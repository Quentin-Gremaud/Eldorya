"use client";

import { useState } from "react";
import { useSignIn } from "@clerk/nextjs/legacy";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { signinSchema, type SigninFormData } from "../signin-schema";

export function SignInForm() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SigninFormData>({
    resolver: zodResolver(signinSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  if (!isLoaded) {
    return <div className="text-text-secondary">Loading...</div>;
  }

  async function onSubmit(data: SigninFormData) {
    if (!signIn) return;
    setError("");

    try {
      const result = await signIn.create({
        identifier: data.email,
        password: data.password,
      });

      if (result.status === "complete" && result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      const clerkError = err as { errors?: Array<{ longMessage?: string }> };
      setError(
        clerkError.errors?.[0]?.longMessage ||
          "Invalid credentials. Please try again."
      );
    }
  }

  async function handleOAuthSignIn(strategy: "oauth_google") {
    if (!signIn) return;
    setError("");

    try {
      await signIn.authenticateWithRedirect({
        strategy,
        redirectUrl: "/sign-in/sso-callback",
        redirectUrlComplete: "/dashboard",
      });
    } catch (err: unknown) {
      const clerkError = err as { errors?: Array<{ longMessage?: string }> };
      setError(
        clerkError.errors?.[0]?.longMessage ||
          "An error occurred during sign in"
      );
    }
  }

  return (
    <div className="w-full max-w-md rounded-lg bg-surface-elevated p-8">
      <h1 className="text-2xl font-bold text-text-primary">Welcome back</h1>
      <p className="mt-2 text-text-secondary">
        Sign in to continue your adventures
      </p>

      {error && <p className="mt-4 text-sm text-danger">{error}</p>}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-text-secondary"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            {...register("email")}
            className="mt-1 w-full rounded-md border border-border bg-surface-base px-3 py-2 text-text-primary placeholder-text-muted focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus"
            placeholder="you@example.com"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-danger">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-text-secondary"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            {...register("password")}
            className="mt-1 w-full rounded-md border border-border bg-surface-base px-3 py-2 text-text-primary placeholder-text-muted focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus"
            placeholder="At least 8 characters"
          />
          {errors.password && (
            <p className="mt-1 text-sm text-danger">
              {errors.password.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-accent-primary px-4 py-2.5 font-semibold text-surface-base transition-colors hover:bg-accent-primary-hover disabled:opacity-50"
        >
          {isSubmitting ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-surface-elevated px-2 text-text-muted">
              Or continue with
            </span>
          </div>
        </div>

        <div className="mt-4">
          <button
            type="button"
            onClick={() => handleOAuthSignIn("oauth_google")}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-surface-interactive"
          >
            Google
          </button>
        </div>
      </div>

      <div className="mt-6 space-y-2 text-center text-sm text-text-muted">
        <p>
          Don&apos;t have an account?{" "}
          <Link
            href="/sign-up"
            className="text-accent-primary hover:text-accent-primary-hover"
          >
            Sign up
          </Link>
        </p>
        <p>
          <Link href="/privacy" className="hover:text-text-secondary">
            Privacy Policy
          </Link>
          {" · "}
          <Link href="/cgu" className="hover:text-text-secondary">
            Terms of Service
          </Link>
        </p>
      </div>

      <div id="clerk-captcha" />
    </div>
  );
}
