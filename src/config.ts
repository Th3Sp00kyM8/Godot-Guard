import { access, readFile } from "node:fs/promises";
import path from "node:path";
import type { GuardConfig } from "./types.js";

const DEFAULT_CONFIG_FILE = "godot-guard.config.json";

export async function loadConfig(root: string, explicitPath?: string): Promise<GuardConfig> {
  const configPath = explicitPath ? path.resolve(root, explicitPath) : path.join(root, DEFAULT_CONFIG_FILE);

  if (!(await exists(configPath))) {
    return {};
  }

  const raw = (await readFile(configPath, "utf8")).replace(/^\uFEFF/, "");
  return JSON.parse(raw) as GuardConfig;
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}
