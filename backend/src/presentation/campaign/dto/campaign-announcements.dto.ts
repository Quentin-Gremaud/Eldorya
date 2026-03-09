export class AnnouncementItemDto {
  id: string;
  content: string;
  gmDisplayName: string;
  createdAt: string;

  constructor(data: {
    id: string;
    content: string;
    gmDisplayName: string;
    createdAt: Date;
  }) {
    this.id = data.id;
    this.content = data.content;
    this.gmDisplayName = data.gmDisplayName;
    this.createdAt = data.createdAt.toISOString();
  }
}

export class CampaignAnnouncementsResponseDto {
  announcements: AnnouncementItemDto[];
  totalCount: number;

  constructor(data: {
    announcements: AnnouncementItemDto[];
    totalCount: number;
  }) {
    this.announcements = data.announcements;
    this.totalCount = data.totalCount;
  }
}
