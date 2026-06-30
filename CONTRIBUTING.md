# Contributing

Godot Guard is a small project health checker for AI-assisted Godot games. Good contributions keep the tool practical, low-noise, and easy to understand for non-specialists.

## Good First Contributions

- Run Godot Guard on an open-source Godot project and report the result.
- Improve an issue explanation so a non-developer can understand the risk.
- Add a focused fixture for a broken scene, script, resource, or `project.godot` case.
- Reduce false positives without hiding real broken references.
- Improve README examples or adoption guidance.

## Field Testing

When testing a real project, include:

- project URL and Godot version, if known
- command used
- issue count by severity
- any false positives
- whether the output was clear enough to act on

Do not paste private project code, private assets, or secrets into issues.

## Development

Install dependencies:

```bash
npm install
```

Run the full local gate:

```bash
npm run check
```

This builds the TypeScript CLI, runs tests, and checks the npm package contents with `npm pack --dry-run`.

## Local CLI Testing

After changing CLI behavior, run a direct smoke test against fixtures:

```bash
npm run build
node ./dist/cli.js --version
node ./dist/cli.js scan tests/fixtures/healthy
node ./dist/cli.js scan tests/fixtures/broken --config __no_config__.json --summary
```

## Rule Design

Prefer rules that catch concrete project breakage:

- missing `res://` files
- case mismatches that Windows can hide
- missing autoload scripts
- missing input actions
- config mistakes

Avoid broad style rules unless they are optional. Godot Guard should help people ship safer projects, not flood new users with preferences.

## Issue Wording

Every user-facing issue should have plain-language guidance:

- what the problem means
- why it matters for the game
- what to try next

If a rule cannot explain itself clearly, it probably needs a narrower scope.
