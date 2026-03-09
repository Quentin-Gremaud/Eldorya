export interface ActiveCampaignsResponse {
  data: {
    count: number;
    campaigns: { id: string; name: string }[];
  };
}
