import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@components/components/ui/sidebar"
import { FileText, LayoutDashboard,ListCollapse,UserRoundGroup} from "lucide-react"
import { AvatarName } from "./AvatarName"

const itemSidebar = [
  {"name": "Overview","url":"/dashboard", "icon": LayoutDashboard},
  {"name": "New Posts", "url":"/dashboard/new-post","icon": FileText},
  {"name": "Categories", "url":"/dashboard/categories","icon": ListCollapse},
  {"name": "Add-user", "url":"/dashboard/add-users","icon": UserRoundGroup},

]


export function AppSidebar({ userName, userRole }: { userName: string; userRole: string }) {
  const visibleItems = userRole === 'ADMIN'
    ? itemSidebar
    : itemSidebar.filter((item) => item.name !== 'Add-user');

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b px-4 py-3">
        <a href="/" className="group-data-[collapsible=icon]:hidden">DUL Blog</a>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>

              {visibleItems.map((i)=>(
                <SidebarMenuItem key={i.name}>
                <a href={i.url} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                  <i.icon className="h-4 w-4" />
                  <span className=" group-data-[collapsible=icon]:hidden ">{i.name}</span>
                </a>
              </SidebarMenuItem>
              ))}
      
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
