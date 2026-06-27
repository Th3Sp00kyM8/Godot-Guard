# Godot Guard

[![npm version](https://img.shields.io/npm/v/godot-guard.svg)](https://www.npmjs.com/package/godot-guard)
[![CI](https://github.com/Th3Sp00kyM8/Godot-Guard/actions/workflows/ci.yml/badge.svg)](https://github.com/Th3Sp00kyM8/Godot-Guard/actions/workflows/ci.yml)
[![GitHub Release](https://img.shields.io/github/v/release/Th3Sp00kyM8/Godot-Guard)](https://github.com/Th3Sp00kyM8/Godot-Guard/releases)

Godot Guard is a local project health checker for Godot games, built for AI-assisted and vibe-coded workflows. It scans scenes, resources, scripts, and project settings to catch broken references, missing assets, risky drift, and common agent-generated mistakes before they reach your game.

## Why

AI-assisted coding can move fast, but Godot projects are more than code. A project can break because an agent edits a scene path, removes an autoload, forgets an input action, or references a resource that does not exist.

Godot Guard is designed to be a small local safety pass you can run before opening a pull request, shipping a build, or asking an AI agent to keep working.

## Current Checks

- Missing `project.godot`
- Missing main scene references
- Missing autoload script paths
- Required autoloads from config
- Required input actions from config
- Broken `res://` references in `.tscn`, `.tres`, `.gd`, and `.gdshader` files
- Case-sensitive `res://` path mismatches that Windows can hide
- Missing directory-like `res://` prefixes reported as warnings instead of hard errors
- Optional GDScript return-type and variable-type warnings

## Vibe-Coding Guardrails

Godot Guard is built for teams and solo developers using AI assistants to move quickly. It focuses on mistakes that are easy for generated code to introduce and hard to diagnose later:

- invented `res://` paths
- scenes pointing at scripts that do not exist
- autoload entries drifting away from real files
- input actions removed from `project.godot`
- placeholder resource strings accidentally treated like real assets

## Install

Run without installing:

```bash
npx godot-guard scan .
```

Or install globally from npm:

```bash
npm install -g godot-guard
```

Then run it inside a Godot project:

```bash
godot-guard scan .
```

From a source checkout:

```bash
npm install
npm run build
npm link
```

Check the installed version:

```bash
godot-guard --version
```

## Usage

```bash
godot-guard init .
godot-guard init . --profile mature-project
godot-guard init-ci .
godot-guard baseline .
godot-guard explain
godot-guard explain resources.missing_res_path
godot-guard scan .
godot-guard scan . --baseline godot-guard.baseline.json
godot-guard project .
godot-guard resources .
godot-guard scripts .
godot-guard scan . --format json
godot-guard scan . --format markdown
godot-guard scan . --format markdown > godot-guard-report.md
godot-guard scan . --format sarif > godot-guard.sarif
godot-guard scan . --format sarif --output godot-guard.sarif
godot-guard scan . --summary
godot-guard scan . --fail-on warn
```

## Config

Create `godot-guard.config.json` in your Godot project root:

```json
{
  "requiredAutoloads": ["SaveSystem", "AudioBus"],
  "requiredInputActions": ["ui_accept", "ui_cancel"],
  "gdscript": {
    "requireReturnTypes": true,
    "requireTypedVars": false
  },
  "ignoredPathPatterns": [
    "^tests/"
  ],
  "allowedMissingResourcePatterns": []
}
```

Config problems are reported as `config.*` issues, including invalid JSON, wrong field types, and invalid regex patterns.

## CI

Godot Guard exits with code `1` when it finds an error-level issue, so it can be used in CI:

```bash
godot-guard scan .
```

Create a starter GitHub Actions workflow:

```bash
godot-guard init-ci .
```

Use `--fail-on warn` for stricter CI, or `--fail-on none` when you want a report without failing the job.
Use `--format sarif` when uploading results to GitHub code scanning.
Use `--output <path>` to write reports directly from the CLI.

For established projects with known issues, create a baseline and commit it:

```bash
godot-guard baseline .
godot-guard scan . --baseline godot-guard.baseline.json
```

Baseline scans ignore the recorded issues and still report new problems.

For a copyable GitHub Actions workflow and rollout advice, see:

- `docs/adoption.md`
- `examples/godot-projects/broken-ai-pass`
- `examples/reports/broken-ai-pass.md`
- `examples/github-actions/godot-guard.yml`
- `examples/github-actions/godot-guard-sarif.yml`
- `examples/configs/low-noise.json`
- `examples/configs/mature-project.json`
- `examples/configs/strict.json`

## Package Verification

The npm package contents are controlled by the `files` field in `package.json`. Before publishing a release, run:

```bash
npm run check
```

This includes `npm pack --dry-run` so the tarball contents can be reviewed before publishing.

For the full release checklist, see `docs/release.md`.

## Scope

Godot Guard is not a replacement for Godot's editor, test runner, or GDScript linters. It is a project-level health checker focused on scene/resource/project drift, especially in AI-assisted workflows.

If a repository contains the Godot project in a nested folder, run Godot Guard against that folder:

```bash
godot-guard scan game
```

When run from the outer repository folder, Godot Guard reports the nested project root instead of producing misleading `res://` path errors.
