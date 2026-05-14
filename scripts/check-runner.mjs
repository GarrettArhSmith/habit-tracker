import { spawnSync } from "node:child_process";
import { performance } from "node:perf_hooks";

const STAGES = [
  { name: "Lint", command: "npm run lint" },
  { name: "Typecheck", command: "npm run typecheck" },
  { name: "Tests", command: "npm run test" },
  { name: "Fallow Strict Gate", command: "npm run fallow:strict" },
];

const ANSI = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
};

const supportsColor =
  process.env.NO_COLOR === undefined && process.env.TERM !== "dumb";

function paint(text, ...codes) {
  if (!supportsColor || codes.length === 0) {
    return text;
  }

  return `${codes.join("")}${text}${ANSI.reset}`;
}

function runCommand(command) {
  const shellArgs =
    process.platform === "win32"
      ? ["cmd.exe", ["/c", command]]
      : ["sh", ["-lc", command]];

  return spawnSync(shellArgs[0], shellArgs[1], {
    cwd: process.cwd(),
    stdio: "inherit",
  });
}

function formatDurationMs(ms) {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  }

  return `${(ms / 1000).toFixed(2)}s`;
}

function printDivider() {
  console.log(
    paint(
      "============================================================",
      ANSI.dim,
      ANSI.cyan,
    ),
  );
}

function printStageHeader(index, total, name) {
  const counter = paint(`[${index}/${total}]`, ANSI.bold, ANSI.cyan);
  const title = paint(name, ANSI.bold, ANSI.white);
  console.log(`\n${counter} ${title}`);
  console.log(
    paint(
      "------------------------------------------------------------",
      ANSI.dim,
      ANSI.cyan,
    ),
  );
}

const startedAt = performance.now();
const durations = [];

printDivider();
console.log(paint("Quality Check Pipeline", ANSI.bold, ANSI.white));
console.log(
  `${paint("Stages:", ANSI.dim, ANSI.cyan)} ${paint(
    "lint, typecheck, test, fallow strict gate",
    ANSI.white,
  )}`,
);
printDivider();

for (let index = 0; index < STAGES.length; index += 1) {
  const stage = STAGES[index];
  printStageHeader(index + 1, STAGES.length, stage.name);
  console.log(`${paint("→", ANSI.yellow)} ${paint(stage.command, ANSI.dim, ANSI.white)}`);

  const stageStart = performance.now();
  const result = runCommand(stage.command);
  const stageElapsed = performance.now() - stageStart;
  durations.push({ name: stage.name, elapsedMs: stageElapsed });

  const exitCode = result.status ?? 1;
  if (exitCode !== 0) {
    console.error(
      `\n${paint("✖ FAIL", ANSI.bold, ANSI.red)} ${paint(
        `${stage.name} failed in ${formatDurationMs(stageElapsed)}.`,
        ANSI.white,
      )}`,
    );
    console.error(
      `${paint("Stopped:", ANSI.red)} stage ${index + 1}/${STAGES.length}.`,
    );
    process.exit(exitCode);
  }

  console.log(
    `\n${paint("✔ OK", ANSI.bold, ANSI.green)} ${paint(
      `${stage.name} passed in ${formatDurationMs(stageElapsed)}.`,
      ANSI.white,
    )}`,
  );
}

const totalElapsed = performance.now() - startedAt;

printDivider();
console.log(paint("Pipeline Summary", ANSI.bold, ANSI.white));
for (const stage of durations) {
  console.log(
    `${paint("•", ANSI.cyan)} ${paint(stage.name, ANSI.white)} ${paint(
      formatDurationMs(stage.elapsedMs),
      ANSI.dim,
      ANSI.white,
    )}`,
  );
}
console.log(
  `${paint("•", ANSI.cyan)} ${paint("Total", ANSI.bold, ANSI.white)} ${paint(
    formatDurationMs(totalElapsed),
    ANSI.bold,
    ANSI.white,
  )}`,
);
console.log(`${paint("RESULT:", ANSI.bold, ANSI.green)} ${paint("PASS", ANSI.bold, ANSI.green)}`);
printDivider();
