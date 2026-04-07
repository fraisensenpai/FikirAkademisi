import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Send, BookOpen, User, Users, Search, Trash2, ArrowLeft, Check, CheckCheck, Smile } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface Profile {
  id: string;
  full_name: string;
  role: string;
  last_seen_at?: string;
  hasUnread?: boolean;
  lastMessageAt?: number;
  isGroup?: boolean;
}

interface Reaction {
  id: string;
  emoji: string;
  user_id: string;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id?: string;
  group_id?: string;
  content: string;
  created_at: string;
  is_read: boolean;
  quoted_text?: string;
  page_number?: number;
  book?: { title: string };
  message_reactions?: Reaction[];
  sender?: { full_name: string };
}

const COMMON_EMOJIS = ["❤️", "👍", "😂", "😮", "😢", "🙏"];

export default function Messages() {
  const { user } = useAuth();
  const [items, setItems] = useState<Profile[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Kendi aktifliğimizi güncelle
  useEffect(() => {
    if (!user) return;
    const updatePresence = async () => {
      await (supabase as any).from("profiles").update({ last_seen_at: new Date().toISOString() }).eq("id", user.id);
    };
    updatePresence();
    const interval = setInterval(updatePresence, 1000 * 60 * 3);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    fetchItems();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    
    const channel = supabase
      .channel("messages-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => {
          console.log("Realtime: Mesaj değişikliği algılandı");
          fetchMessages();
          fetchItems();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "message_reactions" },
        () => fetchMessages()
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

  const isUserActive = (lastSeen?: string) => {
    if (!lastSeen) return false;
    const lastSeenDate = new Date(lastSeen).getTime();
    return new Date().getTime() - lastSeenDate < 1000 * 60 * 5;
  };

  const fetchItems = async () => {
    if (!user) return;
    try {
      setLoading(true);
      
      // 1. Profil bilgilerini çek
      const { data: profilesData, error: profError } = await (supabase as any)
        .from("profiles")
        .select("id, full_name, role, last_seen_at")
        .neq("id", user.id);

      if (profError) throw profError;
      console.log("Profiller yüklendi:", profilesData?.length || 0);

      // 2. Kullanıcının üye olduğu grupları çek
      const { data: myGroups, error: grpError } = await (supabase as any)
        .from("group_members")
        .select("group_id, groups(id, name)")
        .eq("user_id", user.id);

      if (grpError) throw grpError;
      console.log("Gruplar yüklendi:", myGroups?.length || 0);

      const groupItems = myGroups?.map((g: any) => ({
        id: g.groups.id,
        full_name: (g.groups.name as string).toUpperCase(),
        role: "GRUP",
        isGroup: true
      })) || [];

      // 3. Mesaj geçmişini çek (Okunmadı ve sıralama için)
      let lastMessages: any[] = [];
      try {
        const groupIds = groupItems.map(g => g.id);
        let query = (supabase as any).from("messages").select("sender_id, receiver_id, group_id, created_at, is_read");
        
        if (groupIds.length > 0) {
          query = query.or(`sender_id.eq.${user.id},receiver_id.eq.${user.id},group_id.in.(${groupIds.join(',')})`);
        } else {
          query = query.or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);
        }

        const { data, error: msgError } = await query.order("created_at", { ascending: false });
        if (!msgError) lastMessages = data || [];
        else console.warn("Mesaj geçmişi yüklenemedi (Sıralama varsayılan olacak):", msgError);
      } catch (e) {
        console.warn("Mesaj geçmişi sorgu hatası:", e);
      }

      console.log("Listeniz hazırlanıyor...");
      const allItems = [...(profilesData || []), ...groupItems].map((p: any) => {
        const lastMsg = lastMessages?.find((m: any) => 
          p.isGroup 
            ? m.group_id === p.id 
            : (m.sender_id === p.id && m.receiver_id === user.id) || (m.sender_id === user.id && m.receiver_id === p.id)
        );
        const hasUnread = lastMessages?.some((m: any) => 
          p.isGroup ? false : m.sender_id === p.id && m.receiver_id === user.id && !m.is_read
        );
        return {
          ...p,
          lastMessageAt: lastMsg ? new Date(lastMsg.created_at).getTime() : 0,
          hasUnread
        };
      });

      setItems(allItems.sort((a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0)));
    } catch (err) {
      console.error("fetchItems Genel Hatası:", err);
      toast.error("Bağlantı hatası: Sayfayı yenileyin");
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    if (!user || !selectedRecipient) return;
    
    try {
      let query = (supabase as any).from("messages")
        .select("*, book:books(title), message_reactions(id, emoji, user_id), sender:profiles(full_name)");

      if (selectedRecipient.isGroup) {
        query = query.eq("group_id", selectedRecipient.id);
      } else {
        query = query.or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedRecipient.id}),and(sender_id.eq.${selectedRecipient.id},receiver_id.eq.${user.id})`);
      }

      const { data, error } = await query.order("created_at", { ascending: true });
      if (error) throw error;
      
      setMessages(data || []);
      
      if (!selectedRecipient.isGroup && data?.some((m: any) => !m.is_read && m.receiver_id === user.id)) {
        await markAsRead(selectedRecipient.id);
      }
    } catch (err) {
      console.error("fetchMessages Hatası:", err);
    }
  };

  const markAsRead = async (recipientId: string) => {
    await (supabase as any).from("messages").update({ is_read: true }).eq("receiver_id", user?.id).eq("sender_id", recipientId).eq("is_read", false);
    fetchItems();
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedRecipient || !user) return;
    
    const payload: any = { 
      sender_id: user.id, 
      content: newMessage 
    };

    if (selectedRecipient.isGroup) {
      payload.group_id = selectedRecipient.id;
    } else {
      payload.receiver_id = selectedRecipient.id;
    }

    await (supabase as any).from("messages").insert(payload);
    setNewMessage("");
    fetchMessages();
    fetchItems();
  };

  const deleteMessage = async (id: string) => {
    const { error } = await (supabase as any).from("messages").delete().eq("id", id).eq("sender_id", user?.id);
    if (error) toast.error("Silinemedi");
    else fetchMessages();
  };

  const toggleReaction = async (messageId: string, emoji: string) => {
    if (!user) return;
    const existing = messages.find(m => m.id === messageId)?.message_reactions?.find(r => r.user_id === user.id && r.emoji === emoji);
    if (existing) {
      await (supabase as any).from("message_reactions").delete().eq("id", existing.id);
    } else {
      await (supabase as any).from("message_reactions").insert({ message_id: messageId, user_id: user.id, emoji });
    }
    fetchMessages();
  };

  const renderReactions = (msg: Message) => {
    if (!msg.message_reactions?.length) return null;
    const counts: { [emoji: string]: number } = {};
    msg.message_reactions.forEach(r => counts[r.emoji] = (counts[r.emoji] || 0) + 1);
    return (
      <div className={`flex flex-wrap gap-1 mt-1 ${msg.sender_id === user?.id ? "justify-end" : "justify-start"}`}>
        {Object.entries(counts).map(([emoji, count]) => (
          <button 
            key={emoji} 
            onClick={() => toggleReaction(msg.id, emoji)}
            className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 border border-white/5 transition-all ${msg.message_reactions?.some(r => r.user_id === user?.id && r.emoji === emoji) ? "bg-primary/20 text-primary border-primary/20" : "bg-muted/50 text-muted-foreground"}`}
          >
            {emoji} {count > 1 && count}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-background/50 backdrop-blur-xl rounded-3xl border border-white/5 overflow-hidden shadow-2xl relative">
      {/* Sidebar */}
      <div className={`w-full md:w-80 border-r border-white/5 flex flex-col bg-muted/20 ${selectedRecipient ? "hidden md:flex" : "flex"}`}>
        <div className="p-6 border-b border-white/5">
          <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Mesajlar</h2>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Ara..." 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 rounded-xl"
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {items.filter(p => p.full_name.toLowerCase().includes(search.toLowerCase())).map(item => (
              <button
                key={item.id}
                onClick={() => setSelectedRecipient(item)}
                className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${selectedRecipient?.id === item.id ? "bg-primary text-primary-foreground shadow-lg" : "hover:bg-white/5 text-muted-foreground hover:text-white"}`}
              >
                <div className="relative">
                  <Avatar className={`h-10 w-10 border-2 border-white/10 ${item.isGroup ? "rounded-xl bg-indigo-500/20" : ""}`}>
                    <AvatarFallback className={item.isGroup ? "bg-transparent text-indigo-400" : "bg-secondary/20"}>
                      {item.isGroup ? <Users className="w-5 h-5" /> : <User className="w-5 h-5" />}
                    </AvatarFallback>
                  </Avatar>
                  {!item.isGroup && isUserActive(item.last_seen_at) && <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-emerald-500 border-2 border-[#12141c] rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />}
                </div>
                <div className="text-left flex-1 overflow-hidden">
                  <div className="flex items-center justify-between">
                    <p className={`font-bold text-sm truncate ${item.isGroup ? "text-indigo-200" : ""}`}>{item.full_name}</p>
                    {item.hasUnread && <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />}
                  </div>
                  <p className="text-[10px] opacity-50 truncate uppercase font-bold tracking-tighter">{item.role}</p>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col relative overflow-hidden bg-gradient-to-b from-transparent to-primary/5 ${!selectedRecipient ? "hidden md:flex" : "flex animate-in slide-in-from-right duration-300"}`}>
        {selectedRecipient ? (
          <>
            <div className="p-4 md:p-6 border-b border-white/5 flex items-center justify-between bg-background/80 backdrop-blur-md z-10">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => setSelectedRecipient(null)} className="md:hidden"><ArrowLeft className="w-5 h-5" /></Button>
                <div className="relative">
                  <Avatar className={`h-10 w-10 ring-2 ${selectedRecipient.isGroup ? "ring-indigo-500/30 rounded-xl bg-indigo-500/10" : "ring-primary/20"}`}>
                    <AvatarFallback className={selectedRecipient.isGroup ? "text-indigo-400" : ""}>
                      {selectedRecipient.isGroup ? <Users className="w-6 h-6" /> : <User className="w-6 h-6" />}
                    </AvatarFallback>
                  </Avatar>
                  {!selectedRecipient.isGroup && isUserActive(selectedRecipient.last_seen_at) && <div className="absolute bottom-0 right-0 h-3 w-3 bg-emerald-500 border-2 border-background rounded-full animate-pulse" />}
                </div>
                <div>
                  <h3 className="font-bold text-foreground leading-tight">{selectedRecipient.full_name}</h3>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
                    {selectedRecipient.isGroup ? "Grup Sohbeti" : (isUserActive(selectedRecipient.last_seen_at) ? "Aktif" : selectedRecipient.role)}
                  </p>
                </div>
              </div>
            </div>

            <ScrollArea className="flex-1 p-6">
              <div className="space-y-6">
                {messages.map(msg => (
                  <div key={msg.id} className={`flex flex-col group ${msg.sender_id === user?.id ? "items-end" : "items-start"}`}>
                    {selectedRecipient.isGroup && msg.sender_id !== user?.id && (
                      <span className="text-[10px] font-bold text-muted-foreground mb-1 ml-4 uppercase tracking-widest">{msg.sender?.full_name}</span>
                    )}
                    <div className="max-w-[80%] space-y-1 relative">
                      {msg.quoted_text && (
                        <div className="bg-muted/40 p-3 rounded-xl border-l-4 border-primary text-xs italic mb-1">
                          <p className="text-[10px] font-bold text-primary flex items-center gap-1 mb-1 opacity-70"><BookOpen className="w-3 h-3" /> {msg.book?.title}</p>
                          "{msg.quoted_text}"
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        {msg.sender_id === user?.id && (
                          <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" onClick={() => deleteMessage(msg.id)} className="h-8 w-8 hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary"><Smile className="w-4 h-4" /></Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-1 flex gap-1 rounded-full border-white/5 bg-background/90 backdrop-blur-md shadow-2xl">
                                {COMMON_EMOJIS.map(emoji => (
                                  <button key={emoji} onClick={() => toggleReaction(msg.id, emoji)} className="hover:scale-125 transition-transform p-1.5 text-lg">{emoji}</button>
                                ))}
                              </PopoverContent>
                            </Popover>
                          </div>
                        )}
                        <div className={`p-4 rounded-2xl shadow-xl transition-all ${msg.sender_id === user?.id ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-muted/80 backdrop-blur-md rounded-tl-none border border-white/5"}`}>
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        </div>
                        {msg.sender_id !== user?.id && (
                          <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary"><Smile className="w-4 h-4" /></Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-1 flex gap-1 rounded-full border-white/5 bg-background/90 backdrop-blur-md shadow-2xl">
                                {COMMON_EMOJIS.map(emoji => (
                                  <button key={emoji} onClick={() => toggleReaction(msg.id, emoji)} className="hover:scale-125 transition-transform p-1.5 text-lg">{emoji}</button>
                                ))}
                              </PopoverContent>
                            </Popover>
                          </div>
                        )}
                      </div>
                      
                      {renderReactions(msg)}

                      <div className="flex items-center justify-end gap-1 px-1">
                        <span className="text-[9px] opacity-30 font-mono">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {!selectedRecipient.isGroup && msg.sender_id === user?.id && (
                          <span className={`text-[8px] font-black uppercase ${msg.is_read ? "text-blue-500" : "opacity-30"}`}>
                            {msg.is_read ? "Görüldü" : "İletildi"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>

            <div className="p-6 bg-background/80 backdrop-blur-xl border-t border-white/5">
              <form onSubmit={sendMessage} className="flex gap-4">
                <Input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder={`${selectedRecipient.full_name} grubuna mesaj yaz...`} className="flex-1 bg-white/5 border-white/10 h-14 px-6 rounded-2xl" />
                <Button type="submit" size="lg" className="h-14 w-14 rounded-2xl"><Send className="w-6 h-6" /></Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground opacity-20 p-20 text-center">
            <Users className="w-32 h-32 mb-8" />
            <h2 className="text-3xl font-display font-bold">Bir Sohbet Seç</h2>
            <p className="max-w-xs mt-4">Arkadaşlarınla veya grubunla hemen yazışmaya başla! 🚀</p>
          </div>
        )}
      </div>
    </div>
  );
}
