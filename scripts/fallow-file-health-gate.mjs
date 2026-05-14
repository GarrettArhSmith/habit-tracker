import { spawnSync } from "node:child_process";

const MIN_FILE_HEALTH_SCORE = 90;
const MIN_MAINTAINABILITY_SCORE = 90;
const MAX_LARGE_FUNCTIONS = 0;
const ENFORCE_LARGE_FUNCTIONS = false;

function runHealthReport() {
  const command = "npx fallow health --format json --quiet";
  const shellArgs =
    process.platform === "win32"
      ? ["cmd.exe", ["/c", command]]
      : ["sh", ["-lc", command]];

  const result = spawnSync(shellArgs[0], shellArgs[1], {
    cwd: process.cwd(),
    encoding: "utf8",
  });

  if (result.error) {
    throw result.error;
  }

  const output = result.stdout?.trim();
  if (!output) {
    const stderr = result.stderr?.trim();
    throw new Error(stderr || "Fallow returned no JSON output.");
  }

  return JSON.parse(output);
}

function getViolations(fileScores) {
  return fileScores
    .filter((score) => Number(score.maintainability_index) < MIN_FILE_HEALTH_SCORE)
    .sort((a, b) => a.maintainability_index - b.maintainability_index);
}

try {
  const report = runHealthReport();
  const fileScores = Array.isArray(report.file_scores) ? report.file_scores : [];
  const largeFunctions = Array.isArray(report.large_functions)
    ? report.large_functions
    : [];
  const functionsAboveThreshold = Number(report?.summary?.functions_above_threshold ?? 0);
  const averageMaintainability = Number(report?.summary?.average_maintainability ?? 0);

  if (fileScores.length === 0) {
    console.error("Fallow did not return file_scores in health JSON output.");
    process.exit(1);
  }

  const violations = getViolations(fileScores);
  const hasLargeFunctions = functionsAboveThreshold > 0;
  const hasOversizedFunctions = largeFunctions.length > MAX_LARGE_FUNCTIONS;
  const shouldFailForLargeFunctions =
    ENFORCE_LARGE_FUNCTIONS && hasOversizedFunctions;
  const hasLowProjectMaintainability =
    averageMaintainability < MIN_MAINTAINABILITY_SCORE;

  if (
    hasLargeFunctions ||
    shouldFailForLargeFunctions ||
    hasLowProjectMaintainability ||
    violations.length > 0
  ) {
    console.error("Fallow strict gate failed.");

    if (hasLargeFunctions) {
      console.error(
        `- Complexity threshold failures detected: ${functionsAboveThreshold} function(s) above threshold.`,
      );
    }

    if (hasLowProjectMaintainability) {
      console.error(
        `- Project maintainability below ${MIN_MAINTAINABILITY_SCORE}: ${averageMaintainability}.`,
      );
    }

    if (hasOversizedFunctions) {
      console.error(
        `- Large functions detected: ${largeFunctions.length} (max allowed ${MAX_LARGE_FUNCTIONS})${ENFORCE_LARGE_FUNCTIONS ? "." : " [warn-only]"}.`,
      );
      for (const func of largeFunctions.slice(0, 10)) {
        console.error(
          `  - ${func.path}:${func.line} ${func.name} (${func.line_count} lines)`,
        );
      }
      if (largeFunctions.length > 10) {
        console.error(`  - ... and ${largeFunctions.length - 10} more`);
      }
    }

    if (violations.length > 0) {
      console.error(
        `- File health below ${MIN_FILE_HEALTH_SCORE}: ${violations.length} file(s).`,
      );
      for (const violation of violations) {
        console.error(`  - ${violation.path}: ${violation.maintainability_index}`);
      }
    }

    process.exit(1);
  }

  console.log("Fallow strict gate passed.");
  console.log(
    `- Complexity: no functions above configured thresholds (${functionsAboveThreshold}).`,
  );
  console.log(
    `- Large functions: ${largeFunctions.length} (max allowed ${MAX_LARGE_FUNCTIONS})${ENFORCE_LARGE_FUNCTIONS ? "." : " [warn-only]"}.`,
  );
  console.log(
    `- Project maintainability: ${averageMaintainability} (>= ${MIN_MAINTAINABILITY_SCORE}).`,
  );
  console.log(
    `- File health: all ${fileScores.length} scored file(s) are >= ${MIN_FILE_HEALTH_SCORE}.`,
  );
} catch (error) {
  console.error("Failed to run Fallow strict gate.");
  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(String(error));
  }
  process.exit(1);
}
