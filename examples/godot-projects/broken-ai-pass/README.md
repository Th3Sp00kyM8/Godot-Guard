# Broken AI Pass Example

This tiny Godot project is intentionally broken. It demonstrates the kind of drift Godot Guard is meant to catch after a fast AI-assisted editing pass.

Run from the repository root:

```bash
node dist/cli.js scan examples/godot-projects/broken-ai-pass --format markdown
```

Expected issue categories include:

- a missing required autoload
- an autoload pointing at a missing script
- a missing required input action
- missing `res://` resources
- a case-sensitive resource path mismatch
- optional GDScript typing warnings
