extends Node

const MISSION_TEMPLATE := "res://data/missions/%s.json"
const PLACEHOLDER_IMAGE := "res://assets/portraits/<id>.png"
const DOC_EXAMPLE := "res://..."

func load_path(path: String) -> void:
	_load(path)

func _load(_path: String) -> void:
	pass
