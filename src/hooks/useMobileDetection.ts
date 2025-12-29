/**
 * @file useMobileDetection.ts
 *
 * @purpose
 * 모바일 디바이스 감지를 위한 커스텀 훅입니다.
 * 미디어 쿼리를 통해 뷰포트 크기를 모니터링합니다.
 *
 * @structure
 * 1. MOBILE_BREAKPOINT: 모바일 판단 기준 픽셀
 * 2. useIsMobile: 모바일 여부 반환 훅
 *
 * @dependencies
 * - React
 */

import * as React from "react";

/** 모바일 디바이스 판단 기준 픽셀 */
const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
    undefined
  );

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}
