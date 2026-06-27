import path from "node:path";
import { applyBaseline } from "./baseline.js";
import { loadConfig } from "./config.js";
import { checkGdscript } from "./rules/gdscript.js";
import { checkProjectSettings } from "./rules/project.js";
import { checkResourceReferences } from "./rules/resources.js";
import type { ScanOptions, ScanResult } from "./types.js";

export async function scan(options: ScanOptions): Promise<ScanResult> {
  const root = path.resolve(options.root);
  const { config, issues } = await loadConfig(root, options.configPath);

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
    return { root, issues: await applyBaseline(root, issues, options.baselinePath) };
  }

  return { root, issues };
}
