# Changelog

All notable changes to Godot Guard will be documented in this file.

## 0.1.0 - 2026-06-26

- Added the initial `godot-guard` TypeScript CLI.
- Added project checks for `project.godot`, main scene references, autoload script paths, required autoloads, and required input actions.
- Added resource checks for concrete quoted `res://` references in Godot text resources and GDScript.
- Added optional GDScript return-type and variable-type warnings.
- Added `godot-guard init` to generate a starter config file.
- Added text, JSON, Markdown, and summary report output.
- Added CI, fixture tests, and npm package dry-run verification.
