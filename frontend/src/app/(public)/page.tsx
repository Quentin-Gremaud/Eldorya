"use cache";

import Link from "next/link";

export default async function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col bg-surface-base">
      {/* Hero Section */}
      <section className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <h1 className="text-6xl font-bold tracking-tight text-text-primary sm:text-7xl">
          Eldorya
        </h1>
        <p className="mt-6 max-w-2xl text-xl text-text-secondary">
          Your TTRPG adventures, powered by real-time collaboration. Create
          campaigns, build worlds, and play together — all in your browser.
        </p>
        <div className="mt-10 flex gap-4">
          <Link
            href="/sign-up"
            className="rounded-lg bg-accent-primary px-8 py-3 text-lg font-semibold text-surface-base transition-colors hover:bg-accent-primary-hover"
          >
            Sign Up
          </Link>
          <Link
            href="/sign-in"
            className="rounded-lg border border-border px-8 py-3 text-lg font-semibold text-text-primary transition-colors hover:bg-surface-interactive"
          >
            Sign In
          </Link>
        </div>
      </section>

      {/* Value Propositions */}
      <section className="mx-auto grid max-w-5xl gap-8 px-6 pb-24 sm:grid-cols-3">
        <div className="rounded-lg bg-surface-elevated p-6">
          <h3 className="text-lg font-semibold text-accent-primary">
            Campaign Management
          </h3>
          <p className="mt-2 text-text-secondary">
            Create and manage campaigns with ease. Invite players, track
            progress, and keep your story alive between sessions.
          </p>
        </div>
        <div className="rounded-lg bg-surface-elevated p-6">
          <h3 className="text-lg font-semibold text-accent-primary">
            Interactive Maps
          </h3>
          <p className="mt-2 text-text-secondary">
            Build multi-level maps, place tokens, and control fog of war in
            real-time. Your world, visualized.
          </p>
        </div>
        <div className="rounded-lg bg-surface-elevated p-6">
          <h3 className="text-lg font-semibold text-accent-primary">
            Live Sessions
          </h3>
          <p className="mt-2 text-text-secondary">
            Run sessions with real-time action pipelines, chat, and player
            interactions. Everything synced instantly.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <p className="text-sm text-text-muted">
            &copy; Eldorya
          </p>
          <nav className="flex gap-6">
            <Link
              href="/cgu"
              className="text-sm text-text-muted transition-colors hover:text-text-secondary"
            >
              Terms of Service
            </Link>
            <Link
              href="/privacy"
              className="text-sm text-text-muted transition-colors hover:text-text-secondary"
            >
              Privacy Policy
            </Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}
