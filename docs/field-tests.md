# Field Tests

This page records real open-source Godot repositories used to validate Godot Guard beyond local fixtures.

The goal is not to grade these projects. The goal is to keep Godot Guard honest against real project layouts, assets, and `res://` usage.

## Test Environment

- Date: 2026-06-27
- Godot Guard version tested: local build after `v0.1.2` changes
- Command base:

```bash
npm run build
node dist/cli.js scan <project-root> --summary --fail-on none
```

Reports were generated under `C:\tmp\godot-guard-open-source-tests\reports` during local validation.

## Repositories

| Repository | License | Project root tested | Result | What it proved |
| --- | --- | --- | --- | --- |
| [lampe-games/godot-open-rts](https://github.com/lampe-games/godot-open-rts) | MIT | repository root | 1 `resources.missing_res_path` | Finds a concrete missing `res://` file reference in a real active Godot 4 project. |
| [gdquest-demos/godot-platformer-2d](https://github.com/gdquest-demos/godot-platformer-2d) | MIT | `game/` | clean | Handles a real nested Godot project when pointed at the actual project root. |
| [Hairic95/Godot-Barebone-RPG](https://github.com/Hairic95/Godot-Barebone-RPG) | MIT | repository root | clean | Handles a smaller template-style Godot project without false positives. |

## Findings

### `lampe-games/godot-open-rts`

Command:

```bash
node dist/cli.js scan C:\tmp\godot-guard-open-source-tests\godot-open-rts --summary --fail-on none
```

Summary:

```text
Godot Guard: 1 issue(s) found.
Severity: error=1
Codes: resources.missing_res_path=1
```

Detailed finding:

```text
resources.missing_res_path
source/Constants.gd:55
Missing resource reference: res://tmp/options.tres
```

Baseline behavior was also checked:

```bash
node dist/cli.js baseline C:\tmp\godot-guard-open-source-tests\godot-open-rts --baseline C:\tmp\godot-guard-open-source-tests\reports\godot-open-rts.baseline.json
node dist/cli.js scan C:\tmp\godot-guard-open-source-tests\godot-open-rts --summary --baseline C:\tmp\godot-guard-open-source-tests\reports\godot-open-rts.baseline.json --fail-on none
```

Result:

```text
Godot Guard: no issues found.
```

### `gdquest-demos/godot-platformer-2d`

This repository keeps the Godot project under `game/`.

Outer repository command:

```bash
node dist/cli.js scan C:\tmp\godot-guard-open-source-tests\godot-platformer-2d --summary --fail-on none
```

Result after nested-project detection:

```text
Godot Guard: 1 issue(s) found.
Severity: error=1
Codes: project.nested_project_found=1
```

Actual project root command:

```bash
node dist/cli.js scan C:\tmp\godot-guard-open-source-tests\godot-platformer-2d\game --summary --fail-on none
```

Result:

```text
Godot Guard: no issues found.
```

This case directly motivated `project.nested_project_found`. Before that check, scanning the outer repository produced misleading missing-resource reports because `res://` paths were resolved from the wrong root.

### `Hairic95/Godot-Barebone-RPG`

Command:

```bash
node dist/cli.js scan C:\tmp\godot-guard-open-source-tests\Godot-Barebone-RPG --summary --fail-on none
```

Result:

```text
Godot Guard: no issues found.
```

## Follow-Up Targets

Useful future field tests:

- a larger Godot 4 project with addons committed
- a C# Godot project
- a project with imported assets and `.import` files under version control
- a project that intentionally uses generated or runtime-only `res://` paths

When a field test reveals noisy or misleading output, prefer adding a fixture that captures the behavior before changing rules.
