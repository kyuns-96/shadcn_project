/**
 * @file EnvDataDialog.tsx
 *
 * @purpose
 * Power 페이지 DoE ENV 데이터 표시용 Dialog 컴포넌트입니다.
 * DoE Name 클릭 시 해당 시나리오의 ENV 데이터를 Key|Value 테이블로 표시합니다.
 *
 * @structure
 * 1. Dialog 컴포넌트 (shadcn Dialog 프리미티브 사용)
 * 2. ENV 데이터 Key|Value 테이블 (shadcn Table 사용)
 * 3. 빈 상태 처리 (시나리오 미선택, 데이터 없음)
 *
 * @dependencies
 * - @/components/ui/dialog: shadcn Dialog 컴포넌트
 * - @/components/ui/table: shadcn Table 컴포넌트
 * - @/lib/utils: cn() 유틸리티 함수
 */

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/** EnvDataDialog 컴포넌트 Props */
interface EnvDataDialogProps {
  /** Dialog 열림 상태 */
  open: boolean;
  /** Dialog 상태 변경 핸들러 */
  onOpenChange: (open: boolean) => void;
  /** DoE 이름 */
  doeName: string;
  /** 선택된 시나리오 이름 */
  scenario: string | undefined;
  /** ENV 데이터 (flat key-value pairs) */
  envData: Record<string, unknown> | undefined;
}

/**
 * Power 페이지 DoE ENV 데이터 표시용 Dialog
 *
 * DoE Name 클릭 시 해당 시나리오의 ENV 데이터를 Key|Value 테이블로 표시합니다.
 * 시나리오가 선택되지 않았거나 ENV 데이터가 없는 경우 안내 메시지를 표시합니다.
 */
const EnvDataDialog = ({
  open,
  onOpenChange,
  doeName,
  scenario,
  envData,
}: EnvDataDialogProps) => {
  const dialogTitle = scenario
    ? `ENV Data - ${doeName} - ${scenario}`
    : `ENV Data - ${doeName}`;

  const envEntries = envData ? Object.entries(envData) : [];
  const hasEnvData = envEntries.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>

        {!scenario && (
          <div className="text-center py-8 text-muted-foreground">
            시나리오를 먼저 선택해주세요
          </div>
        )}

        {scenario && !hasEnvData && (
          <div className="text-center py-8 text-muted-foreground">
            ENV 데이터가 없습니다
          </div>
        )}

        {scenario && hasEnvData && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Key</TableHead>
                  <TableHead className="w-[60%]">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {envEntries.map(([key, value]) => (
                  <TableRow key={key}>
                    <TableCell className="font-medium">{key}</TableCell>
                    <TableCell>{String(value)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EnvDataDialog;
