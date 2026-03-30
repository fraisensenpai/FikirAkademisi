import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Users, BookOpen, TrendingUp, BarChart3 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ students: 0, assignments: 0, avgProgress: 0 });
  const [studentProgress, setStudentProgress] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      // Get assignments by this teacher
      const { data: assignments } = await supabase
        .from("assignments")
        .select("id, target_class, book:books(title)")
        .eq("teacher_id", user.id);

      // Get student progress
      const { data: progress } = await supabase
        .from("user_books")
        .select("progress_percent, total_minutes, is_completed, user:profiles(full_name, class_name), book:books(title)");

      setStudentProgress((progress as any) || []);
      const avgProg = progress?.length
        ? progress.reduce((s, p) => s + Number(p.progress_percent), 0) / progress.length
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
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Yükleniyor...</div>;
  }

  const statCards = [
    { label: "Öğrenci Sayısı", value: stats.students, icon: Users, color: "text-primary" },
    { label: "Atanan Kitap", value: stats.assignments, icon: BookOpen, color: "text-secondary" },
    { label: "Ort. İlerleme", value: `%${Math.round(stats.avgProgress)}`, icon: TrendingUp, color: "text-amber-500" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground">Öğretmen Paneli</h2>
        <p className="text-muted-foreground">Öğrenci ilerlemelerini takip edin</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Student progress table */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Öğrenci İlerlemeleri
          </h3>
        </div>
        {studentProgress.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">Henüz veri yok</div>
        ) : (
          <div className="divide-y">
            {studentProgress.map((sp, i) => (
              <div key={i} className="p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{sp.user?.full_name || "—"}</p>
                  <p className="text-sm text-muted-foreground">{sp.book?.title}</p>
                </div>
                <div className="w-32">
                  <Progress value={Number(sp.progress_percent)} className="h-2" />
                </div>
                <span className="text-sm font-medium text-foreground w-12 text-right">
                  %{Math.round(Number(sp.progress_percent))}
                </span>
                <span className="text-sm text-muted-foreground w-16 text-right">
                  {Math.round(Number(sp.total_minutes))} dk
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
