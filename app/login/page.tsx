"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Globe, Loader2, Mail, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { useStore } from "@/lib/store";

const ROLE_ROUTE_MAP: Record<string, string> = {
  admin: "/admin",
  pharmacist: "/pharmacist",
  cashier: "/pos",
  inventory: "/inventory",
  customer: "/portal",
};

function getFriendlyAuthError(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("invalid login credentials") || lower.includes("wrong password") || lower.includes("invalid credentials")) {
    return "Incorrect email or password. Please try again.";
  }

  if (lower.includes("email not confirmed") || lower.includes("not confirmed")) {
    return "Please verify your email before signing in.";
  }

  if (lower.includes("rate limit") || lower.includes("too many requests")) {
    return "Too many attempts. Please wait a moment before trying again.";
  }

  if (lower.includes("network") || lower.includes("fetch")) {
    return "Network issue detected. Please try again in a moment.";
  }

  return message;
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const passwordRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResetSubmitting, setIsResetSubmitting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useStore();

  const pendingApprovalMessage = searchParams.get("message") === "approval" ? "Your account is pending administrator approval." : null;

  async function navigateToDashboardByProfile(userEmail: string) {
    const supabase = createClient();
    const { data: profile, error: profileError } = await supabase
      .from("staff_profiles")
      .select("id, name, role, is_verified, is_active, status, email")
      .eq("email", userEmail)
      .maybeSingle();

    if (profileError) {
      throw profileError;
    }

    if (!profile) {
      throw new Error("Profile not found. Please contact the administrator.");
    }

    if (profile.role !== "customer" && profile.role !== "admin" && profile.is_verified === false) {
      throw new Error("Your account is pending administrator approval.");
    }

    if (profile.is_active === false || profile.status === "suspended") {
      throw new Error("This account has been disabled by the administrator.");
    }

    const role = profile.role;
    const route = ROLE_ROUTE_MAP[role];

    if (!route) {
      throw new Error("Your profile is missing a valid role assignment. Please contact the administrator.");
    }

    login({
      id: profile.id,
      name: profile.name,
      role: profile.role,
    });

    router.push(route);
    router.refresh();
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.");
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError || !data.user) {
        throw signInError ?? new Error("Unable to sign in with the provided credentials.");
      }

      await navigateToDashboardByProfile(data.user.email ?? email.trim());
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login failed. Please try again.";
      setError(getFriendlyAuthError(message));
      setIsSubmitting(false);
    }
  }

  async function handleGoogleSignIn() {
    setError(null);
    setSuccessMessage(null);
    setIsGoogleSubmitting(true);

    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=%2Fportal`;

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
        },
      });

      if (oauthError) {
        throw oauthError;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Google sign in failed.";
      setError(getFriendlyAuthError(message));
      setIsGoogleSubmitting(false);
    }
  }

  async function handleForgotPasswordSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResetError(null);
    setResetSuccess(null);

    const normalizedEmail = resetEmail.trim();
    if (!normalizedEmail) {
      setResetError("Please enter the email address associated with your account.");
      return;
    }

    setIsResetSubmitting(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (error) {
        throw error;
      }

      setResetSuccess("Password reset link sent. Please check your inbox and follow the instructions.");
      setResetEmail("");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unable to send reset email.";
      setResetError(getFriendlyAuthError(message));
    } finally {
      setIsResetSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10">
      <Card className="w-full max-w-md border border-slate-800 bg-slate-900/90 shadow-2xl shadow-slate-950/50">
        <CardHeader className="space-y-2 pb-4 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-teal-500/10 ring-1 ring-teal-500/30">
            <Image
              src="/1.jpeg"
              alt="Alem Pharmacy Logo"
              width={80}
              height={80}
              className="object-cover w-full h-full"
              priority
            />
          </div>
          <CardTitle className="text-2xl font-semibold text-white">Alem Pharmacy</CardTitle>
          <p className="text-sm text-slate-400">Secure clinical and retail operations portal</p>
        </CardHeader>

        <CardContent>
          {!showForgotPassword ? (
            <form className="space-y-5" onSubmit={handleSubmit}>
              {(error || pendingApprovalMessage) && (
                <div className="flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                  <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error ?? pendingApprovalMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="flex items-start gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm text-slate-200">Email address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      passwordRef.current?.focus();
                    }
                  }}
                  placeholder="name@alempharma.et"
                  className="border-slate-700 bg-slate-950 text-white placeholder:text-slate-500"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm text-slate-200">Password</Label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(true);
                      setError(null);
                      setSuccessMessage(null);
                    }}
                    className="text-xs font-medium text-teal-400 hover:text-teal-300"
                  >
                    Forgot password?
                  </button>
                </div>
                <Input
                  ref={passwordRef}
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  className="border-slate-700 bg-slate-950 text-white placeholder:text-slate-500"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-teal-600 text-white hover:bg-teal-500 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isSubmitting || isGoogleSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  "Sign in"
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full border-slate-700 bg-slate-950 text-slate-100 hover:bg-slate-800"
                onClick={handleGoogleSignIn}
                disabled={isSubmitting || isGoogleSubmitting}
              >
                {isGoogleSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Redirecting to Google...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Globe className="h-4 w-4" />
                    Continue with Google
                  </span>
                )}
              </Button>

              <p className="text-center text-sm text-slate-400">
                Need an account?{" "}
                <Link href="/signup" className="font-medium text-teal-400 hover:text-teal-300">
                  Create one
                </Link>
              </p>
            </form>
          ) : (
            <form className="space-y-5" onSubmit={handleForgotPasswordSubmit}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold text-white">Reset password</p>
                  <p className="text-sm text-slate-400">We’ll send a reset link to your email.</p>
                </div>
              </div>

              {resetError && (
                <div className="flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                  <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{resetError}</span>
                </div>
              )}

              {resetSuccess && (
                <div className="flex items-start gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{resetSuccess}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="reset-email" className="text-sm text-slate-200">Email address</Label>
                <Input
                  id="reset-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={resetEmail}
                  onChange={(event) => setResetEmail(event.target.value)}
                  placeholder="name@alempharma.et"
                  className="border-slate-700 bg-slate-950 text-white placeholder:text-slate-500"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-teal-600 text-white hover:bg-teal-500 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isResetSubmitting}
              >
                {isResetSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending reset link...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Mail className="h-4 w-4" />
                    Send reset link
                  </span>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full border-slate-700 bg-slate-950 text-slate-100 hover:bg-slate-800"
                onClick={() => setShowForgotPassword(false)}
              >
                Back to sign in
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
