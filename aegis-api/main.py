"""AegisSash API — POST /api/v1/simulate/ — Docket AEGIS-PROV-2026-01"""
from __future__ import annotations

import json
import math
from pathlib import Path
from typing import Any, Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(
    title="AegisSash Digital Twin API",
    version="84.0.0",
    description="Docket AEGIS-PROV-2026-01 / USPTO 64/158,837",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

SCHEMA_PATH = Path(__file__).resolve().parents[1] / "schemas" / "aegis_sash_system.schema.json"


class OpticalMatrix(BaseModel):
    base_polymer: Literal["PMMA", "Zeonex_150ppm", "Polycarbonate", "Glass"]
    substrate_thickness_mm: float = Field(ge=1.0, le=10.0)
    dye_dopant: Literal["None", "Lumogen_Yellow_083", "Lumogen_Red_305"]
    dye_concentration_ppm: float = Field(ge=0.0, le=500.0)


class QuantumDots(BaseModel):
    core_material: Literal["InP", "CuInS2", "CdSe", "CsPbBr3"]
    shell_material: Literal["ZnS", "ZnSe", "Dual_ZnS_ZnSe"]
    diameter_nm: float = Field(ge=1.0, le=10.0)
    concentration_ppm: float = Field(ge=0.0, le=2000.0)


class PhotonicCrystal(BaseModel):
    lattice_geometry: Literal["Square", "Hexagonal", "Penrose_P3", "E8_Projection"]
    pitch_nm: float = Field(ge=200.0, le=1200.0)
    fill_factor: float = Field(ge=0.1, le=0.45)


class ElectricalHydronic(BaseModel):
    pv_material: Literal["c-Si", "GaAs", "GaN", "SiC", "Perovskite"]
    channel_diameter_mm: float = Field(ge=2.0, le=12.0)
    mass_flow_rate_kg_s: float = Field(ge=0.01, le=0.50)
    coolant_fluid: Literal["Pure_H2O", "Ethylene_Glycol_50_50", "Nano_Fluid"] = "Ethylene_Glycol_50_50"
    inverter_topology: Literal["Central_Inverter", "Microinverter", "Buck_Boost_DC_DC"] = "Buck_Boost_DC_DC"
    cavity_gas: Literal["Air", "Argon", "Krypton"] = "Argon"
    low_e_emissivity: float = Field(default=0.03, ge=0.02, le=0.84)


class SimulateRequest(BaseModel):
    optical_matrix: OpticalMatrix
    quantum_dots: QuantumDots
    photonic_crystal: PhotonicCrystal
    electrical_hydronic: ElectricalHydronic
    G_solar: float = Field(default=1000.0, ge=0, le=1400)
    T_ambient: float = Field(default=25.0, ge=-40, le=60)


POLYMER_N = {"PMMA": 1.49, "Zeonex_150ppm": 1.53, "Polycarbonate": 1.58, "Glass": 1.52}
PV_ETA = {"c-Si": 0.22, "GaAs": 0.28, "GaN": 0.18, "SiC": 0.12, "Perovskite": 0.24}
PV_MATCH = {"GaAs": 1.0, "c-Si": 0.92, "Perovskite": 0.88, "GaN": 0.55, "SiC": 0.45}
CP = {"Pure_H2O": 4.18, "Ethylene_Glycol_50_50": 3.55, "Nano_Fluid": 3.8}


def simulate(req: SimulateRequest) -> dict[str, Any]:
    o, q, pc, eh = req.optical_matrix, req.quantum_dots, req.photonic_crystal, req.electrical_hydronic
    G, Tamb = req.G_solar, req.T_ambient
    n_core = POLYMER_N[o.base_polymer]
    Tvis = 0.92 if o.base_polymer == "Zeonex_150ppm" else 0.9
    Tvis -= 0.00004 * o.dye_concentration_ppm + 0.000015 * q.concentration_ppm
    Tvis = max(0.55, min(0.95, Tvis))
    base_q = {"Penrose_P3": 85, "E8_Projection": 72, "Hexagonal": 55, "Square": 42}[pc.lattice_geometry]
    pitch_f = 1 + 0.18 * math.exp(-((pc.pitch_nm - 520) / 180) ** 2)
    fill_f = 1 + 0.3 * (1 - abs(pc.fill_factor - 0.22) / 0.22)
    Qf = base_q * pitch_f * fill_f
    F = max(4.0, min(20.0, (math.pi * Qf) / 10))
    haze = 1.1 if pc.lattice_geometry == "Penrose_P3" else 2.4
    R0 = 5.8 if o.dye_dopant == "Lumogen_Red_305" else 5.2
    if o.dye_dopant == "None":
        E_fret = 0.35
    else:
        conc = (o.dye_concentration_ppm + q.concentration_ppm * 0.5) / 600
        r = max(1.5, 5.2 / math.sqrt(max(0.05, conc)))
        ratio = (R0 / r) ** 6
        E_fret = min(0.99, ratio / (1 + ratio))
    trap = math.sqrt(max(0.0, 1 - (1.42 / n_core) ** 2))
    eta_pv = PV_ETA[eh.pv_material] * PV_MATCH[eh.pv_material]
    stokes = 1.08 if q.core_material == "InP" else 1.0
    eta_el = eta_pv * trap * E_fret * (0.5 + 0.1 * math.log10(max(F, 1.1))) * stokes * (Tvis / 0.9)
    eta_el *= min(1.1, 1 + 0.18 * min(1.0, eh.mass_flow_rate_kg_s / 0.13))
    eta_el = min(0.3, eta_el)
    alpha = 0.72 - Tvis * 0.22
    eta_th = min(0.65, max(0.25, alpha * 0.82 * (1 - 0.1 * math.exp(-eh.mass_flow_rate_kg_s / 0.08))))
    k_gas = {"Krypton": 0.009, "Argon": 0.017, "Air": 0.026}[eh.cavity_gas]
    h_gap = k_gas / 0.012
    h_rad = 4 * 5.67e-8 * (293**3) * eh.low_e_emissivity
    Rgap = 1 / (h_gap + h_rad)
    U = max(0.4, min(2.5, (1.0 / (1 / 8.5 + 0.004 + Rgap + 1 / 25 + 0.018 / 0.25)) * 0.94))
    shgc = max(0.15, min(0.5, 0.4 - o.dye_concentration_ppm / 2200 - (1 - Tvis) * 0.12))
    Cp = CP[eh.coolant_fluid]
    Tcell = Tamb + (G * (alpha - eta_el)) / (U * 14 + eh.mass_flow_rate_kg_s * Cp * 90 + 5)
    eta_el *= 1 + (-0.0035) * (Tcell - 25)
    return {
        "docket": "AEGIS-PROV-2026-01",
        "version": "84.0.0-PROD-AUDIT",
        "metrics": {
            "optical_transparency": round(Tvis, 3),
            "haze_pct": round(haze, 2),
            "path_length_enhancement": round(F, 2),
            "fret_efficiency": round(E_fret, 3),
            "trap_fraction": round(trap, 3),
            "electrical_efficiency_pct": round(max(0, eta_el) * 100, 2),
            "thermal_efficiency_pct": round(eta_th * 100, 2),
            "u_factor": round(U, 3),
            "shgc": round(shgc, 3),
            "cell_temp_c": round(Tcell, 1),
            "power_density_w_m2": round(max(0, eta_el) * G, 1),
            "thermal_power_w_m2": round(eta_th * G, 1),
        },
        "compliance": {
            "nfrc_100": U <= 0.85,
            "nfrc_200": 0.2 <= shgc <= 0.4,
            "nec_690": eh.inverter_topology in ("Microinverter", "Buck_Boost_DC_DC"),
            "ieee_1547": eh.inverter_topology in ("Microinverter", "Buck_Boost_DC_DC"),
        },
    }


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "version": "84.0.0"}


@app.get("/api/v1/schema")
def get_schema() -> Any:
    if not SCHEMA_PATH.exists():
        raise HTTPException(404, "Schema file missing")
    return json.loads(SCHEMA_PATH.read_text())


@app.post("/api/v1/simulate/")
def api_simulate(body: SimulateRequest) -> dict[str, Any]:
    return simulate(body)


@app.get("/")
def root() -> dict[str, str]:
    return {"service": "AegisSash Digital Twin API", "simulate": "POST /api/v1/simulate/", "schema": "GET /api/v1/schema"}
