# Release Process

Use this checklist when publishing a new Godot Guard release.

## Prerequisites

- GitHub CLI is authenticated for `Th3Sp00kyM8/Godot-Guard`.
- npm CLI is authenticated with an account that can publish `godot-guard`.
- npm two-factor authentication is enabled, or publishing uses a granular npm access token with 2FA bypass enabled.
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
npm whoami
npm run check
npm publish --access public
```

`npm run check` builds the CLI, runs tests, and performs `npm pack --dry-run` so the tarball contents can be reviewed before publishing.

## Tag GitHub

```bash
git tag v0.1.0
git push origin v0.1.0
```

Pushing a `v*` tag starts the Release workflow. It runs `npm run check`, creates an npm tarball with `npm pack`, and creates a GitHub Release with generated notes and the tarball attached.

This workflow does not publish to npm. Keep `npm publish --access public` as a deliberate maintainer action.

If the generated GitHub release notes need more detail, edit the GitHub Release after the workflow finishes and copy the matching `CHANGELOG.md` entry into the release notes.

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
