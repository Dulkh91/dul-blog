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
import { FileText, LayoutDashboard,ListCollapse } from "lucide-react"

const itemSidebar = [
  {"name": "Overview","url":"/dashboard", "icon": LayoutDashboard},
  {"name": "New Posts", "url":"/dashboard/new-post","icon": FileText},
  {"name": "Categories", "url":"/dashboard/categories","icon": ListCollapse},
]

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b px-4 py-3">
        <a href="/" className="group-data-[collapsible=icon]:hidden">DUL Blog</a>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>

              {itemSidebar.map((i)=>(
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
      {/* <SidebarFooter className="border-t p-4 text-xs text-muted-foreground">
        Content management
      </SidebarFooter> */}
    </Sidebar>
  )
}
