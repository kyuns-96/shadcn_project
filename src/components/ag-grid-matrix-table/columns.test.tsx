import { describe, it, expect } from "vitest";
import { buildColumnDefs } from "./columns";
import type { ValueFormatterParams } from "ag-grid-community";

// Mock helpers if needed, but we can probably use the real one if it's pure
// The real getMetricFormatStrategy is pure and exported from @/variables/helpers
// We need to make sure we understand what it returns for our test cases.

describe("QoR valueFormatter with per-group decimals", () => {
  type BuildColumnDefsArgs = Parameters<typeof buildColumnDefs>[0];

  // Mock data for buildColumnDefs
  const mockArgs: BuildColumnDefsArgs = {
    columnHeaders: [{ id: "col1", label: "Column 1" }],
    groupColumnWidth: 100,
    rowHeaderColumnWidth: 100,
    textAlignOption: "right" as const,
    decimalPlaces: {
      "Area(G/C)": 2,
      "Power(mW)": 3,
      "Physical Info": 0,
      "Formality": 0,
    },
    rowGroupRowSpan: () => 1,
    rowGroupCellClass: undefined,
    isFirstOfGroupFromApi: () => true,
  };

  const getValueFormatter = () => {
    const colDefs = buildColumnDefs(mockArgs);
    const dataCol = colDefs.find((col) => col.field === "col1");
    if (!dataCol || !dataCol.valueFormatter) {
      throw new Error("valueFormatter not found for col1");
    }
    return dataCol.valueFormatter as (params: ValueFormatterParams) => string;
  };

  it("formats Area(G/C) with 2 decimals", () => {
    const formatter = getValueFormatter();
    const params = {
      value: 1.23456,
      data: { rowGroup: "Area(G/C)", rowHeader: "some_area" },
    } as unknown as ValueFormatterParams;

    expect(formatter(params)).toBe("1.23");
  });

  it("formats Power(mW) with 3 decimals", () => {
    const formatter = getValueFormatter();
    const params = {
      value: 1.23456,
      data: { rowGroup: "Power(mW)", rowHeader: "Total" },
    } as unknown as ValueFormatterParams;

    expect(formatter(params)).toBe("1.235");
  });

  it("ignores decimal setting for string-only metrics (Formality)", () => {
    const formatter = getValueFormatter();
    const params = {
      value: "Clean",
      data: { rowGroup: "Formality", rowHeader: "Status" },
    } as unknown as ValueFormatterParams;

    expect(formatter(params)).toBe("Clean");
  });

  it("ignores decimal setting for string-only metrics (ECO Runtime)", () => {
    const formatter = getValueFormatter();
    const params = {
      value: "01:23:45",
      data: { rowGroup: "Physical Info", rowHeader: "ECO Runtime" },
    } as unknown as ValueFormatterParams;

    expect(formatter(params)).toBe("01:23:45");
  });

  it("applies decimal to Physical Info when decimal setting > 0", () => {
    const argsWithDecimals = {
      ...mockArgs,
      decimalPlaces: {
        ...mockArgs.decimalPlaces,
        "Physical Info": 2,
      },
    };
    
    const colDefs = buildColumnDefs(argsWithDecimals);
    const dataCol = colDefs.find((col) => col.field === "col1");
    const formatter = dataCol!.valueFormatter! as (params: ValueFormatterParams) => string;

    const params = {
      value: 1234.5678,
      data: { rowGroup: "Physical Info", rowHeader: "Wire Length" },
    } as unknown as ValueFormatterParams;

    expect(formatter(params)).toBe("1234.57");
  });

  it("uses integer for Physical Info when decimal setting is 0", () => {
    const formatter = getValueFormatter();
    const params = {
      value: 1234.5678,
      data: { rowGroup: "Physical Info", rowHeader: "Wire Length" },
    } as unknown as ValueFormatterParams;

    expect(formatter(params)).toBe("1234");
  });

  it("handles fallback to default 2 decimals if group not in map", () => {
    const formatter = getValueFormatter();
    const params = {
      value: 9.87654,
      data: { rowGroup: "Unknown Group", rowHeader: "Item" },
    } as unknown as ValueFormatterParams;

    expect(formatter(params)).toBe("9.88");
  });
});
