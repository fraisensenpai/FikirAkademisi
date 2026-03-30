import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronRight, Loader2, Maximize2, Minimize2, Clock } from "lucide-react";
import { toast } from "sonner";
import { Document, Page, pdfjs } from "react-pdf";

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
  const [startTime] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [scale, setScale] = useState(1.0);

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

    if (bookId && user) fetchBookAndProgress();
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

  const handleNextPage = async () => {
    if (!user || !book || (numPages && currentPage >= numPages)) return;
    
    setSaving(true);
    const nextPage = currentPage + 1;
    const total = numPages || book.total_pages;
    const progressPercent = (nextPage / total) * 100;

    // Calculate time spent since opening the book (in minutes)
    const now = Date.now();
    const timeSpentMs = now - startTime;
    const sessionMinutes = timeSpentMs / (1000 * 60);

    try {
      const { error } = await supabase
        .from("user_books")
        .upsert({
          user_id: user.id,
          book_id: book.id,
          current_page: nextPage,
          progress_percent: progressPercent,
          total_minutes: totalMinutes + sessionMinutes, // Add session time to total
          last_read_at: new Date().toISOString(),
          is_completed: nextPage >= total
        }, { onConflict: 'user_id,book_id' });

      if (error) throw error;
      setCurrentPage(nextPage);
      // We don't reset startTime here because we want to track total session accurately
      // but we update totalMinutes for subsequent clicks
      setTotalMinutes(prev => prev + sessionMinutes); 
      window.scrollTo(0, 0);
    } catch (error: any) {
      toast.error("İlerleme kaydedilemedi");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
      <p className="text-muted-foreground animate-pulse font-medium">Kütüphaneden kitap alınıyor...</p>
    </div>
  );
  
  if (!book) return null;

  const isLastPage = numPages ? currentPage >= numPages : false;

  return (
    <div className="flex flex-col min-h-screen bg-[#1a1a1a] font-sans selection:bg-primary/30">
      {/* Smart Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-xl border-b border-white/5 px-6 flex items-center justify-between text-white z-50">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/books")} className="text-white hover:bg-white/10 rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="min-w-0">
            <h1 className="font-bold text-base truncate pr-4">{book.title}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[10px] text-white/50 uppercase tracking-widest font-bold">Okuma Modu Aktif</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/10">
             <Button variant="ghost" size="icon" onClick={() => setScale(s => Math.max(0.7, s - 0.1))} className="h-8 w-8 text-white"><Minimize2 className="w-4 h-4" /></Button>
             <span className="text-xs font-mono w-12 text-center">{Math.round(scale * 100)}%</span>
             <Button variant="ghost" size="icon" onClick={() => setScale(s => Math.min(1.5, s + 0.1))} className="h-8 w-8 text-white"><Maximize2 className="w-4 h-4" /></Button>
          </div>
          <div className="text-sm font-mono bg-primary/20 text-primary border border-primary/30 px-4 py-1.5 rounded-full font-bold">
            {currentPage} / {numPages || "..."}
          </div>
        </div>
      </header>

      {/* Modern Reader Body */}
      <main className="flex-1 flex flex-col items-center pt-20 pb-32 px-1 md:px-4 no-select relative overflow-x-hidden">
        <div className="w-full max-w-full md:max-w-4xl flex justify-center bg-white shadow-[0_0_60px_rgba(0,0,0,0.6)] rounded-sm overflow-hidden touch-none">
          <Document
            file={book.pdf_url}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <div className="h-[500px] md:h-[800px] w-full flex items-center justify-center bg-white">
                <Loader2 className="w-12 h-12 animate-spin text-slate-300" />
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
              loading={<div className="h-[500px] md:h-[800px] w-full bg-white" />}
            />
          </Document>
        </div>

        {/* Dynamic Action Bar - Moved below PDF for better visibility */}
        <div className="w-full max-w-4xl mt-8 mb-12 animate-fade-in group px-2">
          <div className="bg-background/40 backdrop-blur-md rounded-2xl p-4 md:p-6 border border-white/10 shadow-2xl space-y-4 md:space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex justify-between text-xs font-mono text-white/50 mb-1">
                  <span className="uppercase tracking-widest">Okuma İlerlemesi</span>
                  <span className="text-primary font-bold">{Math.round((currentPage / (numPages || 1)) * 100)}%</span>
                </div>
                <div className="h-2 md:h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="h-full bg-primary transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(255,255,255,0.2)]" 
                    style={{ width: `${(currentPage / (numPages || 1)) * 100}%` }}
                  />
                </div>
              </div>
              
              <Button
                onClick={handleNextPage}
                disabled={saving || isLastPage}
                size="lg"
                className="bg-primary hover:bg-primary/90 text-white font-bold h-12 md:h-16 px-6 md:px-10 rounded-xl shadow-xl transition-all active:scale-95 group shrink-0"
              >
                {saving ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <>
                    <span className="text-sm md:text-base">
                      {isLastPage ? "Kitabı Bitirdin! 🎉" : "Sonraki Sayfaya Geç"}
                    </span>
                    {!isLastPage && <ChevronRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />}
                  </>
                )}
              </Button>
            </div>
            
            <div className="flex items-center justify-center gap-2 pt-2 border-t border-white/5">
              <Clock className="w-3.5 h-3.5 text-white/20" />
              <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-medium italic">
                İlerlemeniz {currentPage}. sayfada otomatik olarak buluta kaydedildi
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
