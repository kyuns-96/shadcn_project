/**
 * @file fixtures.ts
 * 
 * @purpose
 * Synthetic test data for MSW handlers in E2E tests.
 * Data structures match EXACT response shapes from API files.
 * 
 * @structure
 * - List endpoints: project, block, netver, revision, econum, function, method
 * - Dataset endpoints: ptpxpower, timing_summary, layoutcellusage/syncellusage
 * 
 * @dependencies
 * - Used by src/mocks/handlers.ts
 */

// ============================================================
// List Endpoints - Simple string arrays
// ============================================================

export const mockProjectList = {
  project_list: ['TestProject1', 'TestProject2', 'TestProject3'],
};

export const mockBlockList = {
  block_list: ['BlockA', 'BlockB', 'BlockC'],
};

export const mockNetverList = {
  netver_list: ['v1.0', 'v2.0', 'v3.0'],
};

export const mockRevisionList = {
  revision_list: ['rev1', 'rev2', 'rev3'],
};

export const mockEconumList = {
  econum_list: ['ECO001', 'ECO002', 'ECO003'],
};

/**
 * Function list - CRITICAL: Only include endpoints we have handlers for
 * Format: Record<string, { method: string; path: string }[]>
 * 
 * Excludes "Info" and "Version Info" (filtered by datasetReducer.ts)
 */
export const mockFunctionList = {
  'Power': [
    { method: 'POST', path: '/api/get_ptpxpower' },
  ],
  'Timing': [
    { method: 'POST', path: '/api/get_timing_summary' },
  ],
  'Layout': [
    { method: 'POST', path: '/api/get_layoutcellusage' },
  ],
};

export const mockMethodList = {
  method_list: ['PRE', 'POST'],
};

// ============================================================
// Dataset Endpoints - Complex nested structures
// ============================================================

/**
 * Power data structure
 * Path: ptpxpower_data.${SCENARIO}.${PowerType}.${Component}
 * 
 * Scenario names contain dots: "tt_0.85v_25c"
 * Power types: Internal_power, Switching_power, Leakage_power, Total_power
 * Components: clock_network, register, combinational, sequential, memory, 
 *             io_pad, black_box, decap, power_switch, Total
 */
export const mockPtpxPowerData = {
  ptpxpower_data: {
    'tt_0.85v_25c': {
      Internal_power: {
        clock_network: 12.5,
        register: 8.3,
        combinational: 15.2,
        sequential: 6.7,
        memory: 22.1,
        io_pad: 3.4,
        black_box: 1.2,
        decap: 0.5,
        power_switch: 0.8,
        Total: 70.7,
      },
      Switching_power: {
        clock_network: 5.1,
        register: 2.1,
        combinational: 7.8,
        sequential: 3.2,
        memory: 9.5,
        io_pad: 1.8,
        black_box: 0.6,
        decap: 0.2,
        power_switch: 0.3,
        Total: 30.6,
      },
      Leakage_power: {
        clock_network: 1.2,
        register: 0.8,
        combinational: 2.5,
        sequential: 1.1,
        memory: 4.3,
        io_pad: 0.7,
        black_box: 0.3,
        decap: 0.1,
        power_switch: 0.2,
        Total: 11.2,
      },
      Total_power: {
        clock_network: 18.8,
        register: 11.2,
        combinational: 25.5,
        sequential: 11.0,
        memory: 35.9,
        io_pad: 5.9,
        black_box: 2.1,
        decap: 0.8,
        power_switch: 1.3,
        Total: 112.5,
      },
    },
    'ss_0.75v_125c': {
      Internal_power: {
        clock_network: 10.2,
        register: 6.8,
        combinational: 12.5,
        sequential: 5.5,
        memory: 18.2,
        io_pad: 2.8,
        black_box: 1.0,
        decap: 0.4,
        power_switch: 0.7,
        Total: 58.1,
      },
      Switching_power: {
        clock_network: 4.2,
        register: 1.7,
        combinational: 6.4,
        sequential: 2.6,
        memory: 7.8,
        io_pad: 1.5,
        black_box: 0.5,
        decap: 0.2,
        power_switch: 0.2,
        Total: 25.1,
      },
      Leakage_power: {
        clock_network: 2.5,
        register: 1.6,
        combinational: 5.0,
        sequential: 2.2,
        memory: 8.6,
        io_pad: 1.4,
        black_box: 0.6,
        decap: 0.2,
        power_switch: 0.4,
        Total: 22.5,
      },
      Total_power: {
        clock_network: 16.9,
        register: 10.1,
        combinational: 23.9,
        sequential: 10.3,
        memory: 34.6,
        io_pad: 5.7,
        black_box: 2.1,
        decap: 0.8,
        power_switch: 1.3,
        Total: 105.7,
      },
    },
  },
};

/**
 * Timing data structure
 * Path: timing_summary_data.${SCENARIO}.${TimingGroup}.${Metric}
 * 
 * Timing groups: setup(r2r), hold(r2r), clock_mttv, data_mttv, max_cap, cpc, gnoise
 * Metrics: WNS, TNS, NVP
 */
export const mockTimingSummaryData = {
  timing_summary_data: {
    'tt_0.85v_25c': {
      'setup(r2r)': {
        WNS: 0.125,
        TNS: 0.0,
        NVP: 0,
      },
      'hold(r2r)': {
        WNS: 0.085,
        TNS: 0.0,
        NVP: 0,
      },
      clock_mttv: {
        WNS: 0.250,
        TNS: 0.0,
        NVP: 0,
      },
      data_mttv: {
        WNS: 0.180,
        TNS: 0.0,
        NVP: 0,
      },
      max_cap: {
        WNS: 0.050,
        TNS: 0.0,
        NVP: 0,
      },
      cpc: {
        WNS: 0.100,
        TNS: 0.0,
        NVP: 0,
      },
      gnoise: {
        WNS: 0.075,
        TNS: 0.0,
        NVP: 0,
      },
    },
    'ss_0.75v_125c': {
      'setup(r2r)': {
        WNS: -0.025,
        TNS: -1.5,
        NVP: 12,
      },
      'hold(r2r)': {
        WNS: 0.065,
        TNS: 0.0,
        NVP: 0,
      },
      clock_mttv: {
        WNS: 0.200,
        TNS: 0.0,
        NVP: 0,
      },
      data_mttv: {
        WNS: 0.150,
        TNS: 0.0,
        NVP: 0,
      },
      max_cap: {
        WNS: 0.040,
        TNS: 0.0,
        NVP: 0,
      },
      cpc: {
        WNS: 0.080,
        TNS: 0.0,
        NVP: 0,
      },
      gnoise: {
        WNS: 0.060,
        TNS: 0.0,
        NVP: 0,
      },
    },
  },
};

/**
 * Layout data structure (Cell Usage)
 * Path: layoutcellusage_data.${Field}
 * 
 * Fields: GATE_COUNT_*, AREA_*, VTH_RATIO_*
 * Used for both /api/get_layoutcellusage (POST mode) and /api/get_syncellusage (PRE mode)
 */
export const mockLayoutData = {
  layoutcellusage_data: {
    // Gate Count metrics
    GATE_COUNT_MEMORY: 125000,
    GATE_COUNT_SEQUENTIAL: 85000,
    GATE_COUNT_COMBINATIONAL: 320000,
    GATE_COUNT_HM: 15000,
    GATE_COUNT_IO: 2500,
    GATE_COUNT_TOTAL: 547500,
    
    // Area metrics (um^2)
    AREA_MEMORY: 1250000.5,
    AREA_SEQUENTIAL: 425000.3,
    AREA_COMBINATIONAL: 960000.7,
    AREA_HM: 75000.2,
    AREA_IO: 12500.1,
    AREA_TOTAL: 2722501.8,
    
    // VTH Ratio metrics (percentages)
    VTH_RATIO_LVT: 35.5,
    VTH_RATIO_LVT_LLP: 12.3,
    VTH_RATIO_HVT: 28.7,
    VTH_RATIO_HVT_LLP: 8.9,
    VTH_RATIO_RVT: 10.2,
    VTH_RATIO_RVT_LLP: 4.4,
  },
};

/**
 * Physical Info data structure
 * Path: layoutpnrdrcsummary_data.${INPUT_DATE}.DATA
 * 
 * Used for DRCs and Short metrics
 */
export const mockPhysicalInfoData = {
  layoutpnrdrcsummary_data: {
    '2026-01-29': {
      DATA: [
        {
          TYPE: '@@@@@@@ TOTAL VIOLATIONS',
          VALUE: 42,
        },
        {
          TYPE: 'Short',
          VALUE: 3,
        },
      ],
    },
  },
};

/**
 * Layout Wiring Total data structure
 * Path: layoutwiringtotal_data.${INPUT_DATE}.DATA[0].WIRE
 */
export const mockLayoutWiringTotalData = {
  layoutwiringtotal_data: {
    '2026-01-29': {
      DATA: [
        {
          WIRE: 1250000.75,
        },
      ],
    },
  },
};

/**
 * Layout Runtime data structure
 * Path: layoutruntime_data.RUNTIME
 */
export const mockLayoutRuntimeData = {
  layoutruntime_data: {
    RUNTIME: 3600.5,
  },
};

/**
 * Formality data structure
 * Path: formality_data
 * 
 * Used for R2N, R2UPF, N2N, N2UPF metrics
 */
export const mockFormalityData = {
  formality_data: [
    {
      TYPE: 'R2N',
      RESULT: 'PASS',
      DATE: '2026-01-29',
    },
    {
      TYPE: 'R2UPF',
      RESULT: 'PASS',
      DATE: '2026-01-29',
    },
    {
      TYPE: 'N2N',
      RESULT: 'PASS',
      DATE: '2026-01-29',
    },
    {
      TYPE: 'N2UPF',
      RESULT: 'PASS',
      DATE: '2026-01-29',
    },
  ],
};
