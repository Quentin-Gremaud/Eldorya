import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { QueryProvider } from "@/providers/query-provider";
import { WebSocketProvider } from "@/providers/web-socket-provider";
import { NotificationBadge } from "@/components/layout/notification-badge";
import { AppHeader } from "@/components/layout/app-header";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <WebSocketProvider>
        <div className="relative min-h-screen">
          <AppHeader />
          <div className="fixed right-6 top-[4.5rem] z-50">
            <NotificationBadge />
          </div>
          {children}
          <Toaster richColors position="bottom-right" />
        </div>
      </WebSocketProvider>
    </QueryProvider>
  );
}
