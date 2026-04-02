import { useNavigate } from "react-router-dom";
import { BookOpen, Users, BarChart3, Shield, ArrowRight, Sparkles, BookMarked, BrainCircuit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Index() {
  const navigate = useNavigate();

  const features = [
    { icon: BookOpen, title: "Dijital Okuma", desc: "PDF kitapları okuyun, ilerlemenizi saniye saniye takip edin.", color: "text-blue-500" },
    { icon: BarChart3, title: "Akıllı Analitik", desc: "Okuma hızı ve odaklanma süresi gibi derin verilerle gelişimi görün.", color: "text-emerald-500" },
    { icon: BrainCircuit, title: "Sınıf Yönetimi", desc: "Öğretmenler için tek tıkla kitap atama ve performans izleme.", color: "text-purple-500" },
    { icon: Shield, title: "Güvenli Sistem", desc: "Anti-cheat ve rol tabanlı erişim ile tam güvenlik.", color: "text-amber-500" },
  ];

  return (
    <div className="min-h-screen bg-background selection:bg-primary/20 overflow-x-hidden">
      {/* Premium Mesh Background */}
      <div className="fixed inset-0 mesh-gradient opacity-60 pointer-events-none" />
      
      {/* Decorative Floating Elements */}
      <div className="fixed -top-24 -left-20 w-96 h-96 bg-primary/5 rounded-full blur-[120px] animate-float pointer-events-none" />
      <div className="fixed top-1/2 -right-40 w-80 h-80 bg-secondary/5 rounded-full blur-[100px] animate-float pointer-events-none" style={{ animationDelay: '2s' }} />

      <div className="relative z-10">
        {/* Navigation */}
        <nav className="max-w-7xl mx-auto px-6 py-8 flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-4 group cursor-pointer" onClick={() => navigate("/")}>
            <div className="w-12 h-12 rounded-2xl bg-secondary shadow-2xl shadow-secondary/20 flex items-center justify-center transform group-hover:rotate-6 transition-transform duration-300">
              <BookMarked className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-extrabold text-xl tracking-tight text-white">Fikir Akademisi</span>
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-secondary leading-none">M. Emin Saraç AİHL</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <ThemeToggle />
            <Button 
              onClick={() => navigate("/auth")} 
              variant="ghost" 
              className="font-bold hover:bg-white/5 hidden md:flex"
            >
              Giriş Yap
            </Button>
            <Button 
              onClick={() => navigate("/auth")}
              className="bg-secondary text-white font-bold px-8 h-12 rounded-2xl shadow-xl shadow-secondary/20 hover:scale-105 active:scale-95 transition-all"
            >
              Hemen Başla
            </Button>
          </div>
        </nav>

        {/* Hero Section */}
        <main className="max-w-7xl mx-auto px-6 pt-20 pb-32">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="animate-slide-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/5 border border-secondary/10 text-secondary text-sm font-bold mb-8 animate-fade-in">
                <Sparkles className="w-4 h-4" />
                <span>Dijital Okuma Devrimi Başladı</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-display font-extrabold text-foreground leading-[1.1] mb-8">
                Geleceğin <br />
                <span className="text-gradient">Okuma Deneyimi</span>
              </h1>
              <p className="text-xl text-muted-foreground/80 leading-relaxed mb-12 max-w-lg">
                Klasik kitap takibini geride bırakın. Yeni nesil analizler, gerçek zamanlı okuma verileri ve 
                interaktif sosyal özelliklerle kütüphanenizi dijitalleştirin.
              </p>
              <div className="flex flex-col sm:flex-row gap-6">
                <Button
                  onClick={() => navigate("/auth")}
                  size="lg"
                  className="h-16 px-10 rounded-2xl bg-secondary text-white font-bold text-lg shadow-2xl shadow-secondary/25 hover:scale-105 active:scale-95 transition-all group"
                >
                  Ücretsiz Kayıt Ol <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>

            <div className="hidden lg:block relative animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <div className="relative z-10 glass-premium p-10 border-white/20 shadow-2xl rotate-3 animate-float overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="space-y-6">
                  <div className="h-8 w-32 bg-primary/20 rounded-full animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-foreground/10 rounded-full" />
                    <div className="h-4 w-3/4 bg-foreground/10 rounded-full" />
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="h-24 rounded-2xl bg-primary/5 border border-white/10" />
                    <div className="h-24 rounded-2xl bg-secondary/5 border border-white/10" />
                  </div>
                </div>
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-primary/10 rounded-full blur-[100px] -z-10" />
            </div>
          </div>
        </main>

        {/* Features Grid */}
        <section className="max-w-7xl mx-auto px-6 py-32 border-t border-white/5">
          <div className="text-center max-w-2xl mx-auto mb-20 animate-fade-in">
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-6 italic tracking-tight">Akıllı Özellikler</h2>
            <p className="text-muted-foreground">Eğitim teknolojilerinde en son standartları kütüphanenize taşıyoruz.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((f, idx) => (
              <div 
                key={idx} 
                className="glass-premium p-8 hover:scale-[1.02] hover:bg-white/50 dark:hover:bg-white/5 transition-all duration-500 animate-slide-up group"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className={`w-14 h-14 rounded-2xl bg-background shadow-xl flex items-center justify-center mb-6 transform group-hover:rotate-12 transition-transform duration-300 ${f.color}`}>
                  <f.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-4">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed italic">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Improved Footer */}
        <footer className="border-t border-white/5 pt-20 pb-12">
          <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-12 mb-16">
            <div className="space-y-4">
              <span className="font-display font-bold text-lg">Fikir Akademisi</span>
              <p className="text-sm text-muted-foreground">Dijital okuma alışkanlıklarını geleceğe taşıyan vakıf girişimi.</p>
            </div>
            <div className="space-y-4">
              <h4 className="font-bold text-sm uppercase tracking-widest text-primary">Bağlantılar</h4>
              <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
                <a href="#" className="hover:text-primary transition-colors">Ana Sayfa</a>
                <a href="#" className="hover:text-primary transition-colors">Kütüphane</a>
                <a href="#" className="hover:text-primary transition-colors">İstatistikler</a>
              </nav>
            </div>
            <div className="space-y-4">
              <h4 className="font-bold text-sm uppercase tracking-widest text-secondary">İletişim</h4>
              <p className="text-sm text-muted-foreground italic">mstfyzc.29@gmail.com</p>
            </div>
          </div>
          <div className="text-center text-xs text-muted-foreground/50 font-medium">
            <p>© {new Date().getFullYear()} Saraç Fikir Akademisi. Tüm hakları saklıdır.</p>
            <p className="mt-2">FraisenSenpai tarafından ❤️ ile yapıldı</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
