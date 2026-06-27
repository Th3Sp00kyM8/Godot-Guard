import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { DEFAULT_BASELINE_FILE } from "./baseline.js";
import { pathExists } from "./filesystem.js";

export interface InitCiResult {
  workflowPath: string;
  created: boolean;
  usedBaseline: boolean;
  prComment: boolean;
  sarif: boolean;
}

export interface InitCiOptions {
  prComment?: boolean;
  sarif?: boolean;
}

const WORKFLOW_PATH = path.join(".github", "workflows", "godot-guard.yml");

export async function initCiWorkflow(root: string, force: boolean, options: InitCiOptions = {}): Promise<InitCiResult> {
  const resolvedRoot = path.resolve(root);
  const workflowPath = path.join(resolvedRoot, WORKFLOW_PATH);
  const baselinePath = path.join(resolvedRoot, DEFAULT_BASELINE_FILE);
  const usedBaseline = await pathExists(baselinePath);
  const prComment = options.prComment ?? false;
  const sarif = options.sarif ?? false;

  if (await pathExists(workflowPath)) {
    if (!force) {
      return { workflowPath, created: false, usedBaseline, prComment, sarif };
    }
  }

  await mkdir(path.dirname(workflowPath), { recursive: true });
  await writeFile(workflowPath, selectWorkflowTemplate(usedBaseline, { prComment, sarif }), "utf8");

  return { workflowPath, created: true, usedBaseline, prComment, sarif };
}

function selectWorkflowTemplate(useBaseline: boolean, options: Required<InitCiOptions>): string {
  if (options.sarif) {
    return sarifWorkflowTemplate(useBaseline);
  }

  if (options.prComment) {
    return prCommentWorkflowTemplate(useBaseline);
  }

  return workflowTemplate(useBaseline);
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

function prCommentWorkflowTemplate(useBaseline: boolean): string {
  const baselineFlag = useBaseline ? ` --baseline ${DEFAULT_BASELINE_FILE}` : "";
  const commentCommand = `npx godot-guard scan . --format github --fail-on none${baselineFlag} --output godot-guard-comment.md`;
  const enforceCommand = `npx godot-guard scan .${baselineFlag}`;

  return `name: Godot Guard PR Comment

on:
  pull_request:

jobs:
  godot-guard:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
      - name: Run Godot Guard
        run: ${commentCommand}
      - name: Upsert PR comment
        env:
          GH_TOKEN: \${{ github.token }}
          PR_NUMBER: \${{ github.event.pull_request.number }}
        run: |
          marker="<!-- godot-guard-report -->"
          body_file="godot-guard-comment.md"
          comment_body="$(mktemp)"
          {
            echo "$marker"
            cat "$body_file"
          } > "$comment_body"

          comment_id="$(gh api "repos/\${{ github.repository }}/issues/$PR_NUMBER/comments" \\
            --jq ".[] | select(.body | contains(\\"$marker\\")) | .id" | head -n 1)"

          if [ -n "$comment_id" ]; then
            gh api "repos/\${{ github.repository }}/issues/comments/$comment_id" \\
              --method PATCH \\
              --field body="$(cat "$comment_body")"
          else
            gh api "repos/\${{ github.repository }}/issues/$PR_NUMBER/comments" \\
              --method POST \\
              --field body="$(cat "$comment_body")"
          fi
      - name: Enforce Godot Guard
        run: ${enforceCommand}
`;
}

function sarifWorkflowTemplate(useBaseline: boolean): string {
  const baselineFlag = useBaseline ? ` --baseline ${DEFAULT_BASELINE_FILE}` : "";
  const scanCommand = `npx godot-guard scan . --format sarif --fail-on none${baselineFlag} --output godot-guard.sarif`;

  return `name: Godot Guard Code Scanning

on:
  pull_request:
    branches: ["main"]
  push:
    branches: ["main"]

jobs:
  godot-guard:
    runs-on: ubuntu-latest
    permissions:
      security-events: write
      contents: read
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
      - run: ${scanCommand}
      - uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: godot-guard.sarif
`;
}
