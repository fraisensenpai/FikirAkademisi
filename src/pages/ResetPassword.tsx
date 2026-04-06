import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Lock, KeyRound, Loader2, BookOpen } from "lucide-react";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if the user arrived here with a valid recovery token in the URL hash
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event == "PASSWORD_RECOVERY") {
        toast.info("Lütfen yeni şifrenizi belirleyin.");
      }
    });
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;

      toast.success("Şifreniz başarıyla güncellendi! Yönlendiriliyorsunuz...");
      
      // Log them out so they can log back in with the new password cleanly
      await supabase.auth.signOut();
      
      setTimeout(() => {
        navigate("/auth");
      }, 2000);

    } catch (error: any) {
      toast.error(error.message || "Şifre güncellenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden selection:bg-primary/20">
      {/* Premium Mesh Background */}
      <div className="fixed inset-0 mesh-gradient opacity-60 pointer-events-none" />
      
      <div className="absolute top-[-5%] left-[-5%] w-[30%] h-[30%] bg-primary/10 rounded-full blur-[100px] animate-float pointer-events-none" />
      <div className="absolute bottom-[-5%] right-[-5%] w-[30%] h-[30%] bg-secondary/10 rounded-full blur-[100px] animate-float pointer-events-none" style={{ animationDelay: '2s' }} />

      <div className="relative z-10 w-full max-w-md mx-4 py-8">
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2.5rem] bg-secondary shadow-2xl shadow-secondary/20 mb-6 group cursor-default">
            <KeyRound className="w-10 h-10 text-primary-foreground group-hover:scale-110 transition-transform" />
          </div>
          <h1 className="text-3xl font-display font-extrabold text-foreground tracking-tight mb-2">
            Yeni Şifre <span className="text-gradient">Belirleme</span>
          </h1>
          <p className="text-muted-foreground font-medium italic">Hesabınıza tekrar güvenle erişin.</p>
        </div>

        <div className="glass-premium p-8 md:p-10 shadow-2xl border-white/20 animate-slide-up">
          <form onSubmit={handleUpdatePassword} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">Yeni Şifreniz</Label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="password"
                  type="password"
                  placeholder="En az 6 karakter girin"
                  className="pl-11 h-14 rounded-2xl bg-background/50 border-white/10 focus:ring-2 ring-primary/20 transition-all shadow-sm font-medium"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-14 rounded-2xl bg-primary text-white font-bold text-lg shadow-2xl shadow-primary/25 hover:scale-[1.02] active:scale-95 transition-all mt-4 border-none"
              disabled={loading || password.length < 6}
            >
              {loading ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Güncelleniyor...</span>
                </div>
              ) : (
                "Şifremi Güncelle"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
