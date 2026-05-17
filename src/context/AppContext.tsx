import {
  useCallback,
  createContext,
  useContext,
  useEffect,
  useReducer,
  useRef,
} from "react";
import type { ReactNode } from "react";
import { appReducer } from "./reducer";
import { useAuth } from "./auth";
import {
  useFlushSyncQueue,
  useHydrateFromRemote,
  useSyncedDispatch,
} from "./syncOrchestration";
import type { AppContextValue } from "./types";
import {
  useOnlineQueueFlush,
  usePersistedSnapshot,
  useThemeAttribute,
} from "./appStateEffects";
import { getInitialStateForUser } from "./appStateInit";
import { ANON_STORAGE_KEY, STORAGE_KEY } from "./config";

const AppContext = createContext<AppContextValue | undefined>(undefined);

type AppProviderProps = {
  children: ReactNode;
};

export function AppProvider({ children }: AppProviderProps): JSX.Element {
  const [state, rawDispatch] = useReducer(appReducer, undefined, () =>
    getInitialStateForUser(null),
  );
  const stateRef = useRef(state);
  const guestMigrationRef = useRef<{
    habits: typeof state.habits;
    settings: typeof state.settings;
    settingsUpdatedAt: typeof state.settingsUpdatedAt;
  } | null>(null);
  const isHydratingRef = useRef(false);
  const { user, isConfigured: isAuthConfigured } = useAuth();
  const userId = user?.id ?? null;
  const previousUserIdRef = useRef<string | null>(userId);
  const hasUserChanged = previousUserIdRef.current !== userId;

  stateRef.current = state;

  useEffect(() => {
    if (!hasUserChanged) {
      return;
    }

    const previousUserId = previousUserIdRef.current;

    previousUserIdRef.current = userId;

    if (userId && !previousUserId) {
      guestMigrationRef.current = {
        habits: stateRef.current.habits,
        settings: stateRef.current.settings,
        settingsUpdatedAt: stateRef.current.settingsUpdatedAt,
      };
    }

    if (!userId) {
      guestMigrationRef.current = null;
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Ignore cleanup failures.
      }
    }

    rawDispatch({
      type: "RESET_STATE",
      state: getInitialStateForUser(userId),
    });
  }, [hasUserChanged, rawDispatch, userId]);

  const commitGuestMigration = useCallback(() => {
    guestMigrationRef.current = null;

    try {
      localStorage.removeItem(ANON_STORAGE_KEY);
    } catch {
      // Ignore cleanup failures.
    }
  }, []);

  const syncUserId = hasUserChanged ? null : userId;

  const flushSyncQueue = useFlushSyncQueue({
    userId: syncUserId,
    isAuthConfigured,
    rawDispatch,
    stateRef,
    isHydratingRef,
  });

  useHydrateFromRemote({
    userId: syncUserId,
    isAuthConfigured,
    rawDispatch,
    stateRef,
    guestMigrationRef,
    isHydratingRef,
    onGuestMigrationCommitted: commitGuestMigration,
    flushSyncQueue,
  });

  const dispatch = useSyncedDispatch({
    rawDispatch,
    userId: syncUserId,
    flushSyncQueue,
  });

  async function dispatchAsync(
    action: Parameters<typeof dispatch>[0],
  ): Promise<void> {
    dispatch(action);
  }

  usePersistedSnapshot({
    state,
    userId,
    enabled: !hasUserChanged,
  });
  useThemeAttribute(state.settings.theme);
  useOnlineQueueFlush(flushSyncQueue);

  return (
    <AppContext.Provider value={{ state, dispatch, dispatchAsync }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }

  return context;
}
