import path from "node:path";

export function resPathToFilePath(root: string, resPath: string): string {
  const relative = resPath.replace(/^res:\/\//, "").replaceAll("/", path.sep);
  return path.join(root, relative);
}

export function normalizeResourcePath(raw: string): string {
  return raw.replace(/[)"'\],]+$/g, "");
}

export function isGodotResourcePath(value: string): boolean {
  return value.startsWith("res://");
}
