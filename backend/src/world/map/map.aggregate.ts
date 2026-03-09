import { MapLevelCreated } from './events/map-level-created.event.js';
import { MapLevelRenamed } from './events/map-level-renamed.event.js';
import { MapLevelBackgroundSet } from './events/map-level-background-set.event.js';
import { MapLevelId } from './map-level-id.js';
import { MapLevelName } from './map-level-name.js';
import { MapLevelDepth } from './map-level-depth.js';
import { MapBackgroundImageUrl } from './map-background-image-url.js';
import { MaxMapDepthReachedException } from './exceptions/max-map-depth-reached.exception.js';
import { ParentMapLevelNotFoundException } from './exceptions/parent-map-level-not-found.exception.js';
import { MapLevelNotFoundException } from './exceptions/map-level-not-found.exception.js';
import { DuplicateMapLevelNameException } from './exceptions/duplicate-map-level-name.exception.js';
import { CampaignId } from '../../shared/campaign-id.js';
import type { Clock } from '../../shared/clock.js';

export type MapEvent = MapLevelCreated | MapLevelRenamed | MapLevelBackgroundSet;

interface MapLevelState {
  id: string;
  name: string;
  parentId: string | null;
  depth: number;
  backgroundImageUrl: string | null;
}

export class MapAggregate {
  private campaignId = '';
  private levels: Map<string, MapLevelState> = new Map();
  private uncommittedEvents: MapEvent[] = [];

  private constructor() {}

  static createNew(campaignId: string): MapAggregate {
    const aggregate = new MapAggregate();
    CampaignId.fromString(campaignId);
    aggregate.campaignId = campaignId;
    return aggregate;
  }

  createLevel(
    mapLevelId: string,
    name: string,
    parentId: string | null,
    clock: Clock,
  ): void {
    const levelId = MapLevelId.fromString(mapLevelId);
    const levelName = MapLevelName.create(name);

    if (this.levels.has(levelId.toString())) {
      throw new Error(`Map level '${levelId.toString()}' already exists in campaign '${this.campaignId}'`);
    }

    let depth = 0;

    if (parentId) {
      MapLevelId.fromString(parentId);
      const parent = this.levels.get(parentId);
      if (!parent) {
        throw ParentMapLevelNotFoundException.forLevel(parentId, this.campaignId);
      }
      if (parent.depth >= MapLevelDepth.maxValue()) {
        throw MaxMapDepthReachedException.forCampaign(this.campaignId);
      }
      depth = parent.depth + 1;
    }

    for (const level of this.levels.values()) {
      if (level.name === levelName.toString() && level.parentId === parentId) {
        throw DuplicateMapLevelNameException.forName(levelName.toString(), parentId);
      }
    }

    const event = new MapLevelCreated(
      this.campaignId,
      levelId.toString(),
      levelName.toString(),
      parentId,
      depth,
      clock.now().toISOString(),
    );

    this.applyEvent(event);
    this.uncommittedEvents.push(event);
  }

  renameLevel(
    mapLevelId: string,
    newName: string,
    clock: Clock,
  ): void {
    const levelId = MapLevelId.fromString(mapLevelId);
    const levelName = MapLevelName.create(newName);

    const level = this.levels.get(levelId.toString());
    if (!level) {
      throw MapLevelNotFoundException.forLevel(levelId.toString(), this.campaignId);
    }

    for (const existingLevel of this.levels.values()) {
      if (
        existingLevel.id !== levelId.toString() &&
        existingLevel.name === levelName.toString() &&
        existingLevel.parentId === level.parentId
      ) {
        throw DuplicateMapLevelNameException.forName(levelName.toString(), level.parentId);
      }
    }

    const event = new MapLevelRenamed(
      this.campaignId,
      levelId.toString(),
      levelName.toString(),
      clock.now().toISOString(),
    );

    this.applyEvent(event);
    this.uncommittedEvents.push(event);
  }

  setBackground(
    mapLevelId: string,
    backgroundImageUrl: string,
    clock: Clock,
  ): void {
    const levelId = MapLevelId.fromString(mapLevelId);
    const url = MapBackgroundImageUrl.create(backgroundImageUrl);

    const level = this.levels.get(levelId.toString());
    if (!level) {
      throw MapLevelNotFoundException.forLevel(levelId.toString(), this.campaignId);
    }

    const event = new MapLevelBackgroundSet(
      this.campaignId,
      levelId.toString(),
      url.toString(),
      level.backgroundImageUrl,
      clock.now().toISOString(),
    );

    this.applyEvent(event);
    this.uncommittedEvents.push(event);
  }

  private applyEvent(event: MapEvent): void {
    if (event instanceof MapLevelCreated) {
      this.campaignId = event.campaignId;
      this.levels.set(event.mapLevelId, {
        id: event.mapLevelId,
        name: event.name,
        parentId: event.parentId,
        depth: event.depth,
        backgroundImageUrl: null,
      });
    } else if (event instanceof MapLevelRenamed) {
      const level = this.levels.get(event.mapLevelId);
      if (!level) {
        throw new Error(`Corrupted event stream: map level '${event.mapLevelId}' not found during rename`);
      }
      level.name = event.newName;
    } else if (event instanceof MapLevelBackgroundSet) {
      const level = this.levels.get(event.mapLevelId);
      if (!level) {
        throw new Error(`Corrupted event stream: map level '${event.mapLevelId}' not found during background set`);
      }
      level.backgroundImageUrl = event.backgroundImageUrl;
    }
  }

  static loadFromHistory(
    campaignId: string,
    events: { type: string; data: Record<string, unknown> }[],
  ): MapAggregate {
    const aggregate = new MapAggregate();
    aggregate.campaignId = campaignId;

    for (const event of events) {
      if (event.type === 'MapLevelCreated') {
        const d = event.data;
        aggregate.applyEvent(
          new MapLevelCreated(
            aggregate.requireString(d, 'campaignId', event.type),
            aggregate.requireString(d, 'mapLevelId', event.type),
            aggregate.requireString(d, 'name', event.type),
            d.parentId === null || d.parentId === undefined ? null : aggregate.requireString(d, 'parentId', event.type),
            aggregate.requireNumber(d, 'depth', event.type),
            aggregate.requireString(d, 'createdAt', event.type),
          ),
        );
      } else if (event.type === 'MapLevelRenamed') {
        const d = event.data;
        aggregate.applyEvent(
          new MapLevelRenamed(
            aggregate.requireString(d, 'campaignId', event.type),
            aggregate.requireString(d, 'mapLevelId', event.type),
            aggregate.requireString(d, 'newName', event.type),
            aggregate.requireString(d, 'renamedAt', event.type),
          ),
        );
      } else if (event.type === 'MapLevelBackgroundSet') {
        const d = event.data;
        const bgUrl = aggregate.requireString(d, 'backgroundImageUrl', event.type);
        MapBackgroundImageUrl.fromPrimitives(bgUrl);
        aggregate.applyEvent(
          new MapLevelBackgroundSet(
            aggregate.requireString(d, 'campaignId', event.type),
            aggregate.requireString(d, 'mapLevelId', event.type),
            bgUrl,
            d.previousBackgroundImageUrl === null || d.previousBackgroundImageUrl === undefined
              ? null
              : aggregate.requireString(d, 'previousBackgroundImageUrl', event.type),
            aggregate.requireString(d, 'setAt', event.type),
          ),
        );
      } else {
        throw new Error(`Unknown event type: ${event.type}`);
      }
    }
    return aggregate;
  }

  getUncommittedEvents(): MapEvent[] {
    return [...this.uncommittedEvents];
  }

  clearEvents(): void {
    this.uncommittedEvents = [];
  }

  getCampaignId(): string {
    return this.campaignId;
  }

  getLevels(): Map<string, MapLevelState> {
    return new Map(this.levels);
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

  private requireNumber(
    data: Record<string, unknown>,
    field: string,
    eventType: string,
  ): number {
    const value = data[field];
    if (typeof value !== 'number') {
      throw new Error(
        `Invalid event data: "${field}" must be a number in ${eventType}, got ${typeof value}`,
      );
    }
    return value;
  }
}
