import type { Severity } from "./types.js";

export interface IssueExplanation {
  code: string;
  severity: Severity;
  category: "config" | "gdscript" | "project" | "resources";
  title: string;
  meaning: string;
  impact: string;
  fix: string;
}

const ISSUE_EXPLANATIONS: IssueExplanation[] = [
  {
    code: "config.invalid_json",
    severity: "error",
    category: "config",
    title: "Config JSON cannot be parsed",
    meaning: "The Godot Guard config file exists, but its JSON syntax is invalid.",
    impact: "The intended config cannot be trusted, so ignores and project-specific requirements may not apply.",
    fix: "Fix the JSON syntax or regenerate the config with `godot-guard init --force`."
  },
  {
    code: "config.invalid_shape",
    severity: "error",
    category: "config",
    title: "Config root is not an object",
    meaning: "The config file is valid JSON, but the top-level value is not a JSON object.",
    impact: "Godot Guard cannot read settings such as required autoloads, required input actions, or ignore patterns.",
    fix: "Use an object with fields like `requiredAutoloads`, `requiredInputActions`, `gdscript`, and `ignoredPathPatterns`."
  },
  {
    code: "config.invalid_field_type",
    severity: "error",
    category: "config",
    title: "Config field has the wrong type",
    meaning: "A config field uses a value type Godot Guard does not understand.",
    impact: "That field may be ignored or only partially applied, which can hide expected checks.",
    fix: "Update the field to the type described in the issue suggestion, usually an array of strings or a boolean."
  },
  {
    code: "config.invalid_regex",
    severity: "error",
    category: "config",
    title: "Config regex is invalid",
    meaning: "An ignore or allow pattern cannot be compiled as a JavaScript regular expression.",
    impact: "The pattern will not be applied, so intended ignores or allows may not work.",
    fix: "Fix or remove the regex pattern named in the issue message."
  },
  {
    code: "gdscript.return_type_missing",
    severity: "warn",
    category: "gdscript",
    title: "Function return type is missing",
    meaning: "A GDScript function does not declare an explicit return type.",
    impact: "This is a style and maintainability warning when typed GDScript is expected.",
    fix: "Add a return type such as `-> void`, or disable `gdscript.requireReturnTypes` in config."
  },
  {
    code: "gdscript.var_type_missing",
    severity: "warn",
    category: "gdscript",
    title: "Variable type is missing",
    meaning: "A GDScript variable assignment does not use a type hint or `:=` inference.",
    impact: "This is a style and maintainability warning when typed GDScript is expected.",
    fix: "Use `var name: Type = value`, `var name := value`, or disable `gdscript.requireTypedVars` in config."
  },
  {
    code: "project.missing",
    severity: "error",
    category: "project",
    title: "project.godot is missing",
    meaning: "Godot Guard could not find `project.godot` at the scan root.",
    impact: "The scan is probably running from the wrong folder, or the folder is not a Godot project.",
    fix: "Run Godot Guard from the Godot project root or pass the correct project path."
  },
  {
    code: "project.nested_project_found",
    severity: "error",
    category: "project",
    title: "Nested Godot project found",
    meaning: "The scan root does not contain `project.godot`, but one or more child folders do.",
    impact: "Running from the outer folder can create misleading missing-resource errors because `res://` paths resolve from the wrong root.",
    fix: "Run Godot Guard from the nested project root named in the issue suggestion."
  },
  {
    code: "project.main_scene_missing",
    severity: "error",
    category: "project",
    title: "Main scene path is broken",
    meaning: "`project.godot` points to a main scene resource that does not exist on disk.",
    impact: "The game may fail to start from the editor, exports, or CI smoke tests.",
    fix: "Restore the missing scene file or update the main scene in Project Settings."
  },
  {
    code: "project.main_scene_missing_setting",
    severity: "warn",
    category: "project",
    title: "Main scene setting is missing",
    meaning: "`project.godot` does not define a main scene.",
    impact: "This may be intentional for libraries or test projects, but a runnable game usually needs one.",
    fix: "Set a main scene in Project Settings if the project is expected to run directly."
  },
  {
    code: "project.required_autoload_missing",
    severity: "error",
    category: "project",
    title: "Required autoload is missing",
    meaning: "The config requires an autoload name that is not present in `project.godot`.",
    impact: "Code that depends on that singleton may crash or silently skip behavior.",
    fix: "Restore the autoload in Project Settings or remove it from `requiredAutoloads` if it is no longer required."
  },
  {
    code: "project.autoload_script_missing",
    severity: "error",
    category: "project",
    title: "Autoload script path is broken",
    meaning: "An autoload entry points to a script resource that does not exist on disk.",
    impact: "Godot may fail to load the singleton, and dependent scripts can break at runtime.",
    fix: "Restore the missing script or update the autoload entry to the correct path."
  },
  {
    code: "project.required_input_action_missing",
    severity: "error",
    category: "project",
    title: "Required input action is missing",
    meaning: "The config requires an input action that is not present in the project's Input Map.",
    impact: "Controls or UI flows that depend on the action may stop responding.",
    fix: "Restore the action in Project Settings > Input Map or remove it from `requiredInputActions` if obsolete."
  },
  {
    code: "resources.missing_res_path",
    severity: "error",
    category: "resources",
    title: "Resource path is missing",
    meaning: "A concrete `res://` reference points to a file that does not exist.",
    impact: "Scenes, scripts, shaders, or resources may fail to load when Godot reaches that reference.",
    fix: "Restore the missing file, update the reference, or allow the pattern in config if it is intentionally generated later."
  },
  {
    code: "resources.missing_res_directory",
    severity: "warn",
    category: "resources",
    title: "Resource directory or prefix is missing",
    meaning: "An extensionless `res://` reference looks like a folder or path prefix, but that path was not found.",
    impact: "This may be a real missing folder or a harmless dynamic path prefix.",
    fix: "Create the folder, update the prefix, or allow the pattern in config if the path is intentionally dynamic."
  },
  {
    code: "resources.res_path_case_mismatch",
    severity: "error",
    category: "resources",
    title: "Resource path casing does not match disk",
    meaning: "A `res://` reference differs from the actual file or folder casing on disk.",
    impact: "The project may work on Windows but fail on case-sensitive systems, exports, or CI.",
    fix: "Update the reference casing to exactly match the file or folder on disk."
  }
];

export function getIssueExplanation(code: string): IssueExplanation | undefined {
  return ISSUE_EXPLANATIONS.find((explanation) => explanation.code === code);
}

export function listIssueExplanations(): IssueExplanation[] {
  return [...ISSUE_EXPLANATIONS].sort((left, right) => left.code.localeCompare(right.code));
}

export function formatExplainOutput(code?: string): string {
  if (!code) {
    return [
      "Godot Guard issue codes:",
      ...listIssueExplanations().map((explanation) => (
        `  ${explanation.code} [${explanation.severity}] - ${explanation.title}`
      )),
      "",
      "Run `godot-guard explain <issue-code>` for details."
    ].join("\n");
  }

  const explanation = getIssueExplanation(code);
  if (!explanation) {
    return [
      `Unknown issue code: ${code}`,
      "",
      "Known issue codes:",
      ...listIssueExplanations().map((known) => `  ${known.code}`)
    ].join("\n");
  }

  return [
    `${explanation.code}`,
    `Severity: ${explanation.severity}`,
    `Category: ${explanation.category}`,
    "",
    `Title: ${explanation.title}`,
    "",
    "What it means:",
    `  ${explanation.meaning}`,
    "",
    "Why it matters:",
    `  ${explanation.impact}`,
    "",
    "How to fix:",
    `  ${explanation.fix}`
  ].join("\n");
}
