import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ClipboardList, Plus } from "lucide-react";

export default function Assignments() {
  const { user } = useAuth();
  const [books, setBooks] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [selectedBook, setSelectedBook] = useState("");
  const [targetClass, setTargetClass] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const [{ data: booksData }, { data: assignmentsData }] = await Promise.all([
      supabase.from("books").select("id, title"),
      supabase.from("assignments").select("id, target_class, created_at, book:books(title)").order("created_at", { ascending: false }),
    ]);
    setBooks(booksData || []);
    setAssignments(assignmentsData || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleAssign = async () => {
    if (!selectedBook || !targetClass) {
      toast.error("Kitap ve sınıf seçin");
      return;
    }

    const { error } = await supabase.from("assignments").insert({
      teacher_id: user!.id,
      book_id: selectedBook,
      target_class: targetClass,
    });

    if (error) {
      toast.error("Atama başarısız");
      return;
    }

    toast.success("Kitap atandı!");
    setSelectedBook("");
    setTargetClass("");
    fetchData();
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground">Ödev Atama</h2>
        <p className="text-muted-foreground">Sınıflara kitap atayın</p>
      </div>

      <div className="glass-card p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="space-y-2">
            <Label>Kitap</Label>
            <Select value={selectedBook} onValueChange={setSelectedBook}>
              <SelectTrigger>
                <SelectValue placeholder="Kitap seçin" />
              </SelectTrigger>
              <SelectContent>
                {books.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Hedef Sınıf</Label>
            <Input value={targetClass} onChange={(e) => setTargetClass(e.target.value)} placeholder="Örn: 9-A" />
          </div>
          <Button onClick={handleAssign} className="bg-secondary hover:bg-secondary/90 text-secondary-foreground">
            <Plus className="w-4 h-4 mr-2" /> Ata
          </Button>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <ClipboardList className="w-4 h-4" /> Atamalar
          </h3>
        </div>
        {assignments.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">Henüz atama yok</div>
        ) : (
          <div className="divide-y">
            {assignments.map((a) => (
              <div key={a.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{(a.book as any)?.title}</p>
                  <p className="text-sm text-muted-foreground">Sınıf: {a.target_class}</p>
                </div>
                <span className="text-sm text-muted-foreground">
                  {new Date(a.created_at).toLocaleDateString("tr-TR")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
