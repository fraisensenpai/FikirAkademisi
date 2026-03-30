import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, BookOpen, BarChart3, Shield } from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, books: 0, activeReaders: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const [{ count: userCount }, { count: bookCount }, { count: readerCount }] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("books").select("*", { count: "exact", head: true }),
        supabase.from("user_books").select("*", { count: "exact", head: true }),
      ]);
      setStats({
        users: userCount || 0,
        books: bookCount || 0,
        activeReaders: readerCount || 0,
      });
      setLoading(false);
    };
    fetchStats();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Yükleniyor...</div>;
  }

  const statCards = [
    { label: "Toplam Kullanıcı", value: stats.users, icon: Users, color: "text-primary" },
    { label: "Toplam Kitap", value: stats.books, icon: BookOpen, color: "text-secondary" },
    { label: "Aktif Okuma", value: stats.activeReaders, icon: BarChart3, color: "text-amber-500" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary">
          <Shield className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">Yönetim Paneli</h2>
          <p className="text-muted-foreground">Sistem genel bakış</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="glass-card p-5">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl bg-muted ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
