import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search, Edit2, Save, Ban, Unlock } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type AppRole = Database["public"]["Enums"]["app_role"];

interface UserProfile {
  id: string;
  full_name: string;
  role: AppRole;
  school_number: string | null;
  class_name: string | null;
  last_device?: string | null;
  is_approved?: boolean;
  is_banned?: boolean;
  banned_by_name?: string | null;
}

export default function UserManagement() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<AppRole>("student");

  const fetchUsers = async () => {
    const { data } = await supabase.from("profiles").select("*").order("full_name");
    setUsers(data as any || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({ role: editRole })
      .eq("id", userId);
    if (error) {
      toast.error("Rol güncellenemedi");
      return;
    }
    toast.success("Rol güncellendi");
    setEditingId(null);
    fetchUsers();
  };

  const handleApprovalChange = async (userId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("profiles")
      .update({ is_approved: !currentStatus } as any)
      .eq("id", userId);
    
    if (error) {
      toast.error("Onay durumu güncellenemedi!");
      return;
    }
    toast.success(!currentStatus ? "Öğretmen hesabı onaylandı!" : "Öğretmen onayı kaldırıldı.");
    fetchUsers();
  };

  const handleBanToggle = async (targetUser: UserProfile) => {
    if (!profile) return;
    
    const newStatus = !targetUser.is_banned;
    const { error } = await supabase
      .from("profiles")
      .update({ 
        is_banned: newStatus,
        banned_by_id: newStatus ? profile.id : null,
        banned_by_name: newStatus ? profile.full_name : null,
        ban_at: newStatus ? new Date().toISOString() : null
      } as any)
      .eq("id", targetUser.id);

    if (error) {
      toast.error("İşlem başarısız!");
      return;
    }
    
    toast.success(newStatus ? `${targetUser.full_name} yasaklandı!` : "Yasak kaldırıldı.");
    fetchUsers();
  };

  const filtered = users.filter((u) =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.school_number?.includes(search) ||
    u.class_name?.toLowerCase().includes(search.toLowerCase())
  );

  const roleLabels: Record<AppRole, string> = {
    student: "Öğrenci",
    teacher: "Öğretmen",
    developer: "Geliştirici",
    admin: "Yetkili",
  };

  const roleBadgeColors: Record<AppRole, string> = {
    student: "bg-muted text-muted-foreground",
    teacher: "bg-blue-100 text-blue-700",
    developer: "bg-purple-100 text-purple-700",
    admin: "bg-red-100 text-red-700",
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">Kullanıcı Yönetimi</h2>
          <p className="text-muted-foreground">{users.length} kullanıcı</p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="İsim, numara veya sınıf ara..."
          className="pl-10"
        />
      </div>

      <div className="glass-card overflow-hidden rounded-3xl border border-white/5 bg-background/50 backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5 bg-muted/20">
                <th className="text-left p-4 text-sm font-bold text-muted-foreground uppercase tracking-widest">Ad Soyad</th>
                <th className="text-left p-4 text-sm font-bold text-muted-foreground uppercase tracking-widest">Okul No</th>
                <th className="text-left p-4 text-sm font-bold text-muted-foreground uppercase tracking-widest">Sınıf</th>
                <th className="text-left p-4 text-sm font-bold text-muted-foreground uppercase tracking-widest">Rol</th>
                <th className="text-left p-4 text-sm font-bold text-muted-foreground uppercase tracking-widest">Durum</th>
                <th className="text-left p-4 text-sm font-bold text-muted-foreground uppercase tracking-widest">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((u) => (
                <tr key={u.id} className={`hover:bg-white/5 transition-colors ${u.is_banned ? "bg-red-500/5 opacity-80" : ""}`}>
                  <td className="p-4 font-medium text-foreground">
                    <div className="flex items-center gap-2">
                       <span className={u.is_banned ? "line-through opacity-50" : ""}>{u.full_name || "—"}</span>
                      {u.is_banned && (
                        <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full uppercase font-black">Yasaklı</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-muted-foreground">{u.school_number || "—"}</td>
                  <td className="p-4 text-muted-foreground">{u.class_name || "—"}</td>
                  <td className="p-4">
                    {editingId === u.id ? (
                      <Select value={editRole} onValueChange={(v) => setEditRole(v as AppRole)}>
                        <SelectTrigger className="w-32 bg-white/5 border-white/10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="student">Öğrenci</SelectItem>
                          <SelectItem value="teacher">Öğretmen</SelectItem>
                          <SelectItem value="developer">Geliştirici</SelectItem>
                          <SelectItem value="admin">Yetkili</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className={`px-2 py-1 rounded-lg text-xs font-bold uppercase tracking-tighter ${roleBadgeColors[u.role]}`}>
                        {roleLabels[u.role]}
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    {u.role === "teacher" ? (
                      <Button 
                        size="sm" 
                        variant={u.is_approved ? "outline" : "destructive"} 
                        className="h-8 text-[10px] uppercase font-black tracking-widest rounded-xl"
                        onClick={() => handleApprovalChange(u.id, !!u.is_approved)}
                      >
                        {u.is_approved ? "Onaylı" : "Onay Bekliyor"}
                      </Button>
                    ) : (
                      <span className="text-[10px] text-muted-foreground/30 uppercase tracking-widest font-black">Gerekmez</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {editingId === u.id ? (
                        <Button size="sm" onClick={() => handleRoleChange(u.id)} className="rounded-xl">
                          <Save className="w-4 h-4 mr-1" /> Kaydet
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingId(u.id);
                            setEditRole(u.role);
                          }}
                          className="rounded-xl hover:bg-white/5"
                        >
                          <Edit2 className="w-4 h-4 mr-1" /> Düzenle
                        </Button>
                      )}
                      
                      {profile?.id !== u.id && (
                        <Button
                          size="sm"
                          variant={u.is_banned ? "default" : "destructive"}
                          className={`h-8 px-3 text-[10px] uppercase font-black rounded-xl transition-all ${u.is_banned ? 'bg-emerald-500 hover:bg-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20'}`}
                          onClick={() => handleBanToggle(u)}
                        >
                          {u.is_banned ? <><Unlock className="w-3 h-3 mr-1"/> Yasağı Kaldır</> : <><Ban className="w-3 h-3 mr-1"/> Yasakla</>}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
