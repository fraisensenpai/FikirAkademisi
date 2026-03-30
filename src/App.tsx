import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import DashboardLayout from "./components/DashboardLayout";
import UserManagement from "./pages/UserManagement";
import ManageBooks from "./pages/ManageBooks";
import Assignments from "./pages/Assignments";
import Analytics from "./pages/Analytics";
import Books from "./pages/Books";
import ReadBook from "./pages/ReadBook";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="manage-books" element={<ManageBooks />} />
                <Route path="assignments" element={<Assignments />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="books" element={<Books />} />
                <Route path="read/:bookId" element={<ReadBook />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
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
