import json
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from services.epw_parser import parse_epw_text
from services.inverse_solver import solve_inverse_design
from services.report_generator import validate_audit_package

app = FastAPI(title='AegisSash API', version='1.0.0')

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_methods=['*'],
    allow_headers=['*'],
)


@app.get('/api/health')
async def health() -> dict:
    return {'status': 'ok', 'service': 'aegis-api'}


@app.post('/api/weather/epw')
async def parse_weather_epw(payload: dict) -> dict:
    epw_text = payload.get('epw_text') or payload.get('content') or ''
    records = parse_epw_text(epw_text)
    return {
        'count': len(records),
        'records': records[:12],
        'poa_peak_w_m2': max((r.get('poa_irradiance_w_m2', 0.0) for r in records), default=0.0),
    }


@app.post('/api/solve/inverse')
async def solve_inverse(payload: dict) -> dict:
    target_u = float(payload.get('target_u_factor', 0.8))
    target_power = float(payload.get('target_power_w', 420.0))
    result = solve_inverse_design(target_u, target_power)
    return result


@app.post('/api/audit/verify')
async def verify_audit(payload: dict) -> dict:
    valid, errors = validate_audit_package(payload)
    return {'is_valid': valid, 'errors': errors}
