import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Send, BookOpen, User, Users, Search, Trash2, ArrowLeft, Smile, Info } from "lucide-react";
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
  message_reactions?: Reaction[];
  sender?: { full_name: string };
}

const COMMON_EMOJIS = ["❤️", "👍", "😂", "😮", "😢", "🙏"];

export default function Messages() {
  const { user } = useAuth();
  const [items, setItems] = useState<Profile[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<Profile | null>(null);
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    const updatePresence = async () => {
      await supabase.from("profiles").update({ last_seen_at: new Date().toISOString() }).eq("id", user.id);
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
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => {
        fetchMessages();
        fetchItems();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, selectedRecipient?.id]);

  useEffect(() => {
    if (selectedRecipient) {
      fetchMessages();
      if (selectedRecipient.isGroup) fetchGroupMembers(selectedRecipient.id);
      else setGroupMembers([]);
    }
  }, [selectedRecipient]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const fetchItems = async () => {
    if (!user) return;
    setLoading(true);
    
    const { data: profilesData } = await supabase.from("profiles").select("id, full_name, role, last_seen_at").neq("id", user.id);
    const { data: memberGroups } = await supabase.from("group_members").select("group_id, groups(id, name)").eq("user_id", user.id);
    const { data: ownedGroups } = await supabase.from("groups").select("id, name").eq("teacher_id", user.id);

    const groupMap = new Map();
    memberGroups?.forEach((g: any) => { if (g.groups) groupMap.set(g.groups.id, { id: g.groups.id, full_name: g.groups.name, role: "GRUP", isGroup: true }); });
    ownedGroups?.forEach((g: any) => { groupMap.set(g.id, { id: g.id, full_name: g.name, role: "GRUP (SAHİBİ)", isGroup: true }); });
    const groupItems = Array.from(groupMap.values());

    const { data: lastMessages } = await supabase.from("messages")
      .select("sender_id, receiver_id, group_id, created_at, is_read")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id},group_id.in.(${groupItems.map(g => g.id).length > 0 ? groupItems.map(g => g.id).join(',') : 'NULL'})`)
      .order("created_at", { ascending: false });

    const allItems = [...(profilesData || []), ...groupItems].map((p: any) => {
      const lastMsg = lastMessages?.find((m: any) => p.isGroup ? m.group_id === p.id : (m.sender_id === p.id && m.receiver_id === user.id) || (m.sender_id === user.id && m.receiver_id === p.id));
      const hasUnread = lastMessages?.some((m: any) => !p.isGroup && m.sender_id === p.id && m.receiver_id === user.id && !m.is_read);
      return { ...p, lastMessageAt: lastMsg ? new Date(lastMsg.created_at).getTime() : 0, hasUnread };
    });

    setItems(allItems.sort((a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0) || (a.full_name || "").localeCompare(b.full_name || "")));
    setLoading(false);
  };

  const fetchGroupMembers = async (groupId: string) => {
    const { data } = await supabase.from("group_members").select("profiles(id, full_name, role)").eq("group_id", groupId);
    setGroupMembers(data?.map((d: any) => d.profiles).filter(Boolean) || []);
  };

  const fetchMessages = async () => {
    if (!user || !selectedRecipient) return;
    let query = supabase.from("messages").select("*, message_reactions(id, emoji, user_id), sender:profiles(id, full_name)");
    if (selectedRecipient.isGroup) query = query.eq("group_id", selectedRecipient.id);
    else query = query.or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedRecipient.id}),and(sender_id.eq.${selectedRecipient.id},receiver_id.eq.${user.id})`);
    const { data } = await query.order("created_at", { ascending: true });
    setMessages(data || []);
    if (!selectedRecipient.isGroup && data?.some((m: any) => !m.is_read && m.receiver_id === user.id)) markAsRead(selectedRecipient.id);
  };

  const markAsRead = async (recipientId: string) => {
    await supabase.from("messages").update({ is_read: true }).eq("receiver_id", user?.id).eq("sender_id", recipientId).eq("is_read", false);
    fetchItems();
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedRecipient || !user) return;
    
    // GÖNDERME MANTIĞI (En Sorunsuz Hali)
    const payload: any = { sender_id: user.id, content: newMessage };
    if (selectedRecipient.isGroup) {
      payload.group_id = selectedRecipient.id;
      // receiver_id'yi payload'dan tamamen çıkararak SQL uyarısını önlüyoruz
    } else {
      payload.receiver_id = selectedRecipient.id;
    }

    const { error } = await supabase.from("messages").insert(payload);
    if (error) {
      console.error(error);
      toast.error("Mesaj gönderilemedi. Lütfen paylaştığım SQL sorgusunu çalıştırın.");
    } else {
      setNewMessage(""); fetchMessages(); fetchItems();
    }
  };

  const deleteMessage = async (id: string) => {
    const { error } = await supabase.from("messages").delete().eq("id", id).eq("sender_id", user?.id);
    if (error) toast.error("Silinemedi"); else fetchMessages();
  };

  const isUserActive = (lastSeen?: string) => {
    if (!lastSeen) return false;
    return new Date().getTime() - new Date(lastSeen).getTime() < 1000 * 60 * 5;
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-background/50 backdrop-blur-xl rounded-3xl border border-white/5 overflow-hidden shadow-2xl relative">
      {/* Sidebar */}
      <div className={`w-full md:w-80 border-r border-white/5 flex flex-col bg-muted/20 ${selectedRecipient ? "hidden md:flex" : "flex"}`}>
        <div className="p-6 border-b border-white/5">
          <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent uppercase tracking-wider">Mesajlar</h2>
          <div className="relative mt-4"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Sohbet ara..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-white/5 border-white/10 rounded-xl" /></div>
        </div>
        <ScrollArea className="flex-1"><div className="p-2 space-y-1">{items.filter(p => (p.full_name || "").toLowerCase().includes(search.toLowerCase())).map(item => (
          <button key={item.id} onClick={() => setSelectedRecipient(item)} className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${selectedRecipient?.id === item.id ? "bg-primary text-primary-foreground shadow-lg" : "hover:bg-white/5 text-muted-foreground hover:text-white"}`}><div className="relative"><Avatar className={`h-11 w-11 border-2 border-white/10 ${item.isGroup ? "rounded-xl bg-indigo-500/20" : ""}`}><AvatarFallback className={item.isGroup ? "bg-transparent text-indigo-400" : "bg-secondary/20"}>{item.isGroup ? <Users className="w-6 h-6" /> : <User className="w-6 h-6" />}</AvatarFallback></Avatar>{!item.isGroup && isUserActive(item.last_seen_at) && <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-emerald-500 border-2 border-[#12141c] rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />}</div><div className="text-left flex-1 overflow-hidden"><div className="flex items-center justify-between"><p className={`font-bold text-sm truncate ${item.isGroup ? "text-indigo-200 uppercase" : ""}`}>{item.full_name}</p>{item.hasUnread && <div className="h-2.5 w-2.5 rounded-full bg-blue-400 animate-pulse" />}</div><p className="text-[10px] opacity-40 truncate uppercase font-bold tracking-tighter">{item.role}</p></div></button>
        ))}</div></ScrollArea>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col relative overflow-hidden bg-gradient-to-b from-transparent to-primary/5 ${!selectedRecipient ? "hidden md:flex" : "flex"}`}>
        {selectedRecipient ? (<><div className="p-5 md:p-6 border-b border-white/5 flex items-center justify-between bg-background/80 backdrop-blur-md z-10"><div className="flex items-center gap-4"><Button variant="ghost" size="icon" onClick={() => setSelectedRecipient(null)} className="md:hidden"><ArrowLeft className="w-5 h-5" /></Button><div className="relative"><Avatar className={`h-10 w-10 ring-2 ${selectedRecipient.isGroup ? "ring-indigo-500/30 rounded-xl bg-indigo-500/10" : "ring-primary/20"}`}><AvatarFallback className={selectedRecipient.isGroup ? "text-indigo-400" : ""}>{selectedRecipient.isGroup ? <Users className="w-6 h-6" /> : <User className="w-6 h-6" />}</AvatarFallback></Avatar></div><div><h3 className="font-black text-foreground leading-tight uppercase tracking-tighter">{selectedRecipient.full_name}</h3><p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">{selectedRecipient.isGroup ? "Grup" : selectedRecipient.role}</p></div></div>{selectedRecipient.isGroup && (<Popover><PopoverTrigger asChild><Button variant="ghost" size="icon" className="hover:text-indigo-400"><Info className="w-5 h-5" /></Button></PopoverTrigger><PopoverContent className="w-64 glass-premium p-4 rounded-2xl border-white/10 shadow-2xl"><h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-3 border-b border-white/5 pb-2">Grup Üyeleri ({groupMembers.length})</h4><div className="space-y-2 max-h-60 overflow-y-auto">{groupMembers.map(m => (<div key={m.id} className="flex items-center gap-2"><div className={`w-1.5 h-1.5 rounded-full ${m.role === 'teacher' ? 'bg-secondary' : 'bg-primary'}`} /><span className="text-sm font-bold uppercase text-white/80">{m.full_name}</span></div>))}</div></PopoverContent></Popover>)}</div>
            <ScrollArea className="flex-1 p-6"><div className="space-y-5">{messages.map(msg => (<div key={msg.id} className={`flex flex-col group ${msg.sender_id === user?.id ? "items-end" : "items-start"}`}>{selectedRecipient.isGroup && msg.sender_id !== user?.id && (<span className="text-[10px] font-black text-indigo-400/70 mb-1 ml-4 uppercase tracking-widest">{msg.sender?.full_name}</span>)}<div className="max-w-[75%] space-y-1 relative"><div className="flex items-center gap-2">{msg.sender_id === user?.id && (<div className="flex opacity-0 group-hover:opacity-100 transition-opacity"><Button variant="ghost" size="icon" onClick={() => deleteMessage(msg.id)} className="h-8 w-8 hover:text-destructive"><Trash2 className="w-4 h-4" /></Button></div>)}<div className={`p-4 rounded-2xl shadow-xl ${msg.sender_id === user?.id ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-tr-none" : "bg-muted/80 backdrop-blur-md rounded-tl-none border border-white/5"}`}><p className="text-sm font-medium whitespace-pre-wrap">{msg.content}</p></div></div><div className="flex items-center gap-1.5 px-1 mt-1 opacity-20"><span className="text-[9px] font-mono">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>{!selectedRecipient.isGroup && msg.sender_id === user?.id && (<span className="text-[8px] font-black uppercase">{msg.is_read ? "Görüldü" : "İletildi"}</span>)}</div></div></div>))}<div ref={scrollRef} /></div></ScrollArea>
            <div className="p-6 bg-background/80 backdrop-blur-xl border-t border-white/5"><form onSubmit={sendMessage} className="flex gap-4"><Input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Bir mesaj yazın..." className="flex-1 bg-white/5 border-white/10 h-14 px-6 rounded-2xl font-medium" /><Button type="submit" size="lg" className="h-14 w-14 rounded-2xl shadow-xl transition-transform active:scale-90"><Send className="w-6 h-6" /></Button></form></div></>) : (<div className="flex-1 flex flex-col items-center justify-center text-muted-foreground opacity-10 p-20 text-center"><Users className="w-40 h-40 mb-8" /><h2 className="text-4xl font-display font-bold uppercase tracking-widest">Sohbet Seç</h2><p className="max-w-xs mt-4 font-medium uppercase text-xs tracking-tighter">İletişime geçmek için listeden birini veya bir grubu seçin.</p></div>)}
      </div>
    </div>
  );
}
