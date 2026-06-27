import { describe, expect, it } from "vitest";
import { extractResourcePathReferences } from "../src/parsers/godotResource.js";

describe("extractResourcePathReferences", () => {
  it("extracts structured path properties from Godot scene resources", () => {
    const raw = `
[gd_scene load_steps=2 format=3]

[ext_resource type="Script" path="res://scripts/Main.gd" id="1_main"]
[node name="Main" type="Node2D"]
note = "res://docs/not-a-resource.txt"
`;

    expect(extractResourcePathReferences(raw, ".tscn").map((reference) => reference.resPath)).toEqual([
      "res://scripts/Main.gd"
    ]);
  });

  it("extracts quoted paths from GDScript files", () => {
    const raw = `const MAIN := "res://scenes/Main.tscn"`;

    expect(extractResourcePathReferences(raw, ".gd")).toMatchObject([{
      resPath: "res://scenes/Main.tscn",
      kind: "resource"
    }]);
  });

  it("marks GDScript path prefix constants separately", () => {
    const raw = `
const EMBLEM_DIR: String = "res://assets/emblems"
const BLOC_CREST_PREFIX: String = "res://assets/blocs/emblems/emblem_"
const BROKEN := "res://assets/missing.png"
`;

    expect(extractResourcePathReferences(raw, ".gd").map((reference) => ({
      resPath: reference.resPath,
      kind: reference.kind
    }))).toEqual([
      { resPath: "res://assets/emblems", kind: "path_prefix" },
      { resPath: "res://assets/blocs/emblems/emblem_", kind: "path_prefix" },
      { resPath: "res://assets/missing.png", kind: "resource" }
    ]);
  });
});
