import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload, Plus, BookOpen, Trash2 } from "lucide-react";

interface Book {
  id: string;
  title: string;
  pdf_url: string;
  total_pages: number;
  cover_url: string | null;
  created_at: string;
}

export default function ManageBooks() {
  const { user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [totalPages, setTotalPages] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [showForm, setShowForm] = useState(false);

  const fetchBooks = async () => {
    const { data } = await supabase.from("books").select("*").order("created_at", { ascending: false });
    setBooks(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchBooks(); }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileRef.current?.files?.[0]) {
      toast.error("PDF dosyası seçin");
      return;
    }

    setUploading(true);
    const file = fileRef.current.files[0];
    const fileName = `${Date.now()}-${file.name}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from("books")
        .upload(fileName, file, { contentType: "application/pdf" });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("books").getPublicUrl(fileName);

      const { error: insertError } = await supabase.from("books").insert({
        title,
        pdf_url: urlData.publicUrl,
        total_pages: parseInt(totalPages) || 1,
        created_by: user?.id,
      });

      if (insertError) throw insertError;

      toast.success("Kitap eklendi!");
      setTitle("");
      setTotalPages("");
      setShowForm(false);
      fetchBooks();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("books").delete().eq("id", id);
    if (error) {
      toast.error("Silinemedi");
      return;
    }
    toast.success("Kitap silindi");
    fetchBooks();
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">Kitap Yönetimi</h2>
          <p className="text-muted-foreground">{books.length} kitap</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="bg-secondary hover:bg-secondary/90 text-secondary-foreground">
          <Plus className="w-4 h-4 mr-2" />
          Kitap Ekle
        </Button>
      </div>

      {showForm && (
        <div className="glass-card p-6">
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kitap Adı</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Kitap başlığı" required />
              </div>
              <div className="space-y-2">
                <Label>Toplam Sayfa</Label>
                <Input type="number" value={totalPages} onChange={(e) => setTotalPages(e.target.value)} placeholder="Sayfa sayısı" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>PDF Dosyası</Label>
              <Input ref={fileRef} type="file" accept=".pdf" required />
            </div>
            <Button type="submit" disabled={uploading}>
              <Upload className="w-4 h-4 mr-2" />
              {uploading ? "Yükleniyor..." : "Yükle"}
            </Button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {books.map((book) => (
          <div key={book.id} className="glass-card p-4 md:p-5 space-y-3 hover:border-primary/20 transition-all">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5 md:gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <BookOpen className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-bold text-sm md:text-base text-foreground line-clamp-1">{book.title}</h4>
                  <p className="text-xs text-muted-foreground">{book.total_pages} sayfa</p>
                </div>
              </div>
              <Button size="icon" variant="ghost" onClick={() => handleDelete(book.id)} className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
