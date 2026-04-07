import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Send, Pin, BookOpen, User, Search, Trash2, ArrowLeft, Check, CheckCheck } from "lucide-react";

interface Profile {
  id: string;
  full_name: string;
  role: string;
  last_seen_at?: string;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  quoted_text?: string;
  page_number?: number;
  book?: { title: string };
}

export default function Messages() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const selectedRecipientRef = useRef<Profile | null>(null);

  // Ref'i güncel tutalım (Stale closure hatasını önlemek için)
  useEffect(() => {
    selectedRecipientRef.current = selectedRecipient;
  }, [selectedRecipient]);

  // Kendi aktifliğimizi güncelle
  useEffect(() => {
    if (!user) return;
    const updatePresence = async () => {
      await (supabase as any).from("profiles").update({ last_seen_at: new Date().toISOString() }).eq("id", user.id);
    };
    updatePresence();
    const interval = setInterval(updatePresence, 1000 * 60 * 3); // 3 dakikada bir
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    fetchProfiles();
  }, [user]);

  // Abonelik sistemini daha uyanık hale getiriyoruz (özellikle mobil için)
  useEffect(() => {
    if (!user) return;
    
    const channelName = `mesaj-kanal-${user.id}-${selectedRecipient?.id || 'genel'}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newMsg = payload.new as any;
            if (
              (newMsg.sender_id === selectedRecipient?.id && newMsg.receiver_id === user?.id) ||
              (newMsg.sender_id === user?.id && newMsg.receiver_id === selectedRecipient?.id)
            ) {
              fetchMessages();
            } else {
              if (newMsg.receiver_id === user?.id) {
                fetchProfiles();
                toast.info("Yeni bir mesajınız var!");
              }
            }
          } else if (payload.eventType === "UPDATE") {
            const updatedMsg = payload.new as any;
            if (
              updatedMsg.sender_id === user?.id && 
              updatedMsg.receiver_id === selectedRecipient?.id && 
              updatedMsg.is_read
            ) {
              fetchMessages();
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, selectedRecipient?.id]);

  useEffect(() => {
    if (selectedRecipient) {
      fetchMessages();
    }
  }, [selectedRecipient]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Her dakika profil listesini tazele (aktiflik ışıkları için)
  useEffect(() => {
    const profileInterval = setInterval(fetchProfiles, 1000 * 60);
    return () => clearInterval(profileInterval);
  }, []);

  const isUserActive = (lastSeen?: string) => {
    if (!lastSeen) return false;
    const lastSeenDate = new Date(lastSeen).getTime();
    const now = new Date().getTime();
    return now - lastSeenDate < 1000 * 60 * 5; // Son 5 dakika
  };

  const fetchProfiles = async () => {
    if (!user) return;
    
    setLoading(true);
    // 1. Tüm profilleri çek
    const { data: profilesData } = await (supabase as any)
      .from("profiles")
      .select("id, full_name, role, last_seen_at")
      .neq("id", user.id);

    if (!profilesData) {
      setLoading(false);
      return;
    }

    // 2. Mesaj geçmişini çek (Sıralama için son mesaj tarihlerini bulacağız)
    const { data: lastMessages } = await (supabase as any)
      .from("messages")
      .select("sender_id, receiver_id, created_at, is_read")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    // En son mesaj tarihini her profil için eşleştirelim
    const profilesWithUnreadAndSort = profilesData.map((p: any) => {
      const lastMsg = lastMessages?.find((m: any) => 
        (m.sender_id === p.id && m.receiver_id === user.id) || 
        (m.sender_id === user.id && m.receiver_id === p.id)
      );
      
      const hasUnread = lastMessages?.some((m: any) => 
        m.sender_id === p.id && m.receiver_id === user.id && !m.is_read
      );

      return {
        ...p,
        lastMessageAt: lastMsg ? new Date(lastMsg.created_at).getTime() : 0,
        hasUnread: hasUnread
      };
    });

    // Mesajlaşma tarihine göre (en yeni en üstte) veya isme göre sırala
    const sortedProfiles = [...profilesWithUnreadAndSort].sort((a, b) => {
      // Eğer ikisi de mesajlaşmışsa tarihe göre
      if (b.lastMessageAt !== a.lastMessageAt) {
        return b.lastMessageAt - a.lastMessageAt;
      }
      // Mesaj yoksa isme göre
      return a.full_name.localeCompare(b.full_name);
    });

    setProfiles(sortedProfiles);
    setLoading(false);
  };

  const deleteMessage = async (msgId: string) => {
    const { error } = await (supabase as any)
      .from("messages")
      .delete()
      .eq("id", msgId)
      .eq("sender_id", user?.id); // Sadece kendi mesajını silebilir

    if (error) {
      toast.error("Mesaj silinemedi");
    } else {
      setMessages(prev => prev.filter(m => m.id !== msgId));
      toast.success("Mesaj silindi");
    }
  };

  const markAsRead = async (recipientId: string) => {
    if (!user) return;
    const { error } = await (supabase as any)
      .from("messages")
      .update({ is_read: true })
      .eq("receiver_id", user.id)
      .eq("sender_id", recipientId)
      .eq("is_read", false);
    
    if (!error) {
      fetchProfiles();
    }
  };

  const fetchMessages = async () => {
    if (!user || !selectedRecipient) return;

    const { data } = await (supabase as any).from("messages")
      .select(`
        *,
        book:books (title)
      `)
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedRecipient.id}),and(sender_id.eq.${selectedRecipient.id},receiver_id.eq.${user.id})`)
      .order("created_at", { ascending: true });

    setMessages(data || []);
    
    // Sohbete girince veya açıkken mesaj gelince okundu işaretle
    await markAsRead(selectedRecipient.id);
  };


  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedRecipient || !user) return;

    const { error } = await (supabase as any).from("messages").insert({
      sender_id: user.id,
      receiver_id: selectedRecipient.id,
      content: newMessage,
    });

    if (error) {
      toast.error("Mesaj gönderilemedi");
    } else {
      setNewMessage("");
      fetchMessages();
      fetchProfiles(); // Listeyi en üste almak için tazele
    }
  };

  const filteredProfiles = profiles.filter(p => 
    p.full_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-background/50 backdrop-blur-xl rounded-3xl border border-white/5 overflow-hidden shadow-2xl relative">
      {/* Sidebar: Users List */}
      <div className={`w-full md:w-80 border-r border-white/5 flex flex-col bg-muted/20 ${selectedRecipient ? "hidden md:flex" : "flex"}`}>
        <div className="p-6 border-b border-white/5">
          <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Mesajlar</h2>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Arkadaşlarını ara..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 rounded-xl"
            />
          </div>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {filteredProfiles.map((profile) => (
              <button
                key={profile.id}
                onClick={() => setSelectedRecipient(profile)}
                className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${
                  selectedRecipient?.id === profile.id 
                    ? "bg-primary text-primary-foreground shadow-lg scale-[0.98]" 
                    : "hover:bg-white/5 text-muted-foreground hover:text-white"
                }`}
              >
                <div className="relative">
                  <Avatar className="h-10 w-10 border-2 border-white/10">
                    <AvatarFallback className="bg-secondary/20"><User className="w-5 h-5" /></AvatarFallback>
                  </Avatar>
                  {isUserActive(profile.last_seen_at) && (
                    <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-emerald-500 border-2 border-[#12141c] rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                  )}
                </div>
                <div className="text-left overflow-hidden flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-sm truncate">{profile.full_name}</p>
                    {(profile as any).hasUnread && (
                      <div className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)] animate-pulse" />
                    )}
                  </div>
                  <p className="text-[10px] opacity-50 uppercase tracking-widest">{(profile as any).role}</p>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col relative overflow-hidden bg-gradient-to-b from-transparent to-primary/5 ${!selectedRecipient ? "hidden md:flex" : "flex animate-in slide-in-from-right duration-300"}`}>
        {selectedRecipient ? (
          <>
            {/* Header */}
            <div className="p-4 md:p-6 border-b border-white/5 flex items-center gap-2 md:gap-4 bg-background/80 backdrop-blur-md z-10 transition-colors">
              {/* Mobil Geri Butonu */}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setSelectedRecipient(null)} 
                className="md:hidden mr-1"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>

              <div className="relative">
                <Avatar className="h-10 w-10 md:h-12 md:w-12 ring-2 ring-primary/20">
                  <AvatarFallback><User className="w-6 h-6" /></AvatarFallback>
                </Avatar>
                {isUserActive(selectedRecipient.last_seen_at) && (
                  <div className="absolute bottom-0 right-0 h-3 w-3 md:h-3.5 md:w-3.5 bg-emerald-500 border-2 border-background rounded-full animate-pulse" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-base md:text-lg text-foreground">{selectedRecipient.full_name}</h3>
                {isUserActive(selectedRecipient.last_seen_at) ? (
                  <p className="text-[10px] md:text-xs text-emerald-500 font-medium">Şu an aktif</p>
                ) : (
                  <p className="text-[10px] md:text-xs text-muted-foreground opacity-70 uppercase tracking-widest font-bold">{selectedRecipient.role}</p>
                )}
              </div>
            </div>

            {/* Messages body */}
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-6">
                {messages.length === 0 && (
                  <div className="text-center py-20 flex flex-col items-center opacity-30">
                    <Send className="w-12 h-12 mb-4 rotate-12" />
                    <p>Sohbeti Başlat!</p>
                  </div>
                )}
                {messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`flex flex-col group ${msg.sender_id === user?.id ? "items-end" : "items-start"}`}
                  >
                    <div className={`max-w-[80%] space-y-1 relative`}>
                      {/* Quote Box (If exists) */}
                      {msg.quoted_text && (
                        <div className="bg-muted/40 p-4 rounded-2xl border-l-4 border-primary text-sm italic backdrop-blur-sm shadow-inner mb-1">
                          <div className="flex items-center gap-2 mb-2 text-[10px] uppercase font-bold text-primary opacity-70">
                            <BookOpen className="w-3 h-3" />
                            {msg.book?.title} - Sayfa {msg.page_number}
                          </div>
                          "{msg.quoted_text}"
                        </div>
                      )}
                      
                      <div className="flex items-end gap-2">
                        {msg.sender_id === user?.id && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => deleteMessage(msg.id)}
                            className="h-6 w-6 opacity-0 group-hover:opacity-50 hover:opacity-100 hover:text-rose-500 transition-all rounded-full"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}

                        <div className={`p-4 rounded-2xl shadow-xl ${
                          msg.sender_id === user?.id 
                            ? "bg-primary text-primary-foreground rounded-tr-none" 
                            : "bg-muted/80 backdrop-blur-md rounded-tl-none border border-white/5"
                        }`}>
                          <p className="text-sm font-medium whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-end gap-1 px-1">
                        <span className="text-[9px] opacity-30 font-mono">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {msg.sender_id === user?.id && (
                          <div className={`flex items-center gap-0.5 text-[8px] font-bold uppercase tracking-tighter ${msg.is_read ? "text-blue-500 animate-in fade-in" : "opacity-30"}`}>
                            {msg.is_read ? (
                              <><CheckCheck className="w-3 h-3" /> Görüldü</>
                            ) : (
                              <><Check className="w-3 h-3" /> İletildi</>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>

            {/* Input area */}
            <div className="p-6 bg-background/80 backdrop-blur-xl border-t border-white/5">
              <form onSubmit={sendMessage} className="flex gap-4">
                <Input 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Mesajınızı yazın..." 
                  className="flex-1 bg-white/5 border-white/10 h-14 px-6 rounded-2xl focus-visible:ring-primary shadow-inner"
                />
                <Button type="submit" size="lg" className="h-14 w-14 rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all">
                  <Send className="w-6 h-6" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground opacity-20 p-20 text-center">
            <Send className="w-32 h-32 mb-8" />
            <h2 className="text-3xl font-display font-bold">Bir Sohbet Seç</h2>
            <p className="max-w-xs mt-4">Arkadaşlarınla kitaplardaki alıntıları ve düşüncelerini paylaşmaya hemen başla.</p>
          </div>
        )}
      </div>
    </div>
  );
}
