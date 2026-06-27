export interface ResourcePathReference {
  resPath: string;
  index: number;
  kind: "resource" | "path_prefix";
}

const QUOTED_RES_PATH_PATTERN = /(["'])(res:\/\/.*?)\1/g;
const RESOURCE_PATH_PROPERTY_PATTERN = /\bpath\s*=\s*(["'])(res:\/\/.*?)\1/g;

export function extractResourcePathReferences(raw: string, extension: string): ResourcePathReference[] {
  if (extension === ".tscn" || extension === ".tres") {
    return extractMatches(raw, RESOURCE_PATH_PROPERTY_PATTERN, 2);
  }

  if (extension === ".gd") {
    return extractGdscriptMatches(raw);
  }

  return extractMatches(raw, QUOTED_RES_PATH_PATTERN, 2);
}

function extractMatches(raw: string, pattern: RegExp, pathMatchIndex: number): ResourcePathReference[] {
  return Array.from(raw.matchAll(pattern)).map((match) => ({
    resPath: match[pathMatchIndex] ?? "",
    index: match.index ?? 0,
    kind: "resource"
  }));
}

function extractGdscriptMatches(raw: string): ResourcePathReference[] {
  return Array.from(raw.matchAll(QUOTED_RES_PATH_PATTERN)).map((match) => {
    const resPath = match[2] ?? "";
    const index = match.index ?? 0;

    return {
      resPath,
      index,
      kind: isLikelyPathPrefixAssignment(raw, index, resPath) ? "path_prefix" : "resource"
    };
  });
}

function isLikelyPathPrefixAssignment(raw: string, index: number, resPath: string): boolean {
  if (/\.[A-Za-z0-9]+$/.test(resPath)) {
    return false;
  }

  const lineStart = raw.lastIndexOf("\n", index) + 1;
  const lineEnd = raw.indexOf("\n", index);
  const line = raw.slice(lineStart, lineEnd === -1 ? raw.length : lineEnd);
  const assignment = line.match(/\b(?:const|var)\s+([A-Za-z_][A-Za-z0-9_]*)\s*(?::=?|=)/);
  const name = assignment?.[1]?.toLowerCase() ?? "";

  return /(^|_)(dir|directory|prefix|base|root|folder|path)$/.test(name);
}
