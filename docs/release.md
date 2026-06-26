# Release Process

Use this checklist when publishing a new Godot Guard release.

## Prerequisites

- GitHub CLI is authenticated for `Th3Sp00kyM8/Godot-Guard`.
- npm CLI is authenticated with an account that can publish `godot-guard`.
- `main` is clean and up to date with `origin/main`.
- `CHANGELOG.md` has a dated entry for the version being released.

## Verify Package Availability

Before the first publish, confirm that the npm package name is still available:

```bash
npm view godot-guard name version --json
```

An `E404` response means npm does not currently have a public package by that name.

## Publish

```bash
npm login
npm run check
npm publish --access public
```

`npm run check` builds the CLI, runs tests, and performs `npm pack --dry-run` so the tarball contents can be reviewed before publishing.

## Tag GitHub

```bash
git tag v0.1.0
git push origin v0.1.0
```

Create a GitHub release from the pushed tag and copy the matching `CHANGELOG.md` entry into the release notes.

## After Publishing

Verify both install paths:

```bash
npx godot-guard --version
npm install -g godot-guard
godot-guard --version
```

Then run a scan against a small Godot project or fixture:

```bash
npx godot-guard scan path/to/godot-project
```
