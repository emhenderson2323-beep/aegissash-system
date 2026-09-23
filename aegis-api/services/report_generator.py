from __future__ import annotations

from typing import Any

import numpy as np
from scipy.optimize import minimize


def model_metrics(glass_thickness_mm: float, gap_mm: float, tint_fraction: float) -> tuple[float, float]:
    t = max(glass_thickness_mm, 2.0) / 100.0
    g = max(gap_mm, 6.0) / 1000.0
    tint = max(0.0, min(1.0, tint_fraction))

    u_factor = 1.82 - (0.35 * t) + (0.08 * g) + (0.25 * (1.0 - tint))
    power_w = 360.0 + 80.0 * t * 10.0 + 34.0 * (1.0 / max(g, 0.01)) - 22.0 * tint
    return float(u_factor), float(power_w)


def solve_inverse_design(target_u_factor: float, target_power_w: float) -> dict[str, Any]:
    def objective(x: np.ndarray) -> float:
        thickness_mm, gap_mm, tint_fraction = x
        u_factor, power_w = model_metrics(float(thickness_mm), float(gap_mm), float(tint_fraction))
        return ((u_factor - target_u_factor) ** 2) * 10_000.0 + ((power_w - target_power_w) ** 2) * 0.01

    initial = np.array([5.0, 12.0, 0.35], dtype=float)
    result = minimize(objective, initial, method='Nelder-Mead', options={'maxiter': 500})

    thickness_mm, gap_mm, tint_fraction = result.x
    u_factor, power_w = model_metrics(float(thickness_mm), float(gap_mm), float(tint_fraction))

    return {
        'success': bool(result.success),
        'target_u_factor': float(target_u_factor),
        'target_power_w': float(target_power_w),
        'solution': {
            'glass_thickness_mm': float(thickness_mm),
            'gap_mm': float(gap_mm),
            'tint_fraction': float(tint_fraction),
        },
        'predicted': {
            'u_factor': float(u_factor),
            'power_w': float(power_w),
        },
        'message': result.message,
    }
