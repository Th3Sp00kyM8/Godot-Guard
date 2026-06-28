import { describe, expect, it } from "vitest";
import { formatExplainOutput, getIssueExplanation, listIssueExplanations } from "../src/explain.js";

const expectedCodes = [
  "config.invalid_field_type",
  "config.invalid_json",
  "config.invalid_regex",
  "config.invalid_shape",
  "gdscript.return_type_missing",
  "gdscript.var_type_missing",
  "project.autoload_script_missing",
  "project.main_scene_missing",
  "project.main_scene_missing_setting",
  "project.missing",
  "project.nested_project_found",
  "project.required_autoload_missing",
  "project.required_input_action_missing",
  "resources.missing_export_presets",
  "resources.missing_res_directory",
  "resources.missing_res_path",
  "resources.res_path_case_mismatch"
];

describe("explain", () => {
  it("lists all known issue codes once", () => {
    const codes = listIssueExplanations().map((explanation) => explanation.code);

    expect(codes).toEqual(expectedCodes);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("formats a plain-language explanation for a known issue code", () => {
    const output = formatExplainOutput("resources.missing_res_path");

    expect(output).toContain("resources.missing_res_path");
    expect(output).toContain("What it means:");
    expect(output).toContain("How to fix:");
  });

  it("explains missing export presets as a warning", () => {
    const explanation = getIssueExplanation("resources.missing_export_presets");

    expect(explanation?.severity).toBe("warn");
    expect(explanation?.impact).toContain("normal gameplay");
  });

  it("formats a discoverable list when no issue code is provided", () => {
    const output = formatExplainOutput();

    expect(output).toContain("Godot Guard issue codes:");
    expect(output).toContain("project.missing [error]");
    expect(output).toContain("Run `godot-guard explain <issue-code>` for details.");
  });

  it("reports unknown issue codes without throwing", () => {
    expect(getIssueExplanation("missing.code")).toBeUndefined();
    expect(formatExplainOutput("missing.code")).toContain("Unknown issue code: missing.code");
  });
});
