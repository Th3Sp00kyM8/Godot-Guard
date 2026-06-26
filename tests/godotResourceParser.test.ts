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

    expect(extractResourcePathReferences(raw, ".gd").map((reference) => reference.resPath)).toEqual([
      "res://scenes/Main.tscn"
    ]);
  });
});
