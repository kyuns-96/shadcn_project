/**
 * @file LandingPage.tsx
 *
 * @purpose
 * 대시보드 랜딩 페이지입니다.
 * 4개의 핵심 기능 페이지로 이동할 수 있는 내비게이션 카드를 제공합니다.
 *
 * @structure
 * 1. CARD_CONFIG: 카드 설정 데이터
 * 2. LandingPage: 카드 그리드 렌더링 컴포넌트
 *
 * @dependencies
 * - lucide-react: 아이콘
 * - @/store: Redux 훅 및 액션
 */

import {
  CheckCircle2,
  GitCompareArrows,
  Clock,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { useAppDispatch, setCurrentPage, type PageType } from "@/store";

/** 카드 설정 타입 */
interface CardConfig {
  id: PageType;
  title: string;
  description: string;
  icon: LucideIcon;
  iconColor: string;
  bgColor: string;
  hoverBgColor: string;
}

/** 카드 설정 데이터 */
const CARD_CONFIG: CardConfig[] = [
  {
    id: "fc-check-tool",
    title: "FC Check Tool",
    description: "FC ",
    icon: CheckCircle2,
    iconColor: "text-emerald-500 dark:text-emerald-400",
    bgColor: "bg-slate-50 dark:bg-slate-900",
    hoverBgColor: "hover:bg-emerald-50 dark:hover:bg-slate-800",
  },
  {
    id: "qor-compare",
    title: "QOR Compare",
    description: "데이터 비교 및 분석",
    icon: GitCompareArrows,
    iconColor: "text-blue-500 dark:text-blue-400",
    bgColor: "bg-slate-50 dark:bg-slate-900",
    hoverBgColor: "hover:bg-blue-50 dark:hover:bg-slate-800",
  },
  {
    id: "timing",
    title: "Timing",
    description: "타이밍 분석 도구",
    icon: Clock,
    iconColor: "text-amber-500 dark:text-amber-400",
    bgColor: "bg-slate-50 dark:bg-slate-900",
    hoverBgColor: "hover:bg-amber-50 dark:hover:bg-slate-800",
  },
  {
    id: "power",
    title: "Power",
    description: "전력 분석 도구",
    icon: Zap,
    iconColor: "text-rose-500 dark:text-rose-400",
    bgColor: "bg-slate-50 dark:bg-slate-900",
    hoverBgColor: "hover:bg-rose-50 dark:hover:bg-slate-800",
  },
];

/**
 * 랜딩 페이지 컴포넌트
 *
 * 4개의 핵심 기능 페이지로 이동할 수 있는 카드 그리드를 렌더링합니다.
 */
const LandingPage = () => {
  const dispatch = useAppDispatch();

  const handleCardClick = (pageId: PageType) => {
    dispatch(setCurrentPage(pageId));
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4">
      <div className="flex flex-col items-center gap-12">
        {/* 헤더 섹션 */}
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Subutai Playground
          </h1>
          
          {/* 임시 이미지 */}
          <div className="mt-8 w-full max-w-2xl">
            <img
              src="https://via.placeholder.com/600x800"
              alt="Subutai Playground"
              className="w-full h-auto object-cover rounded-lg shadow-md"
            />
          </div>
        </div>

        {/* 카드 그리드 */}
        <div className="flex flex-wrap justify-center gap-6">
          {CARD_CONFIG.map((card) => {
            const IconComponent = card.icon;
            return (
              <div
                key={card.id}
                onClick={() => handleCardClick(card.id)}
                className={`
                  aspect-square w-48
                  flex flex-col items-center justify-center gap-4
                  rounded-2xl border border-slate-200 dark:border-slate-700
                  ${card.bgColor} ${card.hoverBgColor}
                  shadow-md hover:shadow-xl
                  cursor-pointer
                  transition-all duration-300 ease-out
                  hover:scale-105
                `}
              >
                <IconComponent
                  className={`h-16 w-16 ${card.iconColor}`}
                  strokeWidth={1.5}
                />
                <div className="text-center px-4">
                  <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                    {card.title}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {card.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
