export class PlayerCampaignDto {
  id: string;
  name: string;
  description: string | null;
  coverImageUrl: string | null;
  status: string;
  gmDisplayName: string;
  playerCount: number;
  lastSessionDate: string | null;
  role: 'player';

  constructor(params: {
    id: string;
    name: string;
    description: string | null;
    coverImageUrl: string | null;
    status: string;
    gmDisplayName: string;
    playerCount: number;
    lastSessionDate: Date | null;
  }) {
    this.id = params.id;
    this.name = params.name;
    this.description = params.description;
    this.coverImageUrl = params.coverImageUrl;
    this.status = params.status;
    this.gmDisplayName = params.gmDisplayName;
    this.playerCount = params.playerCount;
    this.lastSessionDate = params.lastSessionDate?.toISOString() ?? null;
    this.role = 'player';
  }
}
