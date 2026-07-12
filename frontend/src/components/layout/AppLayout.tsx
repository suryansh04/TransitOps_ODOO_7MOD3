import React from "react"
import { NavLink, Outlet, useNavigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar"
import { 
  LayoutDashboard, 
  Truck, 
  Users, 
  Map, 
  Wrench, 
  Receipt, 
  LineChart, 
  Settings,
  Search,
  Bell,
  LogOut
} from "lucide-react"

export const AppLayout: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  const navItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard, permission: "always" },
    { name: "Fleet", path: "/fleet", icon: Truck, permission: "fleet" },
    { name: "Drivers", path: "/drivers", icon: Users, permission: "drivers" },
    { name: "Trips", path: "/trips", icon: Map, permission: "trips" },
    { name: "Maintenance", path: "/maintenance", icon: Wrench, permission: "fleet" },
    { name: "Fuel & Expenses", path: "/fuel-expenses", icon: Receipt, permission: "fuel_expenses" },
    { name: "Analytics", path: "/analytics", icon: LineChart, permission: "analytics" },
    { name: "Settings", path: "/settings", icon: Settings, permission: "settings" },
  ]

  // Filter sidebar based on RBAC permissions
  const filteredNav = navItems.filter(item => {
    if (item.permission === "always") return true
    return user?.permissions?.[item.permission] && user.permissions[item.permission] !== "none"
  })

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2)
  }

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" variant="sidebar">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <LayoutDashboard className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">TransitOps</span>
                  <span className="truncate text-xs">Platform</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Platform Modules</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredNav.map((item) => (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton asChild tooltip={item.name}>
                      <NavLink to={item.path} end={item.path === '/'}>
                        <item.icon />
                        <span>{item.name}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  {user ? getInitials(user.name) : "U"}
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user?.name}</span>
                  <span className="truncate text-xs capitalize">{user?.role.replace('_', ' ')}</span>
                </div>
                <LogOut className="ml-auto size-4 cursor-pointer text-muted-foreground hover:text-foreground" onClick={handleLogout} />
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        {/* Top Header */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-6">
          <SidebarTrigger />
          <div className="flex flex-1 items-center justify-between">
            <div className="flex items-center w-full max-w-sm relative ml-4">
               <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
               <input 
                  type="search" 
                  placeholder="Search trips, drivers, vehicles..." 
                  className="w-full h-9 border rounded-md pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring transition-shadow bg-muted/50"
               />
            </div>
            
            <div className="flex items-center gap-4">
              {user?.permissions?.['trips'] === 'full' && (
                <Button className="cursor-pointer">Dispatch Trip</Button>
              )}
              <Button variant="ghost" size="icon" className="text-muted-foreground cursor-pointer">
                <Bell className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 p-8 overflow-auto">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
