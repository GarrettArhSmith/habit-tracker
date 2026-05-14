import { CalendarDays, CircleUser } from "lucide-react";
import { useApp, useAuth } from "../context/api";
import { formatDate } from "../domain/habitMetrics";

type ScreenTopBarProps = {
  profileAriaLabel?: string;
};

export default function ScreenTopBar({
  profileAriaLabel = "Profile",
}: ScreenTopBarProps): JSX.Element {
  const { dispatch } = useApp();
  const { user } = useAuth();
  const avatarUrl =
    (typeof user?.user_metadata?.avatar_url === "string" &&
      user.user_metadata.avatar_url.trim()) ||
    (typeof user?.user_metadata?.picture === "string" &&
      user.user_metadata.picture.trim()) ||
    null;

  function handleProfileClick(): void {
    dispatch({ type: "NAVIGATE", view: "settings" });
  }

  return (
    <header className="topbar">
      <h1 className="topbar-title">
        <CalendarDays size={22} className="topbar-leading-icon" />
        Today, {formatDate()}
      </h1>
      <button
        className="icon-btn"
        aria-label={profileAriaLabel}
        onClick={handleProfileClick}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            className="topbar-profile-avatar"
            referrerPolicy="no-referrer"
          />
        ) : (
          <CircleUser size={20} />
        )}
      </button>
    </header>
  );
}
