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

export async function pathKind(filePath: string): Promise<"directory" | "file" | undefined> {
  try {
    const fileStat = await stat(filePath);
    if (fileStat.isDirectory()) {
      return "directory";
    }

    if (fileStat.isFile()) {
      return "file";
    }

    return undefined;
  } catch {
    return undefined;
  }
}

export async function findCaseMismatch(root: string, filePath: string): Promise<string | undefined> {
  const relative = path.relative(root, filePath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    return undefined;
  }

  let current = root;
  for (const segment of relative.split(path.sep)) {
    const entries = await readDirectoryEntries(current);
    if (!entries) {
      return undefined;
    }

    const exact = entries.find((entry) => entry === segment);
    if (exact) {
      current = path.join(current, exact);
      continue;
    }

    const caseInsensitive = entries.find((entry) => entry.toLowerCase() === segment.toLowerCase());
    if (caseInsensitive) {
      const requestedPath = toRelative(root, path.join(current, segment));
      const diskPath = toRelative(root, path.join(current, caseInsensitive));
      return `${requestedPath} differs from disk casing ${diskPath}`;
    }

    return undefined;
  }

  return undefined;
}

export async function walkFiles(root: string): Promise<string[]> {
  const files: string[] = [];

  async function visit(current: string): Promise<void> {
    const entries = await readdir(current, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);

      if (entry.isDirectory()) {
        if (!shouldIgnoreDirectory(entry.name)) {
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

async function readDirectoryEntries(directoryPath: string): Promise<string[] | undefined> {
  try {
    const entries = await readdir(directoryPath, { withFileTypes: true });
    return entries.map((entry) => entry.name);
  } catch {
    return undefined;
  }
}

function shouldIgnoreDirectory(name: string): boolean {
  return IGNORED_DIRS.has(name) || name.startsWith(".");
}

export function toRelative(root: string, filePath: string): string {
  return path.relative(root, filePath).replaceAll(path.sep, "/");
}
