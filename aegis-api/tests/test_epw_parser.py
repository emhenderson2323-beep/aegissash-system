from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from jsonschema import Draft7Validator


def schema_path() -> Path:
    return Path(__file__).resolve().parents[2] / 'schemas' / 'audit_package.schema.json'


def validate_audit_package(payload: dict[str, Any]) -> tuple[bool, list[str]]:
    schema = json.loads(schema_path().read_text(encoding='utf-8'))
    validator = Draft7Validator(schema)
    errors = sorted(validator.iter_errors(payload), key=lambda exc: exc.path)
    if not errors:
        return True, []

    messages = []
    for error in errors:
        messages.append(f"{list(error.path) or 'root'}: {error.message}")
    return False, messages
