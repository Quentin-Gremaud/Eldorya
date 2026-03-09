import { CharacterCreated } from './events/character-created.event.js';
import { CharacterApproved } from './events/character-approved.event.js';
import { CharacterRejected } from './events/character-rejected.event.js';
import {
  CharacterModifiedByGM,
  type CharacterModifications,
} from './events/character-modified-by-gm.event.js';
import {
  CharacterModificationRequested,
  type ProposedChanges,
} from './events/character-modification-requested.event.js';
import { CharacterModificationApproved } from './events/character-modification-approved.event.js';
import { CharacterModificationRejected } from './events/character-modification-rejected.event.js';
import { CharacterName } from './character-name.js';
import { CharacterRace } from './character-race.js';
import { CharacterClass } from './character-class.js';
import { CharacterBackground } from './character-background.js';
import { CharacterStats, type CharacterStatsData } from './character-stats.js';
import { CharacterStatus } from './character-status.js';
import { SpellList } from './spell-list.js';
import { RejectionReason } from './rejection-reason.js';
import { CharacterAlreadyExistsException } from './exceptions/character-already-exists.exception.js';
import { CharacterNotPendingException } from './exceptions/character-not-pending.exception.js';
import { CharacterNotApprovedException } from './exceptions/character-not-approved.exception.js';
import { CharacterNotPendingRevalidationException } from './exceptions/character-not-pending-revalidation.exception.js';
import type { CharacterModification } from './character-modification.js';
import type { CharacterExistenceChecker } from './character-existence-checker.port.js';
import { UserId } from '../../shared/user-id.js';
import { CampaignId } from '../../shared/campaign-id.js';
import type { Clock } from '../../shared/clock.js';

export type CharacterEvent =
  | CharacterCreated
  | CharacterApproved
  | CharacterRejected
  | CharacterModifiedByGM
  | CharacterModificationRequested
  | CharacterModificationApproved
  | CharacterModificationRejected;

export class Character {
  private id = '';
  private userId: UserId = UserId.fromString('uninitialized');
  private campaignId: CampaignId = CampaignId.fromString('uninitialized');
  private name: CharacterName = CharacterName.fromString('uninitialized');
  private race: CharacterRace = CharacterRace.fromString('Human');
  private characterClass: CharacterClass =
    CharacterClass.fromString('Warrior');
  private background: CharacterBackground =
    CharacterBackground.fromString('unknown');
  private stats: CharacterStats = CharacterStats.create({
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
  });
  private spells: SpellList = SpellList.empty();
  private status: CharacterStatus = CharacterStatus.pending();
  private rejectionReason: string | null = null;
  private proposedChanges: ProposedChanges | null = null;
  private createdAt: Date = new Date(0);
  private uncommittedEvents: CharacterEvent[] = [];

  private constructor() {}

  static async create(
    params: {
      id: string;
      userId: string;
      campaignId: string;
      name: string;
      race: string;
      characterClass: string;
      background: string;
      stats: CharacterStatsData;
      spells: string[];
    },
    characterExistenceChecker: CharacterExistenceChecker,
    clock: Clock,
  ): Promise<Character> {
    // Validate all VOs first (validation happens in constructors)
    const characterName = CharacterName.fromString(params.name);
    const characterRace = CharacterRace.fromString(params.race);
    const characterClass = CharacterClass.fromString(params.characterClass);
    const characterBackground = CharacterBackground.fromString(
      params.background,
    );
    const characterStats = CharacterStats.create(params.stats);
    const spellList = SpellList.create(params.spells);

    // Check uniqueness: one character per player per campaign
    const alreadyExists = await characterExistenceChecker.exists(
      params.campaignId,
      params.userId,
    );
    if (alreadyExists) {
      throw CharacterAlreadyExistsException.create(
        params.campaignId,
        params.userId,
      );
    }

    const aggregate = new Character();
    const now = clock.now();

    const event = new CharacterCreated(
      params.id,
      params.userId,
      params.campaignId,
      characterName.toString(),
      characterRace.toString(),
      characterClass.toString(),
      characterBackground.toString(),
      characterStats.toPrimitives(),
      spellList.toArray(),
      CharacterStatus.pending().toString(),
      now.toISOString(),
    );

    aggregate.applyEvent(event);
    aggregate.uncommittedEvents.push(event);

    return aggregate;
  }

  approve(approvedBy: UserId, clock: Clock): void {
    if (!this.status.isPending()) {
      throw CharacterNotPendingException.create(this.id);
    }

    const event = new CharacterApproved(
      this.id,
      approvedBy.toString(),
      this.name.toString(),
      clock.now().toISOString(),
    );

    this.applyEvent(event);
    this.uncommittedEvents.push(event);
  }

  reject(
    rejectedBy: UserId,
    reason: RejectionReason,
    clock: Clock,
  ): void {
    if (!this.status.isPending()) {
      throw CharacterNotPendingException.create(this.id);
    }

    const event = new CharacterRejected(
      this.id,
      rejectedBy.toString(),
      this.name.toString(),
      reason.toString(),
      clock.now().toISOString(),
    );

    this.applyEvent(event);
    this.uncommittedEvents.push(event);
  }

  modifyByGm(
    modifiedBy: UserId,
    modifications: CharacterModification,
    clock: Clock,
  ): void {
    if (!this.status.isApproved()) {
      throw CharacterNotApprovedException.create(this.id);
    }

    const previousValues: CharacterModifications = {};
    const newValues: CharacterModifications = {};

    const modName = modifications.getName();
    if (modName !== undefined) {
      previousValues.name = this.name.toString();
      newValues.name = modName.toString();
    }

    const modRace = modifications.getRace();
    if (modRace !== undefined) {
      previousValues.race = this.race.toString();
      newValues.race = modRace.toString();
    }

    const modClass = modifications.getCharacterClass();
    if (modClass !== undefined) {
      previousValues.characterClass = this.characterClass.toString();
      newValues.characterClass = modClass.toString();
    }

    const modBackground = modifications.getBackground();
    if (modBackground !== undefined) {
      previousValues.background = this.background.toString();
      newValues.background = modBackground.toString();
    }

    const modStats = modifications.getStats();
    if (modStats !== undefined) {
      previousValues.stats = this.stats.toPrimitives();
      newValues.stats = modStats.toPrimitives();
    }

    const modSpells = modifications.getSpells();
    if (modSpells !== undefined) {
      previousValues.spells = this.spells.toArray();
      newValues.spells = modSpells.toArray();
    }

    const event = new CharacterModifiedByGM(
      this.id,
      this.campaignId.toString(),
      modifiedBy.toString(),
      this.name.toString(),
      newValues,
      previousValues,
      modifications.getModifiedFields(),
      clock.now().toISOString(),
    );

    this.applyEvent(event);
    this.uncommittedEvents.push(event);
  }

  requestModification(
    playerId: string,
    campaignId: string,
    proposedChanges: ProposedChanges,
    reason: string | null,
    clock: Clock,
  ): void {
    if (!this.status.isApproved()) {
      throw CharacterNotApprovedException.create(this.id);
    }

    const event = new CharacterModificationRequested(
      this.id,
      playerId,
      campaignId,
      this.name.toString(),
      proposedChanges,
      reason,
      clock.now().toISOString(),
    );

    this.applyEvent(event);
    this.uncommittedEvents.push(event);
  }

  approveModification(
    approvedBy: UserId,
    campaignId: string,
    clock: Clock,
  ): void {
    if (!this.status.isPendingRevalidation()) {
      throw CharacterNotPendingRevalidationException.create(this.id);
    }

    if (!this.proposedChanges) {
      throw new Error(
        `Character "${this.id}" has no proposed changes to approve.`,
      );
    }

    const event = new CharacterModificationApproved(
      this.id,
      campaignId,
      approvedBy.toString(),
      this.name.toString(),
      this.proposedChanges,
      clock.now().toISOString(),
    );

    this.applyEvent(event);
    this.uncommittedEvents.push(event);
  }

  rejectModification(
    rejectedBy: UserId,
    reason: RejectionReason,
    campaignId: string,
    clock: Clock,
  ): void {
    if (!this.status.isPendingRevalidation()) {
      throw CharacterNotPendingRevalidationException.create(this.id);
    }

    const event = new CharacterModificationRejected(
      this.id,
      campaignId,
      rejectedBy.toString(),
      this.name.toString(),
      reason.toString(),
      clock.now().toISOString(),
    );

    this.applyEvent(event);
    this.uncommittedEvents.push(event);
  }

  private applyEvent(event: CharacterEvent): void {
    if (event instanceof CharacterCreated) {
      this.id = event.characterId;
      this.userId = UserId.fromString(event.userId);
      this.campaignId = CampaignId.fromString(event.campaignId);
      this.name = CharacterName.fromString(event.name);
      this.race = CharacterRace.fromString(event.race);
      this.characterClass = CharacterClass.fromString(event.characterClass);
      this.background = CharacterBackground.fromString(event.background);
      this.stats = CharacterStats.fromPrimitives(event.stats);
      this.spells = SpellList.create(event.spells);
      this.status = CharacterStatus.fromString(event.status);
      this.createdAt = new Date(event.createdAt);
      this.rejectionReason = null;
    } else if (event instanceof CharacterApproved) {
      this.status = CharacterStatus.approved();
      this.rejectionReason = null;
    } else if (event instanceof CharacterRejected) {
      this.status = CharacterStatus.rejected();
      this.rejectionReason = event.reason;
    } else if (event instanceof CharacterModifiedByGM) {
      const mods = event.modifications;
      if (mods.name !== undefined) {
        this.name = CharacterName.fromString(mods.name);
      }
      if (mods.race !== undefined) {
        this.race = CharacterRace.fromString(mods.race);
      }
      if (mods.characterClass !== undefined) {
        this.characterClass = CharacterClass.fromString(mods.characterClass);
      }
      if (mods.background !== undefined) {
        this.background = CharacterBackground.fromString(mods.background);
      }
      if (mods.stats !== undefined) {
        this.stats = CharacterStats.fromPrimitives(mods.stats);
      }
      if (mods.spells !== undefined) {
        this.spells = SpellList.create(mods.spells);
      }
    } else if (event instanceof CharacterModificationRequested) {
      this.status = CharacterStatus.pendingRevalidation();
      this.proposedChanges = event.proposedChanges;
    } else if (event instanceof CharacterModificationApproved) {
      this.status = CharacterStatus.approved();
      const changes = event.appliedChanges;
      for (const [field, change] of Object.entries(changes)) {
        const proposed = change.proposed;
        if (field === 'name' && typeof proposed === 'string') {
          this.name = CharacterName.fromString(proposed);
        } else if (field === 'race' && typeof proposed === 'string') {
          this.race = CharacterRace.fromString(proposed);
        } else if (field === 'characterClass' && typeof proposed === 'string') {
          this.characterClass = CharacterClass.fromString(proposed);
        } else if (field === 'background' && typeof proposed === 'string') {
          this.background = CharacterBackground.fromString(proposed);
        } else if (field === 'stats' && typeof proposed === 'object') {
          this.stats = CharacterStats.fromPrimitives(
            proposed as CharacterStatsData,
          );
        } else if (field === 'spells' && Array.isArray(proposed)) {
          this.spells = SpellList.create(proposed as string[]);
        }
      }
      this.proposedChanges = null;
      this.rejectionReason = null;
    } else if (event instanceof CharacterModificationRejected) {
      this.status = CharacterStatus.approved();
      this.proposedChanges = null;
      this.rejectionReason = event.reason;
    }
  }

  static loadFromHistory(
    events: { type: string; data: Record<string, unknown> }[],
  ): Character {
    const aggregate = new Character();
    for (const event of events) {
      if (event.type === 'CharacterCreated') {
        const d = event.data;
        aggregate.applyEvent(
          new CharacterCreated(
            aggregate.requireString(d, 'characterId', event.type),
            aggregate.requireString(d, 'userId', event.type),
            aggregate.requireString(d, 'campaignId', event.type),
            aggregate.requireString(d, 'name', event.type),
            aggregate.requireString(d, 'race', event.type),
            aggregate.requireString(d, 'characterClass', event.type),
            aggregate.requireString(d, 'background', event.type),
            aggregate.requireObject(d, 'stats', event.type) as {
              strength: number;
              dexterity: number;
              constitution: number;
              intelligence: number;
              wisdom: number;
              charisma: number;
            },
            aggregate.requireArray(d, 'spells', event.type) as string[],
            aggregate.requireString(d, 'status', event.type),
            aggregate.requireString(d, 'createdAt', event.type),
          ),
        );
      } else if (event.type === 'CharacterApproved') {
        const d = event.data;
        aggregate.applyEvent(
          new CharacterApproved(
            aggregate.requireString(d, 'characterId', event.type),
            aggregate.requireString(d, 'approvedBy', event.type),
            aggregate.requireString(d, 'characterName', event.type),
            aggregate.requireString(d, 'approvedAt', event.type),
          ),
        );
      } else if (event.type === 'CharacterRejected') {
        const d = event.data;
        aggregate.applyEvent(
          new CharacterRejected(
            aggregate.requireString(d, 'characterId', event.type),
            aggregate.requireString(d, 'rejectedBy', event.type),
            aggregate.requireString(d, 'characterName', event.type),
            aggregate.requireString(d, 'reason', event.type),
            aggregate.requireString(d, 'rejectedAt', event.type),
          ),
        );
      } else if (event.type === 'CharacterModifiedByGM') {
        const d = event.data;
        aggregate.applyEvent(
          new CharacterModifiedByGM(
            aggregate.requireString(d, 'characterId', event.type),
            aggregate.requireString(d, 'campaignId', event.type),
            aggregate.requireString(d, 'modifiedBy', event.type),
            aggregate.requireString(d, 'characterName', event.type),
            aggregate.requireObject(d, 'modifications', event.type) as CharacterModifications,
            aggregate.requireObject(d, 'previousValues', event.type) as CharacterModifications,
            aggregate.requireArray(d, 'modifiedFields', event.type) as string[],
            aggregate.requireString(d, 'modifiedAt', event.type),
          ),
        );
      } else if (event.type === 'CharacterModificationRequested') {
        const d = event.data;
        aggregate.applyEvent(
          new CharacterModificationRequested(
            aggregate.requireString(d, 'characterId', event.type),
            aggregate.requireString(d, 'playerId', event.type),
            aggregate.requireString(d, 'campaignId', event.type),
            aggregate.requireString(d, 'characterName', event.type),
            aggregate.requireObject(d, 'proposedChanges', event.type) as ProposedChanges,
            (d.reason as string | null) ?? null,
            aggregate.requireString(d, 'requestedAt', event.type),
          ),
        );
      } else if (event.type === 'CharacterModificationApproved') {
        const d = event.data;
        aggregate.applyEvent(
          new CharacterModificationApproved(
            aggregate.requireString(d, 'characterId', event.type),
            aggregate.requireString(d, 'campaignId', event.type),
            aggregate.requireString(d, 'approvedBy', event.type),
            aggregate.requireString(d, 'characterName', event.type),
            aggregate.requireObject(d, 'appliedChanges', event.type) as ProposedChanges,
            aggregate.requireString(d, 'approvedAt', event.type),
          ),
        );
      } else if (event.type === 'CharacterModificationRejected') {
        const d = event.data;
        aggregate.applyEvent(
          new CharacterModificationRejected(
            aggregate.requireString(d, 'characterId', event.type),
            aggregate.requireString(d, 'campaignId', event.type),
            aggregate.requireString(d, 'rejectedBy', event.type),
            aggregate.requireString(d, 'characterName', event.type),
            aggregate.requireString(d, 'reason', event.type),
            aggregate.requireString(d, 'rejectedAt', event.type),
          ),
        );
      } else {
        throw new Error(`Unknown event type: ${event.type}`);
      }
    }
    return aggregate;
  }

  getUncommittedEvents(): CharacterEvent[] {
    return [...this.uncommittedEvents];
  }

  clearEvents(): void {
    this.uncommittedEvents = [];
  }

  getId(): string {
    return this.id;
  }

  getUserId(): string {
    return this.userId.toString();
  }

  getCampaignId(): string {
    return this.campaignId.toString();
  }

  getName(): string {
    return this.name.toString();
  }

  getStatus(): CharacterStatus {
    return this.status;
  }

  getRejectionReason(): string | null {
    return this.rejectionReason;
  }

  getRace(): string {
    return this.race.toString();
  }

  getCharacterClass(): string {
    return this.characterClass.toString();
  }

  getBackground(): string {
    return this.background.toString();
  }

  getStats(): CharacterStatsData {
    return this.stats.toPrimitives();
  }

  getSpells(): string[] {
    return this.spells.toArray();
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

  private requireObject(
    data: Record<string, unknown>,
    field: string,
    eventType: string,
  ): Record<string, unknown> {
    const value = data[field];
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new Error(
        `Invalid event data: "${field}" must be an object in ${eventType}, got ${typeof value}`,
      );
    }
    return value as Record<string, unknown>;
  }

  private requireArray(
    data: Record<string, unknown>,
    field: string,
    eventType: string,
  ): unknown[] {
    const value = data[field];
    if (!Array.isArray(value)) {
      throw new Error(
        `Invalid event data: "${field}" must be an array in ${eventType}, got ${typeof value}`,
      );
    }
    return value;
  }
}
