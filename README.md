# AegisSash System — Solastrata™ BIPV-T Digital Twin

**AegisSash BIPV-T fenestration digital twin and engineering audit engine**

This repository contains the production-ready digital-to-physical pipeline for the **Solastrata™ BIPV-T Active Glazing Systems** 3′ × 5′ (36″ × 60″) prototype.

---

## Pipeline Overview

| Layer | Artifact | Purpose |
|-------|----------|--------|
| **Data** | `digital-twin/` | Game-engine ingestible JSON (Unreal DataTables / Unity ScriptableObjects) |
| **Simulation** | `scripts/unreal/` | Unreal Engine 5.3+ Level Sequence generator |
| **Documentation** | `docs/` | Shop-floor Standard Operating Procedure |
| **Tracking** | Linear (AEG-9) | Master epic + 8 station issues |

Everything is synchronized: the same station order, durations, tools, quality checks, and safety limits appear in the SOP, the Unreal sequence, and the Linear issues.

---

## Directory Structure

```
aegissash-system/
├── digital-twin/
│   ├── components.json          # Master component library (BOM + mesh + materials)
│   ├── configurations.json      # Valid product combinations & rules
│   └── assembly_sequence.json   # 8-station factory animation timeline
├── scripts/
│   └── unreal/
│       └── Generate_Solastrata_Assembly_Sequencer_v2.py
├── docs/
│   └── SOP_Solastrata_BIPV-T_Assembly_Line.md
├── aegis-web/                   # Existing web digital twin (TypeScript/React)
├── aegis-api/                   # Existing API services
├── aegis-core/                  # Existing Rust physics core
└── schemas/                     # Existing JSON schemas
```

---

## 1. Game-Engine Data (`digital-twin/`)

### `components.json`
Every physical sub-component from the prototype BOM:

- Unique `id`, human-readable `name`, `category`
- Technical `specs` (weight, dimensions, material grade, thermal conductivity, electrical ratings)
- `mesh_path` references for Unreal/Unity assets
- `material_parameters` for PBR shaders (base color, roughness, metallic, IOR, opacity, emission)

### `configurations.json`
Dependency matrix for valid product options:

- Core material, edge PV type, cavity gas, hydronic loop, ALD barrier, thermal break, inverter topology
- `compatible_with` / `incompatible_with` arrays
- Real-time `price_delta` and `weight_delta_g`

### `assembly_sequence.json`
Step-by-step manufacturing choreography (36.5 s active motion):

| Step | Station | Duration | Primary Tool |
|------|---------|----------|--------------|
| 1 | Core Preparation & Doping | 4.5–6.0 s | N₂ Casting + ALD |
| 2 | Glass Washing & Prep | 3.0 s | IPA Wash Station |
| 3 | Vacuum-Bag Lamination | 8.0 s | Vacuum Press 80 °C |
| 4 | PV String Layup & Hydronic | 4.0–5.5 s | GaAs Edge Robot |
| 5 | Wiring & Inverter Potting | 3.5–6.0 s | Kuka KR16 + Dispenser |
| 6 | Framing & Thermal Break | 5.0–7.0 s | Frame Jig + Silicone |
| 7 | Edge Sealing & IGU Press | 4.0 s | Final Press Station |
| 8 | Final Pressure & Thermal Test | 3.0–5.0 s | Hydronic + RSD Tester |

Each station includes `action_type`, start/end transforms, duration, and tool references.

---

## 2. Unreal Engine Digital Twin

**Script:** `scripts/unreal/Generate_Solastrata_Assembly_Sequencer_v2.py`

### Requirements
- Unreal Engine 5.3+
- Python Editor Script Plugin enabled

### Usage
1. Place the script in your project’s `Content/Python` folder (or run via the Python console).
2. Execute `generate_sequencer_v2()`.
3. A Level Sequence named `LS_Solastrata_Assembly_DigitalTwin_v2` is created under `/Game/DigitalTwin/Sequences`.

### Features
- One binding per station + staggered secondary actions
- Continuous `CineCameraActor` track with look-at calculations and mid-station keyframes
- Material parameter curves for optical stations (`DyeConcentration`, `HydrophobicThickness`)
- Metric → centimeter unit scaling

Replace the generic `StaticMeshActor` spawnables with your actual FBX / Blueprint assets (paths match `mesh_path` values in `components.json`) for full visual fidelity.

---

## 3. Standard Operating Procedure

**Document:** `docs/SOP_Solastrata_BIPV-T_Assembly_Line.md`  
**Document ID:** SOP-SOLASTRATA-ASM-001 | **Revision:** A

Covers:

- Governing standards (NFRC 100/200, NEC 690, UL 61730, IEEE 1547, AAMA DP105)
- Safety protocols (N₂ < 50 ppm O₂, ALD LOTO, 30 PSI hydronic limit, rapid-shutdown PPE)
- Station-by-station work instructions and quality checks
- Records & traceability requirements
- Formal approval block

A formatted Word version is also available for shop-floor printing.

---

## 4. Project Tracking (Linear)

| ID | Title |
|----|-------|
| **AEG-9** | Solastrata™ BIPV-T Prototype Production Run – Master Tracking |
| AEG-10 → AEG-17 | Station 1–8 child issues (work instructions + QC embedded) |

Master epic: https://linear.app/aegissash-technologies-llc/issue/AEG-9

---

## Authenticity & Provenance

All component weights, dimensions, material grades, suppliers, and process parameters are derived from the real prototype BOM and manufacturing data (Docket **SOLASTRATA-PROV-2026-01**). No fabricated values.

Key real-world references:

- Zeonex 480R (Zeon Corp)
- Lumogen F Red 305 (BASF)
- InP/ZnS quantum dots
- 3M 8146 OCA
- GaAs edge PV strips
- C12200 copper hydronic loop
- Dual-cavity aluminum frame with polyamide thermal break (Kawneer / YKK class)

---

## License & Confidentiality

Internal engineering use. Confidential — Docket SOLASTRATA-PROV-2026-01.

---

*Generated and maintained as part of the AegisSash digital-twin production pipeline.*
