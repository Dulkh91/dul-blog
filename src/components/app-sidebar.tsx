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
} from "@components/components/ui/sidebar"
import { FileText, LayoutDashboard, ListCollapse, UserRoundGroup } from "lucide-react"
import { AvatarName } from "./AvatarName"
import type { UserProp } from "./types/userType"

const itemSidebar = [
  { name: "New Posts", url: "/dashboard/new-post", icon: FileText },
  { name: "posts", url: "/dashboard", icon: LayoutDashboard },
  
  { name: "Categories", url: "/dashboard/categories", icon: ListCollapse },
  { name: "Add-user", url: "/dashboard/add-users", icon: UserRoundGroup },
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

  useEffect(() => {
    if (initialPath) {
      setCurrentPath(initialPath)
    }
  }, [initialPath])

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentPath(window.location.pathname)

      const handleLocationChange = () => {
        setCurrentPath(window.location.pathname)
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
        <a href="/" className="group-data-[collapsible=icon]:hidden">
          DUL Blog
        </a>

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
                      </span>
                    </a>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t p-4 text-xs text-muted-foreground">
        <AvatarName userName={userName} />
      </SidebarFooter>
    </Sidebar>
  )
}
