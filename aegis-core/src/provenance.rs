use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::BTreeMap;

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum VerificationStatus { Calculated, Modeled, Measured, Estimated, UserSupplied, NotAssessed }

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct CalcResult {
 pub calc_id:String, pub calc_version:String, pub quantity:String, pub value:f64, pub unit:String, pub equation:String,
 pub inputs:BTreeMap<String,f64>, pub intermediates:BTreeMap<String,f64>, pub assumptions:Vec<String>, pub source:String,
 pub source_revision:String, pub verification_status:VerificationStatus, pub uncertainty:Option<f64>, pub validity_domain:String,
 pub warnings:Vec<String>, pub upstream_calculations:Vec<String>,
}
impl CalcResult {
 pub fn new(quantity:&str,value:f64,unit:&str,equation:&str,inputs:BTreeMap<String,f64>,status:VerificationStatus)->Self {
  let mut x=Self{calc_id:String::new(),calc_version:"1.0.0".into(),quantity:quantity.into(),value,unit:unit.into(),equation:equation.into(),inputs,intermediates:BTreeMap::new(),assumptions:vec![],source:"aegis-core".into(),source_revision:"1".into(),verification_status:status,uncertainty:None,validity_domain:"engineering screening domain".into(),warnings:vec![],upstream_calculations:vec![]}; x.calc_id=x.compute_id(); x
 }
 pub fn compute_id(&self)->String { let mut c=self.clone(); c.calc_id.clear(); let bytes=serde_json::to_vec(&c).expect("serializable"); hex(&Sha256::digest(bytes)) }
}
fn hex(bytes:&[u8])->String { bytes.iter().map(|b|format!("{b:02x}")).collect() }
#[derive(Clone,Debug,Serialize,Deserialize)]
pub struct AuditDAG { pub schema_version:String, pub timestamp:String, pub dag_master_hash:String, pub nodes:Vec<CalcResult>, pub metadata:BTreeMap<String,String> }
impl AuditDAG { pub fn new(nodes:Vec<CalcResult>,timestamp:String)->Self { let mut d=Self{schema_version:"1.0".into(),timestamp,dag_master_hash:String::new(),nodes,metadata:BTreeMap::new()}; d.dag_master_hash=d.compute_master_hash(); d }
 pub fn compute_master_hash(&self)->String { let mut ids:Vec<&str>=self.nodes.iter().map(|n|n.calc_id.as_str()).collect(); ids.sort_unstable(); hex(&Sha256::digest(ids.join("").as_bytes())) }
}
