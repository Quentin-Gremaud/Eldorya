import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold text-text-primary">Privacy Policy</h1>
      <p className="mt-6 text-text-secondary">
        Privacy policy content will be provided here. This is a placeholder
        page.
      </p>
      <Link
        href="/"
        className="mt-8 inline-block text-accent-primary transition-colors hover:text-accent-primary-hover"
      >
        &larr; Back to home
      </Link>
    </main>
  );
}
