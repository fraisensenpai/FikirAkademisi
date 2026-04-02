import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, Outlet } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

export default function DashboardLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#0a0c10] overflow-hidden">
        <div className="relative">
          <Loader2 className="h-12 w-12 animate-spin text-primary shadow-2xl shadow-primary/20" />
          <div className="absolute inset-0 h-12 w-12 animate-ping bg-primary/20 rounded-full" />
        </div>
        <span className="ml-8 text-xs font-black uppercase tracking-[0.4em] text-muted-foreground/40 italic">Fikir Akademisi v2.0 Yükleniyor...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background relative overflow-hidden selection:bg-primary/20">
        {/* Subtle Mesh Background for Dashboard Context */}
        <div className="fixed inset-0 mesh-gradient opacity-40 pointer-events-none" />
        
        {/* Floating Decorative Elements */}
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[160px] animate-float pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[140px] animate-float pointer-events-none" style={{ animationDelay: '3s' }} />

        <AppSidebar />
        <main className="flex-1 overflow-y-auto relative z-10">
          <div className="container mx-auto p-4 md:p-8 animate-fade-in">
            {/* Top Header Controls */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="h-11 w-11 rounded-xl bg-white/5 border border-white/10 shadow-lg text-secondary md:hidden" />
                <div className="hidden md:block">
                  <h1 className="text-[10px] uppercase font-black tracking-[0.3em] text-muted-foreground/30 italic">Panel / Genel Bakış</h1>
                </div>
              </div>
              <div className="flex items-center gap-4 glass-premium p-1.5 border-white/5 shadow-2xl shadow-primary/5">
                <div className="hidden sm:block px-4 border-r border-white/5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Görünüm Ayarları</div>
                <ThemeToggle />
              </div>
            </div>
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
