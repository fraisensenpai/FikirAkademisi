import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Send, BookOpen, User, Users, Search, Trash2, ArrowLeft, Check, CheckCheck, Smile, Phone, Video, Info } from "lucide-react";
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
  reply_to_id?: string;
  parent_message?: {
    content: string;
    sender: { full_name: string };
  };
}

const COMMON_EMOJIS = ["❤️", "👍", "😂", "😮", "😢", "🙏"];

export default function Messages() {
  const { user } = useAuth();
  const [items, setItems] = useState<Profile[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [replyTo, setReplyTo] = useState<Message | null>(null);
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
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const newMsg = payload.new as Message;
          
          // Eğer mesaj şu anki sohbete aitse listeye ekle
          const isForCurrentChat = selectedRecipient?.isGroup 
            ? newMsg.group_id === selectedRecipient.id
            : (newMsg.sender_id === selectedRecipient?.id && newMsg.receiver_id === user?.id) ||
              (newMsg.sender_id === user?.id && newMsg.receiver_id === selectedRecipient?.id);

          if (isForCurrentChat) {
            // Gönderen ismini bul
            const sender = items.find(it => it.id === newMsg.sender_id);
            const senderName = newMsg.sender_id === user?.id ? "Siz" : (sender?.full_name || "Bilinmeyen Kullanıcı");
            
            setMessages(prev => {
              if (prev.some(m => m.id === newMsg.id)) return prev;
              return [...prev, { ...newMsg, sender: { full_name: senderName } }];
            });
            fetchItems(); // Mesaj listesindeki sıralamayı/okunmadı bilgisini güncelle
          } else {
            fetchItems(); // Başka birinden mesaj geldiyse listeyi güncelle
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "messages" },
        (payload) => {
          setMessages(prev => prev.filter(m => m.id !== payload.old.id));
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
    if (!user) {
      console.log("fetchItems: Kullanıcı bulunamadı, bekleniyor...");
      return;
    }
    
    try {
      setLoading(true);
      console.log("fetchItems: Veriler çekiliyor... Kullanıcı ID:", user.id);
      
      // 1. Profil bilgilerini çek
      const { data: profilesData, error: profError } = await (supabase as any)
        .from("profiles")
        .select("id, full_name, role, last_seen_at")
        .neq("id", user.id);

      if (profError) {
        console.error("fetchItems: Profil çekme hatası:", profError);
        throw profError;
      }
      console.log("fetchItems: Profiller başarıyla çekildi. Sayı:", profilesData?.length || 0);

      // 2. Kullanıcının üye olduğu grupları çek
      let groupItems: any[] = [];
      try {
        console.log("fetchItems: Adım 2 - Gruplar çekiliyor...");
        // Join sorgusunu en sade hale getirelim veya ayırarak çekelim
        const { data: myGroups, error: grpError } = await (supabase as any)
          .from("group_members")
          .select("group_id")
          .eq("user_id", user.id);

        if (grpError) {
          console.warn("fetchItems: Grup üyeliği uyarısı:", grpError);
        } else if (myGroups && myGroups.length > 0) {
          const gIds = myGroups.map((g: any) => g.group_id);
          const { data: groupNames, error: gnError } = await (supabase as any)
            .from("groups")
            .select("id, name")
            .in("id", gIds);

          if (!gnError && groupNames) {
            groupItems = groupNames.map((g: any) => ({
              id: g.id,
              full_name: (g.name as string).toUpperCase(),
              role: "GRUP",
              isGroup: true
            }));
          }
        }
      } catch (ge) {
        console.warn("fetchItems: Grup çekme işlem hatası (Geçiliyor):", ge);
      }
      console.log("fetchItems: Gruplar hazırlandı. Sayı:", groupItems.length);

      // 3. Mesaj geçmişini çek (Sıralama için)
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
        else console.warn("fetchItems: Mesaj geçmişi yüklenemedi:", msgError);
      } catch (e) {
        console.warn("fetchItems: Mesaj geçmişi sorgu hatası:", e);
      }

      console.log("fetchItems: Liste birleştiriliyor...");
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

      console.log("fetchItems: Liste güncellendi. Toplam öğe:", allItems.length);
      setItems(allItems.sort((a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0)));
    } catch (err) {
      console.error("fetchItems KRİTİK HATASI:", err);
      toast.error("Bağlantı hatası: Konsolu (F12) kontrol edin");
    } finally {
      setLoading(false);
    }
  };

  const [groupMembers, setGroupMembers] = useState<any[]>([]);

  const fetchGroupMembersInfo = async (groupId: string) => {
    try {
      const { data } = await (supabase as any)
        .from("group_members")
        .select("user_id")
        .eq("group_id", groupId);
      
      if (data && data.length > 0) {
        const uIds = data.map((d: any) => d.user_id);
        const { data: profs } = await (supabase as any)
          .from("profiles")
          .select("full_name")
          .in("id", uIds);
        setGroupMembers(profs || []);
      } else {
        setGroupMembers([]);
      }
    } catch (err) {
      console.error("Grup üyeleri çekilemedi:", err);
    }
  };

  useEffect(() => {
    if (selectedRecipient?.isGroup) {
      fetchGroupMembersInfo(selectedRecipient.id);
    } else {
      setGroupMembers([]);
    }
    fetchMessages();
  }, [selectedRecipient?.id]);

  const fetchMessages = async () => {
    if (!user || !selectedRecipient) return;
    
    try {
      // 1. Mesajları en sade haliyle çek
      let query = (supabase as any).from("messages")
        .select(`
          *,
          book:books(title),
          message_reactions(id, emoji, user_id),
          reply_to:messages(id, content, sender_id)
        `);

      if (selectedRecipient.isGroup) {
        query = query.eq("group_id", selectedRecipient.id);
      } else {
        query = query.or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedRecipient.id}),and(sender_id.eq.${selectedRecipient.id},receiver_id.eq.${user.id})`);
      }

      const { data, error } = await query.order("created_at", { ascending: true });
      if (error) throw error;
      
      // 2. İsimleri koda (manuel) ekle
      const messagesWithNames = data?.map((m: any) => {
        const sender = items.find(it => it.id === m.sender_id);
        const senderName = m.sender_id === user.id ? "Siz" : (sender?.full_name || "Bilinmeyen Kullanıcı");
        
        let parentMsgData = null;
        if (m.reply_to) {
          const parentSender = items.find(it => it.id === m.reply_to.sender_id);
          parentMsgData = {
            content: m.reply_to.content,
            sender: { full_name: m.reply_to.sender_id === user.id ? "Siz" : (parentSender?.full_name || "Kullanıcı") }
          };
        }

        return {
          ...m,
          sender: { full_name: senderName },
          parent_message: parentMsgData
        };
      });

      setMessages(messagesWithNames || []);
      
      if (!selectedRecipient.isGroup && data?.some((m: any) => !m.is_read && m.receiver_id === user.id)) {
        await markAsRead(selectedRecipient.id);
      }
    } catch (err) {
      console.error("fetchMessages KRİTİK HATASI:", err);
      toast.error("Mesajlar yüklenemedi");
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

    if (replyTo) {
      payload.reply_to_id = replyTo.id;
    }

    if (selectedRecipient.isGroup) {
      payload.group_id = selectedRecipient.id;
    } else {
      payload.receiver_id = selectedRecipient.id;
    }

    const { error } = await (supabase as any).from("messages").insert(payload);
    if (error) {
      toast.error("Mesaj gönderilemedi");
    } else {
      setNewMessage("");
      setReplyTo(null);
    }
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
                <Button variant="ghost" size="icon" onClick={() => setSelectedRecipient(null)} className="md:hidden">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-xl uppercase italic">
                  {selectedRecipient.full_name.substring(0, 2)}
                </div>
                <div>
                  <h2 className="text-xl font-display font-bold leading-none">{selectedRecipient.full_name}</h2>
                  {selectedRecipient.isGroup ? (
                    <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest font-bold max-w-[200px] md:max-w-md truncate">
                      {groupMembers.length} Üye: {groupMembers.map(m => m.full_name).join(", ")}
                    </p>
                  ) : (
                    <p className="text-xs text-secondary mt-1 font-medium italic uppercase tracking-tighter opacity-80">
                      {isUserActive(selectedRecipient.last_seen_at) ? "Çevrimiçi" : selectedRecipient.role}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="hidden sm:flex text-muted-foreground hover:text-primary"><Phone className="w-5 h-5" /></Button>
                <Button variant="ghost" size="icon" className="hidden sm:flex text-muted-foreground hover:text-primary"><Video className="w-5 h-5" /></Button>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary"><Info className="w-5 h-5" /></Button>
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
                              <Button variant="ghost" size="icon" onClick={() => setReplyTo(msg)} className="h-8 w-8 hover:text-primary"><Send className="w-4 h-4 -rotate-90" /></Button>
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
                          <div className={`p-4 rounded-2xl shadow-xl transition-all relative ${msg.sender_id === user?.id ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-muted/80 backdrop-blur-md rounded-tl-none border border-white/5"}`}>
                            {msg.parent_message && (
                              <div className={`mb-2 p-2 rounded-lg text-xs border-l-4 leading-relaxed ${msg.sender_id === user?.id ? "bg-white/10 border-white/30" : "bg-primary/5 border-primary"}`}>
                                <p className="font-bold opacity-70 mb-0.5">{msg.parent_message.sender.full_name}</p>
                                <p className="opacity-60 line-clamp-2">{msg.parent_message.content}</p>
                              </div>
                            )}
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          </div>
                          {msg.sender_id !== user?.id && (
                            <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="icon" onClick={() => setReplyTo(msg)} className="h-8 w-8 hover:text-primary"><Send className="w-4 h-4 -rotate-90" /></Button>
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
              {replyTo && (
                <div className="mb-3 p-3 bg-muted/50 rounded-xl border-l-4 border-primary flex items-center justify-between animate-in slide-in-from-bottom-2">
                  <div className="overflow-hidden">
                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest">{replyTo.sender?.full_name} kişisine yanıt veriliyor</p>
                    <p className="text-xs text-muted-foreground truncate">{replyTo.content}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setReplyTo(null)} className="h-8 w-8"><Trash2 className="w-4 h-4" /></Button>
                </div>
              )}
              <form onSubmit={sendMessage} className="flex gap-4">
                <Input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder={`${selectedRecipient.full_name} ${selectedRecipient.isGroup ? 'grubuna' : 'kişisine'} mesaj yaz...`} className="flex-1 bg-white/5 border-white/10 h-14 px-6 rounded-2xl" />
                <Button type="submit" size="lg" className="h-14 w-14 rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all"><Send className="w-6 h-6" /></Button>
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
