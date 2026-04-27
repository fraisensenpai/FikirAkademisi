import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Hammer, Cog, ShieldAlert, Loader2 } from "lucide-react";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import DashboardLayout from "./components/DashboardLayout";
import UserManagement from "./pages/UserManagement";
import ManageBooks from "./pages/ManageBooks";
import Assignments from "./pages/Assignments";
import Analytics from "./pages/Analytics";
import Books from "./pages/Books";
import Messages from "./pages/Messages";
import ReadBook from "./pages/ReadBook";
import BookRequests from "./pages/BookRequests";
import TransferProgress from "./pages/TransferProgress";
import ManageTransfers from "./pages/ManageTransfers";
import ManageGroups from "./pages/ManageGroups";
import Updates from "./pages/Updates";
import NotFound from "./pages/NotFound";

import ResetPassword from "./pages/ResetPassword";

const Maintenance = ({ message }: { message: string }) => (
  <div className="fixed inset-0 z-[9999] bg-[#0f1115] flex flex-col items-center justify-center p-6 text-center overflow-hidden">
    <div className="absolute inset-0 mesh-gradient opacity-30 pointer-events-none" />
    <div className="relative space-y-8 max-w-2xl">
      <div className="relative inline-block scale-110 md:scale-150 mb-8">
        <div className="w-16 h-16 md:w-24 md:h-24 rounded-3xl bg-secondary/10 flex items-center justify-center animate-bounce shadow-2xl shadow-secondary/20 border border-secondary/20">
          <Hammer className="w-8 h-8 md:w-12 md:h-12 text-secondary" />
        </div>
        <Cog className="absolute -bottom-2 -right-2 w-6 h-6 md:w-10 md:h-10 text-primary animate-spin-slow opacity-80" />
      </div>
      
      <div className="space-y-4">
        <h1 className="text-4xl md:text-7xl font-display font-black text-white italic tracking-tight uppercase leading-none">
          SİSTEM <br /><span className="text-secondary">BAKIMDA</span>
        </h1>
        <p className="text-sm md:text-xl text-muted-foreground font-medium italic max-w-md mx-auto">
          {message || "Daha iyi bir deneyim için sistemimizi güncelliyoruz."}
        </p>
      </div>

      <div className="p-6 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-xl space-y-4 shadow-2xl max-w-sm mx-auto">
        <div className="flex items-center gap-3 justify-center text-amber-500 font-bold uppercase tracking-widest text-[10px]">
          <ShieldAlert className="w-3 h-3" />
          <span>TAHMİNİ BİTİŞ: YAKINDA</span>
        </div>
        <div className="space-y-1 text-center">
          <p className="text-[10px] text-white/60 font-medium italic">Durum uzun süre kalırsa geliştiricilerle iletişime geçebilirsiniz:</p>
          <p className="text-[10px] text-secondary font-bold">+90 506 330 34 29 | mstfyzc.29@gmail.com</p>
        </div>
        <div className="flex gap-2 justify-center pt-2">
          <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
          <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse delay-75" />
          <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse delay-150" />
        </div>
      </div>

      <p className="pt-12 text-[10px] font-black uppercase tracking-[0.4em] text-white/10">Fikir Akademisi Geliştirici Ekibi</p>
    </div>
  </div>
);

const AppContent = () => {
  const { profile, loading: authLoading } = useAuth();
  const [maintenance, setMaintenance] = useState<{ active: boolean; message: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        const { data } = await supabase
          .from("system_settings" as any)
          .select("value")
          .eq("key", "maintenance_mode")
          .maybeSingle();
        
        if (data) {
          setMaintenance((data as any).value);
        }
      } catch (e) {
        console.error("Maintenance check failed", e);
      } finally {
        setLoading(false);
      }
    };
    checkMaintenance();
  }, []);

  if (authLoading || loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#0f1115] gap-4">
        <Loader2 className="w-12 h-12 text-secondary animate-spin" />
        <p className="font-display font-black text-[10px] uppercase tracking-[0.3em] text-white/20 animate-pulse">Dijital Kütüphane Yükleniyor...</p>
      </div>
    );
  }

  const isAuthorized = profile?.role === "admin" || profile?.role === "developer";
  if (maintenance?.active && !isAuthorized) {
    return <Maintenance message={maintenance.message} />;
  }

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="manage-books" element={<ManageBooks />} />
        <Route path="assignments" element={<Assignments />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="books" element={<Books />} />
        <Route path="read/:bookId" element={<ReadBook />} />
        <Route path="book-requests" element={<BookRequests />} />
        <Route path="transfer" element={<TransferProgress />} />
        <Route path="manage-transfers" element={<ManageTransfers />} />
        <Route path="groups" element={<ManageGroups />} />
        <Route path="messages" element={<Messages />} />
        <Route path="updates" element={<Updates />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AppContent />
            <footer className="fixed bottom-4 left-0 right-0 text-center text-[11px] font-medium text-muted-foreground/60 z-50 pointer-events-none">
              FraisenSenpai tarafından ❤️ ile yapıldı
            </footer>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
