import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Issue } from "./types.js";

export const DEFAULT_BASELINE_FILE = "godot-guard.baseline.json";

export interface BaselineIssue {
  code: string;
  message: string;
  file?: string;
  line?: number;
}

export interface BaselineFile {
  version: 1;
  generatedAt: string;
  issues: BaselineIssue[];
}

export interface WriteBaselineResult {
  baselinePath: string;
  issueCount: number;
}

export async function writeBaseline(
  root: string,
  issues: Issue[],
  baselinePath = DEFAULT_BASELINE_FILE
): Promise<WriteBaselineResult> {
  const resolvedPath = resolveBaselinePath(root, baselinePath);
  const baseline: BaselineFile = {
    version: 1,
    generatedAt: new Date().toISOString(),
    issues: issues.map(issueToBaselineIssue)
  };

  await mkdir(path.dirname(resolvedPath), { recursive: true });
  await writeFile(resolvedPath, `${JSON.stringify(baseline, null, 2)}\n`, "utf8");

  return {
    baselinePath: resolvedPath,
    issueCount: baseline.issues.length
  };
}

export async function applyBaseline(root: string, issues: Issue[], baselinePath: string): Promise<Issue[]> {
  const baseline = await loadBaseline(root, baselinePath);
  const baselineKeys = new Set(baseline.issues.map(baselineIssueKey));
  return issues.filter((issue) => !baselineKeys.has(baselineIssueKey(issueToBaselineIssue(issue))));
}

export async function loadBaseline(root: string, baselinePath: string): Promise<BaselineFile> {
  const resolvedPath = resolveBaselinePath(root, baselinePath);
  let parsed: unknown;

  try {
    parsed = JSON.parse(await readFile(resolvedPath, "utf8"));
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Baseline file is not valid JSON: ${resolvedPath}`);
    }
    throw error;
  }

  if (!isBaselineFile(parsed)) {
    throw new Error(`Baseline file has an invalid shape: ${resolvedPath}`);
  }

  return parsed;
}

export function issueToBaselineIssue(issue: Issue): BaselineIssue {
  return {
    code: issue.code,
    message: issue.message,
    file: issue.file,
    line: issue.line
  };
}

function resolveBaselinePath(root: string, baselinePath: string): string {
  if (path.isAbsolute(baselinePath)) {
    return baselinePath;
  }

  return path.resolve(root, baselinePath);
}

function baselineIssueKey(issue: BaselineIssue): string {
  return JSON.stringify({
    code: issue.code,
    file: issue.file ?? "",
    line: issue.line ?? null,
    message: issue.message
  });
}

function isBaselineFile(value: unknown): value is BaselineFile {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<BaselineFile>;
  return candidate.version === 1
    && typeof candidate.generatedAt === "string"
    && Array.isArray(candidate.issues)
    && candidate.issues.every(isBaselineIssue);
}

function isBaselineIssue(value: unknown): value is BaselineIssue {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<BaselineIssue>;
  return typeof candidate.code === "string"
    && typeof candidate.message === "string"
    && (candidate.file === undefined || typeof candidate.file === "string")
    && (candidate.line === undefined || typeof candidate.line === "number");
}
