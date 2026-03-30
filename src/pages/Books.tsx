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
}

export default function Books() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [assignedBooks, setAssignedBooks] = useState<AssignedBook[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAssignedBooks = async () => {
    if (!user || !profile) return;

    try {
      // Get assignments for the student's class
      const { data: assignments, error: assignError } = await supabase
        .from("assignments")
        .select(`
          id,
          book_id,
          due_date,
          book:books (
            id,
            title,
            cover_url,
            total_pages
          )
        `)
        .eq("target_class", profile.class_name || "");

      if (assignError) throw assignError;

      // Get progress for these books
      const { data: progress, error: progError } = await supabase
        .from("user_books")
        .select("*")
        .eq("user_id", user.id);

      if (progError) throw progError;

      // Merge data
      const merged = (assignments || []).map((assignment: any) => {
        const bookProg = (progress || []).find(p => p.book_id === assignment.book_id);
        return {
          id: assignment.id,
          book_id: assignment.book_id,
          title: assignment.book.title,
          cover_url: assignment.book.cover_url,
          total_pages: assignment.book.total_pages,
          current_page: bookProg?.current_page || 0,
          progress_percent: bookProg?.progress_percent || 0,
          is_completed: bookProg?.is_completed || false,
          due_date: assignment.due_date
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {assignedBooks.map((book) => (
            <div key={book.id} className="glass-card overflow-hidden group hover:shadow-xl transition-all duration-300">
              <div className="p-4 md:p-6 space-y-3 md:space-y-4">
                <div className="flex items-start justify-between">
                  <div className="bg-primary/10 p-2 md:p-3 rounded-xl">
                    <BookOpen className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                  </div>
                  {book.is_completed && (
                    <div className="flex items-center gap-1 text-[10px] md:text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-0.5 md:py-1 rounded-full">
                      <CheckCircle2 className="w-3 h-3" />
                      Tamamlandı
                    </div>
                  )}
                </div>
                
                <div className="min-h-[60px] md:min-h-[80px]">
                  <h3 className="text-base md:text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-tight">{book.title}</h3>
                  <div className="flex items-center gap-2 mt-1 text-xs md:text-sm text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{book.total_pages} Sayfa</span>
                  </div>
                  {book.due_date && (
                    <div className="flex items-center gap-2 mt-1.5 text-[10px] md:text-[11px] font-medium text-rose-500/80 bg-rose-500/5 px-1.5 py-0.5 rounded w-fit">
                      <Calendar className="w-3 h-3 md:w-3.5 md:h-3.5" />
                      Son: {new Date(book.due_date).toLocaleDateString()}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 md:space-y-2">
                  <div className="flex justify-between text-[10px] md:text-xs">
                    <span className="text-muted-foreground">İlerleme</span>
                    <span className="font-medium">{Math.round(book.progress_percent)}%</span>
                  </div>
                  <Progress value={book.progress_percent} className="h-1.5 md:h-2" />
                </div>

                <Button 
                  onClick={() => navigate(`/dashboard/read/${book.book_id}`)}
                  className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground mt-2 h-9 md:h-10 text-xs md:text-sm"
                >
                  {book.progress_percent > 0 ? "Okumaya Devam Et" : "Okumaya Başla"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
