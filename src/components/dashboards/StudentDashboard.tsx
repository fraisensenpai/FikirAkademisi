import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { BookOpen, Clock, Trophy, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

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
  const { user } = useAuth();
  const [userBooks, setUserBooks] = useState<UserBook[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const fetchBooks = async () => {
      const { data } = await supabase
        .from("user_books")
        .select("id, current_page, progress_percent, total_minutes, is_completed, quiz_score, book:books(id, title, total_pages, cover_url)")
        .eq("user_id", user.id);
      setUserBooks((data as any) || []);
      setLoading(false);
    };
    fetchBooks();
  }, [user]);

  const totalMinutes = userBooks.reduce((sum, ub) => sum + Number(ub.total_minutes), 0);
  const completedCount = userBooks.filter((ub) => ub.is_completed).length;
  const avgProgress = userBooks.length
    ? userBooks.reduce((sum, ub) => sum + Number(ub.progress_percent), 0) / userBooks.length
    : 0;

  const stats = [
    { label: "Toplam Kitap", value: userBooks.length, icon: BookOpen, color: "text-primary" },
    { label: "Okuma Süresi", value: `${Math.round(totalMinutes)} dk`, icon: Clock, color: "text-secondary" },
    { label: "Tamamlanan", value: completedCount, icon: Trophy, color: "text-amber-500" },
    { label: "Ort. İlerleme", value: `%${Math.round(avgProgress)}`, icon: TrendingUp, color: "text-secondary" },
  ];

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground">Hoş Geldiniz!</h2>
        <p className="text-muted-foreground">Okuma ilerlemenizi takip edin</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
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

      {/* Book cards */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Kitaplarım</h3>
        {userBooks.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">Henüz atanmış kitabınız yok</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userBooks.map((ub) => (
              <div key={ub.id} className="glass-card p-5 space-y-4 hover:shadow-xl transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-foreground">{ub.book.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {ub.current_page} / {ub.book.total_pages} sayfa
                    </p>
                  </div>
                  {ub.is_completed && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-secondary/10 text-secondary">
                      Tamamlandı
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">İlerleme</span>
                    <span className="font-medium text-foreground">%{Math.round(Number(ub.progress_percent))}</span>
                  </div>
                  <Progress value={Number(ub.progress_percent)} className="h-2" />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {Math.round(Number(ub.total_minutes))} dk
                  </span>
                  
                  {ub.is_completed && ub.quiz_score === null ? (
                    <Button size="sm" className="bg-secondary hover:bg-secondary/90 text-secondary-foreground">
                      Quizi Başlat
                    </Button>
                  ) : ub.quiz_score !== null ? (
                    <span className="text-sm font-medium text-secondary">
                      Quiz: %{Math.round(Number(ub.quiz_score))}
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/dashboard/read/${ub.book.id}`)}
                    >
                      Okumaya Devam Et
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
