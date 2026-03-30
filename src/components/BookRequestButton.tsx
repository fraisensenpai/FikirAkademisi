import { useState } from "react";
import { Plus, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function BookRequestButton() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    try {
      const { error } = await (supabase as any).from("book_requests").insert({
        user_id: user.id,
        title,
        author,
        description,
      });

      if (error) throw error;
      
      toast.success("Kitap isteğiniz gönderildi!");
      setOpen(false);
      setTitle("");
      setAuthor("");
      setDescription("");
    } catch (error: any) {
      toast.error("İstek gönderilemedi: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          className="fixed bottom-20 right-6 w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 shadow-2xl z-50 group transition-all active:scale-90"
        >
          <Plus className="w-8 h-8 text-white group-hover:rotate-90 transition-transform duration-300" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Plus className="w-5 h-5 text-emerald-500" />
            Kitap İste
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Kitap Adı</Label>
            <Input 
              id="title" 
              placeholder="Hangi kitabı okumak istersin?" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              required 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="author">Yazar (Opsiyonel)</Label>
            <Input 
              id="author" 
              placeholder="Yazarın adını biliyorsan yazabilirsin" 
              value={author} 
              onChange={(e) => setAuthor(e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Neden bu kitabı istiyorsun? (Opsiyonel)</Label>
            <Textarea 
              id="description" 
              placeholder="Kısa bir açıklama..." 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              className="resize-none"
              rows={3}
            />
          </div>
          <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 h-11" disabled={loading}>
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4 mr-2" /> Talebi Gönder</>}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
