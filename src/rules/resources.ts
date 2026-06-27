import { readFile } from "node:fs/promises";
import path from "node:path";
import { findCaseMismatch, pathKind, toRelative, walkFiles } from "../filesystem.js";
import { hasFileExtension, isConcreteResourcePath, normalizeResourcePath, resPathToFilePath } from "../godotPath.js";
import { extractResourcePathReferences } from "../parsers/godotResource.js";
import type { GuardConfig, Issue } from "../types.js";

const RESOURCE_EXTENSIONS = new Set([".tscn", ".tres", ".gd", ".gdshader"]);

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
    const extension = path.extname(file);
    if (ignoredPathPatterns.some((pattern) => pattern.test(relative))) {
      continue;
    }

    const raw = await readFile(file, "utf8");

    for (const reference of extractResourcePathReferences(raw, extension)) {
      const resPath = normalizeResourcePath(reference.resPath);
      if (!isConcreteResourcePath(resPath)) {
        continue;
      }

      if (reference.kind === "path_prefix" && !hasFileExtension(resPath)) {
        continue;
      }

      if (allowPatterns.some((pattern) => pattern.test(resPath))) {
        continue;
      }

      const targetPath = resPathToFilePath(root, resPath);
      const targetKind = await pathKind(targetPath);
      const caseMismatch = await findCaseMismatch(root, targetPath);

      if (!targetKind) {
        if (caseMismatch) {
          issues.push({
            code: "resources.res_path_case_mismatch",
            severity: "error",
            message: `Resource path casing does not match disk: ${resPath}`,
            file: relative,
            line: lineForIndex(raw, reference.index),
            suggestion: `Update the reference casing. ${caseMismatch}`
          });
          continue;
        }

        const looksLikeDirectory = !hasFileExtension(resPath);
        issues.push({
          code: looksLikeDirectory ? "resources.missing_res_directory" : "resources.missing_res_path",
          severity: looksLikeDirectory ? "warn" : "error",
          message: looksLikeDirectory ? `Missing resource directory or path prefix: ${resPath}` : `Missing resource reference: ${resPath}`,
          file: relative,
          line: lineForIndex(raw, reference.index),
          suggestion: "Restore the missing file, update the resource path, or allow the pattern in config."
        });
        continue;
      }

      if (caseMismatch) {
        issues.push({
          code: "resources.res_path_case_mismatch",
          severity: "error",
          message: `Resource path casing does not match disk: ${resPath}`,
          file: relative,
          line: lineForIndex(raw, reference.index),
          suggestion: `Update the reference casing. ${caseMismatch}`
        });
      }
    }
  }

  return issues;
}

function lineForIndex(raw: string, index: number): number {
  return raw.slice(0, index).split(/\r?\n/).length;
}
