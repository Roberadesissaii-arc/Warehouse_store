"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  ClipboardList,
  Info,
  LogOut,
  ServerCog,
  Settings2,
  ShieldAlert,
  Sliders,
  UserRound,
} from "lucide-react";
import { MobileLabHero } from "@/components/mobile/MobileLabHero";
import { AccountSubpageFrame } from "./AccountSubpageFrame";
import { useAccount } from "@/components/AccountProvider";
import { useToast } from "@/components/ToastProvider";
import { useIsMobile } from "@/hooks/useIsMobile";
import { fetchSystemInfo, signOut, updatePassword } from "@/lib/store";
import type { SystemInfo } from "@/lib/api";

function SettingsCard({
  icon: Icon,
  title,
  description,
  danger,
  children,
}: {
  icon: typeof UserRound;
  title: string;
  description?: string;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className={`store-row settings-card${danger ? " settings-card--danger" : ""}`}>
      <div className="settings-card-head">
        <span className="settings-card-icon" aria-hidden>
          <Icon size={18} strokeWidth={2.1} />
        </span>
        <div className="settings-card-head-copy">
          <h2>{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
      </div>
      <div className="settings-card-body">{children}</div>
    </section>
  );
}

function ProfileSection() {
  const { account, updateProfileName } = useAccount();
  const { showToast } = useToast();
  const [name, setName] = useState(account?.name || "");
  const [syncedName, setSyncedName] = useState(account?.name);
  const [busy, setBusy] = useState(false);

  if (account?.name !== syncedName) {
    setSyncedName(account?.name);
    setName(account?.name || "");
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await updateProfileName(name.trim());
      showToast("Profile updated");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not save profile", true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <SettingsCard icon={UserRound} title="Profile" description="Your name appears on every pick request.">
      <form className="settings-form" onSubmit={onSubmit}>
        <label className="field-label" htmlFor="acct-name">
          Your name
        </label>
        <input
          id="acct-name"
          className="field-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Shown on pick requests"
          autoComplete="name"
        />
        <label className="field-label" htmlFor="acct-email">
          Email
        </label>
        <input id="acct-email" className="field-input" value={account?.email || ""} readOnly autoComplete="email" />
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? "Saving…" : "Save profile"}
        </button>
      </form>
    </SettingsCard>
  );
}

function PreferencesSection() {
  const { preferences, updatePreferences, ready } = useAccount();
  const { showToast } = useToast();
  const [priority, setPriority] = useState<"standard" | "rush">(preferences.priority);
  const [note, setNote] = useState(preferences.note);
  const [seeded, setSeeded] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!seeded && ready) {
    setSeeded(true);
    setPriority(preferences.priority);
    setNote(preferences.note);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await updatePreferences({ priority, note: note.trim() });
      showToast("Preferences saved");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not save preferences", true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <SettingsCard
      icon={Sliders}
      title="Pick preferences"
      description="Defaults used next time you send a pick from your pick list."
    >
      <form className="settings-form" onSubmit={onSubmit}>
        <span className="field-label">Default pick speed</span>
        <div className="pick-options">
          <label className={priority === "standard" ? "pick-option active" : "pick-option"}>
            <input
              type="radio"
              name="acct-priority"
              checked={priority === "standard"}
              onChange={() => setPriority("standard")}
            />
            <span>
              <strong>Standard pick</strong>
              <small>Queue on the floor when a picker is free</small>
            </span>
          </label>
          <label className={priority === "rush" ? "pick-option active" : "pick-option"}>
            <input
              type="radio"
              name="acct-priority"
              checked={priority === "rush"}
              onChange={() => setPriority("rush")}
            />
            <span>
              <strong>Rush pick</strong>
              <small>Prioritize this request on the floor</small>
            </span>
          </label>
        </div>
        <label className="field-label" htmlFor="acct-note">
          Default note for the picker
        </label>
        <textarea
          id="acct-note"
          className="field-textarea"
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional — pre-filled in your pick list"
        />
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? "Saving…" : "Save preferences"}
        </button>
      </form>
    </SettingsCard>
  );
}

function PasswordSection() {
  const { showToast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast("New passwords do not match", true);
      return;
    }
    setBusy(true);
    try {
      await updatePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast("Password updated");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not update password", true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <SettingsCard
      icon={Settings2}
      title="Password"
      description="At least 8 characters with a letter and a number."
    >
      <form className="settings-form" onSubmit={onSubmit}>
        <label className="field-label" htmlFor="acct-current-pw">
          Current password
        </label>
        <input
          id="acct-current-pw"
          className="field-input"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
        <label className="field-label" htmlFor="acct-new-pw">
          New password
        </label>
        <input
          id="acct-new-pw"
          className="field-input"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoComplete="new-password"
          required
        />
        <label className="field-label" htmlFor="acct-confirm-pw">
          Confirm new password
        </label>
        <input
          id="acct-confirm-pw"
          className="field-input"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          required
        />
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? "Updating…" : "Update password"}
        </button>
      </form>
    </SettingsCard>
  );
}

function NotificationsSection() {
  const { account, markNotificationsSeen, clearNotifications } = useAccount();
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);
  const orders = account?.orders ?? [];
  const unread = orders.filter(
    (o) => !o.notification_hidden && (o.seen_status ?? null) !== (o.status || "preparing"),
  ).length;
  const visible = orders.filter((o) => !o.notification_hidden).length;

  async function run(fn: () => Promise<void>, msg: string) {
    setBusy(true);
    try {
      await fn();
      showToast(msg);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not update notifications", true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <SettingsCard
      icon={Bell}
      title="Notifications"
      description={
        unread ? `${unread} unread pick update${unread === 1 ? "" : "s"}.` : "You're all caught up on pick updates."
      }
    >
      <div className="settings-actions">
        <button
          type="button"
          className="btn-secondary"
          disabled={busy || !unread}
          onClick={() => void run(markNotificationsSeen, "Marked all read")}
        >
          Mark all read
        </button>
        <button
          type="button"
          className="btn-secondary"
          disabled={busy || !visible}
          onClick={() => void run(clearNotifications, "Notifications cleared")}
        >
          Clear notifications
        </button>
      </div>
    </SettingsCard>
  );
}

function WarehouseSection({ system, loading }: { system: SystemInfo | null; loading: boolean }) {
  const connected = system?.warehouse_connected;
  return (
    <SettingsCard
      icon={ServerCog}
      title="Warehouse connection"
      description="Your store reads live stock and sends picks to this warehouse."
    >
      <div className="settings-status">
        <span
          className={`settings-status-dot${connected ? " settings-status-dot--ok" : " settings-status-dot--off"}`}
          aria-hidden
        />
        <span className="settings-status-text">
          {loading ? "Checking…" : connected ? "Connected to WarehouseDB" : "WarehouseDB not reachable"}
        </span>
      </div>
      {system?.warehouse_url ? (
        <div className="settings-info-row">
          <span>Warehouse URL</span>
          <span className="settings-info-value">{system.warehouse_url}</span>
        </div>
      ) : null}
    </SettingsCard>
  );
}

function formatMemberSince(raw?: string | null) {
  if (!raw) return "—";
  const date = new Date(raw.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return raw;
  return new Intl.DateTimeFormat(undefined, { year: "numeric", month: "long", day: "numeric" }).format(date);
}

function AccountInfoSection({ system }: { system: SystemInfo | null }) {
  const { account } = useAccount();
  return (
    <SettingsCard icon={Info} title="App & account" description="Where your store data lives.">
      <div className="settings-info-list">
        <div className="settings-info-row">
          <span>Email</span>
          <span className="settings-info-value">{account?.email || "—"}</span>
        </div>
        <div className="settings-info-row">
          <span>Member since</span>
          <span className="settings-info-value">{formatMemberSince(account?.memberSince)}</span>
        </div>
        <div className="settings-info-row">
          <span>App version</span>
          <span className="settings-info-value">{system?.app_version || "—"}</span>
        </div>
      </div>
      <p className="empty-copy">Your account, preferences, and pick history are stored in the store database on this server.</p>
    </SettingsCard>
  );
}

function DangerSection() {
  const { account, clearPickHistory } = useAccount();
  const { showToast } = useToast();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const count = account?.orders?.length ?? 0;

  async function onClear() {
    setBusy(true);
    try {
      await clearPickHistory();
      showToast("Pick history cleared");
      setConfirming(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not clear history", true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <SettingsCard
      icon={ShieldAlert}
      title="Danger zone"
      description="Permanently remove your pick history. This cannot be undone."
      danger
    >
      {confirming ? (
        <div className="settings-actions">
          <button type="button" className="btn-danger" disabled={busy} onClick={() => void onClear()}>
            {busy ? "Clearing…" : `Yes, delete ${count} pick${count === 1 ? "" : "s"}`}
          </button>
          <button type="button" className="btn-secondary" disabled={busy} onClick={() => setConfirming(false)}>
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="btn-danger"
          disabled={!count}
          onClick={() => setConfirming(true)}
        >
          Clear pick history
        </button>
      )}
    </SettingsCard>
  );
}

function SettingsSections({ onSignOut }: { onSignOut: () => void }) {
  const [system, setSystem] = useState<SystemInfo | null>(null);
  const [systemLoading, setSystemLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await fetchSystemInfo();
        if (!cancelled) setSystem(data);
      } catch {
        /* leave null */
      } finally {
        if (!cancelled) setSystemLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="settings-stack">
      <Link href="/account/orders" className="settings-card settings-link-card">
        <span className="settings-card-icon" aria-hidden>
          <ClipboardList size={18} strokeWidth={2.1} />
        </span>
        <span className="settings-card-head-copy">
          <h2>Your picks</h2>
          <p>Track the pick requests you&apos;ve sent to the floor.</p>
        </span>
      </Link>

      <ProfileSection />
      <PreferencesSection />
      <PasswordSection />
      <NotificationsSection />
      <WarehouseSection system={system} loading={systemLoading} />
      <AccountInfoSection system={system} />
      <DangerSection />

      <button type="button" className="btn-secondary settings-signout" onClick={onSignOut}>
        <LogOut size={16} aria-hidden />
        Sign out
      </button>
    </div>
  );
}

function GuestView({ mobile }: { mobile: boolean }) {
  const body = (
    <section className="store-row account-panel settings-guest">
      <p>No account needed to browse inventory or build your pick list. Sign in to send picks and manage your settings.</p>
      <Link href="/sign-in?next=/account" className="btn-primary account-panel-action">
        Sign in to request picks
      </Link>
    </section>
  );

  if (mobile) {
    return (
      <div className="account-page account-page--mobile">
        <MobileLabHero
          eyebrow="Settings"
          title="Browsing as guest"
          lead="Sign in to manage your profile, preferences, and picks."
        />
        <div className="account-m-body">{body}</div>
      </div>
    );
  }

  return (
    <AccountSubpageFrame
      eyebrow="Settings"
      title="Browsing as guest"
      lead="Sign in to manage your profile, preferences, and picks."
      pills={["Profile", "Preferences", "Sign in to pick"]}
    >
      {body}
    </AccountSubpageFrame>
  );
}

export function AccountClient() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const { account, signedIn, ready } = useAccount();

  function onSignOut() {
    void signOut().finally(() => {
      router.push("/");
      router.refresh();
    });
  }

  if (isMobile === null || !ready) {
    return <div className="empty-state">Loading…</div>;
  }

  if (!signedIn || !account) {
    return <GuestView mobile={isMobile} />;
  }

  const firstName = (account.name || account.email).split(/\s+/)[0];
  const sections = <SettingsSections onSignOut={onSignOut} />;

  if (isMobile) {
    return (
      <div className="account-page account-page--mobile">
        <MobileLabHero eyebrow="Settings" title={`Hello, ${firstName}`} lead={account.email} />
        <div className="account-m-body">{sections}</div>
      </div>
    );
  }

  return (
    <AccountSubpageFrame
      eyebrow="Settings"
      title={`Hello, ${firstName}`}
      lead={account.email}
      pills={["Profile", "Preferences", "Security"]}
    >
      {sections}
    </AccountSubpageFrame>
  );
}
