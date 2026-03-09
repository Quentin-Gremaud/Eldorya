import { Injectable } from '@nestjs/common';
import { MembershipChecker } from '../../campaign/invitation/membership-checker.js';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class MembershipCheckerAdapter implements MembershipChecker {
  constructor(private readonly prisma: PrismaService) {}

  async isMember(campaignId: string, userId: string): Promise<boolean> {
    const member = await this.prisma.campaignMember.findFirst({
      where: { campaignId, userId },
    });
    return member !== null;
  }
}
