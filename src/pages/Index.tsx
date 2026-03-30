import { useNavigate } from "react-router-dom";
import { BookOpen, Users, BarChart3, Shield, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Index() {
  const navigate = useNavigate();

  const features = [
    { icon: BookOpen, title: "Dijital Okuma", desc: "PDF kitapları okuyun, ilerlemenizi takip edin" },
    { icon: BarChart3, title: "Akıllı Takip", desc: "Gerçek okuma davranışı analizi ve anti-cheat sistemi" },
    { icon: Users, title: "Sınıf Yönetimi", desc: "Öğretmenler kitap atayıp öğrenci ilerlemelerini görsün" },
    { icon: Shield, title: "Rol Tabanlı Erişim", desc: "Öğrenci, öğretmen ve yönetici panelleri" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-secondary/8 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 pt-12 pb-20">
          {/* Nav */}
          <nav className="flex items-center justify-between mb-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-foreground">Saraç Fikir Akademisi</span>
            </div>
            <Button onClick={() => navigate("/auth")} variant="outline">
              Giriş Yap
            </Button>
          </nav>

          {/* Hero content */}
          <div className="max-w-3xl animate-fade-in">
            <h1 className="text-4xl md:text-6xl font-display font-bold text-foreground leading-tight mb-6">
              Dijital Okuma ve
              <span className="text-gradient block">Takip Platformu</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl">
              Öğrencilerin okuma alışkanlıklarını takip edin, kitap atayın ve 
              gerçek zamanlı analitiklerle sınıf performansını izleyin.
            </p>
            <div className="flex gap-4">
              <Button
                onClick={() => navigate("/auth")}
                size="lg"
                className="bg-primary hover:bg-primary/90"
              >
                Başla <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => (
            <div key={f.title} className="glass-card p-6 hover:shadow-xl transition-all duration-300 animate-slide-up">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center mb-4">
                <f.icon className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        © 2026 Saraç Fikir Akademisi. Tüm hakları saklıdır.
      </footer>
    </div>
  );
}
