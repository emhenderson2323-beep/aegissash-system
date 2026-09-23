from services.epw_parser import parse_epw_text


def _build_epw_text() -> str:
    lines = [
        'LOCATION,Test,USA,USW00013739,40.71,-74.01,1,1,1,1,1,1',
        'DESIGN CONDITIONS,1,1,1,1,1,1,1,1,1,1',
        'TYPICAL/EXTREME PERIODS,1,1,1,1,1,1,1,1,1,1',
        'GROUND TEMPERATURES,1,1,1,1,1,1,1,1,1,1',
        'HOLIDAYS,1,1,1,1,1,1,1,1,1,1',
        'COMMENTS 1,2,3,4,5,6,7,8,9,10,11,12',
        'COMMENTS 2,1,2,3,4,5,6,7,8,9,10,11',
        'DATA PERIODS,1,1,1,1,1,1,1,1,1,1',
    ]

    for month in range(1, 13):
        for day in range(1, 32):
            if month == 2 and day > 28:
                continue
            for hour in range(24):
                lines.append(
                    ','.join([
                        '2024', str(month), str(day), str(hour),
                        '0', '0', '20.0', '10.0', '0', '0', '0', '0',
                        '0', '0', '400.0', '120.0', '0', '0', '0', '0', '0', '0', '2.0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0'
                    ])
                )

    return '\n'.join(lines)


def test_epw_parser_has_exactly_8760_records() -> None:
    records = parse_epw_text(_build_epw_text())
    assert len(records) == 8760
    assert all('poa_irradiance_w_m2' in record for record in records)
