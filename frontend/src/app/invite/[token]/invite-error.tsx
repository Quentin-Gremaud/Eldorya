import Link from "next/link";

export function InviteError({ expired }: { expired?: boolean }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-base px-4">
      <div className="w-full max-w-md rounded-lg bg-surface-elevated p-8 text-center">
        <h1 className="text-2xl font-bold text-text-primary">
          {expired ? "Invitation Expired" : "Invalid Invitation"}
        </h1>
        <p className="mt-4 text-text-secondary">
          {expired
            ? "This invitation link has expired. Please contact the Game Master for a new invitation."
            : "This invitation link is invalid or has expired. Please contact the Game Master for a new link."}
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Link
            href="/"
            className="rounded-lg bg-accent-primary px-4 py-2.5 font-semibold text-surface-base transition-colors hover:bg-accent-primary-hover"
          >
            Go to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
