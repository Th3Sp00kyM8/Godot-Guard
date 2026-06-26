import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathExists, toRelative, walkFiles } from "../filesystem.js";
import { isConcreteResourcePath, normalizeResourcePath, resPathToFilePath } from "../godotPath.js";
import type { GuardConfig, Issue } from "../types.js";

const RESOURCE_EXTENSIONS = new Set([".tscn", ".tres", ".gd", ".gdshader"]);
const QUOTED_RES_PATH_PATTERN = /(["'])(res:\/\/.*?)\1/g;

export async function checkResourceReferences(root: string, config: GuardConfig): Promise<Issue[]> {
  const issues: Issue[] = [];
  const files = await walkFiles(root);
  const ignoredPathPatterns = (config.ignoredPathPatterns ?? []).map((pattern) => new RegExp(pattern));
  const allowPatterns = (config.allowedMissingResourcePatterns ?? []).map((pattern) => new RegExp(pattern));

  for (const file of files) {
    if (!RESOURCE_EXTENSIONS.has(path.extname(file))) {
      continue;
    }

    const relative = toRelative(root, file);
    if (ignoredPathPatterns.some((pattern) => pattern.test(relative))) {
      continue;
    }

    const raw = await readFile(file, "utf8");

    for (const match of raw.matchAll(QUOTED_RES_PATH_PATTERN)) {
      const resPath = normalizeResourcePath(match[2] ?? "");
      if (!isConcreteResourcePath(resPath)) {
        continue;
      }

      if (allowPatterns.some((pattern) => pattern.test(resPath))) {
        continue;
      }

      const targetPath = resPathToFilePath(root, resPath);
      if (!(await pathExists(targetPath))) {
        issues.push({
          code: "resources.missing_res_path",
          severity: "error",
          message: `Missing resource reference: ${resPath}`,
          file: relative,
          line: lineForIndex(raw, match.index ?? 0),
          suggestion: "Restore the missing file, update the resource path, or allow the pattern in config."
        });
      }
    }
  }

  return issues;
}

function lineForIndex(raw: string, index: number): number {
  return raw.slice(0, index).split(/\r?\n/).length;
}
