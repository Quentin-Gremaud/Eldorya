"use client";

import { useState } from "react";
import { useSignUp } from "@clerk/nextjs/legacy";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { signupSchema, type SignupFormData } from "../signup-schema";

export function SignUpForm() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect_url") || "/dashboard";
  const [verifying, setVerifying] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      emailAddress: "",
      password: "",
      ageConfirmed: undefined as unknown as true,
    },
  });

  if (!isLoaded) {
    return <div className="text-text-secondary">Loading...</div>;
  }

  async function onSubmit(data: SignupFormData) {
    if (!signUp) return;
    setError("");

    try {
      await signUp.create({
        emailAddress: data.emailAddress,
        password: data.password,
        unsafeMetadata: {
          ageDeclaration: true,
          ageDeclarationTimestamp: new Date().toISOString(),
        },
      });

      await signUp.prepareEmailAddressVerification({
        strategy: "email_code",
      });

      setVerifying(true);
    } catch (err: unknown) {
      const clerkError = err as { errors?: Array<{ longMessage?: string }> };
      setError(
        clerkError.errors?.[0]?.longMessage ||
          "An error occurred during sign up"
      );
    }
  }

  async function handleVerification(e: React.FormEvent) {
    e.preventDefault();
    if (!signUp) return;
    setError("");

    try {
      const result = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      });

      if (result.status === "complete" && result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
        router.push(redirectUrl);
      }
    } catch (err: unknown) {
      const clerkError = err as { errors?: Array<{ longMessage?: string }> };
      setError(
        clerkError.errors?.[0]?.longMessage ||
          "Verification failed. Please try again."
      );
    }
  }

  async function handleOAuthSignUp(
    strategy: "oauth_google" | "oauth_github"
  ) {
    if (!signUp) return;

    const ageConfirmed = getValues("ageConfirmed");
    if (ageConfirmed !== true) {
      setError("You must confirm you are 16 years or older");
      return;
    }

    setError("");

    try {
      await signUp.authenticateWithRedirect({
        strategy,
        redirectUrl: "/sign-up/sso-callback",
        redirectUrlComplete: redirectUrl,
        unsafeMetadata: {
          ageDeclaration: true,
          ageDeclarationTimestamp: new Date().toISOString(),
        },
      });
    } catch (err: unknown) {
      const clerkError = err as { errors?: Array<{ longMessage?: string }> };
      setError(
        clerkError.errors?.[0]?.longMessage ||
          "An error occurred during OAuth sign up"
      );
    }
  }

  if (verifying) {
    return (
      <div className="w-full max-w-md rounded-lg bg-surface-elevated p-8">
        <h1 className="text-2xl font-bold text-text-primary">
          Verify your email
        </h1>
        <p className="mt-2 text-text-secondary">
          We sent a verification code to your email address.
        </p>

        {error && <p className="mt-4 text-sm text-danger">{error}</p>}

        <form onSubmit={handleVerification} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="code"
              className="block text-sm font-medium text-text-secondary"
            >
              Verification code
            </label>
            <input
              id="code"
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-surface-base px-3 py-2 text-text-primary placeholder-text-muted focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus"
              placeholder="Enter code"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-accent-primary px-4 py-2.5 font-semibold text-surface-base transition-colors hover:bg-accent-primary-hover"
          >
            Verify
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md rounded-lg bg-surface-elevated p-8">
      <h1 className="text-2xl font-bold text-text-primary">
        Create your account
      </h1>
      <p className="mt-2 text-text-secondary">
        Join Eldorya and start your adventures
      </p>

      {error && <p className="mt-4 text-sm text-danger">{error}</p>}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <div>
          <label
            htmlFor="emailAddress"
            className="block text-sm font-medium text-text-secondary"
          >
            Email
          </label>
          <input
            id="emailAddress"
            type="email"
            {...register("emailAddress")}
            className="mt-1 w-full rounded-md border border-border bg-surface-base px-3 py-2 text-text-primary placeholder-text-muted focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus"
            placeholder="you@example.com"
          />
          {errors.emailAddress && (
            <p className="mt-1 text-sm text-danger">
              {errors.emailAddress.message}
            </p>
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

        <div className="flex items-start gap-3">
          <input
            id="ageConfirmed"
            type="checkbox"
            {...register("ageConfirmed")}
            className="mt-1 h-4 w-4 rounded border-border accent-accent-primary"
          />
          <label htmlFor="ageConfirmed" className="text-sm text-text-secondary">
            I confirm I am 16 years or older
          </label>
        </div>
        {errors.ageConfirmed && (
          <p className="text-sm text-danger">{errors.ageConfirmed.message}</p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-accent-primary px-4 py-2.5 font-semibold text-surface-base transition-colors hover:bg-accent-primary-hover disabled:opacity-50"
        >
          {isSubmitting ? "Creating account..." : "Sign Up"}
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

        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleOAuthSignUp("oauth_google")}
            className="flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-surface-interactive"
          >
            Google
          </button>
          <button
            type="button"
            onClick={() => handleOAuthSignUp("oauth_github")}
            className="flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-surface-interactive"
          >
            GitHub
          </button>
        </div>
      </div>

      <div className="mt-6 space-y-2 text-center text-sm text-text-muted">
        <p>
          Already have an account?{" "}
          <Link
            href="/sign-in"
            className="text-accent-primary hover:text-accent-primary-hover"
          >
            Sign in
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
