"use client";

import { FormEvent, useEffect, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, GalleryVerticalEnd, Lock, Mail, MapPin, Package, Shield, User } from "lucide-react";
import { get } from "@/lib/api";
import { createAccount, signIn } from "@/lib/store";
import { useAccount } from "@/components/AccountProvider";
import { useToast } from "@/components/ToastProvider";
import { storeImages } from "@/lib/images";

const FEATURES = [
  {
    icon: Package,
    title: "Live shelf counts",
    text: "Browse what is on hand in your warehouse, by section and location.",
  },
  {
    icon: GalleryVerticalEnd,
    title: "Pick list & floor dispatch",
    text: "Queue items and send a pick to your lab floor when you are ready.",
  },
  {
    icon: MapPin,
    title: "Shelf locations",
    text: "Every line shows where stock lives — section, shelf, and availability.",
  },
  {
    icon: Shield,
    title: "Private lab access",
    text: "One owner account on this server. Sign in to dispatch picks and view history.",
  },
] as const;

const MOBILE_HERO = {
  signIn: {
    sub: "Your shelf, your lab.",
    desc: "Sign in to queue picks, send them to the floor, and keep your private inventory view in sync.",
  },
  signUp: {
    sub: "First run on this server.",
    desc: "Create the owner account — then browse inventory, build pick lists, and dispatch floor picks.",
  },
} as const;

const REMEMBER_EMAIL_KEY = "warehouse-store-remember-email";

function subscribeRememberEmail(onStoreChange: () => void) {
  const handler = (event: StorageEvent) => {
    if (event.key === null || event.key === REMEMBER_EMAIL_KEY) onStoreChange();
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}

function readRememberedEmail() {
  return localStorage.getItem(REMEMBER_EMAIL_KEY) || "";
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 959px)");
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return isMobile;
}

function SignInForm({
  needsSetup,
  name,
  setName,
  email,
  setEmail,
  password,
  setPassword,
  busy,
  onSubmit,
  onClearError,
  mobile,
  rememberMe,
  setRememberMe,
}: {
  needsSetup: boolean;
  name: string;
  setName: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  busy: boolean;
  onSubmit: (e: FormEvent) => void;
  onClearError: () => void;
  mobile?: boolean;
  rememberMe?: boolean;
  setRememberMe?: (v: boolean) => void;
}) {
  if (mobile) {
    return (
      <form className="sign-in-m-form" onSubmit={onSubmit}>
        {needsSetup ? (
          <label className="sign-in-m-field">
            <span className="sign-in-m-label">Your name</span>
            <span className="sign-in-m-input-wrap">
              <User size={16} strokeWidth={2} aria-hidden />
              <input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  onClearError();
                }}
                placeholder="e.g. Alex"
                autoComplete="name"
                required
              />
            </span>
          </label>
        ) : null}
        <label className="sign-in-m-field">
          <span className="sign-in-m-label">Email</span>
          <span className="sign-in-m-input-wrap">
            <Mail size={16} strokeWidth={2} aria-hidden />
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                onClearError();
              }}
              placeholder="you@lab.local"
              autoComplete="email"
              required
            />
          </span>
        </label>
        <label className="sign-in-m-field">
          <span className="sign-in-m-label">Password</span>
          <span className="sign-in-m-input-wrap">
            <Lock size={16} strokeWidth={2} aria-hidden />
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                onClearError();
              }}
              placeholder="••••••••"
              autoComplete={needsSetup ? "new-password" : "current-password"}
              required
            />
          </span>
        </label>
        {!needsSetup ? (
          <label className="sign-in-m-remember">
            <button
              type="button"
              role="checkbox"
              aria-checked={rememberMe}
              className={`sign-in-m-remember-box${rememberMe ? " is-checked" : ""}`}
              onClick={() => setRememberMe?.(!rememberMe)}
            >
              {rememberMe ? <Check size={12} strokeWidth={2.5} aria-hidden /> : null}
            </button>
            <span>Remember me</span>
          </label>
        ) : null}
        <button type="submit" className="sign-in-m-submit" disabled={busy}>
          {busy ? "Please wait…" : needsSetup ? "Create account" : "Sign in"}
        </button>
      </form>
    );
  }

  return (
    <form className="sign-in-form" onSubmit={onSubmit}>
      {needsSetup ? (
        <label className="sign-in-field">
          <span>Your name</span>
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              onClearError();
            }}
            placeholder="e.g. Alex"
            autoComplete="name"
            required
          />
        </label>
      ) : null}
      <label className="sign-in-field">
        <span>Email</span>
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            onClearError();
          }}
          placeholder="you@lab.local"
          autoComplete="email"
          required
        />
      </label>
      <label className="sign-in-field">
        <span>Password</span>
        <input
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            onClearError();
          }}
          placeholder="••••••••"
          autoComplete={needsSetup ? "new-password" : "current-password"}
          required
        />
      </label>
      <button type="submit" className="sign-in-submit" disabled={busy}>
        {busy ? "Please wait…" : needsSetup ? "Create account" : "Sign in"}
      </button>
    </form>
  );
}

function FormHeader({
  needsSetup,
  mobile,
}: {
  needsSetup: boolean;
  mobile?: boolean;
}) {
  if (mobile) {
    return (
      <div className="sign-in-m-card-head">
        <h2>{needsSetup ? "Create owner account" : "Sign in"}</h2>
        <p>
          {needsSetup
            ? "First run on this server — one account for your lab."
            : "Use your owner email and password for this warehouse."}
        </p>
      </div>
    );
  }

  return (
    <>
      <p className="sign-in-kicker">Warehouse Store</p>
      <h2>{needsSetup ? "Create owner account" : "Sign in"}</h2>
      <p className="sign-in-lead">
        {needsSetup
          ? "First run on this server — one account for your lab."
          : "Use your owner email and password for this warehouse."}
      </p>
    </>
  );
}

function SignInLoading() {
  return (
    <div className="sign-in-page">
      <div className="sign-in-loading">
        <p>Loading…</p>
      </div>
    </div>
  );
}

export function SignInClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const { refresh } = useAccount();
  const isMobile = useIsMobile();
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null);
  const [name, setName] = useState("");
  const rememberedEmail = useSyncExternalStore(
    subscribeRememberEmail,
    readRememberedEmail,
    () => ""
  );
  const [emailDraft, setEmailDraft] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rememberDraft, setRememberDraft] = useState<boolean | null>(null);

  const email = emailDraft ?? rememberedEmail;
  const rememberMe = rememberDraft ?? Boolean(rememberedEmail);

  const next = searchParams.get("next") || "/";
  const heroCopy = needsSetup ? MOBILE_HERO.signUp : MOBILE_HERO.signIn;

  useEffect(() => {
    get<{ needs_setup?: boolean }>("/api/auth/status")
      .then((data) => setNeedsSetup(Boolean(data.needs_setup)))
      .catch(() => setNeedsSetup(false));
  }, []);

  function reportError(message: string) {
    if (isMobile) {
      setError(message);
      return;
    }
    setError(null);
    showToast(message, true);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (needsSetup) {
        const account = await createAccount(name, email, password);
        const verified = await refresh();
        if (!verified) {
          reportError("Account created but your session could not be saved. Is the store API running on port 5004?");
          return;
        }
        if (!isMobile) {
          showToast(`Welcome, ${(account.name || account.email).split(/\s+/)[0]}`);
        }
      } else {
        await signIn(email, password);
        const verified = await refresh();
        if (!verified) {
          reportError("Sign-in succeeded but your session was not saved. Is the store API running on port 5004?");
          return;
        }
        if (rememberMe) {
          localStorage.setItem(REMEMBER_EMAIL_KEY, email);
        } else {
          localStorage.removeItem(REMEMBER_EMAIL_KEY);
        }
        if (!isMobile) {
          const account = verified;
          showToast(`Welcome back, ${(account.name || account.email).split(/\s+/)[0]}`);
        }
      }
      router.replace(next.startsWith("/") ? next : "/");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not sign in";
      reportError(message);
    } finally {
      setBusy(false);
    }
  }

  const formProps = {
    needsSetup: Boolean(needsSetup),
    name,
    setName,
    email,
    setEmail: setEmailDraft,
    password,
    setPassword,
    busy,
    onSubmit,
    onClearError: () => setError(null),
    rememberMe,
    setRememberMe: setRememberDraft,
  };

  if (needsSetup === null || isMobile === null) {
    return <SignInLoading />;
  }

  if (isMobile) {
    return (
      <div className={`sign-in-page sign-in-page--mobile${needsSetup ? " sign-in-page--setup" : ""}`}>
        <div className="sign-in-m-shell">
          <div className="sign-in-hero">
            <div className="sign-in-hero-top">
              <p className="sign-in-hero-wordmark">
                Warehouse<span className="sign-in-hero-wordmark-dot"> Store</span>
              </p>
              <span className="sign-in-hero-badge">Lab</span>
            </div>

            {error ? (
              <p className="sign-in-hero-error" role="alert">
                {error}
              </p>
            ) : null}

            <div className="sign-in-hero-copy">
              <p className="sign-in-hero-sub">{heroCopy.sub}</p>
              <p className="sign-in-hero-desc">{heroCopy.desc}</p>
            </div>

            <div className="sign-in-hero-dot" aria-hidden />
          </div>

          <div className="sign-in-m-body">
            <div className="sign-in-m-card">
              <FormHeader needsSetup={needsSetup} mobile />
              <SignInForm {...formProps} mobile />
              <Link href="/" className="sign-in-m-back">
                Back to store
              </Link>
            </div>

            <footer className="sign-in-m-footer" aria-label="Warehouse Store Mobile">
              <span className="sign-in-m-footer-brand">Warehouse Store</span>
              <span className="sign-in-m-footer-label">Mobile</span>
            </footer>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`sign-in-page${needsSetup ? " sign-in-page--setup" : ""}`}>
      <div className="sign-in-desktop">
        <aside className="sign-in-visual" aria-hidden={false}>
          <Link href="/" className="sign-in-brand">
            <span className="sign-in-brand-text">
              Warehouse <em>Store</em>
            </span>
          </Link>

          <div className="sign-in-visual-copy">
            <p className="sign-in-visual-eyebrow">Your personal lab</p>
            <h1 className="sign-in-visual-title">
              {needsSetup ? "Set up your warehouse" : "Welcome back to your shelf"}
            </h1>
            <p className="sign-in-visual-lead">
              {needsSetup
                ? "Create the owner account for this server — then browse inventory, build pick lists, and dispatch floor picks."
                : "Sign in to queue picks, send them to the floor, and keep your private inventory view in sync."}
            </p>

            <ul className="sign-in-features">
              {FEATURES.map(({ icon: Icon, title, text }) => (
                <li key={title}>
                  <span className="sign-in-feature-icon" aria-hidden>
                    <Icon size={18} strokeWidth={2} />
                  </span>
                  <div>
                    <strong>{title}</strong>
                    <p>{text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="sign-in-art-wrap">
            <Image
              src={storeImages.auth.signInWarehouse}
              alt=""
              width={520}
              height={520}
              className="sign-in-art"
              priority
            />
          </div>
        </aside>

        <main className="sign-in-panel">
          <div className="sign-in-form-shell">
            <FormHeader needsSetup={needsSetup} />
            <SignInForm {...formProps} />
            <Link href="/" className="sign-in-back">
              Back to store
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
