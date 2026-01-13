/**
 * @file ag-grid-matrix-table-power/index.tsx
 *
 * @purpose
 * Power 전용 AG Grid 기반의 매트릭스 테이블 컴포넌트입니다.
 * 10개의 행 (Power 메트릭) × DoE당 4개의 컬럼 (Internal, Switching, Leakage, Total)으로 구성됩니다.
 * 각 DoE는 계층형 컬럼 그룹으로 표시됩니다.
 *
 * @structure
 * 1. AgGridPowerTable: 메인 컴포넌트
 * 2. 툴바: 행 높이, 텍스트 정렬, 소수점 자리수 조정
 * 3. 클립보드 복사 기능
 *
 * @dependencies
 * - ag-grid-react: AG Grid React 컴포넌트
 * - ag-grid-community: AG Grid 코어 모듈
 * - @/store: Redux hooks
 * - ./Toolbar: 툴바 컴포넌트
 * - ./columns: 컬럼 정의 빌더
 * - ./hooks: 커스텀 훅들
 */

"use client";

import { useMemo, useCallback, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  AllCommunityModule,
  ModuleRegistry,
  type GridApi,
} from "ag-grid-community";
import { useAppSelector } from "@/store";
import { PowerToolbar } from "./Toolbar";
import {
  ROW_HEIGHT_CONFIG,
  type RowHeightOption,
  type TextAlignOption,
} from "./constants";
import type { PowerRowData, PowerUnit } from "./types";
import { buildPowerColumnDefs } from "./columns";
import { useSelectionHandlers, useRowClasses } from "./hooks";
import { POWER_COLUMN_NAMES } from "@/variables/defaultPowerMatrixTemplate";

// AG Grid 모듈 등록
ModuleRegistry.registerModules([AllCommunityModule]);

export default function AgGridPowerTable() {
  const gridRef = useRef<AgGridReact<PowerRowData>>(null);
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const { rowHeaders } = useAppSelector((state) => state.powerMatrix);
  const powerDoeGroups = useAppSelector((state) => state.powerMatrix.doeGroups);
  const doeRegistry = useAppSelector((state) => state.doeRegistry);

  // [FIX] Enrich doeGroups with metadata from doeRegistry
  // PowerDoeGroup만으로는 PROJECT_NAME 등의 메타데이터가 없어서 컬럼 헤더 생성 시 문제 발생
  const doeGroups = useMemo(() => {
    return powerDoeGroups.map((doeGroup) => {
      const metadata = doeRegistry.byId[doeGroup.id] || {};
      return {
        ...doeGroup,
        PROJECT_NAME: metadata.PROJECT_NAME,
        BLOCK: metadata.BLOCK,
        NET_VER: metadata.NET_VER,
        REVISION: metadata.REVISION,
        ECO_NUM: metadata.ECO_NUM,
        POWER_SCENARIO: metadata.POWER_SCENARIO,
        AVAILABLE_SCENARIOS: metadata.AVAILABLE_SCENARIOS,
      };
    });
  }, [powerDoeGroups, doeRegistry]);

  const [copied, setCopied] = useState(false);
  const [rowHeightOption, setRowHeightOption] =
    useState<RowHeightOption>("normal");
  const [textAlignOption, setTextAlignOption] =
    useState<TextAlignOption>("right");
  const [decimalPlaces, setDecimalPlaces] = useState<number>(3);
  const [powerUnit, setPowerUnit] = useState<PowerUnit>("mW");

  // 단위 변환 배수: API 값은 W이므로, mW일 때 1000을 곱함
  const unitMultiplier = powerUnit === "mW" ? 1000 : 1;

  const currentRowHeight = ROW_HEIGHT_CONFIG[rowHeightOption].height;

  const handleRowHeightChange = useCallback((option: RowHeightOption) => {
    setRowHeightOption(option);
    const api = gridRef.current?.api as GridApi<PowerRowData> | undefined;
    if (api) {
      const newHeight = ROW_HEIGHT_CONFIG[option].height;
      api.setGridOption("rowHeight", newHeight);
      api.resetRowHeights();
      api.redrawRows();
    }
  }, []);

  const handleTextAlignChange = useCallback((option: TextAlignOption) => {
    setTextAlignOption(option);
    const api = gridRef.current?.api as GridApi<PowerRowData> | undefined;
    api?.refreshCells({ force: true });
  }, []);

  const handleDecimalIncrease = useCallback(() => {
    setDecimalPlaces((prev) => Math.min(prev + 1, 10));
    const api = gridRef.current?.api as GridApi<PowerRowData> | undefined;
    api?.refreshCells({ force: true });
  }, []);

  const handleDecimalDecrease = useCallback(() => {
    setDecimalPlaces((prev) => Math.max(prev - 1, 0));
    const api = gridRef.current?.api as GridApi<PowerRowData> | undefined;
    api?.refreshCells({ force: true });
  }, []);

  const handlePowerUnitChange = useCallback((unit: PowerUnit) => {
    setPowerUnit(unit);
    const api = gridRef.current?.api as GridApi<PowerRowData> | undefined;
    api?.refreshCells({ force: true });
  }, []);

  const handleCopyToClipboard = useCallback(async () => {
    try {
      const api = gridRef.current?.api as GridApi<PowerRowData> | undefined;
      if (!api) return;

      // Format helper function (1000 곱한 후 decimal 적용)
      const formatPowerValue = (value: unknown): string => {
        if (value === null || value === undefined || value === "") return "";
        if (value === "___LOADING___") return "";
        const num = parseFloat(String(value));
        if (isNaN(num)) return String(value);
        // 먼저 1000을 곱하고 (mW인 경우), 그 후에 decimal 적용
        const converted = num * unitMultiplier;
        return converted.toFixed(decimalPlaces);
      };

      // Build headers: Power(단위) + DoE group columns
      const powerHeaderLabel = `Power(${powerUnit})`;
      const headers = [powerHeaderLabel];
      const doeDataArray: Array<[string, string]> = [];

      doeGroups.forEach((doeGroup) => {
        POWER_COLUMN_NAMES.forEach((colName) => {
          headers.push(`${doeGroup.label} - ${colName}`);
          doeDataArray.push([doeGroup.id, colName]);
        });
      });

      // Build data rows
      const displayedRows: PowerRowData[] = [];
      api.forEachNodeAfterFilterAndSort((node) => {
        if (node.data) displayedRows.push(node.data);
      });

      const dataRows = displayedRows.map((row) => {
        const originalRow = rowHeaders.find((r) => r.id === row.id);
        if (!originalRow) return "";

        const rowValues = [originalRow.label];
        doeGroups.forEach((doeGroup) => {
          POWER_COLUMN_NAMES.forEach((colName) => {
            const columnId = `${doeGroup.id}_${colName}`;
            const rawValue = originalRow.data[columnId];
            rowValues.push(formatPowerValue(rawValue));
          });
        });
        return rowValues.join("\t");
      });

      const tsvContent = [headers.join("\t"), ...dataRows].join("\n");

      // 5. HTML 형식 생성
      const generateHtmlTable = (): string => {
        const htmlRows: string[] = [];
        // 공통 border 스타일: 웹용 CSS + Excel용 MSO 속성
        const borderStyle =
          "border: .5pt solid black; mso-border-alt: solid black .5pt;";

        // 헤더 행 (DoE 그룹)
        let headerHtml =
          '<tr style="background-color: #e3f2fd; font-weight: bold; text-align: center;">';
        headerHtml += `<th style="padding: 8px; font-weight: bold; background-color: #e8f5e9; vertical-align: middle; ${borderStyle}" rowspan="2">${powerHeaderLabel}</th>`;
        for (const doeGroup of doeGroups) {
          headerHtml += `<th style="padding: 8px; font-weight: bold; text-align: center; ${borderStyle}" colspan="4">${doeGroup.label}</th>`;
        }
        headerHtml += "</tr>";
        htmlRows.push(headerHtml);

        // 서브 헤더 행 (컬럼명)
        let subHeaderHtml =
          '<tr style="background-color: #e3f2fd; font-weight: bold; text-align: center;">';
        for (let i = 0; i < doeDataArray.length; i++) {
          const colName = doeDataArray[i][1];
          subHeaderHtml += `<th style="padding: 8px; font-weight: bold; text-align: center; ${borderStyle}">${colName}</th>`;
        }
        subHeaderHtml += "</tr>";
        htmlRows.push(subHeaderHtml);

        // 데이터 행들
        for (const row of displayedRows) {
          const originalRow = rowHeaders.find((r) => r.id === row.id);
          if (!originalRow) continue;

          let rowHtml = '<tr style="text-align: right;">';
          rowHtml += `<td style="padding: 8px; text-align: left; font-weight: 500; background-color: #e8f5e9; ${borderStyle}">${originalRow.label}</td>`;

          for (const [doeId, colName] of doeDataArray) {
            const columnId = `${doeId}_${colName}`;
            const rawValue = originalRow.data[columnId];
            const formattedValue = formatPowerValue(rawValue);
            rowHtml += `<td style="padding: 8px; text-align: right; ${borderStyle}">${formattedValue}</td>`;
          }

          rowHtml += "</tr>";
          htmlRows.push(rowHtml);
        }

        return `<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"><style>table { border-collapse: collapse; } td, th { border: .5pt solid black; mso-border-alt: solid black .5pt; }</style></head><body><table cellpadding="8" cellspacing="0" style="font-family: Arial, sans-serif; font-size: 12px;">${htmlRows.join(
          ""
        )}</table></body></html>`;
      };

      const htmlContent = generateHtmlTable();

      // 6. 클립보드에 HTML + TSV 형식으로 복사
      try {
        const blob = new Blob([htmlContent], { type: "text/html" });
        const data = [
          new ClipboardItem({
            "text/html": blob,
            "text/plain": new Blob([tsvContent], { type: "text/plain" }),
          }),
        ];
        await navigator.clipboard.write(data);
      } catch {
        // 다중 형식 미지원시 TSV만 복사
        await navigator.clipboard.writeText(tsvContent);
      }

      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Failed to copy table data: ", err);
    }
  }, [doeGroups, rowHeaders, decimalPlaces, unitMultiplier]);

  // Transform rowHeaders to PowerRowData format (단위 변환 적용)
  const rowData: PowerRowData[] = useMemo(() => {
    return rowHeaders.map((row) => {
      // 각 데이터 값에 단위 변환 적용
      const convertedData: Record<string, string | number> = {};
      for (const key in row.data) {
        const value = row.data[key];
        if (value === null || value === undefined || value === "") {
          convertedData[key] = "";
        } else if (value === "___LOADING___") {
          convertedData[key] = "___LOADING___";
        } else {
          const num = parseFloat(String(value));
          if (!isNaN(num)) {
            convertedData[key] = num * unitMultiplier;
          } else {
            convertedData[key] = String(value);
          }
        }
      }
      return {
        id: row.id,
        rowHeader: row.label,
        rowKey: row.rowKey,
        ...convertedData,
      };
    });
  }, [rowHeaders, unitMultiplier]);

  const { onCellClicked } = useSelectionHandlers(gridRef);
  const { getRowClass } = useRowClasses();

  // Build column definitions with DoE group hierarchy
  const columnDefs = useMemo(
    () =>
      buildPowerColumnDefs({
        doeGroups,
        textAlignOption,
        decimalPlaces,
        powerUnit,
      }),
    [doeGroups, textAlignOption, decimalPlaces, powerUnit]
  );

  const defaultColDef = useMemo(
    () => ({
      resizable: true,
      sortable: false,
      filter: false,
    }),
    []
  );

  // 그룹 헤더 기본 설정 (중앙 정렬)
  const defaultColGroupDef = useMemo(
    () => ({
      headerClass: "ag-header-group-center-text",
    }),
    []
  );

  return (
    <div
      ref={gridContainerRef}
      className="flex flex-col h-full w-full overflow-hidden"
    >
      {/* Toolbar */}
      <div className="flex-shrink-0 p-2 border-b">
        <PowerToolbar
          rowHeightOption={rowHeightOption}
          onRowHeightChange={handleRowHeightChange}
          textAlignOption={textAlignOption}
          onTextAlignChange={handleTextAlignChange}
          decimalPlaces={decimalPlaces}
          onIncreaseDecimal={handleDecimalIncrease}
          onDecreaseDecimal={handleDecimalDecrease}
          powerUnit={powerUnit}
          onPowerUnitChange={handlePowerUnitChange}
          copied={copied}
          onCopy={handleCopyToClipboard}
        />
      </div>

      {/* AG Grid */}
      <div className="flex-1 ag-theme-quartz">
        <AgGridReact<PowerRowData>
          ref={gridRef}
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          defaultColGroupDef={defaultColGroupDef}
          rowHeight={currentRowHeight}
          headerHeight={32}
          groupHeaderHeight={32}
          rowSelection="multiple"
          suppressRowClickSelection={true}
          onCellClicked={onCellClicked}
          getRowClass={getRowClass}
          animateRows={true}
          suppressMovableColumns={false}
          suppressColumnMoveAnimation={false}
        />
      </div>
    </div>
  );
}
