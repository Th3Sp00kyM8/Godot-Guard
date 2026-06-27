import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { initCiWorkflow } from "../src/initCi.js";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.map((dir) => rm(dir, { force: true, recursive: true })));
  tempDirs.length = 0;
});

describe("initCiWorkflow", () => {
  it("creates a starter GitHub Actions workflow", async () => {
    const root = await createTempRoot();

    const result = await initCiWorkflow(root, false);
    const raw = await readFile(result.workflowPath, "utf8");

    expect(result.created).toBe(true);
    expect(result.usedBaseline).toBe(false);
    expect(result.prComment).toBe(false);
    expect(result.workflowPath).toBe(path.join(root, ".github", "workflows", "godot-guard.yml"));
    expect(raw).toContain("name: Godot Guard");
    expect(raw).toContain("run: npx godot-guard scan . --summary");
  });

  it("does not overwrite an existing workflow without force", async () => {
    const root = await createTempRoot();

    await initCiWorkflow(root, false);
    const result = await initCiWorkflow(root, false);

    expect(result.created).toBe(false);
  });

  it("overwrites an existing workflow with force", async () => {
    const root = await createTempRoot();
    const workflowPath = path.join(root, ".github", "workflows", "godot-guard.yml");
    await mkdir(path.dirname(workflowPath), { recursive: true });
    await writeFile(workflowPath, "custom workflow\n", "utf8");

    const result = await initCiWorkflow(root, true);
    const raw = await readFile(workflowPath, "utf8");

    expect(result.created).toBe(true);
    expect(raw).toContain("run: npx godot-guard scan . --summary");
    expect(raw).not.toContain("custom workflow");
  });

  it("uses a baseline when the default baseline file already exists", async () => {
    const root = await createTempRoot();
    await writeFile(path.join(root, "godot-guard.baseline.json"), "{}\n", "utf8");

    const result = await initCiWorkflow(root, false);
    const raw = await readFile(result.workflowPath, "utf8");

    expect(result.usedBaseline).toBe(true);
    expect(raw).toContain("run: npx godot-guard scan . --summary --baseline godot-guard.baseline.json");
  });

  it("creates a pull request comment workflow", async () => {
    const root = await createTempRoot();

    const result = await initCiWorkflow(root, false, { prComment: true });
    const raw = await readFile(result.workflowPath, "utf8");

    expect(result.created).toBe(true);
    expect(result.prComment).toBe(true);
    expect(raw).toContain("name: Godot Guard PR Comment");
    expect(raw).toContain("pull-requests: write");
    expect(raw).toContain("run: npx godot-guard scan . --format github --fail-on none --output godot-guard-comment.md");
    expect(raw).toContain("run: npx godot-guard scan .");
  });

  it("uses a baseline in pull request comment workflows when present", async () => {
    const root = await createTempRoot();
    await writeFile(path.join(root, "godot-guard.baseline.json"), "{}\n", "utf8");

    const result = await initCiWorkflow(root, false, { prComment: true });
    const raw = await readFile(result.workflowPath, "utf8");

    expect(result.usedBaseline).toBe(true);
    expect(raw).toContain("run: npx godot-guard scan . --format github --fail-on none --baseline godot-guard.baseline.json --output godot-guard-comment.md");
    expect(raw).toContain("run: npx godot-guard scan . --baseline godot-guard.baseline.json");
  });
});

async function createTempRoot(): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), "godot-guard-init-ci-"));
  tempDirs.push(root);
  return root;
}
