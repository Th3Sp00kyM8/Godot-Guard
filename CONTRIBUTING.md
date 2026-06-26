# Contributing

Thanks for helping improve Godot Guard.

## Development

Use Node.js 20 or newer.

```bash
npm install
npm run check
```

`npm run check` builds the CLI, runs tests, and verifies the npm package contents with `npm pack --dry-run`.

## Local CLI Testing

```bash
npm run build
node ./dist/cli.js --version
node ./dist/cli.js scan tests/fixtures/healthy
node ./dist/cli.js scan tests/fixtures/broken --config __no_config__.json --summary
```

## Design Goals

- Keep checks local and deterministic.
- Prefer low-noise findings over broad but noisy scans.
- Treat generated Godot cache files and dynamic placeholder paths carefully.
- Keep project-specific policies in config instead of hard-coding one game's conventions.

## Pull Requests

Before opening a pull request:

```bash
npm run check
```

Include a short summary of the rule or CLI behavior changed, plus the fixture or test coverage added.
