import type { ReactNode } from "react"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@components/components/ui/sidebar"
import { AppSidebar } from "@components/app-sidebar"

export function DashboardShell({ children, userName, userRole }: { children: ReactNode; userName: string; userRole: string }) {
  return (
    <SidebarProvider>
      <AppSidebar userName={userName} userRole={userRole} />
      <SidebarInset>
        <header className="flex h-14 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <span className="text-sm font-medium " >Dashboard</span>
        </header>
        <main className="flex-1 p-6">
          {children}
          </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
