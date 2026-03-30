import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, Users, TrendingUp, TrendingDown } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function Analytics() {
  const [classStats, setClassStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      const { data } = await supabase
        .from("user_books")
        .select("progress_percent, total_minutes, user:profiles(full_name, class_name)");

      if (!data) { setLoading(false); return; }

      // Group by class
      const byClass: Record<string, { students: string[]; totalProgress: number; count: number }> = {};
      data.forEach((d: any) => {
        const cls = d.user?.class_name || "Belirtilmemiş";
        if (!byClass[cls]) byClass[cls] = { students: [], totalProgress: 0, count: 0 };
        byClass[cls].students.push(d.user?.full_name || "—");
        byClass[cls].totalProgress += Number(d.progress_percent);
        byClass[cls].count++;
      });

      const stats = Object.entries(byClass).map(([cls, data]) => ({
        className: cls,
        avgProgress: data.count ? data.totalProgress / data.count : 0,
        studentCount: new Set(data.students).size,
      }));

      setClassStats(stats);
      setLoading(false);
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground">Analitik</h2>
        <p className="text-muted-foreground">Sınıf bazlı okuma istatistikleri</p>
      </div>

      {classStats.length === 0 ? (
        <div className="glass-card p-8 text-center text-muted-foreground">Henüz veri yok</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {classStats.map((cs) => (
            <div key={cs.className} className="glass-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground text-lg">{cs.className}</h3>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" /> {cs.studentCount}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Ortalama İlerleme</span>
                  <span className="font-medium text-foreground">%{Math.round(cs.avgProgress)}</span>
                </div>
                <Progress value={cs.avgProgress} className="h-3" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
