export type ProjectGodot = Record<string, Record<string, string>>;

export function parseProjectGodot(raw: string): ProjectGodot {
  const project: ProjectGodot = {};
  let currentSection = "";

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (trimmed.length === 0 || trimmed.startsWith(";")) {
      continue;
    }

    const sectionMatch = trimmed.match(/^\[(.+)]$/);
    if (sectionMatch) {
      currentSection = sectionMatch[1] ?? "";
      project[currentSection] = project[currentSection] ?? {};
      continue;
    }

    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, equalsIndex).trim();
    const value = trimmed.slice(equalsIndex + 1).trim();
    project[currentSection] = project[currentSection] ?? {};
    project[currentSection][key] = value;
  }

  return project;
}

export function findSetting(project: ProjectGodot, key: string): string | undefined {
  for (const section of Object.values(project)) {
    if (section[key] !== undefined) {
      return section[key];
    }
  }

  return undefined;
}

export function unquoteGodotString(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

export function extractFirstResPath(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  return value.match(/res:\/\/[^"')\],\s]+/)?.[0];
}
