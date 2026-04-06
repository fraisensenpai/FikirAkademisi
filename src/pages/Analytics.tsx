import { useEffect, useState, Fragment } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, Users, TrendingUp, BookOpen, Clock, CheckCircle2, Search, Filter, Monitor, Library, Loader2, ChevronDown, ChevronUp, User, BookMarked, Brain } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface StudentBook {
  title: string;
  progress: number;
  sitePercent: number;
  manualPercent: number;
  isCompleted: boolean;
  minutes: number;
}

interface StudentProfile {
  id: string;
  name: string;
  schoolNo: string;
  className: string;
  totalMinutes: number;
  books: StudentBook[];
}

interface ClassStat {
  className: string;
  avgProgress: number;
  totalMinutes: number;
  studentCount: number;
  completedBooks: number;
  students: StudentProfile[];
}

export default function Analytics() {
  const [classStats, setClassStats] = useState<ClassStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    const { data, error } = await (supabase as any)
      .from("profiles")
      .select(`
        id, full_name, class_name, school_number,
        user_books(
          progress_percent, 
          total_minutes, 
          is_completed,
          current_page,
          manual_pages_read,
          book:books(title, total_pages)
        )
      `)
      .eq('role', 'student');

    if (error) {
      toast.error("İstatistikler alınırken hata oluştu: " + error.message);
      setLoading(false);
      return;
    }

    if (!data) { setLoading(false); return; }

    const byClass: Record<string, any> = {};
    
    data.forEach((studentData: any) => {
      const cls = studentData.class_name || "Sınıfı Yok";
      if (!byClass[cls]) {
        byClass[cls] = { 
          className: cls, 
          totalProgress: 0, 
          count: 0,
          totalMinutes: 0,
          completedBooks: 0,
          students: [] 
        };
      }
      
      const stBooks = studentData.user_books || [];
      let stMinutes = 0;
      let stProgressSum = 0;
      
      const processedBooks = stBooks.map((d: any) => {
        const manualPages = d.manual_pages_read || 0;
        const totalPages = d.book?.total_pages || 1;
        const sitePages = Math.max(0, d.current_page - manualPages);
        
        stMinutes += Number(d.total_minutes);
        stProgressSum += Number(d.progress_percent);
        if (d.is_completed) byClass[cls].completedBooks++;
        
        return {
          title: d.book?.title || "Bilinmeyen Kitap",
          progress: Number(d.progress_percent),
          sitePercent: Math.min(100, (sitePages / totalPages) * 100),
          manualPercent: Math.min(100, (manualPages / totalPages) * 100),
          isCompleted: d.is_completed,
          minutes: Number(d.total_minutes)
        };
      });

      byClass[cls].totalMinutes += stMinutes;
      // Calculate average progress for this student if they have books
      if (stBooks.length > 0) {
        byClass[cls].totalProgress += (stProgressSum / stBooks.length);
        byClass[cls].count++;
      }

      byClass[cls].students.push({
        id: studentData.id,
        name: studentData.full_name || "İsimsiz",
        schoolNo: studentData.school_number || "—",
        className: cls,
        totalMinutes: stMinutes,
        books: processedBooks
      });
    });

    const stats = Object.entries(byClass).map(([cls, info]: [any, any]) => ({
      className: cls,
      avgProgress: info.count ? info.totalProgress / info.count : 0,
      totalMinutes: info.totalMinutes,
      studentCount: info.students.length, // Count every registered student
      completedBooks: info.completedBooks,
      students: info.students.sort((a: any, b: any) => b.totalMinutes - a.totalMinutes)
    })).sort((a, b) => b.avgProgress - a.avgProgress);

    setClassStats(stats);
    setLoading(false);
  };

  const filteredStats = classStats.map(cs => ({
    ...cs,
    students: cs.students.filter((s: any) => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.schoolNo?.includes(searchTerm)
    )
  })).filter(cs => cs.className.toLowerCase().includes(searchTerm.toLowerCase()) || cs.students.length > 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-12 h-12 text-secondary animate-spin" />
        <p className="text-secondary font-black uppercase tracking-[0.2em] animate-pulse">SİSTEM VERİLERİ ÇEKİLİYOR...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto pb-12">
      {/* Header and Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 glass-premium p-6 md:p-8 border-primary/10 shadow-2xl shadow-primary/5">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/5 border border-secondary/10 text-secondary text-[10px] font-black uppercase tracking-widest leading-none">
            <BarChart3 className="w-3 h-3" />
            <span>Derin Veri Madenciliği</span>
          </div>
          <h2 className="text-3xl font-display font-black text-foreground uppercase tracking-tight italic">İstatistikler <span className="text-secondary">&</span> Sınıflar</h2>
        </div>
        
        <div className="relative w-full md:w-80 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Sınıf, Öğrenci veya Numara ara..." 
            className="pl-11 h-12 rounded-2xl bg-background border-white/5 focus:bg-background/50 transition-all font-bold tracking-tight text-sm shadow-inner"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
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
                      <span className="flex items-center gap-1.5 text-xs font-black text-muted-foreground uppercase tracking-widest"><Users className="w-4 h-4 text-blue-400" /> {cs.studentCount} Kayıtlı Öğrenci</span>
                      <span className="flex items-center gap-1.5 text-xs font-black text-muted-foreground uppercase tracking-widest"><Clock className="w-4 h-4 text-emerald-400" /> {Math.round(cs.totalMinutes)} Dk. Toplam</span>
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
              <div className="p-2 md:p-4">
                <table className="w-full text-left border-separate border-spacing-y-2">
                  <thead>
                    <tr>
                      <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 leading-none">Öğrenci Adı / No</th>
                      <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 leading-none text-center hidden md:table-cell">Genel İlerleme</th>
                      <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 leading-none text-right">Durum</th>
                    </tr>
                  </thead>
                  <tbody className="">
                    {cs.students.map((student: StudentProfile) => (
                      <Fragment key={student.id}>
                        {/* Summary Row (Clickable) */}
                        <tr 
                          onClick={() => setExpandedStudent(expandedStudent === student.id ? null : student.id)}
                          className={`
                            hover:bg-white/5 transition-colors group/row cursor-pointer rounded-2xl
                            ${expandedStudent === student.id ? 'bg-secondary/5 border-l-2 border-secondary' : 'border-l-2 border-transparent'}
                          `}
                        >
                          <td className="p-4 rounded-l-xl">
                            <p className="font-bold text-foreground group-hover/row:text-secondary transition-colors text-sm uppercase leading-none mb-1 flex items-center gap-2">
                                {student.name}
                                {student.books.length === 0 && <span className="px-1.5 py-0.5 rounded-sm bg-destructive/10 text-destructive text-[8px] tracking-widest">KİTABI YOK</span>}
                            </p>
                            <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest italic">{student.schoolNo || 'Numarasız'}</p>
                          </td>
                          <td className="p-4 hidden md:table-cell align-middle">
                            {student.books.length > 0 ? (
                              <div className="relative h-1.5 w-32 mx-auto bg-background rounded-full overflow-hidden border border-white/5">
                                 <div className="absolute h-full bg-secondary z-10" style={{ width: `${student.books.reduce((sum, b) => sum + b.progress, 0) / student.books.length}%` }} />
                              </div>
                            ) : (
                                <p className="text-center text-[10px] font-bold text-muted-foreground/30 uppercase">—</p>
                            )}
                          </td>
                          <td className="p-4 text-right rounded-r-xl">
                             <div className="inline-flex items-center gap-4 justify-end w-full">
                                <div className="text-right">
                                    <span className="text-sm font-black text-foreground italic flex items-center gap-1.5 justify-end">
                                      <Clock className="w-3 h-3 text-emerald-400" /> {Math.round(student.totalMinutes)} <span className="text-[10px] opacity-40 not-italic">DK</span>
                                    </span>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">{student.books.length} Ekli Kitap</span>
                                </div>
                                <div className="w-6 h-6 flex items-center justify-center text-muted-foreground group-hover/row:text-secondary">
                                    {expandedStudent === student.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </div>
                             </div>
                          </td>
                        </tr>

                        {/* Portfolio Expansion */}
                        {expandedStudent === student.id && (
                          <tr className="bg-background/20 relative shadow-inner">
                            <td colSpan={3} className="p-6 md:p-8 rounded-xl border border-white/5 my-2">
                                <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
                                    <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
                                        <Brain className="w-4 h-4 text-secondary" />
                                    </div>
                                    <h4 className="text-sm font-display font-black text-foreground uppercase tracking-widest italic">Öğrenci Portfolyosu</h4>
                                </div>

                                {student.books.length === 0 ? (
                                    <div className="text-center p-8 bg-white/5 rounded-2xl border border-dashed border-white/10">
                                        <p className="text-xs text-muted-foreground font-black uppercase tracking-widest italic">Öğrenci henüz hiçbir kitaba başlamamış.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {student.books.map((b, bi) => (
                                            <div key={bi} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-between group">
                                                <div>
                                                    <div className="flex items-start justify-between gap-2 mb-2">
                                                        <h5 className="text-xs font-bold text-foreground line-clamp-2 uppercase italic">{b.title}</h5>
                                                        {b.isCompleted && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                                                    </div>
                                                </div>
                                                <div className="space-y-4 mt-6">
                                                    <div className="space-y-1.5 flex-1">
                                                        <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 leading-none">
                                                            <div className="flex gap-2">
                                                                <span className="flex items-center gap-1" title="Siteden Okunan"><Monitor className="w-2.5 h-2.5 text-secondary" /> %{Math.round(b.sitePercent)}</span>
                                                                {b.manualPercent > 0 && <span className="flex items-center gap-1" title="Gerçek (Dışarıdan) Okuma"><Library className="w-2.5 h-2.5 text-blue-400" /> %{Math.round(b.manualPercent)}</span>}
                                                            </div>
                                                            <span className="text-foreground">%{Math.round(b.progress)}</span>
                                                        </div>
                                                        <div className="relative h-1 w-full bg-background rounded-full overflow-hidden border border-white/5">
                                                            <div className="absolute h-full bg-secondary z-10" style={{ width: `${b.sitePercent}%` }} />
                                                            <div className="absolute h-full bg-blue-400 opacity-60" style={{ width: `${b.sitePercent + b.manualPercent}%` }} />
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex items-center justify-between pt-3 border-t border-white/5">
                                                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Okuma Süresi</span>
                                                        <span className="text-xs font-black text-emerald-400">{Math.round(b.minutes)} Dk.</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
