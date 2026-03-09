import { Injectable } from '@nestjs/common';
import type { UserDisplayNameResolver } from '../../campaign/campaign/user-display-name-resolver.port.js';
import { PrismaService } from '../database/prisma.service.js';
import { resolveGmDisplayName } from '../../presentation/campaign/finders/gm-display-name.util.js';

@Injectable()
export class UserDisplayNameResolverAdapter implements UserDisplayNameResolver {
  constructor(private readonly prisma: PrismaService) {}

  async resolve(userId: string): Promise<string> {
    const user = await this.prisma.user.findFirst({
      where: { clerkUserId: userId },
      select: { firstName: true, lastName: true, email: true },
    });
    return resolveGmDisplayName(user);
  }
}
