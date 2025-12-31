/**
 * @file DashboardSidebar.tsx
 *
 * @purpose
 * 애플리케이션의 메인 레이아웃 컴포넌트입니다.
 * 사이드바 네비게이션, 테마 토글, 페이지 렌더링을 담당합니다.
 *
 * @structure
 * 1. NAVIGATION_PAGES: 네비게이션 페이지 정의
 * 2. DashboardSidebar: 레이아웃 및 라우팅 컴포넌트
 *
 * @dependencies
 * - lucide-react: 사이드바 아이콘
 * - @/components/ui/sidebar: 사이드바 UI 컴포넌트
 * - @/store: Redux 훅 및 액션
 * - @/pages: 페이지 컴포넌트들
 * - @/hooks/useURLSync: URL 동기화 훅
 */

import {
  CheckCircle2Icon,
  GitCompareArrowsIcon,
  ClockIcon,
  ZapIcon,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ModeToggle } from "./mode-toggle";

import {
  useAppDispatch,
  useAppSelector,
  setCurrentPage,
  type PageType,
} from "@/store";
import {
  FCCheckToolPage,
  QORComparePage,
  TimingPage,
  PowerPage,
  LandingPage,
} from "@/pages";
import { useURLSync } from "@/hooks/useURLSync";

/** 네비게이션 페이지 정의 */
const NAVIGATION_PAGES = [
  {
    id: "fc-check-tool" as PageType,
    title: "FC Check Tool",
    icon: CheckCircle2Icon,
  },
  {
    id: "qor-compare" as PageType,
    title: "QOR Compare",
    icon: GitCompareArrowsIcon,
  },
  {
    id: "timing" as PageType,
    title: "Timing",
    icon: ClockIcon,
  },
  {
    id: "power" as PageType,
    title: "Power",
    icon: ZapIcon,
  },
];

/**
 * 대시보드 레이아웃 컴포넌트
 *
 * 사이드바 네비게이션과 메인 콘텐츠 영역을 포함합니다.
 */
const DashboardSidebar = () => {
  const dispatch = useAppDispatch();
  const currentPage = useAppSelector((state) => state.page.currentPage);

  // URL과 Redux 상태를 동기화하여 영구 네비게이션 지원
  useURLSync();

  const handlePageChange = (pageId: PageType) => {
    dispatch(setCurrentPage(pageId));
  };

  /** 현재 페이지에 따라 적절한 컴포넌트 렌더링 */
  const renderCurrentPage = () => {
    switch (currentPage) {
      case "landing":
        return <LandingPage />;
      case "fc-check-tool":
        return <FCCheckToolPage />;
      case "qor-compare":
        return <QORComparePage />;
      case "timing":
        return <TimingPage />;
      case "power":
        return <PowerPage />;
      default:
        return <LandingPage />;
    }
  };

  return (
    <div className="flex min-h-dvh w-full">
      <SidebarProvider>
        <Sidebar>
          <SidebarContent>
            <SidebarGroup>
              <button
                onClick={() => handlePageChange("landing")}
                className="px-2.5 py-5 flex items-center justify-start w-full cursor-pointer hover:opacity-80 transition-opacity"
                title="Subutai Playground - 홈으로 이동"
              >
                <svg
                  width="100%"
                  height="84"
                  viewBox="0 0 300 70"
                  className="max-w-xs"
                >
                  <text
                    x="10"
                    y="50%"
                    textAnchor="start"
                    dominantBaseline="middle"
                    className="fill-gray-900 dark:fill-white"
                    style={{
                      fontSize: "28px",
                      fontFamily: "'Roboto Flex', sans-serif",
                      fontWeight: "600",
                      letterSpacing: "-0.5px",
                    }}
                  >
                    Subutai Playground
                  </text>
                </svg>
              </button>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {NAVIGATION_PAGES.map((page) => (
                    <SidebarMenuItem key={page.id}>
                      <SidebarMenuButton
                        isActive={currentPage === page.id}
                        onClick={() => handlePageChange(page.id)}
                        className="cursor-pointer"
                      >
                        <page.icon />
                        <span>{page.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <div className="flex flex-1 flex-col">
          <header className="bg-card sticky top-0 z-50 flex h-13.75 items-center justify-between gap-6 border-b px-4 py-2 sm:px-6">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="[&_svg]:!size-5" />
              <ModeToggle />
            </div>
          </header>
          <main className="size-full flex-1 px-4 py-6 sm:px-6">
            {renderCurrentPage()}
          </main>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default DashboardSidebar;
