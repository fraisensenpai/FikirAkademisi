import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { BookOpen, Clock, Trophy, TrendingUp, Sparkles, BookMarked, Play, CheckCircle2, LayoutDashboard } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface UserBook {
  id: string;
  current_page: number;
  progress_percent: number;
  total_minutes: number;
  is_completed: boolean;
  quiz_score: number | null;
  book: {
    id: string;
    title: string;
    total_pages: number;
    cover_url: string | null;
  };
}

export default function StudentDashboard() {
  const { user, profile } = useAuth();
  const [userBooks, setUserBooks] = useState<UserBook[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const fetchBooks = async () => {
      try {
        const { data, error } = await supabase
          .from("user_books")
          .select("id, current_page, progress_percent, total_minutes, is_completed, quiz_score, book:books(id, title, total_pages, cover_url)")
          .eq("user_id", user.id);
        
        if (error) throw error;
        setUserBooks((data as any) || []);
      } catch (err) {
        toast.error("Veriler alınırken bir hata oluştu");
      } finally {
        setLoading(false);
      }
    };
    fetchBooks();
  }, [user]);

  const totalMinutes = userBooks.reduce((sum, ub) => sum + Number(ub.total_minutes), 0);
  const completedCount = userBooks.filter((ub) => ub.is_completed).length;
  const avgProgress = userBooks.length
    ? userBooks.reduce((sum, ub) => sum + Number(ub.progress_percent), 0) / userBooks.length
    : 0;

  const stats = [
    { label: "Okunan Kitap", value: userBooks.length, icon: BookOpen, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Toplam Süre", value: `${Math.round(totalMinutes)} dk`, icon: Clock, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Tamamlanan", value: completedCount, icon: Trophy, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Ort. Başarı", value: `%${Math.round(avgProgress)}`, icon: TrendingUp, color: "text-purple-500", bg: "bg-purple-500/10" },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground animate-pulse">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
        <p className="font-bold text-sm tracking-widest uppercase opacity-50">Kütüphaneniz Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto pb-12">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 glass-premium p-8 border-primary/10 shadow-2xl shadow-primary/5">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest">
            <Sparkles className="w-3 h-3" />
            <span>Öğrenci Paneli</span>
          </div>
          <h2 className="text-3xl font-display font-extrabold text-foreground animate-slide-up">
            Hoş Geldin, <span className="text-gradient">{profile?.full_name?.split(' ')[0]}!</span>
          </h2>
          <p className="text-muted-foreground font-medium italic">Bugün yeni bir dünyaya kapı aralamaya ne dersin?</p>
        </div>
        <div className="flex items-center gap-4 bg-background/50 p-4 rounded-2xl border border-white/5 shadow-inner">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <LayoutDashboard className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-tighter">Aktiflik Durumu</p>
            <p className="text-sm font-bold text-foreground">Çevrimiçi & Aktif</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div 
            key={stat.label} 
            className="glass-premium p-6 hover:scale-[1.02] transition-all duration-300 animate-slide-up"
            style={{ animationDelay: `${idx * 0.1}s` }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color} shadow-lg`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <TrendingUp className="w-4 h-4 text-muted-foreground opacity-20" />
            </div>
            <p className="text-3xl font-display font-black text-foreground mb-1 tracking-tight">{stat.value}</p>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Book List - Spans 2 cols */}
        <div className="xl:col-span-2 space-y-6">
          <div className="flex items-center justify-between mb-2 px-2">
            <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
              <BookMarked className="w-5 h-5 text-primary" />
              Aktif Kitaplarım
            </h3>
            <span className="text-xs font-bold text-primary bg-primary/5 px-4 py-2 rounded-full border border-primary/10">
              {userBooks.length} Kitap Mevcut
            </span>
          </div>

          {userBooks.length === 0 ? (
            <div className="glass-premium p-16 text-center border-dashed border-2 border-primary/10">
              <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-6">
                <BookOpen className="w-10 h-10 text-muted-foreground/30" />
              </div>
              <h4 className="text-lg font-bold text-foreground mb-2 italic">Kütüphanen Henüz Boş</h4>
              <p className="text-muted-foreground max-w-xs mx-auto text-sm italic">
                Öğretmenin tarafından atanan kitaplar burada görünecek.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {userBooks.map((ub, idx) => (
                <div 
                  key={ub.id} 
                  className="glass-premium p-6 group hover:bg-white/50 dark:hover:bg-white/5 transition-all duration-500 animate-slide-up overflow-hidden relative"
                  style={{ animationDelay: `${idx * 0.15}s` }}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-primary/10 transition-colors" />
                  
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-16 h-24 bg-muted rounded-xl shadow-lg border border-white/10 overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform duration-500">
                      {ub.book.cover_url ? (
                        <img src={ub.book.cover_url} alt={ub.book.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                          <BookOpen className="w-6 h-6 text-foreground/20" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {ub.is_completed ? (
                          <div className="flex items-center gap-1 text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            <CheckCircle2 className="w-2.5 h-2.5" /> TAMAMLANDI
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 text-[9px] font-black uppercase bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full border border-blue-500/20">
                            <Play className="w-2.5 h-2.5" /> OKUNUYOR
                          </div>
                        )}
                      </div>
                      <h4 className="text-lg font-bold text-foreground truncate mb-1 group-hover:text-primary transition-colors leading-tight">
                        {ub.book.title}
                      </h4>
                      <p className="text-xs font-medium text-muted-foreground italic">
                        {ub.current_page} / {ub.book.total_pages} sayfa bitti
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                      <span className="text-muted-foreground">TOPLAM İlerleme</span>
                      <span className="text-primary">%{Math.round(Number(ub.progress_percent))}</span>
                    </div>
                    <div className="relative h-2.5 w-full bg-muted/30 rounded-full overflow-hidden border border-white/5">
                      <div 
                        className="absolute h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(var(--primary),0.3)]"
                        style={{ width: `${ub.progress_percent}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 pt-2">
                    <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground/60 italic leading-none">
                      <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {Math.round(Number(ub.total_minutes))} dk</span>
                      {ub.quiz_score !== null && <span className="text-emerald-500 animate-pulse">Quiz: %{Math.round(Number(ub.quiz_score))}</span>}
                    </div>
                    
                    {ub.is_completed && ub.quiz_score === null ? (
                      <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-500/20">
                        Quizi Başlat
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant={ub.is_completed ? "outline" : "default"}
                        onClick={() => navigate(`/dashboard/read/${ub.book.id}`)}
                        className={`rounded-xl px-4 py-0 h-10 font-bold transition-all ${!ub.is_completed && 'bg-primary shadow-lg shadow-primary/20 hover:scale-105 active:scale-95'}`}
                      >
                        {ub.is_completed ? "Tekrar Oku" : "Devam Et"}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Sidebar - Social / Achievements Placeholder */}
        <div className="space-y-8 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="glass-premium p-8 border-amber-500/10 shadow-2xl shadow-amber-500/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2">
              <Trophy className="w-12 h-12 text-amber-500/10 group-hover:rotate-12 transition-transform duration-700" />
            </div>
            <h4 className="text-lg font-bold text-foreground mb-6 italic tracking-tight">Haftalık Başarılar</h4>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-600 font-black">1</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate leading-none mb-1">En Çok Okuyan</p>
                  <p className="text-[11px] text-amber-600 font-black uppercase tracking-tighter">Okul Birincisi</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 opacity-50">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-black">2</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate leading-none mb-1 text-muted-foreground/60">Yolun Başında</p>
                  <p className="text-[11px] text-muted-foreground font-black uppercase tracking-tighter">95 Öğrenci Önünde</p>
                </div>
              </div>
            </div>
            <Button variant="ghost" className="w-full mt-6 text-xs font-bold text-muted-foreground uppercase tracking-widest hover:text-primary transition-colors">
              Tüm Başarıları Gör
            </Button>
          </div>

          <div className="glass-premium p-8 border-secondary/10 shadow-2xl shadow-secondary/5">
            <h4 className="text-lg font-bold text-foreground mb-6 italic tracking-tight">Hızlı Erişim</h4>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => navigate("/dashboard/messages")}
                className="flex flex-col items-center justify-center gap-3 p-4 rounded-2xl bg-secondary/5 border border-secondary/10 hover:bg-secondary/10 transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <LayoutDashboard className="w-5 h-5 text-secondary" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-secondary">Mesajlar</span>
              </button>
              <button 
                onClick={() => navigate("/dashboard/books")}
                className="flex flex-col items-center justify-center gap-3 p-4 rounded-2xl bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <BookMarked className="w-5 h-5 text-primary" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">Kütüphane</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const Loader2 = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);
