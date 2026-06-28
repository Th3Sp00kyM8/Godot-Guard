# Godot Guard Report

Found 8 issue(s).

## Summary

- Severity: error=5, warn=3
- Codes: gdscript.return_type_missing=1, gdscript.var_type_missing=1, project.autoload_script_missing=1, project.required_autoload_missing=1, project.required_input_action_missing=1, resources.missing_res_directory=1, resources.missing_res_path=1, resources.res_path_case_mismatch=1

## Plain-Language Guide

- `gdscript.return_type_missing`: A GDScript function does not declare an explicit return type. **Risk:** This is a style and maintainability warning when typed GDScript is expected. **Fix:** Add a return type such as `-> void`, or disable `gdscript.requireReturnTypes` in config.
- `gdscript.var_type_missing`: A GDScript variable assignment does not use a type hint or `:=` inference. **Risk:** This is a style and maintainability warning when typed GDScript is expected. **Fix:** Use `var name: Type = value`, `var name := value`, or disable `gdscript.requireTypedVars` in config.
- `project.autoload_script_missing`: An autoload entry points to a script resource that does not exist on disk. **Risk:** Godot may fail to load the singleton, and dependent scripts can break at runtime. **Fix:** Restore the missing script or update the autoload entry to the correct path.
- `project.required_autoload_missing`: The config requires an autoload name that is not present in `project.godot`. **Risk:** Code that depends on that singleton may crash or silently skip behavior. **Fix:** Restore the autoload in Project Settings or remove it from `requiredAutoloads` if it is no longer required.
- `project.required_input_action_missing`: The config requires an input action that is not present in the project's Input Map. **Risk:** Controls or UI flows that depend on the action may stop responding. **Fix:** Restore the action in Project Settings > Input Map or remove it from `requiredInputActions` if obsolete.
- `resources.missing_res_directory`: An extensionless `res://` reference looks like a folder or path prefix, but that path was not found. **Risk:** This may be a real missing folder or a harmless dynamic path prefix. **Fix:** Create the folder, update the prefix, or allow the pattern in config if the path is intentionally dynamic.
- `resources.missing_res_path`: A concrete `res://` reference points to a file that does not exist. **Risk:** Scenes, scripts, shaders, or resources may fail to load when Godot reaches that reference. **Fix:** Restore the missing file, update the reference, or allow the pattern in config if it is intentionally generated later.
- `resources.res_path_case_mismatch`: A `res://` reference differs from the actual file or folder casing on disk. **Risk:** The project may work on Windows but fail on case-sensitive systems, exports, or CI. **Fix:** Update the reference casing to exactly match the file or folder on disk.

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
