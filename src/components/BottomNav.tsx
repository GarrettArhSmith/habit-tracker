import { House, BarChart2, Settings } from "lucide-react";
import { useApp } from "../context/api";
import type { AppPrimaryTab } from "../context/types";
import type { LucideIcon } from "lucide-react";

type NavTab = {
  id: AppPrimaryTab;
  label: string;
  Icon: LucideIcon;
};

const TABS: ReadonlyArray<NavTab> = [
  { id: "home", label: "Home", Icon: House },
  { id: "stats", label: "Stats", Icon: BarChart2 },
  { id: "settings", label: "Settings", Icon: Settings },
];

export default function BottomNav(): JSX.Element {
  const { state, dispatch } = useApp();
  const active = state.activeTab ?? "home";

  return (
    <nav className="bottom-nav" aria-label="Primary navigation">
      {TABS.map(({ id, label, Icon }) => (
        <button
          key={id}
          className={`nav-btn ${active === id ? "active" : ""}`}
          onClick={() => dispatch({ type: "NAVIGATE", view: id })}
          aria-current={active === id ? "page" : undefined}
        >
          <Icon size={20} strokeWidth={active === id ? 2.5 : 1.8} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
