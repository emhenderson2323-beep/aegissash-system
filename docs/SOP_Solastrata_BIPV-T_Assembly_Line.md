# STANDARD OPERATING PROCEDURE
## Solastrata™ BIPV-T Active Glazing Systems
### Factory Assembly Line — 3′ × 5′ Prototype

**Document ID:** SOP-SOLASTRATA-ASM-001  
**Revision:** A  
**Effective:** 2026-10-03  
**Docket:** SOLASTRATA-PROV-2026-01

---

## 1. Purpose
This SOP defines the controlled manufacturing sequence for the Solastrata™ BIPV-T Active Glazing Systems 3′ × 5′ (36″ × 60″) prototype. It ensures repeatable, safe, and quality-compliant assembly of the dual-cavity thermal-break frame, Lumogen-doped Zeonex optical core, GaAs edge photovoltaic strips, hydronic cooling loop, and IP67 electronics chamber.

## 2. Scope
Applies to all production and pilot-line personnel performing assembly, inspection, and final test of the Solastrata™ BIPV-T unit. Covers Stations 1–8 of the digital-twin production line (total active cycle ≈ 36.5 s of automated motion plus manual verification holds).

## 3. References & Governing Standards
- NFRC 100 / NFRC 200 – Thermal & optical performance
- NEC 690 – Solar photovoltaic systems (rapid shutdown ≤ 30 V in 30 s)
- UL 61730 – PV module safety qualification
- IEEE 1547 – Interconnection of distributed energy resources
- AAMA / ASTM DP105 structural rating criteria
- Internal Docket: SOLASTRATA-PROV-2026-01

## 4. Safety Requirements
- **N₂ atmosphere (Station 1):** Verify oxygen < 50 ppm before dye/QD dispensing. Use continuous O₂ monitoring.
- **ALD chamber (Station 1):** Follow lock-out/tag-out; residual process gases must be purged.
- **Structural silicone (Stations 6–7):** Use chemical-resistant gloves and eye protection; ensure adequate ventilation.
- **Hydronic pressure test (Station 8):** Maximum 30 PSI. Never exceed rated pressure of copper tubing.
- **Electrical (Station 5 & 8):** Confirm polarity and IR > 1 MΩ before energizing. Rapid-shutdown test must be performed with PPE.
- **Kuka KR16 robots:** Maintain light-curtain integrity; never enter cell while robot is in automatic mode.

## 5. Cycle-Time Summary

| Step | Station | Duration | Primary Tool |
|------|---------|----------|--------------|
| 1 | Core Prep & Doping | 4.5–6.0 s | N₂ Casting + ALD |
| 2 | Glass Washing & Prep | 3.0 s | IPA Wash Station |
| 3 | Vacuum-Bag Lamination | 8.0 s | Vacuum Press 80 °C |
| 4 | PV String Layup & Hydronic | 4.0–5.5 s | GaAs Edge Robot |
| 5 | Wiring & Inverter Potting | 3.5–6.0 s | Kuka KR16 + Dispenser |
| 6 | Framing & Thermal Break | 5.0–7.0 s | Frame Jig + Silicone |
| 7 | Edge Sealing & IGU Press | 4.0 s | Final Press Station |
| 8 | Final Pressure & Thermal Test | 3.0–5.0 s | Hydronic + RSD Tester |

Total active automated motion ≈ 36.5 s. Manual quality holds and inter-station buffers are additional.

## 6. Station Procedures

### Station 1 — Core Preparation & Doping
**Tooling:** N₂ Atmosphere Casting Station, Precision Dye Dispenser, QD Injection Head, ALD Chamber (Beneq/Picosun)

1. Verify N₂ environment: O₂ < 50 ppm.
2. Cast Zeonex 480R core to 4.0 mm ± 0.1 mm thickness.
3. Dispense Lumogen F Red 305 (target 125–150 ppm) under inert atmosphere.
4. Inject InP/ZnS core-shell quantum dots (≈ 450 ppm, d ≈ 3.2 nm).
5. Apply Penrose P3 nanostructure and deposit 35 nm multi-layer ALD AlN/SiO₂ barrier.

**Quality Checks:** Thickness ± 0.1 mm; no dye streaks or QD agglomeration.

### Station 2 — Glass Washing & Prep
**Tooling:** IPA Wash Station

1. Load outer and inner low-iron tempered float glass (36″ × 60″ × 2.0 mm).
2. Perform IPA wash and lint-free wipe of both surfaces.
3. Transfer to clean staging for lamination.

**Quality Checks:** No particulate > 50 µm; surface energy suitable for OCA bonding.

### Station 3 — Vacuum-Bag Lamination
**Tooling:** Vacuum-Bag Press (80–100 °C), Fluoropolymer Spray Head

1. Layup order: Inner glass → 3M 8146 OCA (0.5–1.0 mm CTE-tuned) → doped core → OCA → Outer glass.
2. Apply vacuum ≥ 25 inHg; cure at 80–100 °C.
3. Apply hydrophobic fluoropolymer top coat (≈ 0.05 mm).

**Quality Checks:** No bubbles > 1 mm; total stack thickness ≈ 9.05 mm.

### Station 4 — PV String Layup & Hydronic
**Tooling:** GaAs Edge Mount Robot, Ribbon Solder Station, Tube Bender/Installer

1. Mount GaAs edge strips along perimeter (≈ 4.3 m total).
2. Solder 2.0 mm tinned copper ribbon busbar.
3. Install 1/4″ C12200 copper cooling loop; pressure-test dry at 30 PSI.

**Quality Checks:** Voc measurable under shop lights; no leaks at 30 PSI.

### Station 5 — Wiring & Inverter Potting (Upper Chamber)
**Tooling:** Kuka KR16 Pick-and-Place, Wire Routing Arm, Connector Crimp Station, Glue Dispenser

1. Route 16 AWG PTFE bus ONLY through upper dual-cavity chamber — never into weep path.
2. Seat 120 × 25 × 12 mm buck-boost PCB + SunSpec RS-485 transceiver.
3. Install inline 10 A DC fuse and IP67 MC4-style connectors.
4. Fully pot upper chamber with thermally conductive epoxy to IP67.

**Quality Checks:** Polarity marked; IR > 1 MΩ to frame; no wire penetration into lower weep chamber; continuous potting.

### Station 6 — Frame Pultrusion & Thermal Break Insertion
**Tooling:** Frame Assembly Jig, Kuka KR16 Glue Dispenser

1. Install laminated stack into dual-cavity aluminum extrusion with polyamide thermal break (18 mm nominal).
2. Apply continuous structural silicone bead at all perimeter interfaces.

**Quality Checks:** Seals continuous; thermal-break integrity verified.

### Station 7 — Edge Sealing & IGU Press
**Tooling:** Final Press Station

1. Apply final perimeter compression to set structural silicone.
2. Verify lower chamber weep holes remain clear and isolated from electronics cavity.

**Quality Checks:** Weep paths open; no silicone intrusion into drainage chamber.

### Station 8 — Final Pressure & Thermal Testing
**Tooling:** Hydronic Fill & Pressure Test Rig, NEC 690 Rapid-Shutdown Tester

1. Fill hydronic loop with 40/60 propylene-glycol/water mix; bleed air.
2. Pressure-test to 30 PSI; hold 15 minutes minimum.
3. Perform wet-leakage test (< 10 µA).
4. Execute NEC 690 rapid-shutdown functional check: ≤ 30 V within 30 s.

**Quality Checks:** Hydronic hold 15 min at 30 PSI with zero pressure drop; RSD compliance confirmed and logged.

## 7. Records & Traceability
Each completed unit shall have a digital traveler containing: serial number, station timestamps, measured Voc, pressure-test result, RSD pass/fail, operator ID, and final stack thickness. Data is retained for the product warranty period plus two years.

## 8. Document Control
Revision A — Initial release aligned with digital-twin assembly sequence and authentic BOM (Docket SOLASTRATA-PROV-2026-01). Approved for production use. Changes require formal ECO and re-validation of affected stations.

## 9. Approvals
Prepared by: ________________________________  Date: ______________  
Reviewed by: ________________________________  Date: ______________  
Approved by: ________________________________  Date: ______________
