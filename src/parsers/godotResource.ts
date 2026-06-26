export interface ResourcePathReference {
  resPath: string;
  index: number;
}

const QUOTED_RES_PATH_PATTERN = /(["'])(res:\/\/.*?)\1/g;
const RESOURCE_PATH_PROPERTY_PATTERN = /\bpath\s*=\s*(["'])(res:\/\/.*?)\1/g;

export function extractResourcePathReferences(raw: string, extension: string): ResourcePathReference[] {
  if (extension === ".tscn" || extension === ".tres") {
    return extractMatches(raw, RESOURCE_PATH_PROPERTY_PATTERN, 2);
  }

  return extractMatches(raw, QUOTED_RES_PATH_PATTERN, 2);
}

function extractMatches(raw: string, pattern: RegExp, pathMatchIndex: number): ResourcePathReference[] {
  return Array.from(raw.matchAll(pattern)).map((match) => ({
    resPath: match[pathMatchIndex] ?? "",
    index: match.index ?? 0
  }));
}
