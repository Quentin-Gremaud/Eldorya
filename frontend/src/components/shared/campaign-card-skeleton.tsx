import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function CampaignCardSkeleton() {
  return (
    <Card className="w-64 shrink-0 overflow-hidden bg-surface-elevated">
      <Skeleton className="h-36 w-full rounded-none" />
      <CardContent className="space-y-2 p-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-24" />
      </CardContent>
    </Card>
  );
}
