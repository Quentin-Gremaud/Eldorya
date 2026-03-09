export class PlayerOnboardingItemDto {
  userId: string;
  displayName: string;
  status: 'joined' | 'ready';
  joinedAt: string;

  constructor(params: {
    userId: string;
    displayName: string;
    status: 'joined' | 'ready';
    joinedAt: Date;
  }) {
    this.userId = params.userId;
    this.displayName = params.displayName;
    this.status = params.status;
    this.joinedAt = params.joinedAt.toISOString();
  }
}

export class CampaignPlayersResponseDto {
  players: PlayerOnboardingItemDto[];
  hasActiveInvitation: boolean;
  allReady: boolean;
  playerCount: number;

  constructor(params: {
    players: PlayerOnboardingItemDto[];
    hasActiveInvitation: boolean;
    allReady: boolean;
    playerCount: number;
  }) {
    this.players = params.players;
    this.hasActiveInvitation = params.hasActiveInvitation;
    this.allReady = params.allReady;
    this.playerCount = params.playerCount;
  }
}
