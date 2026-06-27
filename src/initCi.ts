import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { DEFAULT_BASELINE_FILE } from "./baseline.js";
import { pathExists } from "./filesystem.js";

export interface InitCiResult {
  workflowPath: string;
  created: boolean;
  usedBaseline: boolean;
}

const WORKFLOW_PATH = path.join(".github", "workflows", "godot-guard.yml");

export async function initCiWorkflow(root: string, force: boolean): Promise<InitCiResult> {
  const resolvedRoot = path.resolve(root);
  const workflowPath = path.join(resolvedRoot, WORKFLOW_PATH);
  const baselinePath = path.join(resolvedRoot, DEFAULT_BASELINE_FILE);
  const usedBaseline = await pathExists(baselinePath);

  if (await pathExists(workflowPath)) {
    if (!force) {
      return { workflowPath, created: false, usedBaseline };
    }
  }

  await mkdir(path.dirname(workflowPath), { recursive: true });
  await writeFile(workflowPath, workflowTemplate(usedBaseline), "utf8");

  return { workflowPath, created: true, usedBaseline };
}

function workflowTemplate(useBaseline: boolean): string {
  const scanCommand = useBaseline
    ? `npx godot-guard scan . --summary --baseline ${DEFAULT_BASELINE_FILE}`
    : "npx godot-guard scan . --summary";

  return `name: Godot Guard

on:
  pull_request:
  push:
    branches: ["main"]

jobs:
  godot-guard:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
      - name: Run Godot Guard
        run: ${scanCommand}
`;
}
