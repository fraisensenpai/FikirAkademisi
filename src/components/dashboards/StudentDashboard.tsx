import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { BookOpen, Clock, Trophy, TrendingUp, Sparkles, BookMarked, Play, CheckCircle2, LayoutDashboard, Monitor, Library, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface UserBook {
  id: string;
  book_id: string;
  current_page: number;
  progress_percent: number;
  total_minutes: number;
  manual_pages_read: number;
  manual_minutes_read: number;
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
        const { data, error } = await (supabase as any)
          .from("user_books")
          .select("*, book:books(id, title, total_pages, cover_url)")
          .eq("user_id", user.id);
        
        if (error) throw error;
        setUserBooks((data as any) || []);
      } catch (err: any) {
        toast.error("Veriler alınırken bir hata oluştu: " + err.message);
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
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-secondary" />
        <p className="font-bold text-sm tracking-widest uppercase opacity-50 italic">Kütüphaneniz Hazırlanıyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto pb-12">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 glass-premium p-8 border-primary/10 shadow-2xl shadow-primary/5">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/5 border border-secondary/10 text-secondary text-[10px] font-black uppercase tracking-widest leading-none">
            <Sparkles className="w-3 h-3" />
            <span>Öğrenci Paneli</span>
          </div>
          <h2 className="text-3xl font-display font-black text-foreground animate-slide-up leading-[1.1] uppercase tracking-tight">
            Merhaba, <span className="text-gradient">{(profile as any)?.full_name?.split(' ')[0]}</span>
          </h2>
          <p className="text-muted-foreground font-medium italic">Bugün yeni bir dünyaya kapı aralamaya ne dersin?</p>
        </div>
        <div className="flex items-center gap-4 bg-background/50 p-4 rounded-2xl border border-white/5 shadow-inner">
          <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
            <LayoutDashboard className="w-6 h-6 text-secondary" />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-tighter">Okuma Modu</p>
            <p className="text-sm font-bold text-foreground">Aktif & Odaklanmış</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div 
            key={stat.label} 
            className="glass-premium p-6 hover:scale-[1.02] transition-all duration-300 animate-slide-up border-white/5 shadow-xl"
            style={{ animationDelay: `${idx * 0.1}s` }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color} shadow-lg`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <TrendingUp className="w-4 h-4 text-muted-foreground opacity-20" />
            </div>
            <p className="text-3xl font-display font-black text-foreground mb-1 tracking-tight italic">{stat.value}</p>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60 leading-none">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Book List - Spans 2 cols */}
        <div className="xl:col-span-2 space-y-6">
          <div className="flex items-center justify-between mb-2 px-2">
            <h3 className="text-xl font-bold text-foreground flex items-center gap-2 uppercase tracking-widest text-sm">
              <BookMarked className="w-5 h-5 text-secondary" />
              Aktif Kitaplarım
            </h3>
            <span className="text-[10px] font-black text-secondary bg-secondary/5 px-4 py-2 rounded-full border border-secondary/10 tracking-widest uppercase italic">
              {userBooks.length} Kitap Mevcut
            </span>
          </div>

          {userBooks.length === 0 ? (
            <div className="glass-premium p-16 text-center border-dashed border-2 border-primary/10">
              <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                <BookOpen className="w-10 h-10 text-muted-foreground/30" />
              </div>
              <h4 className="text-sm font-black text-foreground mb-1 italic tracking-widest uppercase">Kütüphanen Henüz Boş</h4>
              <p className="text-muted-foreground max-w-xs mx-auto text-xs italic tracking-tight font-medium opacity-60">
                Hocan tarafından atanan kitaplar burada görünecek.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {userBooks.map((ub, idx) => {
                const totalPages = ub.book?.total_pages || 1;
                const manualPages = ub.manual_pages_read || 0;
                const sitePages = Math.max(0, ub.current_page - manualPages);
                
                const manualPercent = Math.min(100, (manualPages / totalPages) * 100);
                const sitePercent = Math.min(100, (sitePages / totalPages) * 100);
                const totalPercent = Math.round(Number(ub.progress_percent));

                return (
                  <div 
                    key={ub.id} 
                    className="glass-premium p-6 group hover:bg-white/50 dark:hover:bg-white/5 transition-all duration-500 animate-slide-up overflow-hidden relative border-white/5 shadow-2xl"
                    style={{ animationDelay: `${idx * 0.15}s` }}
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-secondary/10 transition-colors" />
                    
                    <div className="flex items-start gap-4 mb-6">
                      <div className="w-16 h-24 bg-muted rounded-xl shadow-lg border border-white/10 overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform duration-500 cursor-pointer" onClick={() => navigate(`/dashboard/read/${ub.book.id}`)}>
                        {ub.book.cover_url ? (
                          <img src={ub.book.cover_url} alt={ub.book.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-secondary/20 to-blue-500/20">
                            <BookOpen className="w-6 h-6 text-foreground/20" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {ub.is_completed ? (
                            <div className="flex items-center gap-1 text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full border border-emerald-500/20 shadow-sm">
                              <CheckCircle2 className="w-2.5 h-2.5" /> TAMAMLANDI
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1 text-[9px] font-black uppercase bg-secondary/10 text-secondary px-3 py-1 rounded-full border border-secondary/20 shadow-sm animate-pulse">
                              <Play className="w-2.5 h-2.5" /> OKUNUYOR
                            </div>
                          )}
                        </div>
                        <h4 className="text-lg font-black text-foreground truncate mb-1 group-hover:text-secondary transition-colors italic leading-none tracking-tight">
                          {ub.book.title}
                        </h4>
                        <p className="text-[10px] font-black text-muted-foreground/60 tracking-widest uppercase leading-none italic">
                          {ub.current_page} / {ub.book.total_pages} SAYFA
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3 mb-6 bg-background/30 p-4 rounded-2xl border border-white/5">
                        <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 leading-none">
                            <div className="flex gap-2">
                                <span className="flex items-center gap-1"><Monitor className="w-3 h-3 text-secondary" /> %{Math.round(sitePercent)}</span>
                                <span className="flex items-center gap-1"><Library className="w-3 h-3 text-blue-400" /> %{Math.round(manualPercent)}</span>
                            </div>
                            <span className="text-foreground">TOPLAM: %{totalPercent}</span>
                        </div>
                        <div className="relative h-2.5 w-full bg-muted rounded-full overflow-hidden border border-white/5">
                            <div 
                                className="absolute h-full bg-secondary shadow-[0_0_8px_rgba(var(--secondary),0.4)] transition-all duration-1000 ease-out z-20"
                                style={{ width: `${sitePercent}%` }}
                            />
                            <div 
                                className="absolute h-full bg-blue-400 opacity-70 transition-all duration-1000 ease-out z-10"
                                style={{ width: `${sitePercent + manualPercent}%` }}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 pt-2">
                      <div className="flex flex-col gap-1 text-[10px] font-black text-muted-foreground/60 italic leading-none">
                        <span className="flex items-center gap-1.5 uppercase tracking-tighter"><Clock className="w-3 h-3 text-secondary" /> {Math.round(Number(ub.total_minutes))} dk OKUMA</span>
                        {ub.quiz_score !== null && <span className="text-emerald-500 uppercase tracking-tighter shadow-emerald-500/20">Quiz Puanı: %{Math.round(Number(ub.quiz_score))}</span>}
                      </div>
                      
                      {ub.is_completed && ub.quiz_score === null ? (
                        <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-500/20 border-none font-bold uppercase text-[10px]">
                          Quizi Başlat
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant={ub.is_completed ? "outline" : "default"}
                          onClick={() => navigate(`/dashboard/read/${ub.book.id}`)}
                          className={`rounded-xl px-6 h-10 font-black uppercase text-[10px] tracking-widest transition-all ${!ub.is_completed ? 'bg-secondary text-white shadow-xl shadow-secondary/20 hover:scale-105 active:scale-95 border-none' : 'hover:bg-secondary hover:text-white border-white/10'}`}
                        >
                          {ub.is_completed ? "Tekrar Oku" : "DEVAM ET 🔥"}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Sidebar - Achievements Placeholder */}
        <div className="space-y-8 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="glass-premium p-8 border-amber-500/10 shadow-2xl shadow-amber-500/10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 opacity-10">
              <Trophy className="w-16 h-16 text-amber-500 group-hover:rotate-12 transition-transform duration-700" />
            </div>
            <h4 className="text-sm font-black text-foreground mb-6 uppercase tracking-[0.2em] italic border-b border-amber-500/10 pb-4">Haftalık Başarılar</h4>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 hover:bg-amber-500/10 transition-colors cursor-pointer group">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-600 font-black text-xl shadow-lg shadow-amber-500/10 group-hover:scale-110 transition-all">1</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-foreground truncate leading-none mb-1 uppercase tracking-tighter">En Çok Okuyan</p>
                  <p className="text-[10px] text-amber-600 font-black uppercase tracking-tighter opacity-80">Okul Birincisi 🏆</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 opacity-40 hover:opacity-100 transition-opacity cursor-not-allowed group">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground font-black text-xl shadow-inner">2</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-foreground truncate leading-none mb-1 uppercase tracking-tighter text-muted-foreground/60">Yolun Başında</p>
                  <p className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter opacity-50">95 Öğrenci Önünde</p>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-premium p-8 border-secondary/10 shadow-2xl shadow-secondary/10">
            <h4 className="text-sm font-black text-foreground mb-6 uppercase tracking-[0.2em] italic border-b border-secondary/10 pb-4">Hızlı Erişim</h4>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => navigate("/dashboard/messages")}
                className="flex flex-col items-center justify-center gap-3 p-5 rounded-2xl bg-secondary/5 border border-secondary/10 hover:bg-secondary/10 transition-all group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg relative z-10">
                  <MessageSquare className="w-5 h-5 text-secondary" />
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-secondary relative z-10">Mesajlar</span>
              </button>
              <button 
                onClick={() => navigate("/dashboard/books")}
                className="flex flex-col items-center justify-center gap-3 p-5 rounded-2xl bg-blue-500/5 border border-blue-500/10 hover:bg-blue-500/10 transition-all group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg relative z-10">
                  <Library className="w-5 h-5 text-blue-500" />
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-blue-500 relative z-10">Kitaplık</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const MessageSquare = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
);
