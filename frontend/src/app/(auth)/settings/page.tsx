"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DeleteAccountSection } from "@/components/features/settings/delete-account-section";
import { AppBreadcrumb } from "@/components/layout/app-breadcrumb";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-surface-base p-8">
      <div className="mx-auto max-w-2xl">
        <AppBreadcrumb
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Settings" },
          ]}
        />

        <div className="mt-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild aria-label="Go back">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-text-primary">Settings</h1>
        </div>

        <div className="mt-8 space-y-8">
          <DeleteAccountSection />
        </div>
      </div>
    </main>
  );
}
