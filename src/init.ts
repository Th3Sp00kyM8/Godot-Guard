import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathExists } from "./filesystem.js";
import type { InitResult } from "./types.js";

export type InitProfile = "default" | "mature-project";

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

const MATURE_PROJECT_CONFIG = {
  ...DEFAULT_CONFIG,
  ignoredPathPatterns: [
    "^tests/",
    "^addons/",
    "^tools/",
    "^third_party/"
  ]
};

export async function initConfig(root: string, force: boolean, profile: InitProfile = "default"): Promise<InitResult> {
  const resolvedRoot = path.resolve(root);
  const configPath = path.join(resolvedRoot, "godot-guard.config.json");

  if (await pathExists(configPath)) {
    if (!force) {
      return { configPath, created: false };
    }
  }

  await mkdir(resolvedRoot, { recursive: true });
  await writeFile(configPath, `${JSON.stringify(configForProfile(profile), null, 2)}\n`, "utf8");

  return { configPath, created: true };
}

function configForProfile(profile: InitProfile): typeof DEFAULT_CONFIG {
  if (profile === "mature-project") {
    return MATURE_PROJECT_CONFIG;
  }

  return DEFAULT_CONFIG;
}
