import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppProvider, useApp } from "./AppContext";
import { AuthProvider } from "./auth";
import { getStorageKeyForUser } from "./config";
import {
  clearBody,
  clickElement,
  renderWithRoot,
  unmountRoot,
} from "../test/render";

function ContextProbe(): JSX.Element {
  const { state, dispatch } = useApp();

  return (
    <div>
      <p data-testid="theme">{state.settings.theme}</p>
      <button
        type="button"
        data-testid="set-dark"
        onClick={() => dispatch({ type: "SET_THEME", theme: "dark" })}
      >
        Set Dark
      </button>
    </div>
  );
}

function getPersistedAppState(): {
  settings: { theme: string; push: boolean; email: boolean };
  habits?: unknown[];
} {
  const persistedRaw = localStorage.getItem(getStorageKeyForUser(null));
  expect(persistedRaw).not.toBeNull();

  return JSON.parse(String(persistedRaw)) as {
    settings: { theme: string; push: boolean; email: boolean };
    habits?: unknown[];
  };
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
});

afterEach(() => {
  clearBody();
});

describe("AppContext", () => {
  it("throws when useApp is used outside AppProvider", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    try {
      expect(() => {
        act(() => {
          root.render(<ContextProbe />);
        });
      }).toThrow("useApp must be used within AppProvider");

      await act(async () => {
        root.unmount();
      });
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });

  it("hydrates settings theme from storage and persists state", async () => {
    localStorage.setItem(
      getStorageKeyForUser(null),
      JSON.stringify({
        settings: { theme: "light", push: false, email: true },
        habits: [],
      }),
    );

    const { container, root } = await renderWithRoot(
      <AuthProvider>
        <AppProvider>
          <ContextProbe />
        </AppProvider>
      </AuthProvider>,
    );

    const themeNode = container.querySelector('[data-testid="theme"]');
    expect(themeNode?.textContent).toBe("light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");

    const persisted = getPersistedAppState();

    expect(persisted.settings).toEqual({
      theme: "light",
      push: false,
      email: true,
    });
    expect(Array.isArray(persisted.habits)).toBe(true);

    await unmountRoot(root);
  });

  it("updates theme attribute and persisted settings on dispatch", async () => {
    const { container, root } = await renderWithRoot(
      <AuthProvider>
        <AppProvider>
          <ContextProbe />
        </AppProvider>
      </AuthProvider>,
    );

    const button = container.querySelector('[data-testid="set-dark"]');
    expect(button).not.toBeNull();

    await clickElement(button);

    const themeNode = container.querySelector('[data-testid="theme"]');
    expect(themeNode?.textContent).toBe("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");

    const persisted = getPersistedAppState();

    expect(persisted.settings.theme).toBe("dark");

    await unmountRoot(root);
  });
});
