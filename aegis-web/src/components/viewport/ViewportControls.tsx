export type VerificationStatus =
  | 'CALCULATED'
  | 'MODELED'
  | 'MEASURED'
  | 'ESTIMATED'
  | 'USER_SUPPLIED'
  | 'NOT_ASSESSED';

export interface CalcResult {
  calc_id: string;
  calc_version: string;
  quantity: string;
  value: number;
  unit: string;
  equation: string;
  inputs: Record<string, number>;
  intermediates: Record<string, number>;
  assumptions: string[];
  source: string;
  source_revision: string;
  verification_status: VerificationStatus;
  uncertainty?: number | null;
  validity_domain: string;
  warnings: string[];
  upstream_calculations: string[];
}

export interface AuditDAG {
  schema_version: string;
  timestamp: string;
  dag_master_hash: string;
  nodes: CalcResult[];
  metadata: Record<string, string>;
}

export interface OpticalBounds {
  critical_angle_deg: number;
  trap_fraction: CalcResult;
  lsc_efficiency?: CalcResult | null;
}

export interface ThermalNetwork {
  center_u: number;
  frame_u: number;
  frame_fraction: number;
  system_u: number;
  cell_temperature_c: number;
}

export interface ElectricalState {
  conductor_resistance_ohm: number;
  mppt_efficiency: number;
  array_power_w: number;
}

export interface HydronicState {
  thermal_q_w: number;
  pump_p_w: number;
  delta_t_c: number;
}

export interface FinanceState {
  npv: number;
  irr: number;
  lcoe: number;
  payback_years: number;
}

export interface RaySegment {
  start: [number, number, number];
  end: [number, number, number];
  tir: boolean;
}

export interface WeatherState {
  zenith_deg: number;
  azimuth_deg: number;
  poa_w_m2: number;
  ambient_c: number;
}
