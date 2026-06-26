# Godot Guard Report

Found 8 issue(s).

## Summary

- Severity: error=5, warn=3
- Codes: gdscript.return_type_missing=1, gdscript.var_type_missing=1, project.autoload_script_missing=1, project.required_autoload_missing=1, project.required_input_action_missing=1, resources.missing_res_directory=1, resources.missing_res_path=1, resources.res_path_case_mismatch=1

## Issues

### project.required_autoload_missing

- Severity: error
- Location: `project.godot`
- Message: Required autoload is missing: AudioBus
- Suggestion: Restore the autoload or remove it from godot-guard.config.json.

### project.autoload_script_missing

- Severity: error
- Location: `project.godot`
- Message: Autoload SaveSystem points to a missing script: res://scripts/MissingSaveSystem.gd
- Suggestion: Restore scripts/MissingSaveSystem.gd or update the autoload entry.

### project.required_input_action_missing

- Severity: error
- Location: `project.godot`
- Message: Required input action is missing: interact
- Suggestion: Restore the action in Project Settings > Input Map or update godot-guard.config.json.

### resources.res_path_case_mismatch

- Severity: error
- Location: `scenes/Main.tscn:4`
- Message: Resource path casing does not match disk: res://assets/HeroPortrait.png
- Suggestion: Update the reference casing. assets/HeroPortrait.png differs from disk casing assets/heroportrait.png

### resources.missing_res_path

- Severity: error
- Location: `scenes/Main.tscn:5`
- Message: Missing resource reference: res://assets/missing_background.png
- Suggestion: Restore the missing file, update the resource path, or allow the pattern in config.

### resources.missing_res_directory

- Severity: warn
- Location: `scripts/Main.gd:3`
- Message: Missing resource directory or path prefix: res://levels/prototype
- Suggestion: Restore the missing file, update the resource path, or allow the pattern in config.

### gdscript.var_type_missing

- Severity: warn
- Location: `scripts/Main.gd:5`
- Message: Variable declaration is missing a type hint or `:=` inference.
- Suggestion: Use `var name: Type = value` or `var name := value`.

### gdscript.return_type_missing

- Severity: warn
- Location: `scripts/Main.gd:7`
- Message: Function declaration is missing an explicit return type.
- Suggestion: Add an explicit return type, for example `-> void`.
