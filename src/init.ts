import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathExists } from "./filesystem.js";
import type { InitResult } from "./types.js";

const DEFAULT_CONFIG = {
  requiredAutoloads: [],
  requiredInputActions: [],
  gdscript: {
    requireReturnTypes: false,
    requireTypedVars: false
  },
  ignoredPathPatterns: [
    "^tests/",
    "^addons/"
  ],
  allowedMissingResourcePatterns: []
};

export async function initConfig(root: string, force: boolean): Promise<InitResult> {
  const resolvedRoot = path.resolve(root);
  const configPath = path.join(resolvedRoot, "godot-guard.config.json");

  if (await pathExists(configPath)) {
    if (!force) {
      return { configPath, created: false };
    }
  }

  await mkdir(resolvedRoot, { recursive: true });
  await writeFile(configPath, `${JSON.stringify(DEFAULT_CONFIG, null, 2)}\n`, "utf8");

  return { configPath, created: true };
}
