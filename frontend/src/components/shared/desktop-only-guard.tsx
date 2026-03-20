"use client";

import { useState, useEffect, type ReactNode } from "react";
import { Monitor } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface DesktopOnlyGuardProps {
  campaignId: string;
  children: ReactNode;
}

const MIN_DESKTOP_WIDTH = 1280;

export function DesktopOnlyGuard({ campaignId, children }: DesktopOnlyGuardProps) {
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

  useEffect(() => {
    const checkWidth = () => {
      setIsDesktop(window.innerWidth >= MIN_DESKTOP_WIDTH);
    };

    checkWidth();
    window.addEventListener("resize", checkWidth);
    return () => window.removeEventListener("resize", checkWidth);
  }, []);

  if (isDesktop === null) {
    return null;
  }

  if (!isDesktop) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-base p-8">
        <div className="max-w-md text-center space-y-4">
          <Monitor className="mx-auto h-16 w-16 text-text-secondary" />
          <h1 className="text-xl font-bold text-text-primary">
            Le cockpit GM nécessite un écran de bureau (≥ 1280px)
          </h1>
          <p className="text-text-secondary">
            Pour une expérience optimale, veuillez utiliser un écran de bureau ou agrandir votre fenêtre.
          </p>
          <Button asChild variant="outline">
            <Link href={`/campaign/${campaignId}/gm/prep`}>
              Retour à la campagne
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
