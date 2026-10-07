"use client";

import { Logo, ScreeningDisclaimer } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, PasswordInput } from "@/components/ui/inputs";
import { Modal } from "@/components/ui/overlay";
import { DEMO_PASSWORD } from "@/lib/constants";
import { forgotSchema, loginSchema, type LoginValues } from "@/lib/validation";
import { useSession } from "@/providers/session-provider";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export function LoginView() {
  const router = useRouter();
  const params = useSearchParams();
  const { signInWithEmail, signInWithDemo } = useSession();
  const destination = params.get("next")?.startsWith("/") ? params.get("next")! : "/dashboard";
  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetError, setResetError] = useState("");
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", remember: true },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    if (values.password !== DEMO_PASSWORD) {
      form.setError("password", {
        message: "Those details don’t match a LearnGuard account. Use the demo password shown below, or continue with the demo account.",
      });
      toast.error("Sign-in failed. Check the email and password.");
      return;
    }
    await signInWithEmail(values.email, Boolean(values.remember));
    toast.success("Signed in successfully");
    router.push(destination);
  });

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-primary-soft px-12 py-12 lg:flex lg:flex-col">
        <Logo href="/" />
        <div className="my-auto max-w-md">
          <h1 className="text-4xl leading-tight font-bold text-heading">Supporting earlier educational intervention.</h1>
          <ul className="mt-8 space-y-4">
            {["Multimodal screening", "Explainable insights", "Teacher-friendly workflow"].map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm font-medium text-heading">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-primary-dark">
                  <Check className="h-4 w-4" />
                </span>
                {item}
              </li>
            ))}
          </ul>
          <svg viewBox="0 0 360 160" className="mt-12 w-full text-primary" aria-hidden>
            <circle cx="70" cy="80" r="8" fill="#8B7CF6" />
            <circle cx="170" cy="46" r="7" fill="#8B7CF6" />
            <circle cx="180" cy="112" r="6" fill="#C4B8FF" />
            <circle cx="280" cy="74" r="8" fill="#5F50C8" />
            <path d="M78 80h84M176 50c30 8 60 16 96 22M184 108c28-8 58-16 90-28" stroke="#8B7CF6" strokeWidth="1.4" fill="none" />
          </svg>
        </div>
      </section>
      <section className="flex items-center justify-center bg-background px-5 py-12">
        <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 md:p-8">
          <div className="mb-6 lg:hidden">
            <Logo href="/" />
          </div>
          <h2 className="text-2xl font-bold text-heading">Welcome back</h2>
          <p className="mt-1 text-sm text-muted">Sign in to continue to LearnGuard</p>
          <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
            <Field label="Email" htmlFor="email" error={form.formState.errors.email?.message}>
              <Input id="email" type="email" autoComplete="email" invalid={Boolean(form.formState.errors.email)} {...form.register("email")} />
            </Field>
            <Field label="Password" htmlFor="password" error={form.formState.errors.password?.message}>
              <PasswordInput id="password" autoComplete="current-password" invalid={Boolean(form.formState.errors.password)} {...form.register("password")} />
            </Field>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-body">
                <input type="checkbox" className="accent-primary" {...form.register("remember")} />
                Remember me
              </label>
              <button type="button" className="font-medium text-primary-dark" onClick={() => setForgotOpen(true)}>
                Forgot password?
              </button>
            </div>
            <Button type="submit" className="w-full" loading={form.formState.isSubmitting}>
              Sign In
            </Button>
          </form>
          <Button
            variant="secondary"
            className="mt-3 w-full"
            onClick={async () => {
              await signInWithDemo();
              toast.success("Signed in with the demo account");
              router.push(destination);
            }}
          >
            Continue with Demo Account
          </Button>
          <p className="mt-4 text-center text-xs leading-5 text-faint">
            Demo teacher: sarah.ahmed@horizonprimary.edu
            <br />
            Demo password: {DEMO_PASSWORD}
          </p>
          <ScreeningDisclaimer className="mt-6 text-center" />
          <p className="mt-4 text-center text-sm">
            <Link href="/" className="text-primary-dark">
              Back to overview
            </Link>
          </p>
        </div>
      </section>
      <Modal open={forgotOpen} onClose={() => setForgotOpen(false)} title="Reset password" description="Enter the school email for this teacher account.">
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            const parsed = forgotSchema.safeParse({ email: resetEmail });
            if (!parsed.success) {
              setResetError(parsed.error.issues[0]?.message ?? "Enter a valid email");
              return;
            }
            setResetError("");
            setForgotOpen(false);
            toast.success("Reset instructions will be sent when account services are connected.");
          }}
        >
          <Field label="Email" htmlFor="reset-email" error={resetError}>
            <Input id="reset-email" type="email" value={resetEmail} onChange={(event) => setResetEmail(event.target.value)} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setForgotOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Send reset link</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
