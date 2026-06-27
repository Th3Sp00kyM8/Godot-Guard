# Adoption Guide

Use this guide to introduce Godot Guard to an existing Godot project without turning the first run into a noisy cleanup project.

For examples from real open-source Godot repositories, see `docs/field-tests.md`.

## 1. Start With A Summary

Run a summary first:

```bash
godot-guard scan . --summary
```

If the summary is clean, run the full report:

```bash
godot-guard scan .
```

If the summary is noisy, initialize a config and ignore intentional fixture or generated areas before treating the report as actionable.

```bash
godot-guard init .
```

## 2. Add A Low-Noise Config

Start with `examples/configs/low-noise.json` and adapt it for your project. Common ignore patterns:

```json
{
  "ignoredPathPatterns": [
    "^tests/",
    "^addons/",
    "^prototype/",
    "^prototypes/"
  ]
}
```

Use `allowedMissingResourcePatterns` for intentional placeholder paths that should stay visible in code but not fail CI.

## 3. Protect Project Contracts

Once the scan is quiet, add project-specific expectations:

```json
{
  "requiredAutoloads": ["SaveSystem", "AudioBus"],
  "requiredInputActions": ["ui_accept", "ui_cancel"]
}
```

These checks are useful in AI-assisted workflows because agents often edit `project.godot` indirectly by opening or saving the project in the editor.

## 4. Add CI

Copy `examples/github-actions/godot-guard.yml` into:

```text
.github/workflows/godot-guard.yml
```

Start with summary output in early adoption. Once the project is clean, switch CI to the full command:

```bash
godot-guard scan .
```

## 5. Baseline Existing Noise

If the project has real issues you cannot fix immediately, create and commit a baseline:

```bash
godot-guard baseline .
godot-guard scan . --baseline godot-guard.baseline.json
```

This keeps CI focused on new drift while older findings remain visible in the baseline file. Refresh the baseline only after reviewing why the issue list changed.

## 6. Review Findings

Treat findings by category:

- `project.*`: usually real project setup drift.
- `resources.missing_res_path`: usually a broken file reference.
- `resources.missing_res_directory`: often a path prefix or folder convention; review before making it an error.
- `resources.res_path_case_mismatch`: fix this even on Windows, because exports and CI can be case-sensitive.
- `gdscript.*`: style or strictness checks; enable these only when your team wants that policy.

## 7. Keep The Config Honest

Prefer narrow ignores. If an ignore pattern grows too broad, it can hide the exact drift Godot Guard is meant to catch.
