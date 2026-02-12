/**
 * @file ag-grid-matrix-table/decimalDefaults.ts
 *
 * @purpose
 * Default decimal precision values for all 3 matrix tables (QoR Compare, Power, Timing).
 * Provides smart defaults based on typical data precision requirements for each metric.
 *
 * @structure
 * 1. Type definitions: QorDecimalMap, PowerDecimalMap, TimingDecimalMap
 * 2. QOR_DEFAULT_DECIMALS: Record with 5 row group names as keys
 * 3. POWER_DEFAULT_DECIMALS: Record with 10 PowerRowKey values as keys
 * 4. TIMING_DEFAULT_DECIMALS: Record with 7 TimingColumnGroup values as keys
 *
 * @dependencies
 * - @/variables/defaultPowerMatrixTemplate: PowerRowKey type
 * - @/variables/defaultTimingMatrixTemplate: TimingColumnGroup type
 */

import type { PowerRowKey } from "@/variables/defaultPowerMatrixTemplate";
import type { TimingColumnGroup } from "@/variables/defaultTimingMatrixTemplate";

/**
 * Type alias for QoR decimal precision map.
 * Keys are exact row group names from defaultMatrixTemplate.
 */
export type QorDecimalMap = Record<string, number>;

/**
 * Type alias for Power decimal precision map.
 * Keys are PowerRowKey values (type-safe).
 */
export type PowerDecimalMap = Record<PowerRowKey, number>;

/**
 * Type alias for Timing decimal precision map.
 * Keys are TimingColumnGroup values (type-safe).
 */
export type TimingDecimalMap = Record<TimingColumnGroup, number>;

/**
 * QoR Compare table: Default decimal precision for each row group.
 * Smart defaults based on typical data precision needs:
 * - Area metrics: 2 decimals (usually sufficient for area values)
 * - VTH_RATIO: 2 decimals (ratio precision)
 * - Power: 3 decimals (power metrics need finer precision)
 * - Physical Info: 0 decimals (mostly integer counts and wire lengths)
 * - Formality: 0 decimals (check counts, no fractions)
 *
 * Keys must match EXACTLY with row group names in defaultMatrixTemplate.ts:51-81
 */
export const QOR_DEFAULT_DECIMALS: QorDecimalMap = {
  "Area(G/C)": 2,
  "VTH_RATIO(Area)": 2,
  "Power(mW)": 3,
  "Physical Info": 0,
  "Formality": 0,
};

/**
 * Power page table: Default decimal precision for each row (power type).
 * All power rows use 3 decimals as power metrics require finer precision.
 *
 * Keys are PowerRowKey values:
 * - clock_network, register, combinational, sequential, memory
 * - io_pad, black_box, decap, power_switch, total
 */
export const POWER_DEFAULT_DECIMALS: PowerDecimalMap = {
  clock_network: 3,
  register: 3,
  combinational: 3,
  sequential: 3,
  memory: 3,
  io_pad: 3,
  black_box: 3,
  decap: 3,
  power_switch: 3,
  total: 3,
};

/**
 * Timing page table: Default decimal precision for each column group.
 * All timing groups use 3 decimals as timing metrics require fine precision.
 *
 * Keys are TimingColumnGroup values:
 * - setup(r2r), hold(r2r), clock_mttv, data_mttv
 * - max_cap, cpc, gnoise
 */
export const TIMING_DEFAULT_DECIMALS: TimingDecimalMap = {
  "setup(r2r)": 3,
  "hold(r2r)": 3,
  clock_mttv: 3,
  data_mttv: 3,
  max_cap: 3,
  cpc: 3,
  gnoise: 3,
};
