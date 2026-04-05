import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { History, Send, BookOpen, Clock, CheckCircle2, XCircle, Clock4, Library, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface UserBook {
  id: string;
  book_id: string;
  book: {
    title: string;
    total_pages: number;
  };
}

interface Request {
  id: string;
  start_page: number;
  end_page: number;
  minutes: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  book: {
    title: string;
  };
}

export default function TransferProgress() {
  const { user } = useAuth();
  const [books, setBooks] = useState<UserBook[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [selectedBook, setSelectedBook] = useState("");
  const [startPage, setStartPage] = useState("");
  const [endPage, setEndPage] = useState("");
  const [minutes, setMinutes] = useState("");

  useEffect(() => {
    if (user) {
      fetchBooks();
      fetchRequests();
    }
  }, [user]);

  const fetchBooks = async () => {
    const { data } = await (supabase as any)
      .from("user_books")
      .select("id, book_id, book:books(title, total_pages)")
      .eq("user_id", user?.id)
      .eq("is_completed", false);
    setBooks(data as any || []);
  };

  const fetchRequests = async () => {
    const { data } = await (supabase as any)
      .from("manual_reading_requests")
      .select("*, book:books(title)")
      .order("created_at", { ascending: false });
    setRequests(data as any || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBook || !startPage || !endPage || !minutes) {
      toast.error("Lütfen tüm alanları doldurun");
      return;
    }

    setLoading(true);
    const { error } = await (supabase as any).from("manual_reading_requests").insert({
      user_id: user?.id,
      book_id: selectedBook,
      start_page: parseInt(startPage),
      end_page: parseInt(endPage),
      minutes: parseInt(minutes),
    });

    if (error) {
      toast.error("Talep gönderilemedi: " + error.message);
    } else {
      toast.success("Okuma talebiniz yetkililere gönderildi");
      setStartPage("");
      setEndPage("");
      setMinutes("");
      fetchRequests();
    }
    setLoading(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in p-2 md:p-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 glass-premium p-8 border-primary/10 shadow-2xl shadow-primary/5">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/5 border border-secondary/10 text-secondary text-[10px] font-black uppercase tracking-widest leading-none">
            <BookOpen className="w-3 h-3" />
            <span>Okuma Aktarımı</span>
          </div>
          <h2 className="text-3xl font-display font-black text-foreground">Kitap Aktarımı</h2>
          <p className="text-muted-foreground font-medium italic">Fiziksel dünyada yaptığınız okumaları dijital karnenize ekleyin.</p>
        </div>
        <div className="flex items-center gap-4 bg-background/50 p-4 rounded-2xl border border-white/5 shadow-inner">
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
            <History className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-tighter">Bekleyen Talepler</p>
            <p className="text-sm font-bold text-foreground">{requests.filter(r => r.status === 'pending').length} Talep</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-1">
          <form onSubmit={handleSubmit} className="glass-premium p-8 space-y-6 sticky top-8">
            <h3 className="text-xl font-bold text-foreground flex items-center gap-2 mb-2">
                <Send className="w-5 h-5 text-secondary" />
                Yeni Talep Oluştur
            </h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Okuduğunuz Kitap</Label>
                <Select onValueChange={setSelectedBook}>
                  <SelectTrigger className="h-12 rounded-2xl bg-background/50 border-white/10 shadow-sm focus:ring-2 ring-secondary/20">
                    <SelectValue placeholder="Kitap Seçin" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {books.map(b => (
                      <SelectItem key={b.book_id} value={b.book_id} className="rounded-xl font-medium">
                        {b.book.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 ml-1">İlk Sayfa</Label>
                  <Input 
                    type="number" 
                    placeholder="1"
                    className="h-12 rounded-2xl bg-background/50 border-white/10 shadow-sm focus:ring-2 ring-secondary/20"
                    value={startPage}
                    onChange={e => setStartPage(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Son Sayfa</Label>
                  <Input 
                    type="number" 
                    placeholder="50"
                    className="h-12 rounded-2xl bg-background/50 border-white/10 shadow-sm focus:ring-2 ring-secondary/20"
                    value={endPage}
                    onChange={e => setEndPage(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Okuma Süresi (Dakika)</Label>
                <div className="relative group">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    type="number" 
                    placeholder="45 dk"
                    className="pl-11 h-12 rounded-2xl bg-background/50 border-white/10 shadow-sm focus:ring-2 ring-secondary/20"
                    value={minutes}
                    onChange={e => setMinutes(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-14 rounded-2xl bg-secondary text-white font-bold text-lg shadow-xl shadow-secondary/20 hover:scale-[1.02] active:scale-95 transition-all mt-4"
              disabled={loading}
            >
              {loading ? "Gönderiliyor..." : "Talebi Gönder"}
            </Button>
            <p className="text-[10px] text-muted-foreground text-center italic">
                * Talebiniz onaylandıktan sonra ilerlemenize yansıyacaktır.
            </p>
          </form>
        </div>

        {/* List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              Taleplerim ve Geçmiş
            </h3>
          </div>

          {requests.length === 0 ? (
            <div className="glass-premium p-16 text-center border-dashed border-2 border-primary/10">
                <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Library className="w-10 h-10 text-muted-foreground/30" />
                </div>
                <h4 className="text-lg font-bold text-foreground mb-2 italic tracking-tight">Henüz bir talebiniz yok</h4>
                <p className="text-muted-foreground max-w-xs mx-auto text-sm italic">
                  Gerçek hayatta okuduğunuz sayfaları eklemek için yandaki formu kullanın.
                </p>
            </div>
          ) : (
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-4">
                {requests.map((req) => (
                  <div key={req.id} className="glass-premium p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group hover:bg-white/50 dark:hover:bg-white/5 transition-all duration-500 border-white/5 shadow-xl">
                    <div className="space-y-1">
                      <h4 className="font-bold text-foreground group-hover:text-secondary transition-colors italic tracking-tight uppercase">
                        {req.book.title}
                      </h4>
                      <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-muted-foreground/70 tracking-tight">
                        <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" /> Sayfa: {req.start_page} - {req.end_page}</span>
                        <span className="flex items-center gap-1.5 font-bold text-secondary/70"><Clock4 className="w-3.5 h-3.5" /> {req.minutes} dakika</span>
                        <span className="italic opacity-50">{format(new Date(req.created_at), 'd MMMM yyyy HH:mm', { locale: tr })}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {req.status === 'pending' && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase rounded-full border border-amber-500/20 animate-pulse">
                          <History className="w-3 h-3" /> BEKLEMEDE
                        </div>
                      )}
                      {req.status === 'approved' && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase rounded-full border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" /> ONAYLANDI
                        </div>
                      )}
                      {req.status === 'rejected' && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 text-rose-500 text-[10px] font-black uppercase rounded-full border border-rose-500/20">
                          <XCircle className="w-3 h-3" /> REDDEDİLDİ
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>
    </div>
  );
}
