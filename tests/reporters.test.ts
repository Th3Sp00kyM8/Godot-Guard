import { describe, expect, it } from "vitest";
import { formatMarkdown, formatSarif, formatText } from "../src/reporters.js";
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
    expect(markdown).toContain("## Issues");
    expect(markdown).toContain("`scenes/Main.tscn:3`");
  });

  it("formats SARIF reports", () => {
    const sarif = JSON.parse(formatSarif(result));

    expect(sarif.version).toBe("2.1.0");
    expect(sarif.runs[0].tool.driver.name).toBe("Godot Guard");
    expect(sarif.runs[0].tool.driver.rules[0].id).toBe("resources.missing_res_path");
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
