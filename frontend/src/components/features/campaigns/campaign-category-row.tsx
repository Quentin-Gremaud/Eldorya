"use client";

import { useRouter } from "next/navigation";
import { CampaignCard, CampaignCardData } from "@/components/shared/campaign-card";

interface CampaignCategoryRowProps {
  title: string;
  campaigns: CampaignCardData[];
}

export function CampaignCategoryRow({
  title,
  campaigns,
}: CampaignCategoryRowProps) {
  const router = useRouter();

  const handleCardClick = (campaign: CampaignCardData) => {
    if (campaign.role === "player") {
      router.push(`/campaign/${campaign.id}/player`);
    } else {
      router.push(`/campaign/${campaign.id}/gm/prep`);
    }
  };

  return (
    <section>
      <div className="mb-3">
        <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {campaigns.map((campaign) => (
          <CampaignCard
            key={campaign.id}
            campaign={campaign}
            onClick={() => handleCardClick(campaign)}
          />
        ))}
      </div>
    </section>
  );
}
