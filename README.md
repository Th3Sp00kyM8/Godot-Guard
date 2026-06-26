# Godot Guard

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
- Broken `res://` references in `.tscn`, `.tres`, `.gd`, `.gdshader`, and `.import` files
- Optional GDScript return-type and variable-type warnings

## Vibe-Coding Guardrails

Godot Guard is built for teams and solo developers using AI assistants to move quickly. It focuses on mistakes that are easy for generated code to introduce and hard to diagnose later:

- invented `res://` paths
- scenes pointing at scripts that do not exist
- autoload entries drifting away from real files
- input actions removed from `project.godot`
- placeholder resource strings accidentally treated like real assets

## Install

This project is currently in early development. From a local checkout:

```bash
npm install
npm run build
npm link
```

Then run it inside a Godot project:

```bash
godot-guard scan .
```

Check the installed version:

```bash
godot-guard --version
```

## Usage

```bash
godot-guard init .
godot-guard scan .
godot-guard project .
godot-guard resources .
godot-guard scripts .
godot-guard scan . --format json
godot-guard scan . --format markdown
godot-guard scan . --format markdown > godot-guard-report.md
godot-guard scan . --summary
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

## CI

Godot Guard exits with code `1` when it finds an error-level issue, so it can be used in CI:

```bash
godot-guard scan .
```

## Package Verification

The npm package contents are controlled by the `files` field in `package.json`. Before publishing a release, run:

```bash
npm run check
```

This includes `npm pack --dry-run` so the tarball contents can be reviewed before publishing.

## Scope

Godot Guard is not a replacement for Godot's editor, test runner, or GDScript linters. It is a project-level health checker focused on scene/resource/project drift, especially in AI-assisted workflows.
