# Changelog

All notable changes to Godot Guard will be documented in this file.

## Unreleased

- Added `godot-guard init-ci` to generate a starter GitHub Actions workflow.
- Added nested Godot project detection to avoid misleading scan results when running from an outer repository folder.

## 0.1.1 - 2026-06-27

- Updated README install guidance and project badges after the first npm publish.
- Added `godot-guard explain [issue-code]` for plain-language issue help.
- Added `godot-guard baseline` and `--baseline <path>` so established projects can ignore known issues while still catching new ones.
- Added `init --profile mature-project` for lower-noise established project configs.
- Suppressed missing-resource warnings for GDScript constants that look like path directory or prefix values.

## 0.1.0 - 2026-06-26

- Added the initial `godot-guard` TypeScript CLI.
- Added project checks for `project.godot`, main scene references, autoload script paths, required autoloads, and required input actions.
- Added resource checks for concrete quoted `res://` references in Godot text resources and GDScript.
- Added structured `.tscn` and `.tres` path extraction for Godot resource `path=` properties.
- Added case-sensitive `res://` path mismatch detection.
- Changed case-mismatch suggestions to use project-relative paths instead of absolute local paths.
- Changed extensionless missing `res://` references to warnings for likely directory or path-prefix usage.
- Stopped treating arbitrary quoted scene/resource string properties as concrete file references.
- Added optional GDScript return-type and variable-type warnings.
- Added config validation for invalid JSON, wrong field types, and invalid regex patterns.
- Added `godot-guard init` to generate a starter config file.
- Added text, JSON, Markdown, and SARIF report output.
- Added `--fail-on error|warn|none` to control CI exit-code behavior.
- Added `--output <path>` to write reports directly to files.
- Added CI, fixture tests, and npm package dry-run verification.
- Added a tag-triggered GitHub Release workflow that verifies and attaches the npm tarball.
- Added npm package metadata and a release checklist for first public publishing.
- Added adoption docs, starter configs, a copyable GitHub Actions workflow, and a GitHub code scanning workflow example.
- Added a tiny broken Godot example project and sample Markdown report.
