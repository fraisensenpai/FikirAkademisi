import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { BookOpen, Mail, Lock, User, Hash, GraduationCap } from "lucide-react";

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
        toast.success("Giriş başarılı!");
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
        toast.success("Kayıt başarılı! Giriş yapabilirsiniz.");
        setIsLogin(true);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-secondary/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-secondary/5 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Logo area */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4">
            <BookOpen className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            Fikir Akademisi
          </h1>
          <p className="text-muted-foreground mt-1">Dijital Okuma Platformu</p>
        </div>

        {/* Glass card */}
        <div className="glass-card p-8 animate-slide-up">
          <h2 className="text-xl font-semibold text-foreground mb-6">
            {isLogin ? "Giriş Yap" : "Kayıt Ol"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label>Hesap Türü</Label>
                  <Select value={role} onValueChange={(v: any) => setRole(v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Hesap türü seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Öğrenci</SelectItem>
                      <SelectItem value="teacher">Öğretmen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Ad Soyad</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Adınız Soyadınız"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                {role === "student" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="schoolNumber">Okul Numarası</Label>
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="schoolNumber"
                          value={schoolNumber}
                          onChange={(e) => setSchoolNumber(e.target.value)}
                          placeholder="Okul numaranız"
                          className="pl-10"
                          required={role === "student"}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="className">Sınıf</Label>
                      <Select onValueChange={setClassName} required={role === "student"}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Sınıfınızı seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {['Haz-A', 'Haz-B', 'Haz-C', 'Haz-D', 'Haz-E', 'Haz-F', 'Haz-G', 'Haz-H'].map(c => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">E-posta</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ornek@email.com"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Şifre</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading}>
              {loading ? "Yükleniyor..." : isLogin ? "Giriş Yap" : "Kayıt Ol"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isLogin ? "Hesabınız yok mu? Kayıt olun" : "Zaten hesabınız var mı? Giriş yapın"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
