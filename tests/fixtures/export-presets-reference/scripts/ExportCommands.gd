extends Node

func has_export_presets() -> bool:
	return FileAccess.file_exists("res://export_presets.cfg")
