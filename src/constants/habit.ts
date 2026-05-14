import type { CompletionRule } from "../context/types";

export type CountingRuleOption = {
  label: string;
  value: CompletionRule;
};

export const COUNTING_RULE_OPTIONS: ReadonlyArray<CountingRuleOption> = [
  { label: "Any Progress", value: "any" },
  { label: "Goal Reached", value: "goal" },
  { label: "Weighted", value: "weighted" },
];
