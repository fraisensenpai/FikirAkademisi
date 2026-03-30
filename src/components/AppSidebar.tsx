import { useLocation } from "react-router-dom";
import { BookOpen, LayoutDashboard, Users, Library, ClipboardList, BarChart3, Settings, LogOut } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const studentItems = [
  { title: "Panel", url: "/dashboard", icon: LayoutDashboard },
  { title: "Kitaplarım", url: "/dashboard/books", icon: Library },
];

const teacherItems = [
  { title: "Panel", url: "/dashboard", icon: LayoutDashboard },
  { title: "Ödev Ata", url: "/dashboard/assignments", icon: ClipboardList },
  { title: "Analitik", url: "/dashboard/analytics", icon: BarChart3 },
];

const adminItems = [
  { title: "Panel", url: "/dashboard", icon: LayoutDashboard },
  { title: "Kitap Yönetimi", url: "/dashboard/manage-books", icon: Library },
  { title: "Kullanıcılar", url: "/dashboard/users", icon: Users },
  { title: "Ödev Ata", url: "/dashboard/assignments", icon: ClipboardList },
  { title: "Analitik", url: "/dashboard/analytics", icon: BarChart3 },
];

export function AppSidebar() {
  const { profile, signOut } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  const role = profile?.role || "student";
  const items = role === "admin" || role === "developer"
    ? adminItems
    : role === "teacher"
    ? teacherItems
    : studentItems;

  const roleLabels: Record<string, string> = {
    student: "Öğrenci",
    teacher: "Öğretmen",
    developer: "Geliştirici",
    admin: "Yetkili",
  };

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarContent className="bg-sidebar text-sidebar-foreground">
        <div className="p-4 flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <h2 className="font-display font-bold text-sm text-sidebar-foreground truncate">Saraç Fikir</h2>
              <p className="text-xs text-sidebar-foreground/60">Akademisi</p>
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50 text-xs uppercase tracking-wider">
            {!collapsed && "Menü"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/dashboard"}
                      className="text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="w-4 h-4 mr-2" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="bg-sidebar p-4">
        {!collapsed && profile && (
          <div className="mb-3 px-2">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{profile.full_name || "Kullanıcı"}</p>
            <p className="text-xs text-sidebar-foreground/50">{roleLabels[role]}</p>
          </div>
        )}
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "default"}
          onClick={signOut}
          className="w-full text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent justify-start"
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && <span className="ml-2">Çıkış Yap</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
