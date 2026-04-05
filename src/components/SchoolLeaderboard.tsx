import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Star, BookOpen, Clock, Loader2, Gauge, MousePointer2 } from "lucide-react";

interface LeaderboardEntry {
  full_name: string;
  total_minutes: number;
  total_pages: number;
  completed_books: number;
  class_name: string;
}

type Category = 'total_minutes' | 'completed_books' | 'total_pages';

export default function SchoolLeaderboard() {
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<Category>('total_minutes');

  useEffect(() => {
    fetchLeaderboard();
  }, [activeCategory]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    const { data: stats } = await (supabase as any)
      .from("leaderboard_stats")
      .select("*")
      .order(activeCategory, { ascending: false })
      .limit(3);

    if (stats) {
      setData(stats);
    }
    setLoading(false);
  };

  const categories = [
    { id: 'total_minutes' as Category, label: 'SÜRE', icon: Clock, color: 'text-emerald-500' },
    { id: 'completed_books' as Category, label: 'KİTAP', icon: BookOpen, color: 'text-blue-500' },
    { id: 'total_pages' as Category, label: 'SAYFA', icon: Gauge, color: 'text-amber-500' },
  ];

  return (
    <div className="glass-premium p-8 border-amber-500/10 shadow-2xl shadow-amber-500/10 relative overflow-hidden group">
      {/* Background Decorative Element */}
      <div className="absolute top-0 right-0 p-2 opacity-10">
        <Trophy className="w-16 h-16 text-amber-500 group-hover:rotate-12 transition-transform duration-700" />
      </div>

      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between border-b border-amber-500/10 pb-4">
            <h4 className="text-sm font-black text-foreground uppercase tracking-[0.2em] italic">Şampiyonlar Kürsüsü</h4>
            <div className="flex gap-1">
                <div className="w-1 h-1 bg-amber-500 rounded-full animate-ping" />
                <div className="w-1 h-1 bg-amber-500 rounded-full" />
            </div>
        </div>

        {/* Category Tabs */}
        <div className="grid grid-cols-3 gap-2 p-1.5 bg-background/50 rounded-2xl border border-white/5">
            {categories.map((cat) => (
                <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`
                        flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-300 relative overflow-hidden
                        ${activeCategory === cat.id ? 'bg-secondary text-white shadow-xl shadow-secondary/20' : 'hover:bg-white/5 text-muted-foreground'}
                    `}
                >
                    <cat.icon className={`w-4 h-4 mb-1.5 ${activeCategory === cat.id ? 'text-white' : cat.color}`} />
                    <span className="text-[8px] font-black tracking-widest leading-none uppercase">{cat.label}</span>
                </button>
            ))}
        </div>

        {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-6 h-6 animate-spin text-secondary" />
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground italic opacity-50">Sıralanıyor...</p>
            </div>
        ) : (
            <div className="space-y-4">
                {data.map((entry, idx) => (
                <div 
                    key={idx} 
                    className={`
                    flex items-center gap-4 p-4 rounded-2xl transition-all duration-500 group/row relative overflow-hidden cursor-default
                    ${idx === 0 ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-white/5 border border-white/5 hover:bg-white/10'}
                    `}
                >
                    {/* Rank Badge */}
                    <div className={`
                    w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg shadow-lg transition-transform duration-500 group-hover/row:scale-110
                    ${idx === 0 ? 'bg-amber-500 text-white' : idx === 1 ? 'bg-slate-300 text-slate-700' : 'bg-orange-400/80 text-white'}
                    `}>
                    {idx === 0 ? <Trophy className="w-5 h-5" /> : idx + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <p className="text-sm font-black text-foreground truncate uppercase tracking-tight italic">
                            {entry.full_name}
                        </p>
                        {idx === 0 && <Star className="w-3 h-3 text-amber-500 fill-amber-500 animate-pulse" />}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-[9px] font-bold text-muted-foreground/60 uppercase">
                            <Clock className="w-2.5 h-2.5 text-secondary" /> {Math.round(entry.total_minutes)}dk
                        </span>
                        <span className="flex items-center gap-1 text-[9px] font-bold text-muted-foreground/60 uppercase">
                            <Gauge className="w-2.5 h-2.5 text-amber-500" /> {Math.round(entry.total_pages)}s
                        </span>
                    </div>
                    </div>

                    {/* Indicator Value */}
                    <div className="text-[10px] font-black text-foreground/80 bg-background/50 px-3 py-1.5 rounded-lg border border-white/5 tracking-widest leading-none shadow-sm">
                        {activeCategory === 'total_minutes' ? Math.round(entry.total_minutes) : activeCategory === 'completed_books' ? entry.completed_books : entry.total_pages}
                    </div>
                </div>
                ))}
            </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
        <div className="flex flex-col">
            <span className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-widest leading-none mb-1">Günün Parlayan Yıldızı</span>
            <span className="text-[10px] font-black text-secondary uppercase leading-none">
                {data[0]?.full_name || '—'}
            </span>
        </div>
        <MousePointer2 className="w-5 h-5 text-muted-foreground/20" />
      </div>
    </div>
  );
}
