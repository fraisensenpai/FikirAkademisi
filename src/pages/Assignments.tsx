import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Search, Plus, BookOpen, Users, Calendar, CheckCircle2, XCircle, Film, User, Layers } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Book {
  id: string;
  title: string;
}

interface Group {
  id: string;
  name: string;
}

interface Student {
  id: string;
  full_name: string;
  school_number: string;
}

interface Assignment {
  id: string;
  book_id?: string;
  movie_id?: string;
  book?: { title: string };
  movie?: { title: string; url: string };
  target_class: string | null;
  target_group_id: string | null;
  target_student_id: string | null;
  target_student?: { full_name: string };
  target_group?: { name: string };
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
  const [groups, setGroups] = useState<Group[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [assignmentType, setAssignmentType] = useState<"book" | "movie">("book");
  const [targetType, setTargetType] = useState<"class" | "group" | "student">("class");
  const [selectedBook, setSelectedBook] = useState("");
  const [movieTitle, setMovieTitle] = useState("");
  const [movieUrl, setMovieUrl] = useState("");
  const [targetClass, setTargetClass] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [dueDate, setDueDate] = useState("");

  const [trackingStudents, setTrackingStudents] = useState<StudentProgress[]>([]);
  const [trackingLoading, setTrackingLoading] = useState(false);

  const fetchData = async () => {
    try {
      const { data: booksData } = await supabase.from("books").select("id, title");
      const { data: groupsData } = await supabase.from("groups").select("id, name");
      
      const { data: studentsData } = await supabase
        .from("profiles")
        .select("id, full_name, school_number")
        .eq("role", "student")
        .order("full_name");

      const { data: assignmentsData } = await supabase
        .from("assignments")
        .select(`
          id,
          book_id,
          movie_id,
          target_class,
          target_group_id,
          target_student_id,
          due_date,
          created_at,
          book:books (title),
          movie:movies (title, url),
          target_student:profiles!assignments_target_student_id_fkey (full_name),
          target_group:groups (name)
        `)
        .order("created_at", { ascending: false });

      setBooks(booksData || []);
      setGroups(groupsData || []);
      setStudents(studentsData as any || []);
      setAssignments((assignmentsData as any) || []);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (assignmentType === "book" && !selectedBook) {
      toast.error("Lütfen bir kitap seçin");
      return;
    }
    if (assignmentType === "movie" && (!movieTitle || !movieUrl)) {
      toast.error("Lütfen film bilgilerini doldurun");
      return;
    }
    if (targetType === "class" && !targetClass) {
      toast.error("Lütfen bir sınıf seçin");
      return;
    }
    if (targetType === "group" && !selectedGroup) {
      toast.error("Lütfen bir grup seçin");
      return;
    }
    if (targetType === "student" && !selectedStudent) {
      toast.error("Lütfen bir öğrenci seçin");
      return;
    }

    try {
      let finalMovieId = null;

      // Handle movie creation if needed
      if (assignmentType === "movie") {
        const { data: movieData, error: movieError } = await supabase
          .from("movies")
          .insert({ title: movieTitle, url: movieUrl, created_by: user?.id })
          .select()
          .single();
        
        if (movieError) throw movieError;
        finalMovieId = movieData.id;
      }

      const assignmentData = {
        teacher_id: user?.id,
        book_id: assignmentType === "book" ? selectedBook : null,
        movie_id: finalMovieId,
        target_class: targetType === "class" ? targetClass : null,
        target_group_id: targetType === "group" ? selectedGroup : null,
        target_student_id: targetType === "student" ? selectedStudent : null,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
      };

      const { error } = await supabase.from("assignments").insert(assignmentData);

      if (error) throw error;
      
      toast.success("Ödev başarıyla atandı!");
      fetchData();
      
      // Reset form
      setMovieTitle("");
      setMovieUrl("");
      setTargetClass("");
      setSelectedGroup("");
      setSelectedStudent("");
      setDueDate("");
    } catch (error: any) {
      toast.error("Hata: " + error.message);
    }
  };

  const loadProgressDetails = async (assignment: any) => {
    if (assignment.movie_id) {
      toast.info("Film ödevleri için ilerleme takibi henüz aktif değil.");
      return;
    }

    setTrackingLoading(true);
    setTrackingStudents([]);
    try {
      const { data: bookInfo } = await supabase.from("books").select("total_pages").eq("id", assignment.book_id).single();
      const totalPages = bookInfo?.total_pages || 0;

      let studentQuery = supabase.from("profiles").select("id, full_name, school_number, role");
      
      if (assignment.target_class) {
        studentQuery = studentQuery.ilike("class_name", assignment.target_class);
      } else if (assignment.target_group_id) {
        const { data: groupMembers } = await supabase
          .from("group_members")
          .select("user_id")
          .eq("group_id", assignment.target_group_id);
        const memberIds = groupMembers?.map(m => m.user_id) || [];
        studentQuery = studentQuery.in("id", memberIds);
      } else if (assignment.target_student_id) {
        studentQuery = studentQuery.eq("id", assignment.target_student_id);
      }

      const { data: students, error: studentError } = await studentQuery;
      if (studentError) throw studentError;

      const studentOnly = (students || []).filter((s: any) => s.role === 'student');

      const results: StudentProgress[] = await Promise.all(studentOnly.map(async (s: any) => {
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
          total_pages: totalPages,
          progress_percent: progress?.progress_percent || 0,
          is_completed: progress?.is_completed || false,
        };
      }));

      setTrackingStudents(results);
    } catch (err) {
      console.error(err);
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
          <p className="text-muted-foreground">Öğrencilerinize veya gruplarınıza kitap/film atayın</p>
        </div>
      </div>

      {/* Assign Form */}
      <div className="glass-card p-6">
        <form onSubmit={handleAssign} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Content Selection */}
            <div className="space-y-4">
              <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Ne Atayacaksınız?</Label>
              <Tabs value={assignmentType} onValueChange={(v: any) => setAssignmentType(v)} className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-11 bg-muted/50">
                  <TabsTrigger value="book" className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" /> Kitap
                  </TabsTrigger>
                  <TabsTrigger value="movie" className="flex items-center gap-2">
                    <Film className="w-4 h-4" /> Film
                  </TabsTrigger>
                </TabsList>
                <div className="mt-4">
                  {assignmentType === "book" ? (
                    <div className="space-y-2">
                      <Label>Kitap Seçin</Label>
                      <Select onValueChange={setSelectedBook}>
                        <SelectTrigger className="h-11 rounded-xl">
                          <SelectValue placeholder="Kitap ara veya seç..." />
                        </SelectTrigger>
                        <SelectContent>
                          {books.map(b => (
                            <SelectItem key={b.id} value={b.id}>{b.title}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Film İsmi</Label>
                        <Input 
                          placeholder="Film adını girin..." 
                          value={movieTitle} 
                          onChange={e => setMovieTitle(e.target.value)}
                          className="h-11 rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>İzleme URL (YouTube, Drive vb.)</Label>
                        <Input 
                          placeholder="https://..." 
                          value={movieUrl} 
                          onChange={e => setMovieUrl(e.target.value)}
                          className="h-11 rounded-xl"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </Tabs>
            </div>

            {/* Target Selection */}
            <div className="space-y-4">
              <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Kime Atayacaksınız?</Label>
              <Tabs value={targetType} onValueChange={(v: any) => setTargetType(v)} className="w-full">
                <TabsList className="grid w-full grid-cols-3 h-11 bg-muted/50">
                  <TabsTrigger value="class">Sınıf</TabsTrigger>
                  <TabsTrigger value="group">Grup</TabsTrigger>
                  <TabsTrigger value="student">Kişiye Özel</TabsTrigger>
                </TabsList>
                <div className="mt-4">
                  {targetType === "class" && (
                    <div className="space-y-2">
                      <Label>Sınıf Seçin</Label>
                      <Select onValueChange={setTargetClass}>
                        <SelectTrigger className="h-11 rounded-xl">
                          <SelectValue placeholder="Sınıf seç..." />
                        </SelectTrigger>
                        <SelectContent>
                          {['Haz-A', 'Haz-B', 'Haz-C', 'Haz-D', 'Haz-E', 'Haz-F', 'Haz-G', 'Haz-H'].map(c => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {targetType === "group" && (
                    <div className="space-y-2">
                      <Label>Grup Seçin</Label>
                      <Select onValueChange={setSelectedGroup}>
                        <SelectTrigger className="h-11 rounded-xl">
                          <SelectValue placeholder="Grup seç..." />
                        </SelectTrigger>
                        <SelectContent>
                          {groups.map(g => (
                            <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {targetType === "student" && (
                    <div className="space-y-2">
                      <Label>Öğrenci Seçin</Label>
                      <Select onValueChange={setSelectedStudent}>
                        <SelectTrigger className="h-11 rounded-xl">
                          <SelectValue placeholder="Öğrenci ara..." />
                        </SelectTrigger>
                        <SelectContent>
                          {students.map(s => (
                            <SelectItem key={s.id} value={s.id}>{s.full_name} ({s.school_number})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </Tabs>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-6 items-end">
            <div className="space-y-2 flex-1 w-full">
              <Label>Son Tarih (Opsiyonel)</Label>
              <Input 
                type="date" 
                value={dueDate} 
                onChange={e => setDueDate(e.target.value)} 
                className="h-11 rounded-xl"
              />
            </div>
            <Button type="submit" className="w-full md:w-auto px-10 h-11 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 rounded-xl font-bold">
              <Plus className="w-4 h-4 mr-2" />
              Ödevi Tanımla
            </Button>
          </div>
        </form>
      </div>

      {/* Assignment List */}
      <div className="grid grid-cols-1 gap-4">
        {assignments.map((a) => (
          <div key={a.id} className="glass-card p-5 flex items-center justify-between group">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${a.movie_id ? "bg-amber-500/10" : "bg-primary/10"}`}>
                {a.movie_id ? (
                  <Film className="w-5 h-5 text-amber-500" />
                ) : (
                  <BookOpen className="w-5 h-5 text-primary" />
                )}
              </div>
              <div>
                <h4 className="font-bold">{a.book?.title || a.movie?.title}</h4>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-1">
                  <span className="flex items-center gap-1 font-medium bg-muted px-2 py-0.5 rounded">
                    <Users className="w-3 h-3" />
                    {a.target_class ? `${a.target_class} Sınıfı` : a.target_group?.name || a.target_student?.full_name}
                  </span>
                  {a.movie?.url && (
                    <a href={a.movie.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                      İzle <Plus className="w-2 h-2 rotate-45" />
                    </a>
                  )}
                  {a.due_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 ml-2" />
                      Son: {new Date(a.due_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {!a.movie_id && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" onClick={() => loadProgressDetails(a)} className="rounded-xl">
                    Takip Et
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto rounded-3xl">
                  <DialogHeader>
                    <DialogTitle>İlerleme Durumu - {a.book?.title}</DialogTitle>
                  </DialogHeader>
                  <div className="mt-4">
                    {trackingLoading ? (
                      <div className="text-center py-10">Yükleniyor...</div>
                    ) : trackingStudents.length === 0 ? (
                      <div className="text-center py-10 text-muted-foreground">Kayıtlı öğrenci bulunamadı.</div>
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
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
