"use client";

import { DeleteAccountSection } from "@/components/features/settings/delete-account-section";

export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-surface-base p-8">
      <h1 className="text-3xl font-bold text-text-primary">Settings</h1>

      <div className="mt-8 max-w-2xl space-y-8">
        <DeleteAccountSection />
      </div>
    </main>
  );
}
