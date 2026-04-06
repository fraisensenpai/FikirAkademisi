import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Users, Search, Edit2, Save } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface UserProfile {
  id: string;
  full_name: string;
  role: AppRole;
  school_number: string | null;
  class_name: string | null;
  last_device?: string | null;
  is_approved?: boolean;
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
    setUsers(data || []);
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
    <div className="space-y-6 animate-fade-in">
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

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 text-sm font-medium text-muted-foreground">Ad Soyad</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground">Okul No</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground">Sınıf</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground">Rol</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground">Durum</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-3 font-medium text-foreground">{u.full_name || "—"}</td>
                  <td className="p-3 text-muted-foreground">{u.school_number || "—"}</td>
                  <td className="p-3 text-muted-foreground">{u.class_name || "—"}</td>
                  <td className="p-3">
                    {editingId === u.id ? (
                      <Select value={editRole} onValueChange={(v) => setEditRole(v as AppRole)}>
                        <SelectTrigger className="w-32">
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
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleBadgeColors[u.role]}`}>
                        {roleLabels[u.role]}
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    {u.role === "teacher" ? (
                      <Button 
                        size="sm" 
                        variant={(u as any).is_approved ? "outline" : "destructive"} 
                        className="h-7 text-[10px] uppercase font-bold tracking-widest"
                        onClick={() => handleApprovalChange(u.id, (u as any).is_approved)}
                      >
                        {(u as any).is_approved ? "Onaylı" : "Onay Bekliyor"}
                      </Button>
                    ) : (
                      <span className="text-[10px] text-muted-foreground/50 uppercase tracking-widest font-bold">Gerekmez</span>
                    )}
                  </td>
                  <td className="p-3">
                    {editingId === u.id ? (
                      <Button size="sm" onClick={() => handleRoleChange(u.id)}>
                        <Save className="w-3 h-3 mr-1" /> Kaydet
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingId(u.id);
                          setEditRole(u.role);
                        }}
                      >
                        <Edit2 className="w-3 h-3 mr-1" /> Düzenle
                      </Button>
                    )}
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
