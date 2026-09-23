use wasm_bindgen::prelude::*;

pub mod provenance;
pub mod optics;
pub mod thermal;
pub mod electrical;
pub mod hydronics;
pub mod fenestration;
pub mod degradation;
pub mod finance;

pub use provenance::{AuditDAG, CalcResult, VerificationStatus};
pub use optics::{optical_bounds, run_monte_carlo_tracer, OpticalBounds, RaySegment};
pub use thermal::cell_temperature;
pub use electrical::conductor_resistance;
pub use hydronics::{heat_extraction, pump_power};
pub use fenestration::{plate_screen, DISCLAIMER};
pub use degradation::decay;
pub use finance::pro_forma;

#[wasm_bindgen]
pub fn calculate_u_factor_wasm(center: f64, frame: f64, frame_fraction: f64) -> String {
    console_error_panic_hook::set_once();
    let result = thermal::u_factor(center, frame, frame_fraction);
    serde_json::to_string(&result).expect("serialize u-factor result")
}

#[wasm_bindgen]
pub fn run_monte_carlo_wasm(rays: usize, n_core: f64, n_clad: f64, thickness: f64, length: f64) -> String {
    console_error_panic_hook::set_once();
    let result = optics::run_monte_carlo_tracer(rays, n_core, n_clad, thickness, length);
    serde_json::to_string(&result).expect("serialize ray traces")
}

#[wasm_bindgen]
pub fn calculate_full_system_wasm(input_json: &str) -> String {
    console_error_panic_hook::set_once();
    let value: serde_json::Value = serde_json::from_str(input_json).unwrap_or(serde_json::json!({
        "center_u": 1.8,
        "frame_u": 2.6,
        "frame_fraction": 0.12,
        "t_cell": 29.4,
        "power": 410.0
    }));

    let center_u = value.get("center_u").and_then(|v| v.as_f64()).unwrap_or(1.8);
    let frame_u = value.get("frame_u").and_then(|v| v.as_f64()).unwrap_or(2.6);
    let frame_fraction = value.get("frame_fraction").and_then(|v| v.as_f64()).unwrap_or(0.12);
    let cell_temp = value.get("t_cell").and_then(|v| v.as_f64()).unwrap_or(29.4);
    let power = value.get("power").and_then(|v| v.as_f64()).unwrap_or(410.0);

    let u_result = thermal::u_factor(center_u, frame_u, frame_fraction);
    let mut inputs = std::collections::BTreeMap::new();
    inputs.insert("center_u".to_string(), center_u);
    inputs.insert("frame_u".to_string(), frame_u);
    inputs.insert("frame_fraction".to_string(), frame_fraction);
    inputs.insert("t_cell".to_string(), cell_temp);

    let mut result = CalcResult::new(
        "system_u_factor",
        u_result.value,
        "W/m2K",
        "U_sys = U_center * (1 - f_frame) + U_frame * f_frame",
        inputs,
        VerificationStatus::Calculated,
    );
    result.intermediates.insert("cell_temperature_C".to_string(), cell_temp);
    result.intermediates.insert("power_W".to_string(), power);
    result.validity_domain = "BIPV fenestration system screening".to_string();

    let dag = AuditDAG::new(vec![result], "2026-01-01T00:00:00Z".to_string());
    serde_json::to_string(&dag).expect("serialize full audit DAG")
}
