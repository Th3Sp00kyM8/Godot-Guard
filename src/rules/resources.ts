import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathExists, toRelative, walkFiles } from "../filesystem.js";
import { normalizeResourcePath, resPathToFilePath } from "../godotPath.js";
import type { GuardConfig, Issue } from "../types.js";

const RESOURCE_EXTENSIONS = new Set([".tscn", ".tres", ".gd", ".gdshader", ".import"]);
const RES_PATH_PATTERN = /res:\/\/[^"'\s\])},]+/g;

export async function checkResourceReferences(root: string, config: GuardConfig): Promise<Issue[]> {
  const issues: Issue[] = [];
  const files = await walkFiles(root);
  const allowPatterns = (config.allowedMissingResourcePatterns ?? []).map((pattern) => new RegExp(pattern));

  for (const file of files) {
    if (!RESOURCE_EXTENSIONS.has(path.extname(file))) {
      continue;
    }

    const relative = toRelative(root, file);
    const raw = await readFile(file, "utf8");

    for (const match of raw.matchAll(RES_PATH_PATTERN)) {
      const resPath = normalizeResourcePath(match[0]);
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
