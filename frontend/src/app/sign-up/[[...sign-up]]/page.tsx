import { Suspense } from "react";
import { SignUpForm } from "./signup-form";

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-base px-4">
      <Suspense
        fallback={
          <div className="text-text-secondary">Loading...</div>
        }
      >
        <SignUpForm />
      </Suspense>
    </main>
  );
}
