import { CampaignCreated } from './events/campaign-created.event.js';
import { CampaignAnnouncementSent } from './events/campaign-announcement-sent.event.js';
import { CampaignArchived } from './events/campaign-archived.event.js';
import { CampaignReactivated } from './events/campaign-reactivated.event.js';
import { CampaignName } from './campaign-name.js';
import { CampaignDescription } from './campaign-description.js';
import { CampaignStatus } from './campaign-status.js';
import { AnnouncementContent } from './announcement-content.js';
import { CampaignLimitReachedException } from './exceptions/campaign-limit-reached.exception.js';
import { CampaignNotActiveException } from './exceptions/campaign-not-active.exception.js';
import { CampaignNotArchivedException } from './exceptions/campaign-not-archived.exception.js';
import { ProSubscriptionRequiredException } from './exceptions/pro-subscription-required.exception.js';
import { NotGmOfCampaignException } from './exceptions/not-gm-of-campaign.exception.js';
import { ActiveCampaignCounter } from './active-campaign-counter.port.js';
import { SubscriptionTierChecker } from './subscription-tier-checker.port.js';

export type CampaignEvent =
  | CampaignCreated
  | CampaignAnnouncementSent
  | CampaignArchived
  | CampaignReactivated;

export class CampaignAggregate {
  private static readonly FREE_TIER_CAMPAIGN_LIMIT = 2;

  private id = '';
  private name: CampaignName = CampaignName.fromString('uninitialized');
  private description: CampaignDescription = CampaignDescription.empty();
  private gmUserId = '';
  private status: CampaignStatus = CampaignStatus.active();
  private createdAt: Date = new Date(0);
  private uncommittedEvents: CampaignEvent[] = [];

  private constructor() {}

  static async create(
    id: string,
    name: string,
    description: string | undefined,
    gmUserId: string,
    createdAt: Date,
    activeCampaignCounter: ActiveCampaignCounter,
    subscriptionTierChecker: SubscriptionTierChecker,
  ): Promise<CampaignAggregate> {
    const campaignName = CampaignName.fromString(name);
    const campaignDescription = description
      ? CampaignDescription.fromString(description)
      : CampaignDescription.empty();

    const isPro = await subscriptionTierChecker.isProUser(gmUserId);

    if (!isPro) {
      const activeCount =
        await activeCampaignCounter.countByGmUserId(gmUserId);
      if (activeCount >= CampaignAggregate.FREE_TIER_CAMPAIGN_LIMIT) {
        throw CampaignLimitReachedException.forFreeTier(
          CampaignAggregate.FREE_TIER_CAMPAIGN_LIMIT,
        );
      }
    }

    const aggregate = new CampaignAggregate();
    const event = new CampaignCreated(
      id,
      campaignName.toString(),
      campaignDescription.toString(),
      gmUserId,
      CampaignStatus.active().toString(),
      createdAt.toISOString(),
    );

    aggregate.applyEvent(event);
    aggregate.uncommittedEvents.push(event);

    return aggregate;
  }

  sendAnnouncement(
    announcementId: string,
    content: string,
    userId: string,
    gmDisplayName: string,
    timestamp: Date,
  ): void {
    if (!this.status.isActive()) {
      throw CampaignNotActiveException.create();
    }

    if (this.gmUserId !== userId) {
      throw NotGmOfCampaignException.create();
    }

    const announcementContent = AnnouncementContent.fromString(content);

    const event = new CampaignAnnouncementSent(
      announcementId,
      this.id,
      announcementContent.toString(),
      userId,
      gmDisplayName,
      timestamp.toISOString(),
    );

    this.applyEvent(event);
    this.uncommittedEvents.push(event);
  }

  async reactivateCampaign(
    userId: string,
    reactivatedAt: Date,
    subscriptionTierChecker: SubscriptionTierChecker,
  ): Promise<void> {
    if (!this.status.isArchived()) {
      throw CampaignNotArchivedException.create();
    }

    if (this.gmUserId !== userId) {
      throw NotGmOfCampaignException.create();
    }

    const isPro = await subscriptionTierChecker.isProUser(userId);
    if (!isPro) {
      throw ProSubscriptionRequiredException.create();
    }

    const event = new CampaignReactivated(
      this.id,
      userId,
      reactivatedAt.toISOString(),
    );

    this.applyEvent(event);
    this.uncommittedEvents.push(event);
  }

  archiveCampaign(userId: string, archivedAt: Date): void {
    if (!this.status.isActive()) {
      throw CampaignNotActiveException.create();
    }

    if (this.gmUserId !== userId) {
      throw NotGmOfCampaignException.create();
    }

    const event = new CampaignArchived(
      this.id,
      userId,
      archivedAt.toISOString(),
    );

    this.applyEvent(event);
    this.uncommittedEvents.push(event);
  }

  private applyEvent(event: CampaignEvent): void {
    if (event instanceof CampaignCreated) {
      this.id = event.campaignId;
      this.name = CampaignName.fromString(event.name);
      this.description = event.description
        ? CampaignDescription.fromString(event.description)
        : CampaignDescription.empty();
      this.gmUserId = event.gmUserId;
      this.status = CampaignStatus.fromString(event.status);
      this.createdAt = new Date(event.createdAt);
    }
    // CampaignAnnouncementSent: no aggregate state change needed — announcement is read from projection

    if (event instanceof CampaignArchived) {
      this.status = CampaignStatus.archived();
    }

    if (event instanceof CampaignReactivated) {
      this.status = CampaignStatus.active();
    }
  }

  static loadFromHistory(
    events: { type: string; data: Record<string, unknown> }[],
  ): CampaignAggregate {
    const aggregate = new CampaignAggregate();
    for (const event of events) {
      if (event.type === 'CampaignCreated') {
        const d = event.data;
        aggregate.applyEvent(
          new CampaignCreated(
            aggregate.requireString(d, 'campaignId', event.type),
            aggregate.requireString(d, 'name', event.type),
            aggregate.optionalString(d, 'description', event.type) ?? '',
            aggregate.requireString(d, 'gmUserId', event.type),
            aggregate.requireString(d, 'status', event.type),
            aggregate.requireString(d, 'createdAt', event.type),
          ),
        );
      } else if (event.type === 'CampaignAnnouncementSent') {
        const d = event.data;
        aggregate.applyEvent(
          new CampaignAnnouncementSent(
            aggregate.requireString(d, 'announcementId', event.type),
            aggregate.requireString(d, 'campaignId', event.type),
            aggregate.requireString(d, 'content', event.type),
            aggregate.requireString(d, 'gmUserId', event.type),
            aggregate.optionalString(d, 'gmDisplayName', event.type) ??
              'Unknown',
            aggregate.requireString(d, 'timestamp', event.type),
          ),
        );
      } else if (event.type === 'CampaignArchived') {
        const d = event.data;
        aggregate.applyEvent(
          new CampaignArchived(
            aggregate.requireString(d, 'campaignId', event.type),
            aggregate.requireString(d, 'gmUserId', event.type),
            aggregate.requireString(d, 'archivedAt', event.type),
          ),
        );
      } else if (event.type === 'CampaignReactivated') {
        const d = event.data;
        aggregate.applyEvent(
          new CampaignReactivated(
            aggregate.requireString(d, 'campaignId', event.type),
            aggregate.requireString(d, 'gmUserId', event.type),
            aggregate.requireString(d, 'reactivatedAt', event.type),
          ),
        );
      } else if (
        event.type === 'InvitationCreated' ||
        event.type === 'InvitationAccepted' ||
        event.type === 'InvitationRevoked'
      ) {
        // Invitation events live in the same campaign stream but belong
        // to the Invitation aggregate — skip them.
      } else {
        throw new Error(`Unknown event type: ${event.type}`);
      }
    }
    return aggregate;
  }

  getUncommittedEvents(): CampaignEvent[] {
    return [...this.uncommittedEvents];
  }

  clearEvents(): void {
    this.uncommittedEvents = [];
  }

  getId(): string {
    return this.id;
  }

  getGmUserId(): string {
    return this.gmUserId;
  }

  getStatus(): CampaignStatus {
    return this.status;
  }

  private requireString(
    data: Record<string, unknown>,
    field: string,
    eventType: string,
  ): string {
    const value = data[field];
    if (typeof value !== 'string') {
      throw new Error(
        `Invalid event data: "${field}" must be a string in ${eventType}, got ${typeof value}`,
      );
    }
    return value;
  }

  private optionalString(
    data: Record<string, unknown>,
    field: string,
    eventType: string,
  ): string | null {
    const value = data[field];
    if (value === null || value === undefined) return null;
    if (typeof value !== 'string') {
      throw new Error(
        `Invalid event data: "${field}" must be a string or null in ${eventType}, got ${typeof value}`,
      );
    }
    return value;
  }
}
