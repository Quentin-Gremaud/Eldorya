import { Injectable, Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { CharacterRepository } from '../../character/character/character.repository.js';
import {
  Character,
  type CharacterEvent,
} from '../../character/character/character.aggregate.js';
import { CharacterCreated } from '../../character/character/events/character-created.event.js';
import { CharacterApproved } from '../../character/character/events/character-approved.event.js';
import { CharacterRejected } from '../../character/character/events/character-rejected.event.js';
import { CharacterModifiedByGM } from '../../character/character/events/character-modified-by-gm.event.js';
import { CharacterModificationRequested } from '../../character/character/events/character-modification-requested.event.js';
import { CharacterModificationApproved } from '../../character/character/events/character-modification-approved.event.js';
import { CharacterModificationRejected } from '../../character/character/events/character-modification-rejected.event.js';
import { KurrentDbService } from '../eventstore/kurrentdb.service.js';
import type { Clock } from '../../shared/clock.js';
import { CLOCK } from '../../shared/clock.js';

@Injectable()
export class KurrentDbCharacterRepository implements CharacterRepository {
  constructor(
    private readonly kurrentDb: KurrentDbService,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async saveNew(character: Character): Promise<void> {
    const characterId = character.getId();
    const streamName = `character-${characterId}`;
    const events = character.getUncommittedEvents();
    const correlationId = randomUUID();

    for (const event of events) {
      await this.kurrentDb.appendToNewStream(
        streamName,
        event.type,
        this.toEventData(event),
        {
          correlationId,
          timestamp: this.clock.now().toISOString(),
          userId: character.getUserId(),
          campaignId: character.getCampaignId(),
        },
      );
    }

    character.clearEvents();
  }

  async save(character: Character): Promise<void> {
    const characterId = character.getId();
    const streamName = `character-${characterId}`;
    const events = character.getUncommittedEvents();
    const correlationId = randomUUID();

    for (const event of events) {
      await this.kurrentDb.appendToStream(
        streamName,
        event.type,
        this.toEventData(event),
        {
          correlationId,
          timestamp: this.clock.now().toISOString(),
          userId: character.getUserId(),
          campaignId: character.getCampaignId(),
        },
      );
    }

    character.clearEvents();
  }

  async load(characterId: string): Promise<Character> {
    const events = await this.kurrentDb.readStream(
      `character-${characterId}`,
    );
    return Character.loadFromHistory(events);
  }

  private toEventData(event: CharacterEvent): Record<string, unknown> {
    if (event instanceof CharacterCreated) {
      return {
        characterId: event.characterId,
        userId: event.userId,
        campaignId: event.campaignId,
        name: event.name,
        race: event.race,
        characterClass: event.characterClass,
        background: event.background,
        stats: event.stats,
        spells: event.spells,
        status: event.status,
        createdAt: event.createdAt,
      };
    }
    if (event instanceof CharacterApproved) {
      return {
        characterId: event.characterId,
        approvedBy: event.approvedBy,
        characterName: event.characterName,
        approvedAt: event.approvedAt,
      };
    }
    if (event instanceof CharacterRejected) {
      return {
        characterId: event.characterId,
        rejectedBy: event.rejectedBy,
        characterName: event.characterName,
        reason: event.reason,
        rejectedAt: event.rejectedAt,
      };
    }
    if (event instanceof CharacterModifiedByGM) {
      return {
        characterId: event.characterId,
        campaignId: event.campaignId,
        modifiedBy: event.modifiedBy,
        characterName: event.characterName,
        modifications: event.modifications,
        previousValues: event.previousValues,
        modifiedFields: event.modifiedFields,
        modifiedAt: event.modifiedAt,
      };
    }
    if (event instanceof CharacterModificationRequested) {
      return {
        characterId: event.characterId,
        playerId: event.playerId,
        campaignId: event.campaignId,
        characterName: event.characterName,
        proposedChanges: event.proposedChanges,
        reason: event.reason,
        requestedAt: event.requestedAt,
      };
    }
    if (event instanceof CharacterModificationApproved) {
      return {
        characterId: event.characterId,
        campaignId: event.campaignId,
        approvedBy: event.approvedBy,
        characterName: event.characterName,
        appliedChanges: event.appliedChanges,
        approvedAt: event.approvedAt,
      };
    }
    if (event instanceof CharacterModificationRejected) {
      return {
        characterId: event.characterId,
        campaignId: event.campaignId,
        rejectedBy: event.rejectedBy,
        characterName: event.characterName,
        reason: event.reason,
        rejectedAt: event.rejectedAt,
      };
    }
    const _exhaustive: never = event;
    throw new Error('Unknown character event type');
  }
}
