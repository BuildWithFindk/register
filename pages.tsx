"use client";

import * as React from "react";
import { Eye, EyeOff, LoaderCircle, LockKeyhole } from "lucide-react";
import { IdentifierFirstLogin, type LoginMethod } from "./IdentifierFirstLogin";
import { AuthError, useAuth, type User } from "./auth";

const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card";
const INPUT = `h-12 w-full rounded-xl border border-border bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground aria-[invalid=true]:border-destructive ${FOCUS}`;
const BUTTON = `flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-[13px] font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70 ${FOCUS}`;
const LINK = `rounded-sm font-medium text-foreground underline underline-offset-2 hover:no-underline ${FOCUS}`;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Card({ logo, title, subtitle, children }: { logo?: React.ReactNode; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="w-full max-w-[400px] overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-xl shadow-primary/5">
      <div className="px-7 pt-6">
        <span className="mb-4 flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground" aria-hidden="true">{logo ?? <LockKeyhole className="size-5" />}</span>
        <h1 className="text-[24px] font-semibold leading-tight tracking-tight">{title}</h1>
        {subtitle && <p className="mt-2 text-[13px] leading-5 text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="px-7 pb-6 pt-5">{children}</div>
    </div>
  );
}

function Field({ label, error, type = "text", ...props }: { label: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = React.useId();
  const [shown, setShown] = React.useState(false);
  const secret = type === "password";
  return (
    <div className="mb-4">
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium">{label}</label>
      <div className="relative">
        <input {...props} id={id} type={secret && shown ? "text" : type} aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-err` : undefined} className={`${INPUT} ${secret ? "pr-12" : ""}`} />
        {secret && (
          <button type="button" onClick={() => setShown(!shown)} aria-label={shown ? "Hide password" : "Show password"} className={`absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground ${FOCUS}`}>
            {shown ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
          </button>
        )}
      </div>
      {error && <p id={`${id}-err`} role="alert" className="mt-1.5 text-[11px] font-medium text-destructive">{error}</p>}
    </div>
  );
}

function Submit({ pending, children }: { pending: boolean; children: React.ReactNode }) {
  return (
    <button type="submit" disabled={pending} aria-busy={pending} className={BUTTON}>
      {pending && <LoaderCircle className="size-4 motion-safe:animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}

const FormError = ({ message }: { message?: string }) =>
  message ? <p role="alert" className="mb-4 rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs">{message}</p> : null;

/* ------------------------------- Login ------------------------------- */

export type LoginPageProps = {
  appName?: string;
  logo?: React.ReactNode;
  onSuccess?: (user: User) => void;
  onRegister?: () => void;
  /** Wire Socialite / OAuth here. Without it, social buttons show a "not enabled" message. */
  onSocial?: (provider: LoginMethod) => void;
};

export function LoginPage({ appName = "your store", logo, onSuccess, onRegister, onSocial }: LoginPageProps) {
  const { login } = useAuth();
  const [step, setStep] = React.useState<"email" | "password">("email");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [pending, setPending] = React.useState(false);

  if (step === "email") {
    return (
      <IdentifierFirstLogin
        appName={appName}
        logo={logo}
        description="Enter your email to sign in to your account."
        email={email}
        onEmailChange={(value) => { setEmail(value); setError(""); }}
        error={error}
        onContinue={(method) => {
          if (method === "password") { setError(""); setStep("password"); }
          else if (onSocial) onSocial(method);
          else setError("That sign-in option isn't enabled yet.");
        }}
        footer={<>New customer? <button type="button" onClick={onRegister} className={LINK}>Create an account</button></>}
      />
    );
  }

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError("");
    try {
      onSuccess?.(await login(email.trim(), password));
    } catch (err) {
      setError(err instanceof AuthError ? err.message : "Couldn't sign you in. Try again.");
    } finally {
      setPending(false);
    }
  };

  return (
    <Card logo={logo} title={`Sign in to ${appName}`} subtitle={email.trim()}>
      <form onSubmit={submit} noValidate>
        <FormError message={error} />
        <input type="email" name="email" value={email} autoComplete="username" readOnly hidden />
        <Field label="Password" type="password" name="password" autoComplete="current-password" autoFocus required value={password} onChange={(e) => setPassword(e.target.value)} />
        <Submit pending={pending}>Sign in</Submit>
      </form>
      <button type="button" onClick={() => { setStep("email"); setPassword(""); setError(""); }} className={`mx-auto mt-4 block text-[11px] text-muted-foreground hover:text-foreground ${FOCUS}`}>
        Use a different email
      </button>
    </Card>
  );
}

/* ------------------------------ Register ----------------------------- */

export type RegisterPageProps = {
  appName?: string;
  logo?: React.ReactNode;
  onSuccess?: (user: User) => void;
  onLogin?: () => void;
};

export function RegisterPage({ appName = "your store", logo, onSuccess, onLogin }: RegisterPageProps) {
  const { register } = useAuth();
  const [form, setForm] = React.useState({ name: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [pending, setPending] = React.useState(false);
  const bind = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value })),
    error: errors[key],
  });

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = "Enter your name.";
    if (!EMAIL_RE.test(form.email.trim())) next.email = "Enter a valid email address.";
    if (form.password.length < 8) next.password = "Use at least 8 characters.";
    if (form.confirm !== form.password) next.confirm = "Passwords don't match.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setPending(true);
    try {
      onSuccess?.(await register({ name: form.name.trim(), email: form.email.trim(), password: form.password, password_confirmation: form.confirm }));
    } catch (err) {
      if (err instanceof AuthError && Object.keys(err.fields).length) {
        // Map server field names onto form keys; "password_confirmation" lives under "confirm".
        setErrors(Object.fromEntries(Object.entries(err.fields).map(([k, v]) => [k === "password_confirmation" ? "confirm" : k, v[0]])));
      } else {
        setErrors({ form: err instanceof AuthError ? err.message : "Couldn't create your account. Try again." });
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <Card logo={logo} title={`Create your ${appName} account`} subtitle="Save your details for faster checkout and order tracking.">
      <form onSubmit={submit} noValidate>
        <FormError message={errors.form} />
        <Field label="Full name" name="name" autoComplete="name" required {...bind("name")} />
        <Field label="Email address" type="email" name="email" autoComplete="email" autoCapitalize="none" spellCheck={false} required {...bind("email")} />
        <Field label="Password" type="password" name="new-password" autoComplete="new-password" required {...bind("password")} />
        <Field label="Confirm password" type="password" name="confirm-password" autoComplete="new-password" required {...bind("confirm")} />
        <Submit pending={pending}>Create account</Submit>
      </form>
      <p className="mt-4 text-center text-[11px] text-muted-foreground">
        Already have an account? <button type="button" onClick={onLogin} className={LINK}>Sign in</button>
      </p>
    </Card>
  );
}
