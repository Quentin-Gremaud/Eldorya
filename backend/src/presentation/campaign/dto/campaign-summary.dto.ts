export class CampaignSummaryDto {
  id: string;
  name: string;
  description: string | null;
  coverImageUrl: string | null;
  status: string;
  role: 'gm' | 'player';
  playerCount: number;
  lastSessionDate: string | null;
  createdAt: string;

  constructor(params: {
    id: string;
    name: string;
    description: string | null;
    coverImageUrl: string | null;
    status: string;
    role: 'gm' | 'player';
    playerCount: number;
    lastSessionDate: Date | null;
    createdAt: Date;
  }) {
    this.id = params.id;
    this.name = params.name;
    this.description = params.description;
    this.coverImageUrl = params.coverImageUrl;
    this.status = params.status;
    this.role = params.role;
    this.playerCount = params.playerCount;
    this.lastSessionDate = params.lastSessionDate?.toISOString() ?? null;
    this.createdAt = params.createdAt.toISOString();
  }
}
