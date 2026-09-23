import pytest

from services.report_generator import validate_audit_package


def _valid_package() -> dict:
    return {
        'schema_version': '1.0',
        'timestamp': '2026-09-23T00:00:00Z',
        'dag_master_hash': 'a' * 64,
        'nodes': [
            {
                'calc_id': 'b' * 64,
                'calc_version': '1.0.0',
                'quantity': 'U_factor',
                'value': 1.8,
                'unit': 'W/m2K',
                'equation': 'U_center*(1-f_frame)+U_frame*f_frame',
                'inputs': {'center_u': 1.2, 'frame_u': 2.6, 'frame_fraction': 0.12},
                'intermediates': {'system_u': 1.8},
                'assumptions': ['default glass stack'],
                'source': 'aegis-core',
                'source_revision': '1',
                'verification_status': 'CALCULATED',
                'uncertainty': 0.05,
                'validity_domain': 'engineering screening',
                'warnings': [],
                'upstream_calculations': [],
            }
        ],
        'metadata': {'project': 'AegisSash'}
    }


def test_valid_audit_package_passes_schema_validation() -> None:
    valid, errors = validate_audit_package(_valid_package())
    assert valid is True
    assert errors == []


def test_invalid_hash_is_rejected() -> None:
    payload = _valid_package()
    payload['dag_master_hash'] = 'not-a-valid-sha256'
    valid, errors = validate_audit_package(payload)
    assert valid is False
    assert any('dag_master_hash' in str(error) for error in errors)


def test_invalid_status_enum_is_rejected() -> None:
    payload = _valid_package()
    payload['nodes'][0]['verification_status'] = 'INVALID_STATUS'
    valid, errors = validate_audit_package(payload)
    assert valid is False
    assert any('verification_status' in str(error) for error in errors)
