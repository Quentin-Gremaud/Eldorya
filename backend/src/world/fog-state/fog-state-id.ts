import { InvalidFogStateIdException } from './exceptions/invalid-fog-state-id.exception.js';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class FogStateId {
  private constructor(
    private readonly _campaignId: string,
    private readonly _playerId: string,
  ) {}

  static fromParts(campaignId: string, playerId: string): FogStateId {
    if (!campaignId || !UUID_REGEX.test(campaignId.trim())) {
      throw InvalidFogStateIdException.invalidCampaignId(campaignId);
    }
    if (!playerId || !UUID_REGEX.test(playerId.trim())) {
      throw InvalidFogStateIdException.invalidPlayerId(playerId);
    }
    return new FogStateId(campaignId.trim(), playerId.trim());
  }

  static fromString(value: string): FogStateId {
    if (!value || !value.includes('-')) {
      throw InvalidFogStateIdException.invalidFormat(value);
    }
    // Format: {campaignId}-{playerId} where both are UUIDs
    // UUID is 36 chars, so split at position 36
    const campaignId = value.substring(0, 36);
    const playerId = value.substring(37);

    if (!UUID_REGEX.test(campaignId) || !UUID_REGEX.test(playerId)) {
      throw InvalidFogStateIdException.invalidFormat(value);
    }
    return new FogStateId(campaignId, playerId);
  }

  getCampaignId(): string {
    return this._campaignId;
  }

  getPlayerId(): string {
    return this._playerId;
  }

  toString(): string {
    return `${this._campaignId}-${this._playerId}`;
  }

  equals(other: FogStateId | null | undefined): boolean {
    if (!other) return false;
    return this._campaignId === other._campaignId && this._playerId === other._playerId;
  }
}
