import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Clock, User, BookOpen, Filter, Search, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface TransferRequest {
  id: string;
  user_id: string;
  book_id: string;
  start_page: number;
  end_page: number;
  minutes: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  profiles: {
    full_name: string;
    school_number: string | null;
  };
  books: {
    title: string;
    total_pages: number;
  };
}

export default function ManageTransfers() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<TransferRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    const { data, error } = await (supabase as any)
      .from("manual_reading_requests")
      .select("*, profiles:user_id(full_name, school_number), books:book_id(title, total_pages)")
      .eq('status', 'pending')
      .order("created_at", { ascending: true });

    if (error) {
      toast.error("Talepler alınırken bir hata oluştu");
    } else {
      setRequests(data as any || []);
    }
    setLoading(false);
  };

  const processRequest = async (request: TransferRequest, status: 'approved' | 'rejected') => {
    try {
      const { error: updateError } = await (supabase as any)
        .from("manual_reading_requests")
        .update({ 
          status, 
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString()
        })
        .eq("id", request.id);

      if (updateError) throw updateError;

      if (status === 'approved') {
        const { data: userBook, error: fetchError } = await (supabase as any)
          .from("user_books")
          .select("*")
          .eq("user_id", request.user_id)
          .eq("book_id", request.book_id)
          .single();

        if (fetchError || !userBook) {
          throw new Error("Öğrencinin bu kitapla ilgili kaydı bulunamadı veya bir hata oluştu.");
        }

        const pagesRead = request.end_page - request.start_page;
        const newCurrentPage = Math.max(userBook.current_page, request.end_page);
        const newManualPages = (userBook.manual_pages_read || 0) + pagesRead;
        const newManualMinutes = (userBook.manual_minutes_read || 0) + request.minutes;
        const newTotalMinutes = (userBook.total_minutes || 0) + request.minutes;
        
        const newProgress = Math.min(100, (newCurrentPage / request.books.total_pages) * 100);

        const { error: bookUpdateError } = await (supabase as any)
          .from("user_books")
          .update({
            current_page: newCurrentPage,
            progress_percent: newProgress,
            total_minutes: newTotalMinutes,
            manual_pages_read: newManualPages,
            manual_minutes_read: newManualMinutes,
            is_completed: newProgress >= 100
          })
          .eq("id", userBook.id);

        if (bookUpdateError) throw bookUpdateError;
      }

      toast.success(status === 'approved' ? "Talep onaylandı ve ilerleme güncellendi" : "Talep reddedildi");
      fetchRequests();
    } catch (error: any) {
      toast.error("İşlem sırasında hata: " + error.message);
    }
  };

  const filteredRequests = requests.filter(r => 
    r.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.books?.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in p-2 md:p-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 glass-premium p-8 border-primary/10 shadow-2xl shadow-primary/5">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/5 border border-secondary/10 text-secondary text-[10px] font-black uppercase tracking-widest leading-none">
            <Filter className="w-3 h-3" />
            <span>Talep Yönetimi</span>
          </div>
          <h2 className="text-3xl font-display font-black text-foreground">Kitap Aktarım Talepleri</h2>
          <p className="text-muted-foreground font-medium italic">Öğrencilerin fiziksel okuma taleplerini onaylayın veya reddedin.</p>
        </div>
        <div className="flex items-center gap-4 bg-background/50 p-4 rounded-2xl border border-white/5 shadow-inner">
          <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
            <Clock className="w-6 h-6 text-secondary" />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-tighter">İncelenmeyi Bekleyen</p>
            <p className="text-sm font-bold text-foreground">{requests.length} Bekleyen</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="relative group max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-secondary transition-colors" />
          <Input 
            placeholder="Öğrenci veya kitap adı ile ara..."
            className="pl-11 h-12 rounded-2xl bg-background/50 border-white/10 shadow-sm focus:ring-2 ring-secondary/20"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground animate-pulse">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-secondary" />
            <p className="font-bold text-sm tracking-widest uppercase opacity-50 italic">Talepler Listeleniyor...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="glass-premium p-20 text-center border-dashed border-2 border-primary/10">
            <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500/30 mb-4" />
            <h4 className="text-lg font-bold text-foreground mb-1 italic tracking-tight">Bekleyen Talep Yok</h4>
            <p className="text-muted-foreground max-w-xs mx-auto text-sm italic">Şu an incelenmeyi bekleyen herhangi bir aktarım talebi bulunmuyor.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredRequests.map((req) => (
              <div key={req.id} className="glass-premium p-8 space-y-6 group hover:bg-white/50 dark:hover:bg-white/5 transition-all duration-500 border-white/5 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-secondary/10 transition-colors" />
                
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-background shadow-lg flex items-center justify-center text-secondary font-black text-xs border border-white/10">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground tracking-tight uppercase leading-none mb-1">
                        {req.profiles?.full_name}
                    </h4>
                    <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest leading-none">
                        OKUL NO: {req.profiles?.school_number || 'Belirtilmemiş'}
                    </p>
                  </div>
                </div>

                <div className="space-y-4 py-4 border-y border-white/5">
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-4 h-4 text-secondary" />
                    <div>
                        <p className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-tighter leading-none mb-1">Okuduğu Kitap</p>
                        <p className="text-sm font-bold text-foreground italic">{req.books?.title}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-2xl bg-background/50 border border-white/10">
                        <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest mb-1">Sayfa Aralığı</p>
                        <p className="text-sm font-black text-foreground">{req.start_page} — {req.end_page}</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-background/50 border border-white/10">
                        <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest mb-1">Okunan Süre</p>
                        <p className="text-sm font-black text-secondary">{req.minutes} Dakika</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-[10px] font-bold text-muted-foreground italic">
                    {format(new Date(req.created_at), 'd MMMM HH:mm', { locale: tr })}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="rounded-xl px-6 h-10 border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white transition-all font-bold"
                      onClick={() => processRequest(req, 'rejected')}
                    >
                      <XCircle className="w-4 h-4 mr-2" /> Reddet
                    </Button>
                    <Button 
                      size="sm" 
                      className="rounded-xl px-6 h-10 bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl shadow-emerald-500/20 transition-all font-bold border-none"
                      onClick={() => processRequest(req, 'approved')}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" /> Onayla
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
