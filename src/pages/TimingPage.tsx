/**
 * @file TimingPage.tsx
 *
 * @purpose
 * 타이밍 분석 페이지 플레이스홀더입니다.
 * 향후 타이밍 분석 기능이 구현될 예정입니다.
 *
 * @dependencies
 * - lucide-react: 아이콘
 */

import { ClockIcon } from "lucide-react";

/** 타이밍 페이지 컴포넌트 */
const TimingPage = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-muted-foreground">
      <ClockIcon className="size-16 mb-4 opacity-50" />
      <h2 className="text-2xl font-semibold mb-2">Timing</h2>
      <p className="text-sm">Timing analysis page coming soon...</p>
    </div>
  );
};

export default TimingPage;
