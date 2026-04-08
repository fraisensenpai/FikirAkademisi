import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { BookOpen, Clock, CheckCircle2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

interface AssignedBook {
  id: string;
  book_id: string;
  title: string;
  cover_url: string | null;
  total_pages: number;
  current_page: number;
  progress_percent: number;
  is_completed: boolean;
  due_date: string | null;
  type: "class" | "personal";
}

export default function Books() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [assignedBooks, setAssignedBooks] = useState<AssignedBook[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAssignedBooks = async () => {
    if (!user || !profile) return;

    try {
      // 1. Sınıfa verilen ödevler
      const { data: classAssignments } = await supabase
        .from("assignments")
        .select(`id, book_id, due_date, book:books(id, title, cover_url, total_pages)`)
        .eq("target_class", profile.class_name || "");

      // 2. Kişisel ödevler (target_student_id = bu kullanıcı)
      const { data: personalAssignments } = await (supabase as any)
        .from("assignments")
        .select(`id, book_id, due_date, book:books(id, title, cover_url, total_pages)`)
        .eq("target_student_id", user.id);

      // 3. Birleştir ve tekrarı kaldır
      const allAssignments = [
        ...(classAssignments || []).map((a: any) => ({ ...a, type: "class" })),
        ...(personalAssignments || []).map((a: any) => ({ ...a, type: "personal" })),
      ];
      const seen = new Set<string>();
      const uniqueAssignments = allAssignments.filter((a: any) => {
        if (seen.has(a.book_id)) return false;
        seen.add(a.book_id);
        return true;
      });

      // 4. İlerleme verilerini çek
      const { data: progress } = await supabase
        .from("user_books")
        .select("*")
        .eq("user_id", user.id);

      const merged = uniqueAssignments.map((assignment: any) => {
        const bookProg = (progress || []).find((p: any) => p.book_id === assignment.book_id);
        return {
          id: assignment.id,
          book_id: assignment.book_id,
          title: assignment.book.title,
          cover_url: assignment.book.cover_url,
          total_pages: assignment.book.total_pages,
          current_page: bookProg?.current_page || 0,
          progress_percent: bookProg?.progress_percent || 0,
          is_completed: bookProg?.is_completed || false,
          due_date: assignment.due_date,
          type: assignment.type,
        };
      });

      setAssignedBooks(merged);
    } catch (error: any) {
      toast.error("Kitaplar yüklenirken hata oluştu");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignedBooks();
  }, [user, profile]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px] text-muted-foreground animate-pulse">Kitapların getiriliyor...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-display font-bold text-foreground">Kitaplarım</h2>
        <p className="text-muted-foreground">Senin için atanan okuma görevleri</p>
      </div>

      {assignedBooks.length === 0 ? (
        <div className="glass-card p-12 text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary/10 mb-4">
            <BookOpen className="w-8 h-8 text-secondary" />
          </div>
          <h3 className="text-xl font-semibold">Henüz kitap atanmamış</h3>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Görünen o ki henüz senin için bir ödev atanmamış. Öğretmenin kitap atadığında burada göreceksin!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
          {assignedBooks.map((book) => (
            <div key={book.id} className="glass-card overflow-hidden group hover:shadow-xl transition-all duration-300">
              <div className="p-3 md:p-6 space-y-2 md:space-y-4">
                <div className="flex items-start justify-between">
                  <div className="bg-primary/10 p-1.5 md:p-3 rounded-lg">
                    <BookOpen className="w-4 h-4 md:w-6 md:h-6 text-primary" />
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {book.is_completed && (
                      <div className="flex items-center gap-1 text-[8px] md:text-xs font-medium text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 md:py-1 rounded-full">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        Tamam
                      </div>
                    )}
                    <div className={`text-[8px] md:text-[10px] font-bold px-1.5 py-0.5 rounded-full ${book.type === "personal"
                        ? "bg-purple-500/15 text-purple-500"
                        : "bg-blue-500/15 text-blue-500"
                      }`}>
                      {book.type === "personal" ? "👤 Kişisel" : "📚 Sınıf"}
                    </div>
                  </div>
                </div>

                <div className="min-h-[45px] md:min-h-[80px]">
                  <h3 className="text-xs md:text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-tight">{book.title}</h3>
                  <div className="flex items-center gap-1.5 mt-1 text-[10px] md:text-sm text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{book.total_pages} s.</span>
                    {book.due_date && (
                      <span className="ml-1 text-amber-500 font-medium flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(book.due_date).toLocaleDateString("tr-TR")}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-1 md:space-y-2">
                  <div className="flex justify-between text-[9px] md:text-xs">
                    <span className="text-muted-foreground">İlerleme</span>
                    <span className="font-medium">{Math.round(book.progress_percent)}%</span>
                  </div>
                  <Progress value={book.progress_percent} className="h-1 md:h-2" />
                </div>

                <Button
                  onClick={() => navigate(`/dashboard/read/${book.book_id}`)}
                  className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground mt-1 h-7 md:h-10 text-[10px] md:text-sm"
                >
                  {book.progress_percent > 0 ? "Devam" : "Başla"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
