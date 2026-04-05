import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, Users, TrendingUp, BookOpen, Clock, Calendar, CheckCircle2, Search, Filter, Monitor, Library, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface ClassStat {
  className: string;
  avgProgress: number;
  totalMinutes: number;
  studentCount: number;
  completedBooks: number;
  students: any[];
}

export default function Analytics() {
  const [classStats, setClassStats] = useState<ClassStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    const { data, error } = await (supabase as any)
      .from("user_books")
      .select(`
        progress_percent, 
        total_minutes, 
        is_completed,
        current_page,
        manual_pages_read,
        user:profiles(full_name, class_name, school_number),
        book:books(title, total_pages)
      `);

    if (error) {
      toast.error("İstatistikler alınırken hata oluştu: " + error.message);
      setLoading(false);
      return;
    }

    if (!data) { setLoading(false); return; }

    const byClass: Record<string, any> = {};
    
    data.forEach((d: any) => {
      const cls = d.user?.class_name || "Belirtilmemiş";
      if (!byClass[cls]) {
        byClass[cls] = { 
          className: cls, 
          totalProgress: 0, 
          count: 0, 
          totalMinutes: 0,
          completedBooks: 0,
          students: {} 
        };
      }
      
      const studentName = d.user?.full_name || "—";
      if (!byClass[cls].students[studentName]) {
        byClass[cls].students[studentName] = { 
          name: studentName, 
          schoolNo: d.user?.school_number,
          totalMinutes: 0, 
          books: [] 
        };
      }

      const manualPages = d.manual_pages_read || 0;
      const sitePages = Math.max(0, d.current_page - manualPages);
      const totalPages = d.book?.total_pages || 1;

      byClass[cls].totalProgress += Number(d.progress_percent);
      byClass[cls].count++;
      byClass[cls].totalMinutes += Number(d.total_minutes);
      if (d.is_completed) byClass[cls].completedBooks++;
      
      byClass[cls].students[studentName].totalMinutes += Number(d.total_minutes);
      byClass[cls].students[studentName].books.push({
        title: d.book?.title,
        progress: d.progress_percent,
        sitePercent: (sitePages / totalPages) * 100,
        manualPercent: (manualPages / totalPages) * 100,
        isCompleted: d.is_completed
      });
    });

    const stats = Object.entries(byClass).map(([cls, info]: [any, any]) => ({
      className: cls,
      avgProgress: info.count ? info.totalProgress / info.count : 0,
      totalMinutes: info.totalMinutes,
      studentCount: Object.keys(info.students).length,
      completedBooks: info.completedBooks,
      students: Object.values(info.students)
    })).sort((a, b) => b.avgProgress - a.avgProgress);

    setClassStats(stats);
    setLoading(false);
  };

  const filteredStats = classStats.filter(cs => 
    cs.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cs.students.some(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-muted-foreground animate-pulse">
        <Loader2 className="w-10 h-10 animate-spin mb-4 text-secondary" />
        <p className="font-display font-black text-xs uppercase tracking-[0.3em] opacity-30 italic">Veri Motoru Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 glass-premium p-8 border-primary/10 shadow-2xl shadow-primary/5">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/5 border border-secondary/10 text-secondary text-[10px] font-black uppercase tracking-widest leading-none">
            <BarChart3 className="w-3 h-3" />
            <span>Genel Akademi İstatistikleri</span>
          </div>
          <h2 className="text-3xl font-display font-black text-foreground uppercase tracking-tight italic">Analitik <span className="text-secondary">&</span> Raporlar</h2>
          <p className="text-muted-foreground font-medium italic tracking-tight">Tüm sınıfların ve öğrencilerin okuma performansını derinlemesine inceleyin.</p>
        </div>
        <div className="flex items-center gap-4 bg-background/50 p-4 rounded-2xl border border-white/5 shadow-inner">
          <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-secondary" />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-tighter leading-none mb-1">Akademi Verimliliği</p>
            <p className="text-sm font-bold text-foreground">%{Math.round(classStats.reduce((s, c) => s + c.avgProgress, 0) / (classStats.length || 1))}</p>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative group flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-secondary transition-colors" />
          <Input 
            placeholder="Sınıf veya öğrenci ismi ile süzgeçten geçirin..."
            className="pl-11 h-14 rounded-2xl bg-background/50 border-white/10 shadow-sm focus:ring-2 ring-secondary/20 font-medium"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 bg-background/50 p-1.5 rounded-2xl border border-white/10">
            <button className="px-6 py-3 rounded-xl bg-secondary text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-secondary/20">TÜM SINIFLAR</button>
            <button className="px-6 py-3 rounded-xl hover:bg-white/5 text-[10px] font-black uppercase tracking-widest text-muted-foreground transition-all">AKTİF ŞUBELER</button>
        </div>
      </div>

      {/* Class Statistics Grid */}
      <div className="grid grid-cols-1 gap-8">
        {filteredStats.length === 0 ? (
          <div className="glass-premium p-20 text-center border-dashed border-2 border-primary/10">
            <Filter className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground font-black uppercase tracking-widest text-xs italic">Sonuç Bulunamadı</p>
          </div>
        ) : (
          filteredStats.map((cs, idx) => (
            <div key={cs.className} className="glass-premium overflow-hidden group hover:border-secondary/20 transition-all duration-500 animate-slide-up" style={{ animationDelay: `${idx * 0.1}s` }}>
              {/* Class Header */}
              <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 bg-white/5">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary font-black text-xl shadow-inner border border-secondary/10 group-hover:scale-110 transition-transform duration-500">
                    {cs.className.substring(0, 2)}
                  </div>
                  <div>
                    <h3 className="text-2xl font-display font-black text-foreground italic uppercase tracking-tight">{cs.className} Şubesi</h3>
                    <div className="flex flex-wrap items-center gap-4 mt-1">
                      <span className="flex items-center gap-1.5 text-xs font-black text-muted-foreground uppercase tracking-widest"><Users className="w-4 h-4 text-blue-400" /> {cs.studentCount} Öğrenci</span>
                      <span className="flex items-center gap-1.5 text-xs font-black text-muted-foreground uppercase tracking-widest"><Clock className="w-4 h-4 text-emerald-400" /> {Math.round(cs.totalMinutes)} Dk.</span>
                      <span className="flex items-center gap-1.5 text-xs font-black text-muted-foreground uppercase tracking-widest"><CheckCircle2 className="w-4 h-4 text-amber-500" /> {cs.completedBooks} Biten Kitap</span>
                    </div>
                  </div>
                </div>
                <div className="w-full md:w-64 space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 leading-none">
                        <span>ORTALAMA İLERLEME</span>
                        <span className="text-foreground">%{Math.round(cs.avgProgress)}</span>
                    </div>
                    <div className="relative h-2.5 w-full bg-background rounded-full overflow-hidden border border-white/5">
                        <div 
                          className="absolute h-full bg-secondary shadow-[0_0_10px_rgba(var(--secondary),0.4)] transition-all duration-1000 ease-out"
                          style={{ width: `${cs.avgProgress}%` }}
                        />
                    </div>
                </div>
              </div>

              {/* Student Detail List */}
              <ScrollArea className="h-max max-h-[400px]">
                <div className="p-2 md:p-4">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 leading-none">Öğrenci Adı / No</th>
                        <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 leading-none text-center">Okunan Kitaplar & Kaynaklar</th>
                        <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 leading-none text-right">Performans</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {cs.students.map((student: any) => (
                        <tr key={student.name} className="hover:bg-white/5 transition-colors group/row">
                          <td className="p-4">
                            <p className="font-bold text-foreground group-hover/row:text-secondary transition-colors text-sm uppercase leading-none mb-1">{student.name}</p>
                            <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest italic">{student.schoolNo || '...'}</p>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-wrap gap-2 justify-center">
                              {student.books.map((b: any, bi: number) => (
                                <div key={bi} className="relative w-32 group/book">
                                    <div className="flex justify-between items-center text-[8px] font-black text-muted-foreground/60 mb-1 leading-none uppercase truncate">
                                        <span className="truncate">{b.title}</span>
                                        <span className="text-foreground">%{Math.round(b.progress)}</span>
                                    </div>
                                    <div className="relative h-1.5 w-full bg-background rounded-full overflow-hidden border border-white/5">
                                        <div className="absolute h-full bg-secondary z-10" style={{ width: `${b.sitePercent}%` }} />
                                        <div className="absolute h-full bg-blue-400 opacity-60" style={{ width: `${b.sitePercent + b.manualPercent}%` }} />
                                    </div>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="p-4 text-right">
                             <div className="inline-flex flex-col items-end">
                                <span className="text-sm font-black text-foreground italic flex items-center gap-1.5"><Clock className="w-3 h-3 text-emerald-400" /> {Math.round(student.totalMinutes)} <span className="text-[10px] opacity-40 not-italic">DK</span></span>
                                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">{student.books.length} Aktif Kitap</span>
                             </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ScrollArea>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
