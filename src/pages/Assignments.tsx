import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Search, Plus, BookOpen, Users, Calendar, CheckCircle2, XCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Book {
  id: string;
  title: string;
}

interface Assignment {
  id: string;
  book: { title: string };
  target_class: string;
  due_date: string | null;
  created_at: string;
}

interface StudentProgress {
  full_name: string;
  school_number: string;
  current_page: number;
  total_pages: number;
  is_completed: boolean;
  progress_percent: number;
}

export default function Assignments() {
  const { user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState("");
  const [targetClass, setTargetClass] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [trackingStudents, setTrackingStudents] = useState<StudentProgress[]>([]);
  const [trackingLoading, setTrackingLoading] = useState(false);

  const fetchData = async () => {
    const { data: booksData } = await supabase.from("books").select("id, title");
    const { data: assignmentsData } = await supabase
      .from("assignments")
      .select(`
        id,
        book_id,
        target_class,
        due_date,
        created_at,
        book:books (title)
      `)
      .order("created_at", { ascending: false });

    setBooks(booksData || []);
    setAssignments((assignmentsData as any) || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBook || !targetClass) return;

    try {
      const { error } = await supabase.from("assignments").insert({
        book_id: selectedBook,
        target_class: targetClass,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        teacher_id: user?.id,
      });

      if (error) throw error;
      toast.success("Ödev atandı!");
      fetchData();
      setTargetClass("");
      setDueDate("");
    } catch (error: any) {
      toast.error("Hata: " + error.message);
    }
  };

  const loadProgressDetails = async (assignment: any) => {
    setTrackingLoading(true);
    setTrackingStudents([]);
    try {
      // 1. Get total pages from the assignment's book
      const bookId = assignment.book_id || (assignment as any).book?.id; 
      // If assignment query didn't include book_id directly, we find it:
      const { data: bookInfo } = await supabase.from("books").select("total_pages").eq("id", assignment.book_id).single();
      const totalPages = bookInfo?.total_pages || 0;

      // 2. Get all students in that class (using ilike for case insensitivity)
      const { data: students, error: studentError } = await supabase
        .from("profiles")
        .select("id, full_name, school_number")
        .ilike("class_name", assignment.target_class)
        .eq("role", "student");

      if (studentError) throw studentError;

      // 3. Get progress for all students for this book
      const results: StudentProgress[] = await Promise.all((students || []).map(async (s) => {
        const { data: progress } = await supabase
          .from("user_books")
          .select("current_page, progress_percent, is_completed")
          .eq("user_id", s.id)
          .eq("book_id", assignment.book_id)
          .maybeSingle();

        return {
          full_name: s.full_name,
          school_number: s.school_number || "---",
          current_page: progress?.current_page || 0,
          total_pages: totalPages, // Always use the book's total pages
          progress_percent: progress?.progress_percent || 0,
          is_completed: progress?.is_completed || false,
        };
      }));

      setTrackingStudents(results);
    } catch (err) {
      toast.error("Detaylar alınamadı");
    } finally {
      setTrackingLoading(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64">Yükleniyor...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold">Ödev Yönetimi</h2>
          <p className="text-muted-foreground">Sınıflarınıza kitap atayın ve takip edin</p>
        </div>
      </div>

      {/* Assign Form */}
      <div className="glass-card p-6">
        <form onSubmit={handleAssign} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-2">
            <Label>Kitap Seçin</Label>
            <Select onValueChange={setSelectedBook}>
              <SelectTrigger>
                <SelectValue placeholder="Seçin..." />
              </SelectTrigger>
              <SelectContent>
                {books.map(b => (
                  <SelectItem key={b.id} value={b.id}>{b.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Sınıf</Label>
            <Select onValueChange={setTargetClass}>
              <SelectTrigger>
                <SelectValue placeholder="Sınıf Seç..." />
              </SelectTrigger>
              <SelectContent>
                {['Haz-A', 'Haz-B', 'Haz-C', 'Haz-D', 'Haz-E', 'Haz-F', 'Haz-G', 'Haz-H'].map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Son Tarih</Label>
            <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
          </div>
          <Button type="submit" className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Ödev Ata
          </Button>
        </form>
      </div>

      {/* Assignment List */}
      <div className="grid grid-cols-1 gap-4">
        {assignments.map((a) => (
          <div key={a.id} className="glass-card p-5 flex items-center justify-between group">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-secondary/10 rounded-xl">
                <BookOpen className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <h4 className="font-bold">{a.book.title}</h4>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                  <span className="flex items-center gap-1 font-medium bg-muted px-2 py-0.5 rounded">
                    <Users className="w-3 h-3" />
                    {a.target_class} Sınıfı
                  </span>
                  {a.due_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Son: {new Date(a.due_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" onClick={() => loadProgressDetails(a)}>
                  Takip Et
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
                <DialogHeader>
                  <DialogTitle>{a.target_class} Sınıfı - İlerleme Durumu</DialogTitle>
                </DialogHeader>
                <div className="mt-4">
                  {trackingLoading ? (
                    <div className="text-center py-10">Yükleniyor...</div>
                  ) : trackingStudents.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">Bu sınıfta kayıtlı öğrenci bulunamadı.</div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-4 text-xs font-bold uppercase tracking-wider text-muted-foreground px-4">
                        <div className="col-span-2">Öğrenci</div>
                        <div>İlerleme</div>
                        <div className="text-right">Durum</div>
                      </div>
                      {trackingStudents.map((s, idx) => (
                        <div key={idx} className="flex flex-col gap-2 p-4 bg-muted/30 rounded-xl border border-border/50">
                          <div className="grid grid-cols-4 items-center">
                            <div className="col-span-2">
                              <p className="font-bold text-sm">{s.full_name}</p>
                              <p className="text-[10px] text-muted-foreground">Nu: {s.school_number}</p>
                            </div>
                            <div className="text-xs">
                              <span className="font-mono">{s.current_page}</span> / {s.total_pages || '?'} sayfa
                            </div>
                            <div className="flex justify-end">
                              {s.is_completed ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                              ) : (
                                <XCircle className="w-5 h-5 text-rose-400 opacity-50" />
                              )}
                            </div>
                          </div>
                          <div className="h-1.5 bg-background rounded-full overflow-hidden">
                             <div 
                              className={`h-full transition-all duration-500 ${s.is_completed ? 'bg-emerald-500' : 'bg-primary'}`} 
                              style={{ width: `${s.progress_percent}%` }}
                             />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        ))}
      </div>
    </div>
  );
}
