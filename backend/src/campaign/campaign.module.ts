import { Module } from '@nestjs/common';
import { CampaignDomainModule } from './campaign/campaign.module';
import { InvitationModule } from './invitation/invitation.module.js';

@Module({
  imports: [CampaignDomainModule, InvitationModule],
})
export class CampaignModule {}
