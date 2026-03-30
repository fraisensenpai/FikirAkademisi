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
} from "@/components/ui/sidebar";
import {
  Users,
  BookOpen,
  BarChart3,
  Library,
  BookMarked,
  LayoutDashboard,
  ClipboardList,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export function AppSidebar() {
  const { profile } = useAuth();
  const location = useLocation();
  const role = profile?.role || "student";

  const adminItems = [
    { title: "Giriş", url: "/dashboard", icon: LayoutDashboard },
    { title: "Kullanıcı Yönetimi", url: "/dashboard/users", icon: Users },
    { title: "Kitap Yönetimi", url: "/dashboard/manage-books", icon: BookOpen },
    { title: "Kitap İstekleri", url: "/dashboard/book-requests", icon: BookMarked },
    { title: "İstatistikler", url: "/dashboard/analytics", icon: BarChart3 },
  ];

  const teacherItems = [
    { title: "Panel", url: "/dashboard", icon: LayoutDashboard },
    { title: "Ödev Atama", url: "/dashboard/assignments", icon: ClipboardList },
    { title: "Kitap İstekleri", url: "/dashboard/book-requests", icon: BookMarked },
    { title: "Raporlar", url: "/dashboard/analytics", icon: BarChart3 },
  ];

  const studentItems = [
    { title: "Panel", url: "/dashboard", icon: LayoutDashboard },
    { title: "Kitaplarım", url: "/dashboard/books", icon: Library },
  ];

  const menuItems = role === "admin" || role === "developer" 
    ? adminItems 
    : role === "teacher" 
      ? teacherItems 
      : studentItems;

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <div className="px-4 py-6 mb-2 border-b border-sidebar-border/50">
            <h2 className="text-xl font-display font-bold text-primary flex items-center gap-2">
              <BookOpen className="w-6 h-6" />
              Fikir Akademisi
            </h2>
          </div>
          <SidebarGroupLabel className="px-4 text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60 mb-2">
            Menü
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="px-2 gap-1">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url}
                    className={`
                      transition-all duration-300 rounded-xl h-10 px-3
                      ${location.pathname === item.url 
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary" 
                        : "hover:bg-muted text-muted-foreground hover:text-foreground"}
                    `}
                  >
                    <Link to={item.url} className="flex items-center gap-3">
                      <item.icon className={`w-5 h-5 ${location.pathname === item.url ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary transition-colors"}`} />
                      <span className="font-medium text-sm">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
