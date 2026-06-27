import path from "node:path";
import { applyBaseline } from "./baseline.js";
import { loadConfig } from "./config.js";
import { findNestedProjectIssue } from "./projectRoot.js";
import { checkGdscript } from "./rules/gdscript.js";
import { checkProjectSettings } from "./rules/project.js";
import { checkResourceReferences } from "./rules/resources.js";
import type { ScanOptions, ScanResult } from "./types.js";

export async function scan(options: ScanOptions): Promise<ScanResult> {
  const root = path.resolve(options.root);
  const { config, issues } = await loadConfig(root, options.configPath);
  const nestedProjectIssue = await findNestedProjectIssue(root);

  if (nestedProjectIssue && (options.command === "scan" || options.command === "project")) {
    issues.push(nestedProjectIssue);
    return applyBaselineIfNeeded(root, issues, options.baselinePath);
  }

  if (options.command === "scan" || options.command === "project") {
    issues.push(...await checkProjectSettings(root, config));
  }

  if (options.command === "scan" || options.command === "resources") {
    issues.push(...await checkResourceReferences(root, config));
  }

  if (options.command === "scan" || options.command === "scripts") {
    issues.push(...await checkGdscript(root, config));
  }

  if (options.baselinePath) {
    return applyBaselineIfNeeded(root, issues, options.baselinePath);
  }

  return { root, issues };
}

async function applyBaselineIfNeeded(
  root: string,
  issues: ScanResult["issues"],
  baselinePath: string | undefined
): Promise<ScanResult> {
  if (!baselinePath) {
    return { root, issues };
  }

  return { root, issues: await applyBaseline(root, issues, baselinePath) };
}
