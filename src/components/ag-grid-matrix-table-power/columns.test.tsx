
import { describe, it, expect } from "vitest";
import { buildPowerColumnDefs } from "./columns";
import type { PowerDecimalMap } from "@/components/ag-grid-matrix-table/decimalDefaults";
import type { PowerRowData, DoeColumnGroup } from "./types";
import { POWER_DEFAULT_DECIMALS } from "@/components/ag-grid-matrix-table/decimalDefaults";
import type { ValueFormatterParams, ColGroupDef, ColDef } from "ag-grid-community";

const MOCK_DECIMALS: PowerDecimalMap = {
  ...POWER_DEFAULT_DECIMALS,
  clock_network: 2,
  total: 5,
};

const mockDoeGroup: DoeColumnGroup = {
  id: "doe1",
  label: "DoE 1",
};

describe("Power table columns configuration", () => {
  it("should apply per-row decimal formatting", () => {
    const colDefs = buildPowerColumnDefs({
      doeGroups: [mockDoeGroup],
      textAlignOption: "right",
      decimalPlaces: MOCK_DECIMALS,
    });

    const doeGroupCol = colDefs[1] as ColGroupDef<PowerRowData>;
    const internalCol = doeGroupCol.children[0] as ColDef<PowerRowData>;
    
    expect(internalCol).toBeDefined();
    
    const valueFormatter = internalCol.valueFormatter;
    expect(valueFormatter).toBeDefined();

    if (typeof valueFormatter !== 'function') {
      throw new Error("valueFormatter is not a function");
    }

    const paramsClock = {
      value: 123.456789,
      data: { rowKey: "clock_network" } as PowerRowData,
    } as ValueFormatterParams<PowerRowData, number>;
    
    expect(valueFormatter(paramsClock)).toBe("123.46");

    const paramsTotal = {
      value: 123.456789,
      data: { rowKey: "total" } as PowerRowData,
    } as ValueFormatterParams<PowerRowData, number>;
    expect(valueFormatter(paramsTotal)).toBe("123.45679");

    const decimalsMissingTotal: Record<string, number> = { ...MOCK_DECIMALS };
    delete decimalsMissingTotal.total;

    const colDefsMissingTotal = buildPowerColumnDefs({
      doeGroups: [mockDoeGroup],
      textAlignOption: "right",
      decimalPlaces: decimalsMissingTotal as unknown as PowerDecimalMap,
    });

    const doeGroupColMissingTotal = colDefsMissingTotal[1] as ColGroupDef<PowerRowData>;
    const internalColMissingTotal = doeGroupColMissingTotal.children[0] as ColDef<PowerRowData>;

    const valueFormatterMissingTotal = internalColMissingTotal.valueFormatter;
    expect(valueFormatterMissingTotal).toBeDefined();

    if (typeof valueFormatterMissingTotal !== "function") {
      throw new Error("valueFormatter is not a function");
    }

    const paramsTotalMissing = {
      value: 123.456789,
      data: { rowKey: "total" } as PowerRowData,
    } as ValueFormatterParams<PowerRowData, number>;

    expect(valueFormatterMissingTotal(paramsTotalMissing)).toBe("123.457");
  });
});
