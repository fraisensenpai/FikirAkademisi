import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Users, BookOpen, TrendingUp, BarChart3, Clock, Sparkles, User, Monitor, Library, CheckCircle2, MessageSquare, History, Play } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import SchoolLeaderboard from "../SchoolLeaderboard";
import { useNavigate } from "react-router-dom";

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ students: 0, assignments: 0, avgProgress: 0 });
  const [studentProgress, setStudentProgress] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      // Get assignments by this teacher
      const { data: assignments } = await supabase
        .from("assignments")
        .select("id, target_class, book:books(title)")
        .eq("teacher_id", user.id);

      // Get student progress with NEW COLUMNS
      const { data: progress } = await (supabase as any)
        .from("user_books")
        .select(`
          progress_percent, 
          total_minutes, 
          current_page,
          manual_pages_read,
          manual_minutes_read,
          is_completed, 
          user:profiles(full_name, class_name), 
          book:books(title, total_pages)
        `);

      setStudentProgress((progress as any) || []);
      const avgProg = progress?.length
        ? progress.reduce((s: any, p: any) => s + Number(p.progress_percent), 0) / progress.length
        : 0;

      setStats({
        students: new Set(progress?.map((p: any) => p.user?.full_name)).size,
        assignments: assignments?.length || 0,
        avgProgress: avgProg,
      });
      setLoading(false);
    };
    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground animate-pulse">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-bold text-xs uppercase tracking-widest opacity-50 italic">Öğretmen Paneli Hazırlanıyor...</p>
      </div>
    );
  }

  const statCards = [
    { label: "Öğrenci Sayısı", value: stats.students, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Atanan Kitap", value: stats.assignments, icon: BookOpen, color: "text-secondary", bg: "bg-secondary/10" },
    { label: "Ort. İlerleme", value: `%${Math.round(stats.avgProgress)}`, icon: TrendingUp, color: "text-amber-500", bg: "bg-amber-500/10" },
  ];

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 glass-premium p-8 border-primary/10 shadow-2xl shadow-primary/5">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/5 border border-secondary/10 text-secondary text-[10px] font-black uppercase tracking-widest leading-none">
            <Sparkles className="w-3 h-3" />
            <span>Öğretmen Kontrol Merkezi</span>
          </div>
          <h2 className="text-3xl font-display font-black text-foreground uppercase tracking-tight italic">Hoca Paneli</h2>
          <p className="text-muted-foreground font-medium italic">Akademideki öğrencileri ve okul genelindeki başarı tablosunu takip edin.</p>
        </div>
        <div className="flex items-center gap-4 bg-background/50 p-4 rounded-2xl border border-white/5 shadow-inner">
          <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-secondary" />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-tighter">Sistem Durumu</p>
            <p className="text-sm font-bold text-foreground">Aktif & Stabil</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
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

            <div className="glass-premium border-white/5 shadow-2xl overflow-hidden">
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
                <h3 className="font-bold text-foreground flex items-center gap-3 uppercase tracking-widest text-sm">
                    <BarChart3 className="w-5 h-5 text-secondary" />
                    Öğrenci İlerlemeleri
                </h3>
                </div>
                
                {studentProgress.length === 0 ? (
                <div className="p-20 text-center text-muted-foreground italic font-medium opacity-50">Henüz veri akışı yok...</div>
                ) : (
                <div className="max-h-[500px] overflow-y-auto divide-y divide-white/5">
                    {studentProgress.map((sp, i) => {
                        const totalPages = sp.book?.total_pages || 1;
                        const manualPages = sp.manual_pages_read || 0;
                        const sitePages = Math.max(0, sp.current_page - manualPages);
                        const manualPercent = Math.min(100, (manualPages / totalPages) * 100);
                        const sitePercent = Math.min(100, (sitePages / totalPages) * 100);
                        const totalPercent = Math.round(Number(sp.progress_percent));

                        return (
                        <div key={i} className="p-6 flex flex-col md:flex-row md:items-center gap-6 hover:bg-white/5 transition-all group">
                            <div className="flex items-center gap-4 w-64 flex-shrink-0">
                                <div className="w-10 h-10 rounded-xl bg-background border border-white/10 flex items-center justify-center text-muted-foreground group-hover:text-secondary transition-colors">
                                    <User className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-bold text-foreground truncate uppercase text-sm leading-none mb-1 group-hover:text-secondary transition-colors italic">{sp.user?.full_name || "—"}</p>
                                    <p className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-tighter truncate">{sp.book?.title}</p>
                                </div>
                            </div>

                            <div className="flex-1 space-y-2">
                                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 leading-none">
                                    <div className="flex gap-2">
                                        <span className="flex items-center gap-1"><Monitor className="w-2.5 h-2.5 text-secondary" /> %{Math.round(sitePercent)}</span>
                                        <span className="flex items-center gap-1"><Library className="w-2.5 h-2.5 text-blue-400" /> %{Math.round(manualPercent)}</span>
                                    </div>
                                    <span className="text-foreground">TOPLAM: %{totalPercent}</span>
                                </div>
                                <div className="relative h-2 w-full bg-background rounded-full overflow-hidden border border-white/5">
                                    <div className="absolute h-full bg-secondary z-20" style={{ width: `${sitePercent}%` }} />
                                    <div className="absolute h-full bg-blue-400 opacity-60 z-10" style={{ width: `${sitePercent + manualPercent}%` }} />
                                </div>
                            </div>

                            <div className="flex items-center gap-4 w-24 justify-end">
                                <div className="text-right">
                                    <p className="text-sm font-black text-foreground leading-none mb-0.5">{Math.round(Number(sp.total_minutes))}</p>
                                    <p className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-tighter">DAKİKA</p>
                                </div>
                            </div>
                        </div>
                        );
                    })}
                </div>
                )}
            </div>
        </div>

        {/* School Leaderboard Sidebar */}
        <div className="space-y-8 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <SchoolLeaderboard />

          <div className="glass-premium p-8 border-secondary/10 shadow-2xl shadow-secondary/10">
            <h4 className="text-sm font-black text-foreground mb-6 uppercase tracking-[0.2em] italic border-b border-secondary/10 pb-4">Şubeler Arası Yarış</h4>
            <div className="space-y-4">
                <div className="flex items-center justify-between group cursor-default p-2 rounded-xl hover:bg-white/5 transition-all">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic">En Çalışkan Sınıf</span>
                    <span className="text-xs font-black text-secondary">9/A FEN</span>
                </div>
                <div className="flex items-center justify-between group cursor-default p-2 rounded-xl hover:bg-white/5 transition-all">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic">Okul Ortalaması</span>
                    <span className="text-xs font-black text-foreground">%{Math.round(stats.avgProgress)}</span>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
