import { describe, expect, it } from "vitest";
import { formatGithub, formatMarkdown, formatSarif, formatText } from "../src/reporters.js";
import type { ScanResult } from "../src/types.js";

const result: ScanResult = {
  root: "/game",
  issues: [
    {
      code: "resources.missing_res_path",
      severity: "error",
      file: "scenes/Main.tscn",
      line: 3,
      message: "Missing resource reference: res://missing.gd",
      suggestion: "Restore the missing file."
    }
  ]
};

describe("reporters", () => {
  it("formats text summaries", () => {
    expect(formatText(result, { summaryOnly: true })).toContain("Codes: resources.missing_res_path=1");
  });

  it("formats markdown reports", () => {
    const markdown = formatMarkdown(result);

    expect(markdown).toContain("# Godot Guard Report");
    expect(markdown).toContain("## Plain-Language Guide");
    expect(markdown).toContain("**Risk:** Scenes, scripts, shaders, or resources may fail to load");
    expect(markdown).toContain("## Issues");
    expect(markdown).toContain("`scenes/Main.tscn:3`");
  });

  it("formats GitHub comment reports", () => {
    const markdown = formatGithub(result);

    expect(markdown).toContain("## Godot Guard");
    expect(markdown).toContain("Found **1** issue(s).");
    expect(markdown).toContain("### Plain-language guide");
    expect(markdown).toContain("**Fix:** Restore the missing file, update the reference");
    expect(markdown).toContain("| Severity | Code | Location | Message |");
    expect(markdown).toContain("| error | `resources.missing_res_path` | `scenes/Main.tscn:3` | Missing resource reference: res://missing.gd |");
  });

  it("formats clean GitHub comment reports", () => {
    expect(formatGithub({ root: "/game", issues: [] })).toBe("## Godot Guard\n\nNo issues found.");
  });

  it("supports summary-only GitHub comment reports", () => {
    const markdown = formatGithub(result, { summaryOnly: true });

    expect(markdown).toContain("Found **1** issue(s).");
    expect(markdown).toContain("Codes: resources.missing_res_path=1");
    expect(markdown).not.toContain("| Severity | Code | Location | Message |");
  });

  it("formats SARIF reports", () => {
    const sarif = JSON.parse(formatSarif(result));

    expect(sarif.version).toBe("2.1.0");
    expect(sarif.runs[0].tool.driver.name).toBe("Godot Guard");
    expect(sarif.runs[0].tool.driver.rules[0].id).toBe("resources.missing_res_path");
    expect(sarif.runs[0].tool.driver.rules[0].shortDescription.text).toBe("Resource path is missing");
    expect(sarif.runs[0].tool.driver.rules[0].help.text).toContain("Restore the missing file");
    expect(sarif.runs[0].results[0]).toMatchObject({
      ruleId: "resources.missing_res_path",
      level: "error",
      locations: [{
        physicalLocation: {
          artifactLocation: {
            uri: "scenes/Main.tscn"
          },
          region: {
            startLine: 3
          }
        }
      }]
    });
  });
});
