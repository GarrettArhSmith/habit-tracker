import { useApp } from "./context/api";
import BottomNav from "./components/BottomNav";
import HomeScreen from "./screens/HomeScreen";
import HabitDetailScreen from "./screens/HabitDetailScreen";
import StatsScreen from "./screens/StatsScreen";
import SettingsScreen from "./screens/SettingsScreen";
import NewHabitScreen from "./screens/NewHabitScreen";
import type { AppView } from "./context/types";

const SCREENS: Record<AppView, () => JSX.Element | null> = {
  home: HomeScreen,
  detail: HabitDetailScreen,
  stats: StatsScreen,
  settings: SettingsScreen,
  newHabit: NewHabitScreen,
};

export default function App() {
  const { state } = useApp();
  const Screen = SCREENS[state.view] ?? HomeScreen;

  return (
    <div className="app-shell">
      <main className="scroll-area">
        <Screen />
      </main>
      <BottomNav />
    </div>
  );
}
