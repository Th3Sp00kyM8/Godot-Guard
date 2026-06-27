import path from "node:path";
import { pathExists, toRelative, walkFiles } from "./filesystem.js";
import type { Issue } from "./types.js";

const PROJECT_FILE = "project.godot";

export async function findNestedProjectIssue(root: string): Promise<Issue | undefined> {
  if (await pathExists(path.join(root, PROJECT_FILE))) {
    return undefined;
  }

  const nestedProjects = await findNestedProjectFiles(root);
  if (nestedProjects.length === 0) {
    return undefined;
  }

  const projectRoots = nestedProjects.map((projectFile) => path.posix.dirname(projectFile));
  const firstProjectRoot = projectRoots[0];
  const listedProjects = projectRoots.slice(0, 5).join(", ");
  const extraCount = projectRoots.length > 5 ? `, and ${projectRoots.length - 5} more` : "";

  return {
    code: "project.nested_project_found",
    severity: "error",
    message: `No project.godot was found at the scan root, but nested Godot project root(s) were found: ${listedProjects}${extraCount}`,
    file: nestedProjects[0],
    suggestion: `Run Godot Guard from the nested project root, for example: godot-guard scan ${firstProjectRoot}`
  };
}

async function findNestedProjectFiles(root: string): Promise<string[]> {
  const files = await walkFiles(root);

  return files
    .filter((file) => path.basename(file) === PROJECT_FILE)
    .map((file) => toRelative(root, file))
    .filter((file) => file !== PROJECT_FILE)
    .sort((left, right) => left.localeCompare(right));
}
