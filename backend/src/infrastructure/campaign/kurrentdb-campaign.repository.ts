import { Injectable, Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { CampaignRepository } from '../../campaign/campaign/campaign.repository.port.js';
import {
  CampaignAggregate,
  CampaignEvent,
} from '../../campaign/campaign/campaign.aggregate.js';
import { CampaignCreated } from '../../campaign/campaign/events/campaign-created.event.js';
import { CampaignAnnouncementSent } from '../../campaign/campaign/events/campaign-announcement-sent.event.js';
import { CampaignArchived } from '../../campaign/campaign/events/campaign-archived.event.js';
import { CampaignReactivated } from '../../campaign/campaign/events/campaign-reactivated.event.js';
import { KurrentDbService } from '../eventstore/kurrentdb.service.js';
import type { Clock } from '../../shared/clock.js';
import { CLOCK } from '../../shared/clock.js';

@Injectable()
export class KurrentDbCampaignRepository implements CampaignRepository {
  constructor(
    private readonly kurrentDb: KurrentDbService,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async saveNew(aggregate: CampaignAggregate, userId: string): Promise<void> {
    const campaignId = aggregate.getId();
    const streamName = `campaign-${campaignId}`;
    const events = aggregate.getUncommittedEvents();
    const correlationId = randomUUID();

    for (const event of events) {
      await this.kurrentDb.appendToNewStream(
        streamName,
        event.type,
        this.toEventData(event),
        {
          correlationId,
          timestamp: this.clock.now().toISOString(),
          userId,
          campaignId,
        },
      );
    }

    aggregate.clearEvents();
  }

  async save(aggregate: CampaignAggregate, userId: string): Promise<void> {
    const campaignId = aggregate.getId();
    const streamName = `campaign-${campaignId}`;
    const events = aggregate.getUncommittedEvents();
    const correlationId = randomUUID();

    for (const event of events) {
      await this.kurrentDb.appendToStream(
        streamName,
        event.type,
        this.toEventData(event),
        {
          correlationId,
          timestamp: this.clock.now().toISOString(),
          userId,
          campaignId,
        },
      );
    }

    aggregate.clearEvents();
  }

  async load(campaignId: string): Promise<CampaignAggregate> {
    const events = await this.kurrentDb.readStream(
      `campaign-${campaignId}`,
    );
    return CampaignAggregate.loadFromHistory(events);
  }

  private toEventData(event: CampaignEvent): Record<string, unknown> {
    if (event instanceof CampaignCreated) {
      return {
        campaignId: event.campaignId,
        name: event.name,
        description: event.description,
        gmUserId: event.gmUserId,
        status: event.status,
        createdAt: event.createdAt,
      };
    }
    if (event instanceof CampaignAnnouncementSent) {
      return {
        announcementId: event.announcementId,
        campaignId: event.campaignId,
        content: event.content,
        gmUserId: event.gmUserId,
        gmDisplayName: event.gmDisplayName,
        timestamp: event.timestamp,
      };
    }
    if (event instanceof CampaignArchived) {
      return {
        campaignId: event.campaignId,
        gmUserId: event.gmUserId,
        archivedAt: event.archivedAt,
      };
    }
    if (event instanceof CampaignReactivated) {
      return {
        campaignId: event.campaignId,
        gmUserId: event.gmUserId,
        reactivatedAt: event.reactivatedAt,
      };
    }
    const _exhaustive: never = event;
    throw new Error(`Unknown campaign event type`);
  }
}
