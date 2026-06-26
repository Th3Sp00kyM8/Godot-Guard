# Changelog

All notable changes to Godot Guard will be documented in this file.

## Unreleased

- Added structured `.tscn` and `.tres` path extraction for Godot resource `path=` properties.
- Added case-sensitive `res://` path mismatch detection.
- Changed extensionless missing `res://` references to warnings for likely directory or path-prefix usage.
- Stopped treating arbitrary quoted scene/resource string properties as concrete file references.

## 0.1.0 - 2026-06-26

- Added the initial `godot-guard` TypeScript CLI.
- Added project checks for `project.godot`, main scene references, autoload script paths, required autoloads, and required input actions.
- Added resource checks for concrete quoted `res://` references in Godot text resources and GDScript.
- Added optional GDScript return-type and variable-type warnings.
- Added `godot-guard init` to generate a starter config file.
- Added text, JSON, Markdown, and summary report output.
- Added CI, fixture tests, and npm package dry-run verification.
