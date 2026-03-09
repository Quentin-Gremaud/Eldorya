import { Suspense } from "react";
import { SignInForm } from "./signin-form";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-base px-4">
      <Suspense
        fallback={
          <div className="text-text-secondary">Loading...</div>
        }
      >
        <SignInForm />
      </Suspense>
    </main>
  );
}
