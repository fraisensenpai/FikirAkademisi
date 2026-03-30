import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BookRequestButton } from "@/components/BookRequestButton";
import { Loader2 } from "lucide-react";

export default function DashboardLayout() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b bg-card/50 backdrop-blur-sm px-4 sticky top-0 z-10 justify-between">
            <div className="flex items-center">
              <SidebarTrigger className="mr-4" />
              <h1 className="text-sm font-medium text-muted-foreground font-display">Saraç Fikir Akademisi</h1>
            </div>
            <ThemeToggle />
          </header>
          <main className="flex-1 p-6 overflow-auto relative">
            <Outlet />
            <BookRequestButton />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
