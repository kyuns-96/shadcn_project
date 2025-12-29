/**
 * @file PowerPage.tsx
 *
 * @purpose
 * 전력 분석 페이지 플레이스홀더입니다.
 * 향후 전력 분석 기능이 구현될 예정입니다.
 *
 * @dependencies
 * - lucide-react: 아이콘
 */

import { ZapIcon } from "lucide-react";

/** 전력 페이지 컴포넌트 */
const PowerPage = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-muted-foreground">
      <ZapIcon className="size-16 mb-4 opacity-50" />
      <h2 className="text-2xl font-semibold mb-2">Power</h2>
      <p className="text-sm">Power analysis page coming soon...</p>
    </div>
  );
};

export default PowerPage;
