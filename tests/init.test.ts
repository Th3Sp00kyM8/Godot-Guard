import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { initConfig } from "../src/init.js";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.map((dir) => rm(dir, { force: true, recursive: true })));
  tempDirs.length = 0;
});

describe("initConfig", () => {
  it("creates a default config", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "godot-guard-init-"));
    tempDirs.push(root);

    const result = await initConfig(root, false);
    const raw = await readFile(result.configPath, "utf8");

    expect(result.created).toBe(true);
    expect(JSON.parse(raw).ignoredPathPatterns).toContain("^tests/");
  });

  it("does not overwrite without force", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "godot-guard-init-"));
    tempDirs.push(root);

    await initConfig(root, false);
    const result = await initConfig(root, false);

    expect(result.created).toBe(false);
  });

  it("creates a mature-project profile config", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "godot-guard-init-"));
    tempDirs.push(root);

    const result = await initConfig(root, false, "mature-project");
    const raw = await readFile(result.configPath, "utf8");
    const config = JSON.parse(raw);

    expect(config.ignoredPathPatterns).toEqual([
      "^tests/",
      "^addons/",
      "^tools/",
      "^third_party/"
    ]);
  });
});
