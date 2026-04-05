import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, BookOpen, TrendingUp, BarChart3, Clock, Sparkles, User, Monitor, Library, BookMarked, UserPlus, ClipboardList, Loader2 } from "lucide-react";
import SchoolLeaderboard from "../SchoolLeaderboard";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, books: 0, assignments: 0, totalMinutes: 0 });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAdminStats = async () => {
      const [{ count: users }, { count: books }, { count: assignments }, { data: userBooks }] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("books").select("*", { count: "exact", head: true }),
        supabase.from("assignments").select("*", { count: "exact", head: true }),
        supabase.from("user_books").select("total_minutes")
      ]);

      const totalMin = userBooks?.reduce((s, b) => s + Number(b.total_minutes), 0) || 0;

      setStats({
        users: users || 0,
        books: books || 0,
        assignments: assignments || 0,
        totalMinutes: totalMin
      });
      setLoading(false);
    };
    fetchAdminStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground animate-pulse">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-secondary" />
        <p className="font-display font-black text-xs uppercase tracking-[0.3em] opacity-30 italic">Yönetici Paneli Hazırlanıyor...</p>
      </div>
    );
  }

  const statCards = [
    { label: "Toplam Kullanıcı", value: stats.users, icon: Users, color: "text-blue-400", bg: "bg-blue-400/10", link: "/dashboard/users" },
    { label: "Kütüphane Kitabı", value: stats.books, icon: Library, color: "text-secondary", bg: "bg-secondary/10", link: "/dashboard/manage-books" },
    { label: "Aktif Ödevler", value: stats.assignments, icon: ClipboardList, color: "text-amber-500", bg: "bg-amber-500/10", link: "/dashboard/assignments" },
    { label: "Toplam Okuma (Dk)", value: Math.round(stats.totalMinutes), icon: Clock, color: "text-emerald-500", bg: "bg-emerald-500/10", link: "/dashboard/analytics" },
  ];

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 glass-premium p-8 border-primary/10 shadow-2xl shadow-primary/5">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/5 border border-secondary/10 text-secondary text-[10px] font-black uppercase tracking-widest leading-none">
            <Monitor className="w-3 h-3" />
            <span>Sistem Yönetim Üssü</span>
          </div>
          <h2 className="text-3xl font-display font-black text-foreground uppercase tracking-tight italic">Admin <span className="text-secondary">Dashboard</span></h2>
          <p className="text-muted-foreground font-medium italic">Akademinin tüm verilerini ve en başarılılarını buradan yönetin.</p>
        </div>
        <div className="flex items-center gap-3">
            <button className="px-6 py-3 rounded-2xl bg-secondary text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-secondary/20 hover:scale-[1.05] transition-all" onClick={() => navigate('/dashboard/analytics')}>DERİN ANALİTİK</button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {statCards.map((stat, idx) => (
                <div 
                  key={stat.label} 
                  className="glass-premium p-8 hover:scale-[1.02] transition-all duration-300 animate-slide-up group cursor-pointer" 
                  style={{ animationDelay: `${idx * 0.1}s` }}
                  onClick={() => navigate(stat.link)}
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color} shadow-lg group-hover:scale-110 transition-transform`}>
                            <stat.icon className="w-6 h-6" />
                        </div>
                        <TrendingUp className="w-4 h-4 text-muted-foreground opacity-20" />
                    </div>
                    <p className="text-3xl font-display font-black text-foreground mb-1 tracking-tight italic">{stat.value}</p>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60 leading-none">{stat.label}</p>
                </div>
                ))}
            </div>

            <div className="glass-premium p-8 border-dashed border-2 border-primary/10 flex flex-col items-center justify-center min-h-[300px] text-center space-y-6">
                <div className="w-20 h-20 bg-secondary/5 rounded-full flex items-center justify-center">
                    <Sparkles className="w-10 h-10 text-secondary/30" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-xl font-display font-black text-foreground uppercase italic tracking-tight leading-none">Veri Görselleştirme Hazır</h3>
                    <p className="text-sm text-muted-foreground italic font-medium">Sınıf bazlı ve öğrenci bazlı detaylı raporlara "Derin Analitik" sayfasından ulaşabilirsiniz.</p>
                </div>
                <button className="px-8 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-foreground transition-all" onClick={() => navigate('/dashboard/analytics')}>RAPORLARI AÇ</button>
            </div>
        </div>

        <div className="space-y-8 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <SchoolLeaderboard />
          
          <div className="glass-premium p-8 border-secondary/10 shadow-2xl shadow-secondary/10">
            <h4 className="text-sm font-black text-foreground mb-6 uppercase tracking-[0.2em] italic border-b border-secondary/10 pb-4">Yönetim Bilgisi</h4>
            <div className="space-y-4">
                <div className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-all cursor-default">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic leading-none">Veri Tabanı</span>
                    <span className="text-xs font-black text-emerald-500 uppercase">STABİL</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-all cursor-default">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic leading-none">Son Senkronizasyon</span>
                    <span className="text-xs font-black text-foreground uppercase">ŞİMDİ</span>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
