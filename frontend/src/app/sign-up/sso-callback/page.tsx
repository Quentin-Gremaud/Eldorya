"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

export default function SignUpSSOCallbackPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-base px-4">
      <div className="w-full max-w-md rounded-lg bg-surface-elevated p-8 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-accent-primary border-t-transparent" />
        <p className="mt-4 text-text-secondary">
          Completing sign up...
        </p>
      </div>
      <AuthenticateWithRedirectCallback />
      <div id="clerk-captcha" />
    </main>
  );
}
