import { readFile } from "node:fs/promises";
import path from "node:path";
import { toRelative, walkFiles } from "../filesystem.js";
import type { GuardConfig, Issue } from "../types.js";

export async function checkGdscript(root: string, config: GuardConfig): Promise<Issue[]> {
  const gdscriptConfig = config.gdscript ?? {};
  if (!gdscriptConfig.requireReturnTypes && !gdscriptConfig.requireTypedVars) {
    return [];
  }

  const issues: Issue[] = [];
  const files = (await walkFiles(root)).filter((file) => path.extname(file) === ".gd");

  for (const file of files) {
    const raw = await readFile(file, "utf8");
    const lines = raw.split(/\r?\n/);
    const relative = toRelative(root, file);

    lines.forEach((line, index) => {
      const trimmed = line.trim();

      if (gdscriptConfig.requireReturnTypes && /^func\s+\w+\s*\([^)]*\)\s*:?\s*$/.test(trimmed)) {
        issues.push({
          code: "gdscript.return_type_missing",
          severity: "warn",
          message: "Function declaration is missing an explicit return type.",
          file: relative,
          line: index + 1,
          suggestion: "Add an explicit return type, for example `-> void`."
        });
      }

      if (gdscriptConfig.requireTypedVars && /^var\s+\w+\s*=/.test(trimmed)) {
        issues.push({
          code: "gdscript.var_type_missing",
          severity: "warn",
          message: "Variable declaration is missing a type hint or `:=` inference.",
          file: relative,
          line: index + 1,
          suggestion: "Use `var name: Type = value` or `var name := value`."
        });
      }
    });
  }

  return issues;
}
