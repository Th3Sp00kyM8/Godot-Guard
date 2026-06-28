import path from "node:path";
import { describe, expect, it } from "vitest";
import { scan } from "../src/scan.js";

const fixtures = path.join(process.cwd(), "tests", "fixtures");

describe("scan", () => {
  it("passes a healthy fixture", async () => {
    const result = await scan({
      root: path.join(fixtures, "healthy"),
      command: "scan",
      configPath: undefined
    });

    expect(result.issues).toEqual([]);
  });

  it("finds missing project and resource references", async () => {
    const result = await scan({
      root: path.join(fixtures, "broken"),
      command: "scan",
      configPath: "__no_config__.json"
    });

    expect(result.issues.map((issue) => issue.code)).toEqual(expect.arrayContaining([
      "project.main_scene_missing",
      "project.autoload_script_missing",
      "resources.missing_res_path",
      "resources.missing_res_directory",
      "resources.res_path_case_mismatch"
    ]));
    expect(result.issues.find((issue) => issue.code === "resources.res_path_case_mismatch")?.suggestion)
      .toContain("assets/actualcase.png differs from disk casing assets/ActualCase.png");
  });

  it("supports ignoring paths by config pattern", async () => {
    const result = await scan({
      root: path.join(fixtures, "broken"),
      command: "resources",
      configPath: "godot-guard.config.json"
    });

    expect(result.issues).toEqual([]);
  });

  it("reports invalid JSON config as a scan issue", async () => {
    const result = await scan({
      root: path.join(fixtures, "invalid-config-json"),
      command: "resources",
      configPath: "godot-guard.config.json"
    });

    expect(result.issues.map((issue) => issue.code)).toEqual(["config.invalid_json"]);
  });

  it("reports invalid config field types and regex patterns", async () => {
    const result = await scan({
      root: path.join(fixtures, "invalid-config-shape"),
      command: "resources",
      configPath: "godot-guard.config.json"
    });

    expect(result.issues.map((issue) => issue.code)).toEqual([
      "config.invalid_field_type",
      "config.invalid_regex",
      "config.invalid_field_type"
    ]);
  });

  it("does not warn on GDScript constants that are likely path prefixes", async () => {
    const result = await scan({
      root: path.join(fixtures, "prefix-constants"),
      command: "resources",
      configPath: undefined
    });

    expect(result.issues.map((issue) => issue.code)).toEqual(["resources.missing_res_path"]);
  });

  it("reports a nested project root instead of cascading resource errors", async () => {
    const result = await scan({
      root: path.join(fixtures, "nested-project"),
      command: "scan",
      configPath: undefined
    });

    expect(result.issues).toEqual([expect.objectContaining({
      code: "project.nested_project_found",
      severity: "error",
      file: "game/project.godot"
    })]);
    expect(result.issues[0].suggestion).toContain("godot-guard scan game");
  });

  it("passes when scanning the nested project root directly", async () => {
    const result = await scan({
      root: path.join(fixtures, "nested-project", "game"),
      command: "scan",
      configPath: undefined
    });

    expect(result.issues).toEqual([]);
  });

  it("accepts Godot 4 uid main scene settings", async () => {
    const result = await scan({
      root: path.join(fixtures, "uid-main-scene"),
      command: "project",
      configPath: undefined
    });

    expect(result.issues).toEqual([]);
  });

  it("reports missing export presets as a warning instead of a broken gameplay resource", async () => {
    const result = await scan({
      root: path.join(fixtures, "export-presets-reference"),
      command: "resources",
      configPath: undefined
    });

    expect(result.issues).toEqual([expect.objectContaining({
      code: "resources.missing_export_presets",
      severity: "warn",
      message: "Export presets file is not present: res://export_presets.cfg"
    })]);
  });
});
