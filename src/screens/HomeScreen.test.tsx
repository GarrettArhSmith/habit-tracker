import { afterEach, describe, expect, it, vi } from "vitest";
import HomeScreen from "./HomeScreen";
import {
  clearBody,
  clickElement,
  renderWithRoot,
  unmountRoot,
} from "../test/render";

const dispatch = vi.fn();

vi.mock("../context/api", () => ({
  useApp: () => ({
    state: {
      habits: [
        {
          id: "habit-binary",
          name: "Read",
          frequency: "Daily",
          color: "#10b981",
          trackingMode: "binary",
          dailyTarget: 1,
          completionRule: "goal",
          measurement: "times",
          history: { "2026-05-14": 1 },
          doneToday: true,
        },
        {
          id: "habit-multiple",
          name: "Water",
          frequency: "Daily",
          color: "#2170e4",
          trackingMode: "multiple",
          dailyTarget: 4,
          completionRule: "goal",
          measurement: "glasses",
          history: { "2026-05-14": 2 },
          doneToday: false,
        },
      ],
      settings: { theme: "system", push: true, email: false },
      view: "home",
      activeTab: "home",
      detailId: null,
      history: [],
    },
    dispatch,
  }),
  useAuth: () => ({
    user: null,
  }),
}));

afterEach(() => {
  dispatch.mockClear();
  clearBody();
});

describe("HomeScreen", () => {
  it("renders summary and dispatches the expected actions", async () => {
    const { container, root } = await renderWithRoot(<HomeScreen />);

    expect(container.textContent).toContain("Daily Completion");
    expect(container.textContent).toContain("50%");
    expect(container.textContent).toContain("Read");
    expect(container.textContent).toContain("Water");

    const toggleButton = container.querySelector(
      'button[aria-label="Mark Read incomplete"]',
    );
    expect(toggleButton).not.toBeNull();

    await clickElement(toggleButton);

    expect(dispatch).toHaveBeenCalledWith({
      type: "TOGGLE_HABIT",
      id: "habit-binary",
    });

    const increaseButton = container.querySelector(
      'button[aria-label="Increase Water"]',
    );
    expect(increaseButton).not.toBeNull();

    await clickElement(increaseButton);

    expect(dispatch).toHaveBeenCalledWith({
      type: "ADJUST_HABIT_COUNT",
      id: "habit-multiple",
      delta: 1,
    });

    const habitCard = container.querySelector('article[role="button"]');
    expect(habitCard).not.toBeNull();

    await clickElement(habitCard);

    expect(dispatch).toHaveBeenCalledWith({
      type: "NAVIGATE",
      view: "detail",
      detailId: "habit-binary",
    });

    const fab = container.querySelector('button[aria-label="Add new habit"]');
    expect(fab).not.toBeNull();

    await clickElement(fab);

    expect(dispatch).toHaveBeenCalledWith({
      type: "NAVIGATE",
      view: "newHabit",
    });

    await unmountRoot(root);
  });
});
