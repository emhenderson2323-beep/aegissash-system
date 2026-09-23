import csv
import io
from typing import Any


def parse_epw_text(epw_text: str) -> list[dict[str, Any]]:
    if not epw_text:
        return []

    rows = []
    handle = io.StringIO(epw_text)
    reader = csv.reader(handle)
    all_rows = list(reader)

    for row in all_rows[8:]:
        if len(row) < 35 or not row[0].strip():
            continue
        try:
            year = int(row[0]) if row[0].strip() else 2024
            month = int(row[1]) if row[1].strip() else 1
            day = int(row[2]) if row[2].strip() else 1
            hour = int(row[3]) if row[3].strip() else 0
            dni = float(row[14]) if row[14].strip() else 0.0
            dhi = float(row[15]) if row[15].strip() else 0.0
            dry_bulb = float(row[6]) if row[6].strip() else 20.0
            wind_speed = float(row[22]) if row[22].strip() else 2.0
            poa = dni * 0.75 + dhi * 0.5
            rows.append({
                'date': f'{year}-{month:02d}-{day:02d}',
                'hour': hour,
                'dry_bulb_temperature_c': dry_bulb,
                'dni_w_m2': dni,
                'dhi_w_m2': dhi,
                'wind_speed_m_s': wind_speed,
                'poa_irradiance_w_m2': poa,
            })
        except (TypeError, ValueError):
            continue

    return rows[:8760]


def parse_epw_file(path: str | None = None, epw_text: str | None = None) -> list[dict[str, Any]]:
    if epw_text is not None:
        return parse_epw_text(epw_text)
    if path is None:
        return []
    with open(path, 'r', encoding='utf-8') as handle:
        return parse_epw_text(handle.read())
