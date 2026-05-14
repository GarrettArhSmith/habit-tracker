import { afterEach, describe, expect, it, vi } from "vitest";
import HabitDetailScreen from "./HabitDetailScreen";
import {
  clearBody,
  clickElement,
  renderWithRoot,
  unmountRoot,
} from "../test/render";

const dispatchAsync = vi.fn(() => Promise.resolve());

const mockState = {
  habits: [
    {
      id: "habit-1",
      name: "Read",
      frequency: "Daily",
      color: "#10b981",
      trackingMode: "binary",
      dailyTarget: 1,
      completionRule: "goal",
      measurement: "times",
      history: {
        "2026-05-14": 1,
        "2026-05-13": 1,
        "2026-05-12": 0,
      },
      doneToday: true,
    },
  ],
  settings: { theme: "system", push: true, email: false },
  view: "detail",
  activeTab: "home",
  detailId: "habit-1",
  history: [],
} as const;

vi.mock("../context/api", () => ({
  useApp: () => ({
    state: mockState,
    dispatchAsync,
    dispatch: vi.fn(),
  }),
}));

vi.mock("../components/MultiCompletionFields", () => ({
  default: ({
    onChange,
    disabled,
  }: {
    onChange: (patch: {
      measurement?: string;
      dailyTarget?: number;
      completionRule?: string;
    }) => void;
    disabled?: boolean;
  }) => (
    <button
      type="button"
      data-testid="multi-fields"
      disabled={disabled}
      onClick={() =>
        onChange({
          measurement: "sets",
          dailyTarget: 4,
          completionRule: "weighted",
        })
      }
    >
      Multi
    </button>
  ),
}));

afterEach(() => {
  dispatchAsync.mockClear();
  clearBody();
});

describe("HabitDetailScreen", () => {
  it("enters edit mode, updates draft state, and dispatches saved changes", async () => {
    const { container, root } = await renderWithRoot(<HabitDetailScreen />);

    expect(container.textContent).toContain("Read");
    expect(container.textContent).toContain("Current Streak");

    const editButton = container.querySelector(
      'button[aria-label="Edit habit"]',
    );
    expect(editButton).not.toBeNull();

    await clickElement(editButton);

    const cancelButton = container.querySelector(
      'button[aria-label="Cancel editing"]',
    );
    expect(cancelButton).not.toBeNull();

    const trackingToggle = Array.from(
      container.querySelectorAll("button"),
    ).find((button) => button.textContent?.trim() === "Multi Completion");
    expect(trackingToggle).not.toBeNull();

    const bluePreset = container.querySelector('button[title="Blue"]');
    expect(bluePreset).not.toBeNull();

    await clickElement(bluePreset);
    await clickElement(trackingToggle ?? null);

    const multiFields = container.querySelector('[data-testid="multi-fields"]');
    expect(multiFields).not.toBeNull();

    await clickElement(multiFields);

    const saveButton = container.querySelector("button.primary-btn");
    expect(saveButton).not.toBeNull();
    expect((saveButton as HTMLButtonElement).disabled).toBe(false);

    await clickElement(saveButton);

    expect(dispatchAsync).toHaveBeenCalledWith({
      type: "UPDATE_HABIT_SETTINGS",
      id: "habit-1",
      patch: {
        trackingMode: "multiple",
        dailyTarget: 4,
        completionRule: "weighted",
        measurement: "sets",
      },
    });

    expect(dispatchAsync).toHaveBeenCalledWith({
      type: "UPDATE_HABIT_COLOR",
      id: "habit-1",
      color: "#2170e4",
    });

    await unmountRoot(root);
  });

  it("deletes a habit after confirmation", async () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    const { container, root } = await renderWithRoot(<HabitDetailScreen />);

    const editButton = container.querySelector(
      'button[aria-label="Edit habit"]',
    );
    expect(editButton).not.toBeNull();

    await clickElement(editButton);

    const deleteButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.trim() === "Delete Habit",
    );
    expect(deleteButton).not.toBeNull();

    await clickElement(deleteButton ?? null);

    expect(dispatchAsync).toHaveBeenCalledWith({
      type: "DELETE_HABIT",
      id: "habit-1",
    });

    confirmSpy.mockRestore();
    await unmountRoot(root);
  });
});
