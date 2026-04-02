import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { BookOpen, Mail, Lock, User, Hash, GraduationCap, Sparkles, ArrowRight, Loader2 } from "lucide-react";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [schoolNumber, setSchoolNumber] = useState("");
  const [className, setClassName] = useState("");
  const [role, setRole] = useState<"student" | "teacher">("student");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Giriş başarılı! Hoş geldiniz.");
        navigate("/dashboard");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { 
              full_name: fullName,
              role: role,
              school_number: role === "student" ? schoolNumber : null,
              class_name: role === "student" ? className : null
            },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success("Kayıt başarılı! Şimdi giriş yapabilirsiniz.");
        setIsLogin(true);
      }
    } catch (error: any) {
      toast.error(error.message || "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden selection:bg-primary/20">
      {/* Premium Mesh Background */}
      <div className="fixed inset-0 mesh-gradient opacity-60 pointer-events-none" />
      
      {/* Decorative Floating Elements */}
      <div className="absolute top-[-5%] left-[-5%] w-[30%] h-[30%] bg-primary/10 rounded-full blur-[100px] animate-float pointer-events-none" />
      <div className="absolute bottom-[-5%] right-[-5%] w-[30%] h-[30%] bg-secondary/10 rounded-full blur-[100px] animate-float pointer-events-none" style={{ animationDelay: '2s' }} />

      <div className="relative z-10 w-full max-w-lg mx-4 py-8">
        {/* Logo area */}
        <div className="text-center mb-8 animate-fade-in">
          <div 
            className="inline-flex items-center justify-center w-20 h-20 rounded-[2.5rem] bg-secondary shadow-2xl shadow-secondary/20 mb-6 cursor-pointer hover:rotate-12 transition-transform duration-500 group"
            onClick={() => navigate("/")}
          >
            <BookOpen className="w-10 h-10 text-primary-foreground group-hover:scale-110 transition-transform" />
          </div>
          <h1 className="text-4xl font-display font-extrabold text-foreground tracking-tight mb-2">
            Fikir <span className="text-gradient">Akademisi</span>
          </h1>
          <p className="text-muted-foreground font-medium italic animate-pulse">Dijital Okuma Yolculuğu</p>
        </div>

        {/* Glass-Premium card */}
        <div className="glass-premium p-8 md:p-10 shadow-2xl border-white/20 dark:border-white/5 animate-slide-up">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10 text-primary text-[10px] font-bold mb-4 uppercase tracking-widest">
              <Sparkles className="w-3 h-3" />
              <span>Güvenli {isLogin ? "Giriş" : "Kayıt"}</span>
            </div>
            <h2 className="text-2xl font-bold text-foreground">
              {isLogin ? "Tekrar Hoş Geldiniz" : "Kütüphanemize Katılın"}
            </h2>
            <p className="text-sm text-muted-foreground/70 mt-2 font-medium">
              {isLogin ? "Bilgilerinizi girerek kaldığınız yerden devam edin." : "Yeni bir hesap oluşturarak okumaya başlayın."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-5 animate-fade-in">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">Hesap Türü</Label>
                  <Select value={role} onValueChange={(v: any) => setRole(v)}>
                    <SelectTrigger className="w-full h-12 rounded-2xl bg-background/50 border-white/10 focus:ring-2 ring-primary/20 transition-all shadow-sm">
                      <SelectValue placeholder="Rolünüzü seçin" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-white/10 shadow-2xl">
                      <SelectItem value="student" className="rounded-xl">Öğrenci</SelectItem>
                      <SelectItem value="teacher" className="rounded-xl">Öğretmen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">Ad Soyad</Label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="fullName"
                      placeholder="Adınız Soyadınız"
                      className="pl-11 h-12 rounded-2xl bg-background/50 border-white/10 focus:ring-2 ring-primary/20 transition-all shadow-sm"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {role === "student" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="schoolNumber" className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">Okul No</Label>
                      <div className="relative group">
                        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                          id="schoolNumber"
                          placeholder="No"
                          className="pl-11 h-12 rounded-2xl bg-background/50 border-white/10 focus:ring-2 ring-primary/20 transition-all shadow-sm"
                          value={schoolNumber}
                          onChange={(e) => setSchoolNumber(e.target.value)}
                          required={role === "student"}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="className" className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">Sınıf</Label>
                      <Select onValueChange={setClassName} required={role === "student"}>
                        <SelectTrigger className="w-full h-12 rounded-2xl bg-background/50 border-white/10 focus:ring-2 ring-primary/20 transition-all shadow-sm">
                          <SelectValue placeholder="Sınıf" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-white/10 shadow-2xl">
                          {['Haz-A', 'Haz-B', 'Haz-C', 'Haz-D', 'Haz-E', 'Haz-F', 'Haz-G', 'Haz-H'].map(c => (
                            <SelectItem key={c} value={c} className="rounded-xl">{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">E-Posta</Label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="email"
                  type="email"
                  placeholder="eposta@adresiniz.com"
                  className="pl-11 h-12 rounded-2xl bg-background/50 border-white/10 focus:ring-2 ring-primary/20 transition-all shadow-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">Şifre</Label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-11 h-12 rounded-2xl bg-background/50 border-white/10 focus:ring-2 ring-primary/20 transition-all shadow-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-14 rounded-2xl bg-secondary text-white font-bold text-lg shadow-2xl shadow-secondary/25 hover:scale-[1.02] active:scale-95 transition-all mt-4 border-none"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Hazırlanıyor...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>{isLogin ? "Giriş Yap" : "Kayıt Ol"}</span>
                  <ArrowRight className="w-5 h-5 opacity-50" />
                </div>
              )}
            </Button>
          </form>

          <p className="mt-8 pt-6 border-t border-white/5 text-center text-sm font-medium text-muted-foreground">
            {isLogin ? "Bir hesabınız yok mu? " : "Zaten üye misiniz? "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary font-bold hover:underline underline-offset-4 decoration-2 transition-all ml-1"
            >
              {isLogin ? "Hemen Katılın" : "Giriş Yapın"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
