import { useEffect, useState } from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarTrigger
} from "@components/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./components/ui/collapsible"
import { 
  FileText, 
  LayoutDashboard, 
  ListCollapse, 
  UserRoundGroup,
  ChevronDown,
  UserLock
} from "lucide-react"
import { AvatarName } from "./AvatarName"
import type { UserProp } from "./types/userType"

const itemSidebar = [
  { name: "New Posts", url: "/dashboard/new-post", icon: FileText },
  { name: "posts", url: "/dashboard", icon: LayoutDashboard },
  
  { name: "Categories", url: "/dashboard/categories", icon: ListCollapse },
  { name: "Add-user", url: "/dashboard/add-users", icon: UserRoundGroup },
]

const dulInfo = [
  {name: "Transactions", url: "/expand/dashboard/transactions"},
  {name: "Transactions Report", url: "/expand/dashboard/report"}

]

export function AppSidebar({
  userName,
  userRole,
  currentPath: initialPath,
}: {
  userName: UserProp
  userRole: string
  currentPath?: string
}) {
  const [currentPath, setCurrentPath] = useState(initialPath ?? "")
  const isDulInfoActive = currentPath.startsWith("/dul")
  const [isDulInfoOpen, setIsDulInfoOpen] = useState(initialPath?.startsWith("/dul") ?? false)

  useEffect(() => {
    if (initialPath) {
      setCurrentPath(initialPath)
      if (initialPath.startsWith("/dul")) {
        setIsDulInfoOpen(true)
      }
    }
  }, [initialPath])

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentPath(window.location.pathname)
      if (window.location.pathname.startsWith("/dul")) {
        setIsDulInfoOpen(true)
      }

      const handleLocationChange = () => {
        const path = window.location.pathname
        setCurrentPath(path)
        if (path.startsWith("/dul")) {
          setIsDulInfoOpen(true)
        }
      }

      window.addEventListener("popstate", handleLocationChange)
      document.addEventListener("astro:page-load", handleLocationChange)

      return () => {
        window.removeEventListener("popstate", handleLocationChange)
        document.removeEventListener("astro:page-load", handleLocationChange)
      }
    }
  }, [])

  const visibleItems =
    userRole === "ADMIN"
      ? itemSidebar
      : itemSidebar.filter((item) => item.name !== "Add-user")

  const isItemActive = (itemUrl: string) => {
    if (!currentPath) return false
    const cleanCurrent = currentPath.replace(/\/+$/, "") || "/"
    const cleanItem = itemUrl.replace(/\/+$/, "") || "/"

    if (cleanItem === "/dashboard") {
      return cleanCurrent === "/dashboard"
    }
    return cleanCurrent === cleanItem || cleanCurrent.startsWith(`${cleanItem}/`)
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b px-4 py-3">
        <div className=" flex items-center justify-between">
            <a href="/" className="group-data-[collapsible=icon]:hidden">
              DUL Blog
            </a>
            {/* Desktop screen */}
            <div >
               <SidebarTrigger/>
            </div>
        </div>

      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((i) => {
                const active = isItemActive(i.url)
                return (
                  <SidebarMenuItem key={i.name} className="first:border-b first:border-zinc-200 dark:first:border-zinc-700">
                    <a
                      href={i.url}
                      onClick={() => setCurrentPath(i.url)}
                      aria-current={active ? "page" : undefined}
                      data-active={active}
                      title={i.name}
                      className={`flex items-center gap-2 rounded-md px-2 py-3 text-sm font-medium transition-colors ${
                        active
                          ? "bg-zinc-400/25 text-sidebar-accent-foreground font-semibold shadow-xs"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                      }`}
                    >
                      <i.icon
                        className={`h-4 w-4 shrink-0 ${
                          active
                            ? "text-sidebar-accent-foreground"
                            : "text-sidebar-foreground/70"
                        }`}
                      />
                      <span className="group-data-[collapsible=icon]:hidden">
                        {i.name}
                      </span >
                    </a>
                  </SidebarMenuItem>
                )
              })}
              {/* Dul Info Dropdown Menu using shadcn ui Collapsible */}
              <Collapsible
                open={isDulInfoOpen}
                onOpenChange={setIsDulInfoOpen}
                className="group/collapsible"
              >
                <SidebarMenuItem className="border-t border-zinc-200 dark:border-zinc-700/60 pt-1 mt-1">
                  <CollapsibleTrigger
                    render={
                      <SidebarMenuButton
                        tooltip="Dul Info"
                        isActive={isDulInfoActive}
                        className="w-full flex items-center justify-between cursor-pointer"
                      />
                    }
                  >
                    <div className="flex items-center gap-2">
                      <UserLock 
                        className={`h-4 w-4 shrink-0 ${
                          isDulInfoActive
                            ? "text-sidebar-accent-foreground"
                            : "text-sidebar-foreground/70"
                        }`}
                      />

                      <span className="group-data-[collapsible=icon]:hidden font-medium">
                        Dul Info
                      </span>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 transition-transform duration-200 group-data-[collapsible=icon]:hidden ${
                        isDulInfoOpen ? "rotate-180" : ""
                      }`}
                    />
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        {dulInfo.map(dul=>(
                          <SidebarMenuSubButton
                            key={dul.name}
                            href={dul.url}
                            onClick={() => setCurrentPath(dul.url)}
                            isActive={isItemActive(dul.url)}
                            className={
                              isItemActive("/expandtrack-dashboard")
                                ? "bg-zinc-400/25 font-semibold text-sidebar-accent-foreground shadow-xs"
                                : ""
                            }
                          >
                          <span>{dul.name}</span>
                        </SidebarMenuSubButton>
                        ))}
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible> 
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>{/*  End Dul infor */}
      <SidebarFooter className="border-t p-4 text-xs text-muted-foreground">
        <AvatarName userName={userName} />
      </SidebarFooter>
    </Sidebar>
  )
}
