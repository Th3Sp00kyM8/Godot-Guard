import { access, readdir, stat } from "node:fs/promises";
import path from "node:path";

const IGNORED_DIRS = new Set([
  ".git",
  ".godot",
  ".vscode",
  "node_modules",
  "dist",
  "coverage"
]);

export async function pathExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function walkFiles(root: string): Promise<string[]> {
  const files: string[] = [];

  async function visit(current: string): Promise<void> {
    const entries = await readdir(current, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);

      if (entry.isDirectory()) {
        if (!IGNORED_DIRS.has(entry.name)) {
          await visit(fullPath);
        }
        continue;
      }

      if (entry.isFile()) {
        files.push(fullPath);
      }
    }
  }

  if ((await stat(root)).isDirectory()) {
    await visit(root);
  }

  return files;
}

export function toRelative(root: string, filePath: string): string {
  return path.relative(root, filePath).replaceAll(path.sep, "/");
}
