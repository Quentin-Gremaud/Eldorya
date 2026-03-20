"use client";

import { MessageCircle } from "lucide-react";

export default function GmChatPage() {
  return (
    <main className="flex-1 p-4">
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-16 text-center">
        <MessageCircle className="h-16 w-16 text-text-secondary mb-4" />
        <h1 className="text-lg font-bold text-text-primary mb-2">Session Chat</h1>
        <p className="text-text-secondary">
          Coming in epic 7
        </p>
      </div>
    </main>
  );
}
