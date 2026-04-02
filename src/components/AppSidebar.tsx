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
} from "@/components/ui/sidebar";
import {
  Users,
  BookOpen,
  BarChart3,
  Library,
  BookMarked,
  LayoutDashboard,
  ClipboardList,
  LogOut,
  User,
  MessageSquare,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

export function AppSidebar() {
  const { profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const role = profile?.role || "student";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Başarıyla çıkış yapıldı");
    navigate("/auth");
  };

  const adminItems = [
    { title: "Giriş", url: "/dashboard", icon: LayoutDashboard },
    { title: "Kullanıcı Yönetimi", url: "/dashboard/users", icon: Users },
    { title: "Kitap Yönetimi", url: "/dashboard/manage-books", icon: BookOpen },
    { title: "Kitap İstekleri", url: "/dashboard/book-requests", icon: BookMarked },
    { title: "İstatistikler", url: "/dashboard/analytics", icon: BarChart3 },
    { title: "Mesajlar", url: "/dashboard/messages", icon: MessageSquare },
  ];

  const teacherItems = [
    { title: "Panel", url: "/dashboard", icon: LayoutDashboard },
    { title: "Ödev Atama", url: "/dashboard/assignments", icon: ClipboardList },
    { title: "Kitap İstekleri", url: "/dashboard/book-requests", icon: BookMarked },
    { title: "Raporlar", url: "/dashboard/analytics", icon: BarChart3 },
    { title: "Mesajlar", url: "/dashboard/messages", icon: MessageSquare },
  ];

  const studentItems = [
    { title: "Panel", url: "/dashboard", icon: LayoutDashboard },
    { title: "Kitaplarım", url: "/dashboard/books", icon: Library },
    { title: "Mesajlar", url: "/dashboard/messages", icon: MessageSquare },
  ];

  const menuItems = role === "admin" || role === "developer" 
    ? adminItems 
    : role === "teacher" 
      ? teacherItems 
      : studentItems;

  return (
    <Sidebar className="border-r border-white/5 bg-[#0a0c10]/95 backdrop-blur-3xl">
      <SidebarContent className="p-4">
        <SidebarGroup>
          <div className="px-3 py-6 mb-8 flex items-center gap-3 animate-fade-in">
            <div className="w-10 h-10 rounded-2xl bg-secondary flex items-center justify-center shadow-2xl shadow-secondary/30">
              <BookOpen className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-black text-lg tracking-tight text-white leading-none mb-1">Fikir Akademisi</span>
              <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-secondary animate-pulse">M. Emin Saraç AİHL</span>
            </div>
          </div>

          <SidebarGroupLabel className="px-4 text-[10px] uppercase tracking-[0.3em] font-black text-muted-foreground/40 mb-4 select-none">
            Ana Kontroller
          </SidebarGroupLabel>
          
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {menuItems.map((item, idx) => (
                <SidebarMenuItem key={item.title} className="animate-slide-up" style={{ animationDelay: `${idx * 0.05}s` }}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url}
                    className={`
                      w-full h-12 px-4 rounded-2xl transition-all duration-300 group relative overflow-hidden
                      ${location.pathname === item.url 
                        ? "bg-primary text-primary-foreground shadow-xl shadow-primary/20" 
                        : "hover:bg-white/5 text-muted-foreground/70 hover:text-foreground"}
                    `}
                  >
                    <Link to={item.url} className="flex items-center gap-4">
                      {location.pathname === item.url && (
                        <div className="absolute left-0 w-1 h-6 bg-white/50 rounded-full blur-[2px]" />
                      )}
                      <item.icon className={`w-5 h-5 transition-transform duration-500 group-hover:scale-110 ${location.pathname === item.url ? "text-primary-foreground stroke-[2.5px]" : "text-muted-foreground group-hover:text-primary"}`} />
                      <span className={`font-bold text-sm tracking-tight ${location.pathname === item.url ? 'text-white' : ''}`}>{item.title}</span>
                      {location.pathname === item.url && <ChevronRight className="w-4 h-4 ml-auto opacity-50" />}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-6">
        <div className="glass-premium p-4 border-white/5 shadow-2xl relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all duration-700" />
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="w-10 h-10 border-2 border-primary/20 p-0.5">
              <AvatarFallback className="bg-primary/10 text-primary font-black text-xs uppercase tracking-tighter">
                {profile?.full_name?.substring(0, 2) || "FA"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-foreground truncate italic leading-tight">{profile?.full_name}</p>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">{role}</span>
              </div>
            </div>
          </div>
          <Button 
            variant="ghost" 
            onClick={handleLogout}
            className="w-full h-10 rounded-xl bg-white/5 hover:bg-destructive shadow-sm hover:text-destructive-foreground transition-all duration-500 group"
          >
            <LogOut className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] uppercase tracking-widest font-black">Güvenli Çıkış</span>
          </Button>
        </div>
        <div className="mt-4 px-2 text-[9px] text-center font-bold uppercase tracking-[0.3em] text-muted-foreground/30 italic">
          Saraç Fikir Akademisi v2.0
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
