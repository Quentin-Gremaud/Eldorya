import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { START, eventTypeFilter } from '@kurrent/kurrentdb-client';
import { KurrentDbService } from '../../../infrastructure/eventstore/kurrentdb.service.js';
import { CryptoShreddingService } from '../../../infrastructure/gdpr/crypto-shredding.service.js';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';

@Injectable()
export class UserProjection implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(UserProjection.name);
  private abortController: AbortController | null = null;

  constructor(
    private readonly kurrentDb: KurrentDbService,
    private readonly cryptoShredding: CryptoShreddingService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    void this.startSubscription();
  }

  onModuleDestroy() {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  private async startSubscription() {
    this.abortController = new AbortController();

    try {
      const client = this.kurrentDb.getClient();

      // Load last checkpoint for restart recovery
      const checkpoint = await this.prisma.projectionCheckpoint.findUnique({
        where: { projectionName: 'UserProjection' },
      });

      const fromPosition = checkpoint
        ? {
            commit: BigInt(checkpoint.commitPosition),
            prepare: BigInt(checkpoint.preparePosition),
          }
        : START;

      const subscription = client.subscribeToAll({
        fromPosition,
        filter: eventTypeFilter({
          prefixes: ['UserRegistered'],
        }),
      });

      this.logger.log(
        `User projection catch-up subscription started from ${checkpoint ? `position ${checkpoint.commitPosition}` : 'START'}`,
      );

      for await (const resolvedEvent of subscription) {
        if (this.abortController.signal.aborted) break;
        if (!resolvedEvent.event) continue;

        try {
          await this.handleUserRegistered(
            resolvedEvent.event.data as Record<string, unknown>,
          );

          // Persist cursor position for restart recovery
          const position = resolvedEvent.event?.position;
          if (position) {
            const commitStr = String(position.commit);
            const prepareStr = String(position.prepare);
            await this.prisma.projectionCheckpoint.upsert({
              where: { projectionName: 'UserProjection' },
              create: {
                projectionName: 'UserProjection',
                commitPosition: commitStr,
                preparePosition: prepareStr,
              },
              update: {
                commitPosition: commitStr,
                preparePosition: prepareStr,
              },
            });
          }
        } catch (err) {
          this.logger.error(
            `Error projecting event ${resolvedEvent.event.id}`,
            err instanceof Error ? err.stack : String(err),
          );
        }
      }
    } catch (err) {
      if (this.abortController?.signal.aborted) return;
      this.logger.error(
        'User projection subscription error',
        err instanceof Error ? err.stack : String(err),
      );
    }
  }

  private async handleUserRegistered(
    data: Record<string, unknown>,
  ): Promise<void> {
    const clerkUserId = data.clerkUserId as string;
    if (!clerkUserId) return;

    const key = await this.cryptoShredding.getKey(clerkUserId);

    let email: string | null = null;
    let firstName: string | null = null;
    let lastName: string | null = null;

    if (key) {
      try {
        email = this.cryptoShredding.decrypt(data.email as string, key);
        firstName = this.cryptoShredding.decrypt(data.firstName as string, key);
        lastName = this.cryptoShredding.decrypt(data.lastName as string, key);
      } catch {
        this.logger.warn(
          `Could not decrypt data for user ${clerkUserId} — key may have been destroyed`,
        );
      }
    }

    const ageDeclarationTimestamp = data.ageDeclarationTimestamp
      ? new Date(data.ageDeclarationTimestamp as string)
      : null;

    await this.prisma.user.upsert({
      where: { clerkUserId },
      create: {
        id: clerkUserId,
        clerkUserId,
        email,
        firstName,
        lastName,
        ageDeclaration: (data.ageDeclaration as boolean) ?? false,
        ageDeclarationTimestamp,
        createdAt: new Date(data.registeredAt as string),
      },
      update: {
        email,
        firstName,
        lastName,
        ageDeclaration: (data.ageDeclaration as boolean) ?? false,
        ageDeclarationTimestamp,
      },
    });

    this.logger.log(`User ${clerkUserId} projected to read model`);
  }
}
