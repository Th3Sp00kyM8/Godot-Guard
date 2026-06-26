import type { Issue } from "./types.js";

export type FailOn = "error" | "warn" | "none";

export function shouldFail(issues: Issue[], failOn: FailOn): boolean {
  if (failOn === "none") {
    return false;
  }

  if (failOn === "warn") {
    return issues.some((issue) => issue.severity === "error" || issue.severity === "warn");
  }

  return issues.some((issue) => issue.severity === "error");
}

export function parseFailOn(value: string | undefined): FailOn {
  if (value === "error" || value === "warn" || value === "none") {
    return value;
  }

  throw new Error("--fail-on must be `error`, `warn`, or `none`.");
}
