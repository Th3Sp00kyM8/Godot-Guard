import { access, readFile } from "node:fs/promises";
import path from "node:path";
import type { GuardConfig, Issue } from "./types.js";

const DEFAULT_CONFIG_FILE = "godot-guard.config.json";

export interface LoadedConfig {
  config: GuardConfig;
  issues: Issue[];
}

export async function loadConfig(root: string, explicitPath?: string): Promise<LoadedConfig> {
  const configPath = explicitPath ? path.resolve(root, explicitPath) : path.join(root, DEFAULT_CONFIG_FILE);
  const displayPath = toDisplayPath(root, configPath);

  if (!(await exists(configPath))) {
    return { config: {}, issues: [] };
  }

  const raw = (await readFile(configPath, "utf8")).replace(/^\uFEFF/, "");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      config: {},
      issues: [{
        code: "config.invalid_json",
        severity: "error",
        message: `Config file is not valid JSON: ${message}`,
        file: displayPath,
        suggestion: "Fix the JSON syntax or regenerate the config with `godot-guard init --force`."
      }]
    };
  }

  return validateConfig(parsed, displayPath);
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function validateConfig(value: unknown, file: string): LoadedConfig {
  const issues: Issue[] = [];
  const config: GuardConfig = {};

  if (!isRecord(value)) {
    return {
      config,
      issues: [{
        code: "config.invalid_shape",
        severity: "error",
        message: "Config file must contain a JSON object.",
        file,
        suggestion: "Use an object with fields like `requiredAutoloads`, `requiredInputActions`, and `gdscript`."
      }]
    };
  }

  config.requiredAutoloads = readStringArray(value, "requiredAutoloads", file, issues);
  config.requiredInputActions = readStringArray(value, "requiredInputActions", file, issues);
  config.ignoredPathPatterns = readStringArray(value, "ignoredPathPatterns", file, issues, true);
  config.allowedMissingResourcePatterns = readStringArray(value, "allowedMissingResourcePatterns", file, issues, true);
  config.gdscript = readGdscriptConfig(value, file, issues);

  return { config, issues };
}

function readStringArray(
  source: Record<string, unknown>,
  key: keyof GuardConfig,
  file: string,
  issues: Issue[],
  validateRegex = false
): string[] | undefined {
  const value = source[key];
  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    issues.push({
      code: "config.invalid_field_type",
      severity: "error",
      message: `Config field ${key} must be an array of strings.`,
      file,
      suggestion: `Update ${key} to use JSON string values only.`
    });
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : undefined;
  }

  if (!validateRegex) {
    return value;
  }

  return value.filter((pattern) => {
    try {
      new RegExp(pattern);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      issues.push({
        code: "config.invalid_regex",
        severity: "error",
        message: `Config field ${key} contains an invalid regex: ${pattern}`,
        file,
        suggestion: `Fix or remove the pattern. Regex error: ${message}`
      });
      return false;
    }
  });
}

function readGdscriptConfig(
  source: Record<string, unknown>,
  file: string,
  issues: Issue[]
): GuardConfig["gdscript"] {
  const value = source.gdscript;
  if (value === undefined) {
    return undefined;
  }

  if (!isRecord(value)) {
    issues.push({
      code: "config.invalid_field_type",
      severity: "error",
      message: "Config field gdscript must be an object.",
      file,
      suggestion: "Use `gdscript.requireReturnTypes` and `gdscript.requireTypedVars` boolean options."
    });
    return undefined;
  }

  return {
    requireReturnTypes: readBoolean(value, "requireReturnTypes", "gdscript.requireReturnTypes", file, issues),
    requireTypedVars: readBoolean(value, "requireTypedVars", "gdscript.requireTypedVars", file, issues)
  };
}

function readBoolean(
  source: Record<string, unknown>,
  key: string,
  displayKey: string,
  file: string,
  issues: Issue[]
): boolean | undefined {
  const value = source[key];
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "boolean") {
    issues.push({
      code: "config.invalid_field_type",
      severity: "error",
      message: `Config field ${displayKey} must be a boolean.`,
      file,
      suggestion: `Set ${displayKey} to true or false.`
    });
    return undefined;
  }

  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toDisplayPath(root: string, filePath: string): string {
  return path.relative(root, filePath).replaceAll(path.sep, "/") || path.basename(filePath);
}
