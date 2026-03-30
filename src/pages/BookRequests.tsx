import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BookMarked, User as UserIcon, Calendar, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface BookRequest {
  id: string;
  title: string;
  author: string | null;
  description: string | null;
  status: string;
  created_at: string;
  profile: {
    full_name: string;
    class_name: string;
  };
}

export default function BookRequests() {
  const [requests, setRequests] = useState<BookRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("book_requests")
        .select(`
          *,
          profile:profiles(full_name, class_name)
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase Error:", error);
        throw error;
      }
      setRequests(data || []);
    } catch (error: any) {
      toast.error("İstekler yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const { error } = await (supabase as any)
        .from("book_requests")
        .update({ status })
        .eq("id", id);

      if (error) throw error;
      toast.success("Durum güncellendi");
      fetchRequests();
    } catch (error: any) {
      toast.error("Güncelleme hatası");
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64">Yükleniyor...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-display font-bold">Kitap İstekleri</h2>
        <p className="text-muted-foreground">Öğrencilerden gelen yeni kitap talepleri</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {requests.length === 0 ? (
          <div className="glass-card p-12 text-center text-muted-foreground">
            Henüz kitap isteği bulunmuyor.
          </div>
        ) : (
          requests.map((req) => (
            <div key={req.id} className="glass-card p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 hover:border-primary/30 transition-all">
              <div className="space-y-2 md:space-y-3 flex-1">
                <div className="flex items-start md:items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 rounded-lg shrink-0">
                    <BookMarked className="w-4 h-4 md:w-5 md:h-5 text-emerald-500" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-base md:text-lg leading-tight truncate">{req.title}</h4>
                    {req.author && <p className="text-xs md:text-sm text-muted-foreground truncate">Yazar: {req.author}</p>}
                  </div>
                  <Badge variant={req.status === 'pending' ? 'secondary' : req.status === 'approved' ? 'default' : 'destructive'} className="text-[10px] md:text-xs px-1.5 py-0 md:px-2 md:py-0.5">
                    {req.status === 'pending' ? 'Bekliyor' : req.status === 'approved' ? 'Onaylandı' : 'Reddedildi'}
                  </Badge>
                </div>
                
                {req.description && (
                  <p className="text-xs md:text-sm bg-muted/50 p-2 md:p-3 rounded-lg border border-border/50 italic text-muted-foreground/80">
                    "{req.description}"
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-3 md:gap-4 text-[10px] md:text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <UserIcon className="w-3 md:w-3.5 h-3 md:h-3.5" />
                    {req.profile?.full_name} ({req.profile?.class_name})
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 md:w-3.5 h-3 md:h-3.5" />
                    {new Date(req.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {req.status === 'pending' && (
                <div className="flex items-center gap-2 mt-2 md:mt-0">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1 md:flex-none text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 h-8 md:h-9 text-xs"
                    onClick={() => updateStatus(req.id, 'approved')}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                    İşleme Al
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1 md:flex-none text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-8 md:h-9 text-xs"
                    onClick={() => updateStatus(req.id, 'rejected')}
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1.5" />
                    Reddet
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
