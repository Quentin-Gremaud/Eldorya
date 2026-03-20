"use client";

import { Ghost } from "lucide-react";

export default function GmNpcsPage() {
  return (
    <main className="flex-1 p-4">
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-16 text-center">
        <Ghost className="h-16 w-16 text-text-secondary mb-4" />
        <h1 className="text-lg font-bold text-text-primary mb-2">NPC Library</h1>
        <p className="text-text-secondary">
          Coming in story 6b-3
        </p>
      </div>
    </main>
  );
}
