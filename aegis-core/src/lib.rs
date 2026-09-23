mod provenance;mod optics;mod thermal;mod electrical;mod hydronics;mod fenestration;mod degradation;mod finance;
pub use provenance::*;pub use optics::*;pub use thermal::*;
use wasm_bindgen::prelude::*;
#[wasm_bindgen] pub fn calculate_u_factor_wasm(center:f64,frame:f64,frame_fraction:f64)->String{console_error_panic_hook::set_once();serde_json::to_string(&thermal::u_factor(center,frame,frame_fraction)).unwrap()}
#[wasm_bindgen] pub fn run_monte_carlo_wasm(rays:usize,n_core:f64,n_clad:f64,thickness:f64,length:f64)->String{serde_json::to_string(&optics::run_monte_carlo_tracer(rays,n_core,n_clad,thickness,length)).unwrap()}
#[wasm_bindgen] pub fn calculate_full_system_wasm(input_json:&str)->String{console_error_panic_hook::set_once();let v:serde_json::Value=serde_json::from_str(input_json).unwrap_or_default();let u=thermal::u_factor(v["center_u"].as_f64().unwrap_or(1.2),v["frame_u"].as_f64().unwrap_or(2.5),v["frame_fraction"].as_f64().unwrap_or(0.15));serde_json::to_string(&AuditDAG::new(vec![u],"external".into())).unwrap()}
