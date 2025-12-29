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
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ModeToggle } from "./mode-toggle";

import { useAppDispatch, useAppSelector, setCurrentPage, type PageType } from "@/store";
import {
  FCCheckToolPage,
  QORComparePage,
  TimingPage,
  PowerPage,
} from "@/pages";

const pages = [
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

const DashboardSidebar = () => {
  const dispatch = useAppDispatch();
  const currentPage = useAppSelector((state) => state.page.currentPage);

  const handlePageChange = (pageId: PageType) => {
    dispatch(setCurrentPage(pageId));
  };

  const renderPage = () => {
    switch (currentPage) {
      case "fc-check-tool":
        return <FCCheckToolPage />;
      case "qor-compare":
        return <QORComparePage />;
      case "timing":
        return <TimingPage />;
      case "power":
        return <PowerPage />;
      default:
        return <QORComparePage />;
    }
  };

  return (
    <div className="flex min-h-dvh w-full">
      <SidebarProvider>
        <Sidebar>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Pages</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {pages.map((page) => (
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
            {renderPage()}
          </main>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default DashboardSidebar;
