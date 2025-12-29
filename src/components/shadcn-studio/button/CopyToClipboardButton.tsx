/**
 * @file CopyToClipboardButton.tsx
 *
 * @purpose
 * 클립보드 복사 기능을 제공하는 버튼 컴포넌트 데모입니다.
 * 복사 성공 시 시각적 피드백을 제공합니다.
 *
 * @structure
 * 1. CopyToClipboardButton: 복사 버튼 컴포넌트 (상태 애니메이션 포함)
 *
 * @dependencies
 * - lucide-react: 아이콘
 * - @/components/ui/button: 버튼 UI
 * - @/lib/utils: cn 유틸리티
 */

import { useState } from "react";
import { CheckIcon, CopyIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** 복사 성공 표시 지속 시간 (ms) */
const COPY_SUCCESS_DISPLAY_DURATION = 1500;

/** 복사할 기본 텍스트 */
const DEFAULT_COPY_TEXT = "Thank you for using Shadcn Studio!";

/**
 * 클립보드 복사 버튼 컴포넌트
 *
 * 클릭 시 미리 정의된 텍스트를 클립보드에 복사하고
 * 복사 성공 상태를 애니메이션으로 표시합니다.
 */
const CopyToClipboardButton = () => {
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const handleCopyClick = async () => {
    try {
      await navigator.clipboard.writeText(DEFAULT_COPY_TEXT);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), COPY_SUCCESS_DISPLAY_DURATION);
    } catch (error) {
      console.error("Failed to copy text:", error);
    }
  };

  return (
    <Button
      variant="outline"
      className="relative disabled:opacity-100"
      onClick={handleCopyClick}
      disabled={isCopied}
    >
      <span
        className={cn(
          "transition-all",
          isCopied ? "scale-100 opacity-100" : "scale-0 opacity-0"
        )}
      >
        <CheckIcon className="stroke-green-600 dark:stroke-green-400" />
      </span>
      <span
        className={cn(
          "absolute left-4 transition-all",
          isCopied ? "scale-0 opacity-0" : "scale-100 opacity-100"
        )}
      >
        <CopyIcon />
      </span>
      {isCopied ? "Copied!" : "Copy"}
    </Button>
  );
};

export default CopyToClipboardButton;
