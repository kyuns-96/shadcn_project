import {
    ArrowRightLeftIcon,
    CalendarClockIcon,
    ChartNoAxesCombinedIcon,
    ChartPieIcon,
    ChartSplineIcon,
    ClipboardListIcon,
    Clock9Icon,
    CrownIcon,
    HashIcon,
    SettingsIcon,
    SquareActivityIcon,
    Undo2Icon,
    UsersIcon
} from 'lucide-react'

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuBadge,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
    SidebarTrigger
} from '@/components/ui/sidebar'
import { ModeToggle } from './mode-toggle'

import AgGridMatrixTable from '@/components/ag-grid-matrix-table'
import ComboboxDemo from '@/components/shadcn-studio/combobox/combobox-01'
import InputDemo from './shadcn-studio/input/doeInput'
import ButtonCopyStateDemo from './shadcn-studio/button/button-28'
import ButtonDemo from './shadcn-studio/button/button-01'

const DashboardSidebar = () => {
    return (
        <div className='flex min-h-dvh w-full'>
            <SidebarProvider>
                <Sidebar>
                    <SidebarContent>
                        <SidebarGroup>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild>
                                            <a href='#'>
                                                <ChartNoAxesCombinedIcon />
                                                <span>Dashboard</span>
                                            </a>
                                        </SidebarMenuButton>
                                        <SidebarMenuBadge className='bg-primary/10 rounded-full'>5</SidebarMenuBadge>
                                    </SidebarMenuItem>
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                        <SidebarGroup>
                            <SidebarGroupLabel>Pages</SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild>
                                            <a href='#'>
                                                <ChartSplineIcon />
                                                <span>Content Performance</span>
                                            </a>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild>
                                            <a href='#'>
                                                <UsersIcon />
                                                <span>Audience Insight</span>
                                            </a>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild>
                                            <a href='#'>
                                                <ChartPieIcon />
                                                <span>Engagement Metrics</span>
                                            </a>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild>
                                            <a href='#'>
                                                <HashIcon />
                                                <span>Hashtag Performance</span>
                                            </a>
                                        </SidebarMenuButton>
                                        <SidebarMenuBadge className='bg-primary/10 rounded-full'>3</SidebarMenuBadge>
                                    </SidebarMenuItem>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild>
                                            <a href='#'>
                                                <ArrowRightLeftIcon />
                                                <span>Competitor Analysis</span>
                                            </a>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild>
                                            <a href='#'>
                                                <Clock9Icon />
                                                <span>Campaign Tracking</span>
                                            </a>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild>
                                            <a href='#'>
                                                <ClipboardListIcon />
                                                <span>Sentiment Tracking</span>
                                            </a>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild>
                                            <a href='#'>
                                                <CrownIcon />
                                                <span>Influencer</span>
                                            </a>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                        <SidebarGroup>
                            <SidebarGroupLabel>Supporting Features</SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild>
                                            <a href='#'>
                                                <SquareActivityIcon />
                                                <span>Real Time Monitoring</span>
                                            </a>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild>
                                            <a href='#'>
                                                <CalendarClockIcon />
                                                <span>Schedule Post & Calendar</span>
                                            </a>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild>
                                            <a href='#'>
                                                <Undo2Icon />
                                                <span>Report & Export</span>
                                            </a>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild>
                                            <a href='#'>
                                                <SettingsIcon />
                                                <span>Settings & Integrations</span>
                                            </a>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild>
                                            <a href='#'>
                                                <UsersIcon />
                                                <span>User Management</span>
                                            </a>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    </SidebarContent>
                </Sidebar>
                <div className='flex flex-1 flex-col'>
                    <header className='bg-card sticky top-0 z-50 flex h-13.75 items-center justify-between gap-6 border-b px-4 py-2 sm:px-6'>
                        <div className="flex items-center gap-2">
                            <SidebarTrigger className='[&_svg]:!size-5' />
                            <ModeToggle />
                        </div>
                    </header>
                    <main className='size-full flex-1 px-4 py-6 sm:px-6'>
                        <div className="flex flex-wrap gap-2 mb-4">
                            <ComboboxDemo name="PROJECT" />
                            <ComboboxDemo name="BLOCK" />
                            <ComboboxDemo name="NET_VER" />
                            <ComboboxDemo name="REVISION" />
                            <ComboboxDemo name="ECO_NUM" />
                            <InputDemo />
                            <ButtonDemo />
                            <ButtonCopyStateDemo />
                        </div>
                        <AgGridMatrixTable />
                    </main>
                </div>
            </SidebarProvider>
        </div>
    )
}

export default DashboardSidebar
