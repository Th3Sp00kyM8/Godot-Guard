import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathExists, toRelative } from "../filesystem.js";
import { extractFirstResPath, findSetting, parseProjectGodot, unquoteGodotString } from "../parsers/projectGodot.js";
import { resPathToFilePath } from "../godotPath.js";
import type { GuardConfig, Issue } from "../types.js";

export async function checkProjectSettings(root: string, config: GuardConfig): Promise<Issue[]> {
  const issues: Issue[] = [];
  const projectPath = path.join(root, "project.godot");

  if (!(await pathExists(projectPath))) {
    return [{
      code: "project.missing",
      severity: "error",
      message: "project.godot was not found.",
      file: "project.godot",
      suggestion: "Run Godot Guard from the root of a Godot project."
    }];
  }

  const raw = await readFile(projectPath, "utf8");
  const project = parseProjectGodot(raw);
  const mainScene = unquoteGodotString(findSetting(project, "run/main_scene") ?? findSetting(project, "config/run/main_scene"));

  if (mainScene?.startsWith("res://")) {
    const mainScenePath = resPathToFilePath(root, mainScene);
    if (!(await pathExists(mainScenePath))) {
      issues.push({
        code: "project.main_scene_missing",
        severity: "error",
        message: `Main scene points to a missing resource: ${mainScene}`,
        file: "project.godot",
        suggestion: "Update the main scene path or restore the missing scene file."
      });
    }
  } else {
    issues.push({
      code: "project.main_scene_missing_setting",
      severity: "warn",
      message: "No run/main_scene setting was found.",
      file: "project.godot",
      suggestion: "Set a main scene in Project Settings when the project is expected to run directly."
    });
  }

  issues.push(...await checkAutoloads(root, project.autoload ?? {}, config));
  issues.push(...checkInputActions(project.input ?? {}, config));

  return issues;
}

async function checkAutoloads(root: string, autoloads: Record<string, string>, config: GuardConfig): Promise<Issue[]> {
  const issues: Issue[] = [];
  const required = new Set(config.requiredAutoloads ?? []);

  for (const requiredAutoload of required) {
    if (autoloads[requiredAutoload] === undefined) {
      issues.push({
        code: "project.required_autoload_missing",
        severity: "error",
        message: `Required autoload is missing: ${requiredAutoload}`,
        file: "project.godot",
        suggestion: "Restore the autoload or remove it from godot-guard.config.json."
      });
    }
  }

  for (const [name, value] of Object.entries(autoloads)) {
    const resPath = extractFirstResPath(value);
    if (!resPath) {
      continue;
    }

    const filePath = resPathToFilePath(root, resPath);
    if (!(await pathExists(filePath))) {
      issues.push({
        code: "project.autoload_script_missing",
        severity: "error",
        message: `Autoload ${name} points to a missing script: ${resPath}`,
        file: "project.godot",
        suggestion: `Restore ${toRelative(root, filePath)} or update the autoload entry.`
      });
    }
  }

  return issues;
}

function checkInputActions(input: Record<string, string>, config: GuardConfig): Issue[] {
  const issues: Issue[] = [];
  const required = config.requiredInputActions ?? [];

  for (const action of required) {
    if (input[action] === undefined) {
      issues.push({
        code: "project.required_input_action_missing",
        severity: "error",
        message: `Required input action is missing: ${action}`,
        file: "project.godot",
        suggestion: "Restore the action in Project Settings > Input Map or update godot-guard.config.json."
      });
    }
  }

  return issues;
}
