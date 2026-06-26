import { describe, expect, it } from "vitest";
import { extractFirstResPath, findSetting, parseProjectGodot, unquoteGodotString } from "../src/parsers/projectGodot.js";

describe("parseProjectGodot", () => {
  it("parses sections and settings", () => {
    const project = parseProjectGodot(`[application]
config/name="Example"
run/main_scene="res://scenes/Main.tscn"

[autoload]
SaveSystem="*res://scripts/SaveSystem.gd"
`);

    expect(unquoteGodotString(findSetting(project, "run/main_scene"))).toBe("res://scenes/Main.tscn");
    expect(extractFirstResPath(project.autoload?.SaveSystem)).toBe("res://scripts/SaveSystem.gd");
  });
});
