import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { BookOpen, Clock, Trophy, TrendingUp, Sparkles, BookMarked, Play, CheckCircle2, LayoutDashboard, Monitor, Library, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import SchoolLeaderboard from "../SchoolLeaderboard";

interface UserBook {
  id: string;
  book_id: string;
  current_page: number;
  progress_percent: number;
  total_minutes: number;
  manual_pages_read: number;
  manual_minutes_read: number;
  is_completed: boolean;
  book: {
    title: string;
    description: string;
    total_pages: number;
    cover_url: string;
  };
}

export default function StudentDashboard() {
  const { user, profile } = useAuth();
  const [activeBooks, setActiveBooks] = useState<UserBook[]>([]);
  const [stats, setStats] = useState({ totalMinutes: 0, completedBooks: 0, avgProgress: 0 });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !profile) return;
    const fetchDashboardData = async () => {
      // 1. Önce bu öğrenciye atanmış ödevleri (kitap/film) al
      const { data: classAss } = await supabase
        .from("assignments")
        .select("book_id, movie_id")
        .eq("target_class", profile.class_name || "");
      
      const { data: persAss } = await (supabase as any)
        .from("assignments")
        .select("book_id, movie_id")
        .eq("target_student_id", user.id);

      const assignedBookIds = new Set([
        ...(classAss || []).map(a => a.book_id),
        ...(persAss || []).map(a => a.book_id)
      ].filter(Boolean));

      // 2. Sadece ödev olan kitapların okuma verilerini çek
      const { data, error } = await (supabase as any)
        .from("user_books")
        .select(`
          id, book_id, current_page, progress_percent, total_minutes, 
          manual_pages_read, manual_minutes_read, is_completed,
          book:books(title, total_pages, cover_url)
        `)
        .eq("user_id", user.id);

      if (error) {
        toast.error("Veriler alınırken hata oluştu: " + error.message);
      } else {
        // Atanmamış kitapları filtrele
        const filteredData = (data || []).filter((ub: any) => assignedBookIds.has(ub.book_id));
        setActiveBooks(filteredData);
        
        const totalMin = filteredData.reduce((s: any, b: any) => s + Number(b.total_minutes), 0) || 0;
        const compBooks = filteredData.filter((b: any) => b.is_completed).length || 0;
        const avgProg = filteredData.length 
          ? filteredData.reduce((s: any, b: any) => s + Number(b.progress_percent), 0) / filteredData.length 
          : 0;

        setStats({ totalMinutes: totalMin, completedBooks: compBooks, avgProgress: avgProg });
      }
      setLoading(false);
    };
    fetchDashboardData();
  }, [user, profile]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground animate-pulse">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-secondary" />
        <p className="font-display font-black text-xs uppercase tracking-[0.3em] opacity-30 italic">Fikir Akademisi Hazırlanıyor...</p>
      </div>
    );
  }

  const statCards = [
    { label: "Okuma Süresi", value: `${Math.round(stats.totalMinutes)} DK`, icon: Clock, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Biten Kitap", value: stats.completedBooks, icon: BookMarked, color: "text-secondary", bg: "bg-secondary/10" },
    { label: "Ortalama İlerleme", value: `%${Math.round(stats.avgProgress)}`, icon: TrendingUp, color: "text-amber-500", bg: "bg-amber-500/10" },
  ];

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto pb-12">
      {/* Header with Welcome Message */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 glass-premium p-8 border-primary/10 shadow-2xl shadow-primary/5">
        <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/5 border border-secondary/10 text-secondary text-[10px] font-black uppercase tracking-widest leading-none">
                <Sparkles className="w-3 h-3" />
                <span>Hoş Geldin, M. Emin Saraç AİHL Öğrencisi</span>
            </div>
            <h2 className="text-3xl font-display font-black text-foreground uppercase tracking-tight italic">
                Selam, <span className="text-secondary">{(profile as any)?.full_name?.split(' ')[0]}</span> 👋
            </h2>
            <p className="text-muted-foreground font-medium italic tracking-tight">Kaldığın yerden okumaya devam et ve zirveye tırman.</p>
        </div>
        <div className="flex items-center gap-4 bg-background/50 p-4 rounded-2xl border border-white/5 shadow-inner">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-blue-500" />
            </div>
            <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-tighter leading-none mb-1">Rütben</p>
                <p className="text-sm font-bold text-foreground italic uppercase">Genç Fikir Öncüsü</p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="xl:col-span-2 space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {statCards.map((stat, idx) => (
                <div key={stat.label} className="glass-premium p-6 hover:scale-[1.02] transition-all duration-300 animate-slide-up" style={{ animationDelay: `${idx * 0.1}s` }}>
                    <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color} shadow-lg`}>
                        <stat.icon className="w-6 h-6" />
                    </div>
                    <TrendingUp className="w-4 h-4 text-muted-foreground opacity-20" />
                    </div>
                    <p className="text-3xl font-display font-black text-foreground mb-1 tracking-tight italic">{stat.value}</p>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60 leading-none">{stat.label}</p>
                </div>
                ))}
            </div>

            {/* Reading List */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-xl font-display font-black text-foreground flex items-center gap-3 uppercase tracking-widest leading-none">
                        <BookOpen className="w-5 h-5 text-secondary" />
                        Okuma Listen
                    </h3>
                    <Button variant="ghost" size="sm" className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-secondary hover:bg-secondary/5" onClick={() => navigate('/dashboard/books')}>Tümünü Gör</Button>
                </div>
                
                {activeBooks.length === 0 ? (
                <div className="glass-premium p-16 text-center border-dashed border-2 border-primary/10 group cursor-pointer hover:bg-white/50 transition-all duration-500" onClick={() => navigate('/dashboard/books')}>
                    <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:bg-secondary/10 transition-all duration-500">
                        <Library className="w-10 h-10 text-muted-foreground/30 group-hover:text-secondary/40" />
                    </div>
                    <h4 className="text-lg font-display font-black text-foreground mb-2 italic tracking-tight uppercase">Henüz bir kitabın yok</h4>
                    <p className="text-muted-foreground max-w-xs mx-auto text-sm italic">Okumaya başlamak için kütüphaneye göz at ve bir kitap seç.</p>
                </div>
                ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {activeBooks.map((book) => {
                      const totalPages = book.book?.total_pages || 1;
                      const manualPages = book.manual_pages_read || 0;
                      const sitePages = Math.max(0, book.current_page - manualPages);
                      const manualPercent = Math.min(100, (manualPages / totalPages) * 100);
                      const sitePercent = Math.min(100, (sitePages / totalPages) * 100);
                      const totalPercent = Math.round(Number(book.progress_percent));

                      return (
                        <div key={book.id} className="glass-premium p-6 group hover:border-secondary/20 transition-all duration-500 animate-slide-up bg-white/5 hover:bg-white/10 shadow-xl relative overflow-hidden">
                            {/* Accent Background */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-secondary/10 transition-colors" />

                            <div className="flex gap-6 relative z-10">
                            <div className="w-24 h-32 flex-shrink-0 relative group/cover rounded-xl overflow-hidden shadow-2xl">
                                {book.book?.cover_url ? (
                                <img src={book.book.cover_url} alt={book.book?.title} className="w-full h-full object-cover group-hover/cover:scale-110 transition-transform duration-700" />
                                ) : (
                                <div className="w-full h-full bg-secondary/10 flex items-center justify-center text-secondary">
                                    <BookOpen className="w-8 h-8 opacity-20" />
                                </div>
                                )}
                                {book.is_completed && (
                                    <div className="absolute inset-0 bg-emerald-500/80 flex items-center justify-center backdrop-blur-sm animate-fade-in">
                                        <CheckCircle2 className="w-8 h-8 text-white" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                                <div>
                                    <h4 className="font-display font-black text-foreground group-hover:text-secondary transition-colors text-lg uppercase tracking-tight leading-tight line-clamp-1 italic mb-1">
                                        {book.book?.title}
                                    </h4>
                                    <div className="flex items-center gap-3">
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest ${book.is_completed ? 'bg-emerald-500/10 text-emerald-500' : 'bg-secondary/10 text-secondary'}`}>
                                            {book.is_completed ? 'Tamamlandı' : 'Okunuyor'}
                                        </span>
                                        <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tighter">
                                            {book.current_page} / {totalPages} SAYFA
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="space-y-2 mt-4">
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 leading-none">
                                        <div className="flex gap-2">
                                            <span className="flex items-center gap-1"><Monitor className="w-2.5 h-2.5 text-secondary" /> %{Math.round(sitePercent)}</span>
                                            {manualPercent > 0 && <span className="flex items-center gap-1"><Library className="w-2.5 h-2.5 text-blue-400" /> %{Math.round(manualPercent)}</span>}
                                        </div>
                                        <span className="text-foreground">%{totalPercent}</span>
                                    </div>
                                    <div className="relative h-2 w-full bg-background rounded-full overflow-hidden border border-white/5">
                                        <div className="absolute h-full bg-secondary z-20 shadow-[0_0_8px_rgba(var(--secondary),0.3)] transition-all duration-1000" style={{ width: `${sitePercent}%` }} />
                                        <div className="absolute h-full bg-blue-400 opacity-60 z-10 transition-all duration-1000" style={{ width: `${sitePercent + manualPercent}%` }} />
                                    </div>
                                </div>

                                <Button 
                                    size="sm" 
                                    className={`w-full h-10 mt-4 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all shadow-lg ${book.is_completed ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20' : 'bg-secondary hover:bg-secondary/80 text-white shadow-secondary/20'}`}
                                    onClick={() => navigate(`/dashboard/read/${book.book_id}`)}
                                >
                                    <Play className="w-3 h-3 mr-2 fill-current" />
                                    {book.is_completed ? 'Tekrar Göz At' : 'Okumaya Devam Et'}
                                </Button>
                            </div>
                            </div>
                        </div>
                      );
                    })}
                </div>
                )}
            </div>
        </div>

        {/* Sidebar Achievements */}
        <div className="space-y-8 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <SchoolLeaderboard />

          <div className="glass-premium p-8 border-secondary/10 shadow-2xl shadow-secondary/10 relative overflow-hidden group">
            <h4 className="text-sm font-black text-foreground mb-6 uppercase tracking-[0.2em] italic border-b border-secondary/10 pb-4">Senin Durumun</h4>
            <div className="space-y-6">
                <div className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-all">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        </div>
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic">Kitap Hedefi</span>
                    </div>
                    <span className="text-xs font-black text-foreground">%{Math.round(stats.avgProgress)}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-all">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <Library className="w-4 h-4 text-blue-500" />
                        </div>
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic">Kütüphane Sıran</span>
                    </div>
                    <span className="text-xs font-black text-foreground">#12</span>
                </div>
            </div>
            <div className="mt-8">
                <Button className="w-full rounded-2xl bg-secondary/10 hover:bg-secondary/20 text-secondary border border-secondary/10 font-black uppercase tracking-widest text-[10px] h-12" onClick={() => navigate('/dashboard/analytics')}>TÜMİSTATİSTİKLER</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
