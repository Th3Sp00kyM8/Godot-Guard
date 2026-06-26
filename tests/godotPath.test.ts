import { describe, expect, it } from "vitest";
import { isConcreteResourcePath, normalizeResourcePath } from "../src/godotPath.js";

describe("resource path helpers", () => {
  it("normalizes trailing punctuation from documentation-style references", () => {
    expect(normalizeResourcePath("res://scenes/Main.tscn.`")).toBe("res://scenes/Main.tscn");
  });

  it("distinguishes concrete paths from dynamic or generated paths", () => {
    expect(isConcreteResourcePath("res://scenes/Main.tscn")).toBe(true);
    expect(isConcreteResourcePath("res://data/missions/%s.json")).toBe(false);
    expect(isConcreteResourcePath("res://assets/portraits/<id>.png")).toBe(false);
    expect(isConcreteResourcePath("res://.godot/imported/asset.ctex")).toBe(false);
  });
});
