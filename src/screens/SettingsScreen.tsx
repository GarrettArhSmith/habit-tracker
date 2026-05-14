import {
  Sun,
  Moon,
  Monitor,
  Bell,
  Mail,
  Cloud,
  CloudOff,
  LoaderCircle,
  UserRound,
  Info,
  FileText,
  Shield,
  ChevronRight,
} from "lucide-react";
import { useApp, useAuth } from "../context/api";
import type { ReactNode } from "react";
import type { Theme } from "../context/types";
import ScreenTopBar from "../components/ScreenTopBar";

export default function SettingsScreen(): JSX.Element {
  const { state, dispatchAsync } = useApp();
  const { settings, syncStatus, syncError, lastSyncedAt } = state;
  const {
    user,
    isConfigured,
    isLoading,
    authError,
    signInWithGoogle,
    signOut,
  } = useAuth();

  const accountName = user?.user_metadata.full_name ?? user?.email ?? "Guest";
  const accountEmail = user?.email ?? "Local-only mode";
  const avatarUrl =
    (typeof user?.user_metadata?.avatar_url === "string" &&
      user.user_metadata.avatar_url.trim()) ||
    (typeof user?.user_metadata?.picture === "string" &&
      user.user_metadata.picture.trim()) ||
    null;

  async function setTheme(theme: Theme): Promise<void> {
    await dispatchAsync({ type: "SET_THEME", theme });
  }

  async function setNotif(
    key: "push" | "email",
    value: boolean,
  ): Promise<void> {
    await dispatchAsync({ type: "SET_NOTIF", key, value });
  }

  async function handleAuthClick(): Promise<void> {
    if (user) {
      await signOut();
      return;
    }

    await signInWithGoogle();
  }

  function renderSyncState(): JSX.Element {
    if (!isConfigured) {
      return (
        <p className="sync-note">
          Supabase env values are missing. Add keys to enable cloud sync.
        </p>
      );
    }

    if (syncStatus === "syncing") {
      return (
        <p className="sync-note">
          <LoaderCircle size={14} className="spin" /> Syncing updates...
        </p>
      );
    }

    if (syncStatus === "error") {
      return (
        <p className="sync-note sync-note-error">
          <CloudOff size={14} />{" "}
          {syncError ?? "Sync failed. Retrying when online."}
        </p>
      );
    }

    return (
      <p className="sync-note">
        <Cloud size={14} />
        {lastSyncedAt
          ? `Last synced ${new Date(lastSyncedAt).toLocaleString()}`
          : "Ready to sync"}
      </p>
    );
  }

  return (
    <div className="screen">
      <ScreenTopBar profileAriaLabel="Profile" />

      <Section label="Account">
        <article className="card account-card">
          <div className="avatar" aria-hidden="true">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                className="avatar-image"
                referrerPolicy="no-referrer"
              />
            ) : (
              <UserRound size={24} />
            )}
          </div>
          <div>
            <p className="font-16-700">{accountName}</p>
            <p className="t-body-sm">{accountEmail}</p>
          </div>
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className="account-avatar-chip"
              referrerPolicy="no-referrer"
            />
          ) : (
            <UserRound size={20} className="text-muted-icon" />
          )}
        </article>

        {isConfigured ? (
          <button
            type="button"
            className="signout-btn"
            onClick={() => {
              void handleAuthClick();
            }}
            disabled={isLoading}
          >
            {user ? "Sign Out" : "Sign In With Google"}
          </button>
        ) : null}

        {authError ? (
          <p className="sync-note sync-note-error">{authError}</p>
        ) : null}
      </Section>

      <Section label="Sync">
        <article className="card sync-card">{renderSyncState()}</article>
      </Section>

      <Section label="Theme">
        <div
          className="theme-seg"
          role="radiogroup"
          aria-label="Theme selector"
        >
          <ThemeOption
            label="Light"
            icon={<Sun size={18} />}
            active={settings.theme === "light"}
            onClick={() => {
              void setTheme("light");
            }}
          />
          <ThemeOption
            label="Dark"
            icon={<Moon size={18} />}
            active={settings.theme === "dark"}
            onClick={() => {
              void setTheme("dark");
            }}
          />
          <ThemeOption
            label="System"
            icon={<Monitor size={18} />}
            active={settings.theme === "system"}
            onClick={() => {
              void setTheme("system");
            }}
          />
        </div>
      </Section>

      <Section label="Notifications">
        <div className="card notif-list">
          <NotifRow
            icon={<Bell size={18} />}
            title="Push Notifications"
            sub="Daily reminders and streak alerts"
            checked={settings.push}
            onChange={(value) => {
              void setNotif("push", value);
            }}
            id="push-toggle"
          />
          <NotifRow
            icon={<Mail size={18} />}
            title="Email Digests"
            sub="Weekly performance summary"
            checked={settings.email}
            onChange={(value) => {
              void setNotif("email", value);
            }}
            id="email-toggle"
          />
        </div>
      </Section>

      <Section label="About">
        <div className="card about-list">
          <div className="about-row">
            <Info size={18} className="text-muted-icon" />
            <span className="about-row-label">Version</span>
            <span className="about-row-value">2.4.0 (Emerald)</span>
          </div>
          <a href="#" className="about-row">
            <FileText size={18} className="text-muted-icon" />
            <span className="about-row-label">Terms of Service</span>
            <ChevronRight size={16} className="text-muted-icon" />
          </a>
          <a href="#" className="about-row">
            <Shield size={18} className="text-muted-icon" />
            <span className="about-row-label">Privacy Policy</span>
            <ChevronRight size={16} className="text-muted-icon" />
          </a>
        </div>
      </Section>

      {!isConfigured ? (
        <p className="sync-note">
          Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to switch from
          local mode to cloud sync.
        </p>
      ) : null}
    </div>
  );
}

type SectionProps = {
  label: string;
  children: ReactNode;
};

function Section({ label, children }: SectionProps): JSX.Element {
  return (
    <section className="stack section-gap-10">
      <p className="t-label">{label}</p>
      {children}
    </section>
  );
}

type ThemeOptionProps = {
  label: string;
  icon: JSX.Element;
  active: boolean;
  onClick: () => void;
};

function ThemeOption({
  label,
  icon,
  active,
  onClick,
}: ThemeOptionProps): JSX.Element {
  return (
    <button
      className={`theme-opt ${active ? "active" : ""}`}
      onClick={onClick}
      role="radio"
      aria-checked={active}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

type NotifRowProps = {
  icon: JSX.Element;
  title: string;
  sub: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  id: string;
};

function NotifRow({
  icon,
  title,
  sub,
  checked,
  onChange,
  id,
}: NotifRowProps): JSX.Element {
  return (
    <label className="notif-row" htmlFor={id}>
      <span className="text-muted-icon">{icon}</span>
      <div className="notif-text">
        <p className="notif-title">{title}</p>
        <p className="notif-sub">{sub}</p>
      </div>
      <label className="toggle-switch">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          aria-label={title}
        />
        <span className="toggle-track" />
      </label>
    </label>
  );
}
