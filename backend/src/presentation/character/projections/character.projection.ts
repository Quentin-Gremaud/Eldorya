import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { START, eventTypeFilter } from '@kurrent/kurrentdb-client';
import { CharacterStatusEnum } from '@prisma/client';
import { KurrentDbService } from '../../../infrastructure/eventstore/kurrentdb.service.js';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';

function sanitize(str: string): string {
  return str.replace(/<[^>]*>/g, '');
}

@Injectable()
export class CharacterProjection implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CharacterProjection.name);
  private abortController: AbortController | null = null;

  constructor(
    private readonly kurrentDb: KurrentDbService,
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

      const checkpoint = await this.prisma.projectionCheckpoint.findUnique({
        where: { projectionName: 'CharacterProjection' },
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
          prefixes: ['Character'],
        }),
      });

      this.logger.log(
        `Character projection catch-up subscription started from ${checkpoint ? `position ${checkpoint.commitPosition}` : 'START'}`,
      );

      for await (const resolvedEvent of subscription) {
        if (this.abortController.signal.aborted) break;
        if (!resolvedEvent.event) continue;

        try {
          const eventType = resolvedEvent.event.type;
          const data = resolvedEvent.event.data as Record<string, unknown>;

          if (eventType === 'CharacterCreated') {
            await this.handleCharacterCreated(data);
          } else if (eventType === 'CharacterApproved') {
            await this.handleCharacterApproved(data);
          } else if (eventType === 'CharacterRejected') {
            await this.handleCharacterRejected(data);
          } else if (eventType === 'CharacterModifiedByGM') {
            await this.handleCharacterModifiedByGM(data);
          } else if (eventType === 'CharacterModificationRequested') {
            await this.handleCharacterModificationRequested(data);
          } else if (eventType === 'CharacterModificationApproved') {
            await this.handleCharacterModificationApproved(data);
          } else if (eventType === 'CharacterModificationRejected') {
            await this.handleCharacterModificationRejected(data);
          }

          const position = resolvedEvent.event?.position;
          if (position) {
            await this.prisma.projectionCheckpoint.upsert({
              where: { projectionName: 'CharacterProjection' },
              create: {
                projectionName: 'CharacterProjection',
                commitPosition: String(position.commit),
                preparePosition: String(position.prepare),
              },
              update: {
                commitPosition: String(position.commit),
                preparePosition: String(position.prepare),
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
        'Character projection subscription error — will retry in 5s',
        err instanceof Error ? err.stack : String(err),
      );
      setTimeout(() => {
        if (!this.abortController?.signal.aborted) {
          void this.startSubscription();
        }
      }, 5000);
    }
  }

  async handleCharacterCreated(data: Record<string, unknown>): Promise<void> {
    const characterId = data.characterId as string;
    const userId = data.userId as string;
    const campaignId = data.campaignId as string;
    const name = data.name as string;
    const race = data.race as string;
    const characterClass = data.characterClass as string;
    const background = data.background as string;
    const stats = data.stats as Record<string, number>;
    const spells = data.spells as string[];
    const createdAt = new Date(data.createdAt as string);

    await this.prisma.$transaction(async (tx) => {
      await tx.character.upsert({
        where: { id: characterId },
        create: {
          id: characterId,
          userId,
          campaignId,
          name,
          race,
          characterClass,
          background,
          stats,
          spells,
          status: CharacterStatusEnum.pending,
          createdAt,
        },
        update: {
          name,
          race,
          characterClass,
          background,
          stats,
          spells,
          status: CharacterStatusEnum.pending,
          rejectionReason: null,
        },
      });

      // Find the campaign's GM to send notification
      const campaign = await tx.campaign.findUnique({
        where: { id: campaignId },
        select: { gmUserId: true },
      });

      if (campaign) {
        await tx.notification.createMany({
          data: [
            {
              userId: campaign.gmUserId,
              type: 'character_submitted',
              title: 'New character submitted',
              content: `${sanitize(name)} has been submitted for review.`,
              campaignId,
              referenceId: characterId,
            },
          ],
          skipDuplicates: true,
        });
      }
    });

    this.logger.log(
      `Character ${characterId} projected to read model with GM notification`,
    );
  }

  async handleCharacterApproved(data: Record<string, unknown>): Promise<void> {
    const characterId = data.characterId as string;
    const characterName = data.characterName as string;

    await this.prisma.$transaction(async (tx) => {
      const character = await tx.character.update({
        where: { id: characterId },
        data: { status: CharacterStatusEnum.approved, rejectionReason: null },
        select: { userId: true, campaignId: true },
      });

      await tx.notification.create({
        data: {
          userId: character.userId,
          type: 'character_approved',
          title: 'Character Approved',
          content: `Your character ${sanitize(characterName)} has been approved by the GM!`,
          campaignId: character.campaignId,
          referenceId: characterId,
        },
      });
    });

    this.logger.log(
      `Character ${characterId} approved — status updated and player notified`,
    );
  }

  async handleCharacterRejected(data: Record<string, unknown>): Promise<void> {
    const characterId = data.characterId as string;
    const characterName = data.characterName as string;
    const reason = data.reason as string;

    await this.prisma.$transaction(async (tx) => {
      const character = await tx.character.update({
        where: { id: characterId },
        data: { status: CharacterStatusEnum.rejected, rejectionReason: reason },
        select: { userId: true, campaignId: true },
      });

      await tx.notification.create({
        data: {
          userId: character.userId,
          type: 'character_rejected',
          title: 'Character Rejected',
          content: `Your character ${sanitize(characterName)} was rejected: ${sanitize(reason)}`,
          campaignId: character.campaignId,
          referenceId: characterId,
        },
      });
    });

    this.logger.log(
      `Character ${characterId} rejected — status updated and player notified`,
    );
  }

  async handleCharacterModifiedByGM(
    data: Record<string, unknown>,
  ): Promise<void> {
    const characterId = data.characterId as string;
    const campaignId = data.campaignId as string;
    const characterName = data.characterName as string;
    const modifications = data.modifications as Record<string, unknown>;
    const modifiedFields = data.modifiedFields as string[];

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (modifications.name !== undefined) {
      updateData.name = modifications.name;
    }
    if (modifications.race !== undefined) {
      updateData.race = modifications.race;
    }
    if (modifications.characterClass !== undefined) {
      updateData.characterClass = modifications.characterClass;
    }
    if (modifications.background !== undefined) {
      updateData.background = modifications.background;
    }
    if (modifications.stats !== undefined) {
      updateData.stats = modifications.stats;
    }
    if (modifications.spells !== undefined) {
      updateData.spells = modifications.spells as string[];
    }

    const changeSummary = sanitize(modifiedFields.join(', '));

    await this.prisma.$transaction(async (tx) => {
      const character = await tx.character.update({
        where: { id: characterId, campaignId },
        data: updateData,
        select: { userId: true, campaignId: true },
      });

      await tx.notification.create({
        data: {
          userId: character.userId,
          type: 'character_modified_by_gm',
          title: 'Character Modified by GM',
          content: `The GM has modified your character ${sanitize(characterName)}: ${changeSummary}`,
          campaignId: character.campaignId,
          referenceId: characterId,
        },
      });
    });

    this.logger.log(
      `Character ${characterId} modified by GM — read model updated and player notified`,
    );
  }

  async handleCharacterModificationRequested(
    data: Record<string, unknown>,
  ): Promise<void> {
    const characterId = data.characterId as string;
    const campaignId = data.campaignId as string;
    const characterName = data.characterName as string;
    const proposedChanges = data.proposedChanges as Record<string, unknown>;
    const reason = (data.reason as string | null) ?? null;

    await this.prisma.$transaction(async (tx) => {
      const character = await tx.character.update({
        where: { id: characterId, campaignId },
        data: {
          status: CharacterStatusEnum.pending_revalidation,
          proposedChanges: proposedChanges as unknown as Prisma.InputJsonValue,
        },
        select: { campaignId: true },
      });

      const campaign = await tx.campaign.findUnique({
        where: { id: character.campaignId },
        select: { gmUserId: true },
      });

      if (campaign) {
        const reasonSuffix = reason
          ? `: ${sanitize(reason)}`
          : '';
        await tx.notification.create({
          data: {
            userId: campaign.gmUserId,
            type: 'character_modification_requested',
            title: 'Character Modification Requested',
            content: `${sanitize(characterName)} has requested modifications${reasonSuffix}`,
            campaignId,
            referenceId: characterId,
          },
        });
      }
    });

    this.logger.log(
      `Character ${characterId} modification requested — status updated to pending-revalidation and GM notified`,
    );
  }

  async handleCharacterModificationApproved(
    data: Record<string, unknown>,
  ): Promise<void> {
    const characterId = data.characterId as string;
    const campaignId = data.campaignId as string;
    const characterName = data.characterName as string;
    const appliedChanges = data.appliedChanges as Record<
      string,
      { current: unknown; proposed: unknown }
    >;

    const updateData: Record<string, unknown> = {
      status: CharacterStatusEnum.approved,
      proposedChanges: null,
      rejectionReason: null,
      updatedAt: new Date(),
    };

    for (const [field, change] of Object.entries(appliedChanges)) {
      if (field === 'name') updateData.name = change.proposed;
      else if (field === 'race') updateData.race = change.proposed;
      else if (field === 'characterClass')
        updateData.characterClass = change.proposed;
      else if (field === 'background') updateData.background = change.proposed;
      else if (field === 'stats') updateData.stats = change.proposed;
      else if (field === 'spells') updateData.spells = change.proposed;
    }

    const changedFields = sanitize(Object.keys(appliedChanges).join(', '));

    await this.prisma.$transaction(async (tx) => {
      const character = await tx.character.update({
        where: { id: characterId, campaignId },
        data: updateData,
        select: { userId: true, campaignId: true },
      });

      await tx.notification.create({
        data: {
          userId: character.userId,
          type: 'character_modification_approved',
          title: 'Modification Approved',
          content: `Your modification request for ${sanitize(characterName)} has been approved (${changedFields})`,
          campaignId: character.campaignId,
          referenceId: characterId,
        },
      });
    });

    this.logger.log(
      `Character ${characterId} modification approved — changes applied and player notified`,
    );
  }

  async handleCharacterModificationRejected(
    data: Record<string, unknown>,
  ): Promise<void> {
    const characterId = data.characterId as string;
    const campaignId = data.campaignId as string;
    const characterName = data.characterName as string;
    const reason = data.reason as string;

    await this.prisma.$transaction(async (tx) => {
      const character = await tx.character.update({
        where: { id: characterId, campaignId },
        data: {
          status: CharacterStatusEnum.approved,
          proposedChanges: Prisma.DbNull,
          rejectionReason: reason,
        },
        select: { userId: true, campaignId: true },
      });

      await tx.notification.create({
        data: {
          userId: character.userId,
          type: 'character_modification_rejected',
          title: 'Modification Rejected',
          content: `Your modification request for ${sanitize(characterName)} was rejected: ${sanitize(reason)}`,
          campaignId: character.campaignId,
          referenceId: characterId,
        },
      });
    });

    this.logger.log(
      `Character ${characterId} modification rejected — status reverted to approved and player notified`,
    );
  }
}
