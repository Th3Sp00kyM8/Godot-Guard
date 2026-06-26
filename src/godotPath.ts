import path from "node:path";

export function resPathToFilePath(root: string, resPath: string): string {
  const relative = resPath.replace(/^res:\/\//, "").replaceAll("/", path.sep);
  return path.join(root, relative);
}

export function normalizeResourcePath(raw: string): string {
  return raw.trim().replace(/[)"'`,;.\]]+$/g, "");
}

export function isGodotResourcePath(value: string): boolean {
  return value.startsWith("res://");
}

export function isConcreteResourcePath(resPath: string): boolean {
  if (!resPath.startsWith("res://")) {
    return false;
  }

  if (resPath.includes("%") || resPath.includes("<") || resPath.includes(">")) {
    return false;
  }

  if (resPath.includes("...") || resPath.includes("*")) {
    return false;
  }

  if (resPath.startsWith("res://.godot/")) {
    return false;
  }

  return true;
}

export function hasFileExtension(resPath: string): boolean {
  const withoutPrefix = resPath.replace(/^res:\/\//, "");
  const lastSegment = withoutPrefix.split("/").pop() ?? "";
  return /\.[A-Za-z0-9_+-]+$/.test(lastSegment);
}
