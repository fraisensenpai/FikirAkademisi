import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronRight, Loader2, Maximize2, Minimize2, Clock, Share2, User, Search } from "lucide-react";
import { toast } from "sonner";
import { Document, Page, pdfjs } from "react-pdf";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

// Worker for PDF.js - IMPORTANT!
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface Book {
  id: string;
  title: string;
  pdf_url: string;
  total_pages: number;
}

export default function ReadBook() {
  const { bookId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [book, setBook] = useState<Book | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [scale, setScale] = useState(1.0);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<string>("");
  const [quote, setQuote] = useState("");
  const [userSearch, setUserSearch] = useState("");

  // Anti-Cheat Variables
  const [activeSeconds, setActiveSeconds] = useState(0);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [isIdle, setIsIdle] = useState(false);
  const IDLE_THRESHOLD = 60000; // 60 saniye hareketsizlik limiti
  const MIN_READ_TIME_PER_PAGE = 10; // Bir sayfa için minimum 10 saniye aktiflik gerek

  const filteredParticipants = profiles.filter(p => 
    p.full_name.toLowerCase().includes(userSearch.toLowerCase())
  );

  // Aktivite Takipçisi (Anti-Hile Mekanizması)
  useEffect(() => {
    const handleUserActivity = () => {
      setLastActivity(Date.now());
      setIsIdle(false);
    };

    window.addEventListener("mousemove", handleUserActivity);
    window.addEventListener("keydown", handleUserActivity);
    window.addEventListener("scroll", handleUserActivity);
    window.addEventListener("click", handleUserActivity);
    window.addEventListener("touchstart", handleUserActivity);

    const interval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivity;
      const isWindowActive = document.visibilityState === "visible";

      if (timeSinceLastActivity < IDLE_THRESHOLD && isWindowActive) {
        setActiveSeconds(prev => prev + 1);
        setIsIdle(false);
      } else {
        setIsIdle(true);
      }
    }, 1000);

    return () => {
      window.removeEventListener("mousemove", handleUserActivity);
      window.removeEventListener("keydown", handleUserActivity);
      window.removeEventListener("scroll", handleUserActivity);
      window.removeEventListener("click", handleUserActivity);
      window.removeEventListener("touchstart", handleUserActivity);
      clearInterval(interval);
    };
  }, [lastActivity]);

  useEffect(() => {
    const fetchBookAndProgress = async () => {
      try {
        const { data: bookData, error: bookError } = await supabase
          .from("books")
          .select("*")
          .eq("id", bookId)
          .single();

        if (bookError) throw bookError;
        setBook(bookData);

        const { data: progData } = await supabase
          .from("user_books")
          .select("current_page, total_minutes")
          .eq("user_id", user?.id)
          .eq("book_id", bookId)
          .maybeSingle();

        if (progData) {
          setCurrentPage(progData.current_page || 1);
          setTotalMinutes(Number(progData.total_minutes) || 0);
        }
      } catch (error: any) {
        toast.error("Kitap yüklenemedi");
        navigate("/dashboard/books");
      } finally {
        setLoading(false);
      }
    };

    const fetchProfiles = async () => {
      const { data } = await supabase.from("profiles").select("id, full_name").neq("id", user?.id);
      setProfiles(data || []);
    };

    if (bookId && user) {
      fetchBookAndProgress();
      fetchProfiles();
    }
  }, [bookId, user]);

  const [pageWidth, setPageWidth] = useState(window.innerWidth > 768 ? 800 : window.innerWidth - 32);

  useEffect(() => {
    const handleResize = () => {
      setPageWidth(window.innerWidth > 768 ? 800 : window.innerWidth - 32);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const handleSaveProgress = async (targetPage: number) => {
    if (!user || !book) return;

    // Sadece aktif geçen süreyi dakikaya çevirip ekle
    const sessionMinutes = Math.min(activeSeconds / 60, 30); // Bir sayfada tek seferde max 30 dk sayılabilir

    const total = numPages || book.total_pages;
    let progressPercent = 0;
    if (total > 0) {
      progressPercent = Number(((targetPage / total) * 100).toFixed(2));
    }

    try {
      const { error: upsertError } = await supabase
        .from("user_books")
        .upsert({
          user_id: user.id,
          book_id: book.id,
          current_page: targetPage,
          progress_percent: progressPercent,
          total_minutes: Number(totalMinutes) + sessionMinutes,
          last_read_at: new Date().toISOString(),
          is_completed: targetPage >= total
        }, { onConflict: 'user_id,book_id' });

      if (upsertError) throw upsertError;
      
      setTotalMinutes(prev => Number(prev) + sessionMinutes);
      setActiveSeconds(0);
      return true;
    } catch (error) {
      console.error("Save failed:", error);
      return false;
    }
  };

  const handleNextPage = async () => {
    if (!user || !book || (numPages && currentPage >= numPages)) return;

    // SERT HİLE ENGELİ: Minimum süre dolmadan kesinlikle geçirilmez
    if (activeSeconds < MIN_READ_TIME_PER_PAGE) {
      const remaining = MIN_READ_TIME_PER_PAGE - activeSeconds;
      toast.error(`Sayfayı henüz geçemezsiniz! 🛡️`, {
        description: `Sonraki sayfaya geçmek için ${remaining} saniye daha aktif okumanız gerekiyor.`,
        duration: 3000,
      });
      return; // KESİNLİKLE DURDUR
    }

    setSaving(true);
    const success = await handleSaveProgress(currentPage + 1);
    if (success) setCurrentPage(currentPage + 1);
    setSaving(false);
  };

  const handlePrevPage = async () => {
    if (currentPage <= 1) return;
    setSaving(true);
    const success = await handleSaveProgress(currentPage - 1);
    if (success) setCurrentPage(currentPage - 1);
    setSaving(false);
  };

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Not: beforeunload içinde async işler garanti değildir ama denemekte fayda var
      if (activeSeconds > 5) {
        handleSaveProgress(currentPage);
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [activeSeconds, currentPage]);

  const isLastPage = numPages ? currentPage >= numPages : false;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background gap-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-muted-foreground animate-pulse font-display">Kitap Hazırlanıyor...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1115] flex flex-col text-white selection:bg-primary/30">
      {/* Dynamic Header */}
      <div className="sticky top-0 w-full z-50 bg-[#0f1115]/80 backdrop-blur-xl border-b border-white/5 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard/books")}
            className="hover:bg-white/10 rounded-xl"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-display font-bold text-sm md:text-lg line-clamp-1">{book?.title}</h1>
            <p className="text-[10px] md:text-xs opacity-50 font-mono tracking-widest uppercase">
              SAYFA {currentPage} / {numPages || "..."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isIdle && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-amber-500/20 border border-amber-500/30 rounded-full animate-pulse">
              <Clock className="w-3 h-3 text-amber-500" />
              <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Hareketsizlik: Süre Durdu</span>
            </div>
          )}
          {!isIdle && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Okuma Takip Ediliyor</span>
            </div>
          )}
          <Button variant="outline" size="icon" onClick={() => setScale(s => Math.max(0.5, s - 0.1))} className="h-8 w-8 md:h-10 md:w-10 border-white/5 bg-white/5"><Minimize2 className="w-4 h-4" /></Button>
          <Button variant="outline" size="icon" onClick={() => setScale(s => Math.min(2, s + 0.1))} className="h-8 w-8 md:h-10 md:w-10 border-white/5 bg-white/5"><Maximize2 className="w-4 h-4" /></Button>
        </div>
      </div>

      {/* Main Content: The PDF */}
      <div className="flex-1 flex flex-col items-center p-4 md:p-8 overflow-y-auto custom-scrollbar pt-20 pb-32">
        {/* Mobile Status Indicator */}
        {isIdle && (
          <div className="md:hidden mb-4 flex items-center gap-2 px-3 py-2 bg-amber-500/20 border border-amber-500/30 rounded-xl w-full justify-center animate-pulse">
            <Clock className="w-3 h-3 text-amber-500" />
            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Süre Duraklatıldı</span>
          </div>
        )}

        <div className="relative group transition-all duration-500 hover:scale-[1.005]">
          <Document
            file={book?.pdf_url}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <div className="flex flex-col items-center gap-4 py-20">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <span className="text-sm opacity-50">Sayfalar oluşturuluyor...</span>
              </div>
            }
          >
            <Page
              pageNumber={currentPage}
              width={pageWidth}
              scale={scale}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              className="max-w-full drop-shadow-2xl"
              loading={<div className="h-[500px] md:h-[800px] w-full bg-white/5 rounded-2xl animate-pulse" />}
            />
          </Document>
        </div>

        {/* Sticky Action Bar */}
        <div className="sticky bottom-0 w-full max-w-4xl mt-auto z-40 animate-fade-in group px-0 md:px-2 pb-2 md:pb-6">
          <div className="bg-background/60 backdrop-blur-lg rounded-t-2xl md:rounded-2xl p-3 md:p-5 border-t md:border border-white/10 shadow-[0_-20px_50px_rgba(0,0,0,0.3)] space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 space-y-1">
                <div className="flex justify-between text-[10px] font-mono text-white/40 px-1">
                  <span className="uppercase tracking-widest text-primary font-bold">İlerleme</span>
                  <span className="text-primary font-bold">{Math.round((currentPage / (numPages || 1)) * 100)}%</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-1000"
                    style={{ width: `${(currentPage / (numPages || 1)) * 100}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="icon" className="h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl border-white/10 hover:bg-white/10 bg-white/5">
                      <Share2 className="w-5 h-5 opacity-80" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-xl border-white/5 rounded-3xl p-6">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-display font-bold text-foreground">Alıntıyı Paylaş</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                          <label className="text-[10px] font-bold uppercase opacity-60 tracking-widest text-primary">ARKADAŞINI BUL & SEÇ</label>
                          {selectedRecipient && (
                            <span className="text-[10px] text-emerald-500 font-bold animate-pulse">Kişi Seçildi!</span>
                          )}
                        </div>
                        
                        {/* Birleşik Arama ve Seçim Alanı */}
                        <div className="space-y-2">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input 
                              placeholder="İsim veya rol ile ara..." 
                              value={userSearch}
                              onChange={(e) => setUserSearch(e.target.value)}
                              className="h-12 pl-10 bg-muted/20 border-white/10 rounded-2xl text-foreground focus:ring-2 focus:ring-primary/50 transition-all"
                            />
                          </div>

                          <ScrollArea className="h-[200px] rounded-2xl border border-white/5 bg-muted/10 p-2">
                            <div className="space-y-1">
                              {filteredParticipants.slice(0, 50).map(p => (
                                <button
                                  key={p.id}
                                  onClick={() => {
                                    setSelectedRecipient(p.id);
                                    setUserSearch(p.full_name); // Seçilince ismi kutuya yazabiliriz veya seçili olduğunu belli ederiz
                                  }}
                                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                                    selectedRecipient === p.id 
                                      ? "bg-primary text-primary-foreground shadow-lg scale-[0.98]" 
                                      : "hover:bg-white/5 text-foreground/80 hover:text-foreground"
                                  }`}
                                >
                                  <div className="flex flex-col items-start gap-0.5">
                                    <span className="font-bold text-sm">{p.full_name}</span>
                                    <span className={`text-[9px] uppercase tracking-tighter ${selectedRecipient === p.id ? "text-primary-foreground/60" : "opacity-40"}`}>
                                      {p.role || "Öğrenci"}
                                    </span>
                                  </div>
                                  {selectedRecipient === p.id && (
                                    <div className="h-2 w-2 rounded-full bg-primary-foreground animate-ping" />
                                  )}
                                </button>
                              ))}
                              {filteredParticipants.length === 0 && (
                                <div className="py-10 text-center flex flex-col items-center opacity-30">
                                  <User className="w-8 h-8 mb-2" />
                                  <p className="text-xs">Kimse bulunamadı</p>
                                </div>
                              )}
                            </div>
                          </ScrollArea>
                        </div>
                      </div>

                      <div className="space-y-2 text-left">
                        <label className="text-[10px] font-bold uppercase opacity-60 tracking-widest text-primary block">ALINTI / NOTUN</label>
                        <Textarea 
                          placeholder="Bu kısım harikaydı, mutlaka okumalısın!..." 
                          className="min-h-[100px] bg-muted/40 border-white/10 rounded-2xl resize-none p-4 text-foreground text-sm focus:ring-1 focus:ring-primary placeholder:opacity-30"
                          value={quote}
                          onChange={(e) => setQuote(e.target.value)}
                        />
                        <div className="flex items-center gap-2 px-1 opacity-50 italic text-[10px] text-foreground/70">
                          <Clock className="w-3 h-3" />
                          {book?.title} - Sayfa {currentPage} otomatik eklenecek.
                        </div>
                      </div>

                      <Button 
                        onClick={async () => {
                          if (!selectedRecipient || !quote.trim()) return toast.error("Kişi ve alıntı seçmelisiniz");
                          const { error } = await (supabase as any).from("messages").insert({
                            sender_id: user?.id,
                            receiver_id: selectedRecipient,
                            content: quote,
                            book_id: book?.id,
                            quoted_text: "Kitaptan bir alıntı paylaştı",
                            page_number: currentPage
                          });
                          if (!error) {
                            toast.success("Alıntı başarıyla gönderildi!");
                            setIsShareOpen(false);
                            setQuote("");
                          } else {
                            toast.error("Gönderilirken bir sorun oluştu");
                          }
                        }}
                        className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold text-lg shadow-xl hover:scale-[1.02] active:scale-95 transition-all outline-none border-none"
                      >
                        Hemen Paylaş
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button
                  onClick={handlePrevPage}
                  disabled={saving || currentPage <= 1}
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl border-white/10 hover:bg-white/10 bg-white/5"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>

                {activeSeconds < MIN_READ_TIME_PER_PAGE ? (
                  <Button
                    onClick={handleNextPage}
                    size="lg"
                    className="px-4 md:px-8 h-10 md:h-12 rounded-xl md:rounded-2xl bg-amber-600/80 text-white font-bold shadow-lg flex-1 md:flex-none text-xs md:text-sm border border-amber-500/50 cursor-not-allowed"
                  >
                    🔒 {MIN_READ_TIME_PER_PAGE - activeSeconds}s bekle
                  </Button>
                ) : (
                  <Button
                    onClick={handleNextPage}
                    disabled={saving || isLastPage}
                    size="lg"
                    className="px-6 md:px-8 h-10 md:h-12 rounded-xl md:rounded-2xl bg-primary text-primary-foreground font-bold shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-30 flex-1 md:flex-none text-xs md:text-sm"
                  >
                    {saving ? <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" /> : "Sonraki Sayfa"}
                    <ChevronRight className="ml-2 w-4 h-4 md:w-5 md:h-5" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
