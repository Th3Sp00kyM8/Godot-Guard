import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { applyBaseline, writeBaseline, type BaselineFile } from "../src/baseline.js";
import { scan } from "../src/scan.js";
import type { Issue } from "../src/types.js";

const fixtures = path.join(process.cwd(), "tests", "fixtures");
const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("baseline", () => {
  it("writes stable issue identities without severity or suggestion fields", async () => {
    const root = await createTempRoot();
    const issues: Issue[] = [{
      code: "resources.missing_res_path",
      severity: "error",
      message: "Missing res:// path: res://missing.png",
      file: "scenes/Main.tscn",
      line: 4,
      suggestion: "Create the missing file."
    }];

    const result = await writeBaseline(root, issues);
    const baseline = JSON.parse(await readFile(result.baselinePath, "utf8")) as BaselineFile;

    expect(result.issueCount).toBe(1);
    expect(baseline).toMatchObject({
      version: 1,
      issues: [{
        code: "resources.missing_res_path",
        message: "Missing res:// path: res://missing.png",
        file: "scenes/Main.tscn",
        line: 4
      }]
    });
    expect(baseline.issues[0]).not.toHaveProperty("severity");
    expect(baseline.issues[0]).not.toHaveProperty("suggestion");
  });

  it("filters baseline issues and keeps new issues", async () => {
    const root = await createTempRoot();
    const baselineIssue: Issue = {
      code: "resources.missing_res_path",
      severity: "error",
      message: "Missing res:// path: res://old.png",
      file: "scenes/Main.tscn",
      line: 4
    };
    const newIssue: Issue = {
      code: "resources.missing_res_path",
      severity: "error",
      message: "Missing res:// path: res://new.png",
      file: "scenes/Main.tscn",
      line: 5
    };

    await writeBaseline(root, [baselineIssue]);

    await expect(applyBaseline(root, [baselineIssue, newIssue], "godot-guard.baseline.json"))
      .resolves.toEqual([newIssue]);
  });

  it("lets scan ignore known fixture issues from a baseline file", async () => {
    const root = path.join(fixtures, "broken");
    const tempRoot = await createTempRoot();
    const baselinePath = path.join(tempRoot, "known-issues.json");
    const result = await scan({
      root,
      command: "scan",
      configPath: "__no_config__.json"
    });

    await writeBaseline(root, result.issues, baselinePath);

    await expect(scan({
      root,
      command: "scan",
      configPath: "__no_config__.json",
      baselinePath
    })).resolves.toMatchObject({ issues: [] });
  });
});

async function createTempRoot(): Promise<string> {
  const dir = await mkdtemp(path.join(os.tmpdir(), "godot-guard-baseline-"));
  tempDirs.push(dir);
  return dir;
}
