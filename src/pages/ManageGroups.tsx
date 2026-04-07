import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Users, Trash2, UserPlus, X, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Group {
  id: string;
  name: string;
  created_at: string;
}

interface GroupMember {
  id: string;
  user_id: string;
  profiles: {
    full_name: string;
    school_number: string;
    class_name: string;
    role: string;
  };
}

interface PotentialMember {
  id: string;
  full_name: string;
  school_number: string;
  class_name: string;
  role: string;
}

export default function ManageGroups() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [potentialMembers, setPotentialMembers] = useState<PotentialMember[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("all");

  const fetchGroups = async () => {
    const { data, error } = await supabase
      .from("groups")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) toast.error("Gruplar yüklenemedi");
    else setGroups(data || []);
    setLoading(false);
  };

  const fetchMembers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, school_number, class_name, role")
      .in("role", ["student", "teacher", "admin", "developer"])
      .order("full_name");
    setPotentialMembers(data as any || []);
  };

  const fetchGroupMembers = async (groupId: string) => {
    const { data, error } = await supabase
      .from("group_members")
      .select(`
        id,
        user_id,
        profiles (
          full_name,
          school_number,
          class_name
        )
      `)
      .eq("group_id", groupId);
    
    if (error) {
      console.error("Grup üyeleri hatası:", error);
      toast.error("Grup üyeleri yüklenemedi");
    } else {
      setGroupMembers(data as any || []);
    }
  };

  useEffect(() => {
    fetchGroups();
    fetchMembers();
  }, []);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    const { error } = await supabase
      .from("groups")
      .insert({ name: newGroupName, teacher_id: user?.id });

    if (error) toast.error("Grup oluşturulamadı");
    else {
      toast.success("Grup oluşturuldu");
      setNewGroupName("");
      fetchGroups();
    }
  };

  const handleDeleteGroup = async (id: string) => {
    const { error } = await supabase.from("groups").delete().eq("id", id);
    if (error) toast.error("Grup silinemedi");
    else {
      toast.success("Grup silindi");
      if (selectedGroup?.id === id) setSelectedGroup(null);
      fetchGroups();
    }
  };

  const handleAddMember = async (studentId: string) => {
    if (!selectedGroup) return;

    const { error } = await supabase
      .from("group_members")
      .insert({ group_id: selectedGroup.id, user_id: studentId });

    if (error) {
      if (error.code === "23505") toast.error("Kişi zaten bu grupta");
      else toast.error("Üye eklenemedi");
    } else {
      toast.success("Üye eklendi");
      fetchGroupMembers(selectedGroup.id);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    const { error } = await supabase
      .from("group_members")
      .delete()
      .eq("id", memberId);

    if (error) toast.error("Üye çıkarılamadı");
    else {
      toast.success("Üye çıkarıldı");
      if (selectedGroup) fetchGroupMembers(selectedGroup.id);
    }
  };

  const classes = Array.from(new Set(potentialMembers.map(s => s.class_name).filter(Boolean))).sort();

  const filteredMembers = potentialMembers.filter(s => {
    const matchesSearch = s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (s.school_number && s.school_number.includes(searchTerm));
    const matchesClass = selectedClass === "all" || s.class_name === selectedClass;
    return matchesSearch && matchesClass;
  }).slice(0, 20);

  if (loading) return <div className="flex items-center justify-center h-64 font-display italic opacity-50">Kayıtlar Hazırlanıyor...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">Grup Yönetimi</h2>
          <p className="text-muted-foreground text-sm">Özel öğrenci grupları oluşturun ve yönetin</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Group Creation & List */}
        <div className="md:col-span-1 space-y-6">
          <div className="glass-card p-6">
            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 mb-4 block">Yeni Grup</Label>
            <form onSubmit={handleCreateGroup} className="flex gap-2">
              <Input 
                placeholder="Grup adı..." 
                value={newGroupName}
                onChange={e => setNewGroupName(e.target.value)}
                className="rounded-xl h-11 bg-white/5 border-white/10"
              />
              <Button type="submit" size="icon" className="rounded-xl h-11 w-11 shadow-lg shadow-primary/20">
                <Plus className="w-5 h-5" />
              </Button>
            </form>
          </div>

          <div className="space-y-3">
            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 px-4">Gruplarınız</Label>
            {groups.length === 0 ? (
              <div className="text-center py-10 glass-card text-muted-foreground text-xs italic">Henüz grup oluşturulmamış</div>
            ) : (
              groups.map(g => (
                <div 
                  key={g.id} 
                  onClick={() => {
                    setSelectedGroup(g);
                    fetchGroupMembers(g.id);
                  }}
                  className={`
                    glass-card p-4 flex items-center justify-between cursor-pointer transition-all duration-300 group
                    ${selectedGroup?.id === g.id ? "border-primary bg-primary/5 shadow-xl shadow-primary/10" : "hover:border-white/20"}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${selectedGroup?.id === g.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                      <Users className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-sm">{g.name}</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground/50 hover:text-destructive transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteGroup(g.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Group Members Section */}
        <div className="md:col-span-2">
          {selectedGroup ? (
            <div className="glass-card flex flex-col h-full min-h-[500px]">
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-primary/5">
                <div>
                  <h3 className="text-lg font-black tracking-tight">{selectedGroup.name}</h3>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mt-1">
                    {groupMembers.length} Üye Bulunuyor
                  </p>
                </div>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="rounded-xl shadow-xl shadow-primary/20 gap-2">
                      <UserPlus className="w-4 h-4" />
                      <span>Üye Ekle</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="rounded-3xl border-white/10 glass-premium max-w-lg">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-black">Öğrenci Seç</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input 
                            placeholder="İsim veya numara ile ara..." 
                            className="pl-10 rounded-xl bg-white/5"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                          />
                        </div>
                        <Select value={selectedClass} onValueChange={setSelectedClass}>
                          <SelectTrigger className="w-[140px] rounded-xl bg-white/5">
                            <SelectValue placeholder="Sınıf Seç" />
                          </SelectTrigger>
                          <SelectContent className="glass-premium rounded-xl">
                            <SelectItem value="all">Sınıf: Tümü</SelectItem>
                            {classes.map(c => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                        {filteredMembers.map(s => (
                          <div key={s.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors group/item">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-bold">{s.full_name}</p>
                                {s.role === 'teacher' && (
                                  <span className="text-[10px] bg-secondary/20 text-secondary px-1.5 py-0.5 rounded-md font-bold uppercase tracking-tighter border border-secondary/20">
                                    Öğretmen
                                  </span>
                                )}
                                {s.class_name && (
                                  <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-md font-black italic">
                                    {s.class_name}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{s.role === 'student' ? (s.school_number || 'No') : 'Hoca'}</p>
                            </div>
                            <Button 
                              size="sm" 
                              variant="secondary"
                              className="rounded-lg opacity-0 group-hover/item:opacity-100 transition-opacity"
                              onClick={() => handleAddMember(s.id)}
                            >
                              Ekle
                            </Button>
                          </div>
                        ))}
                        {searchTerm && filteredMembers.length === 0 && (
                          <div className="text-center py-4 text-xs text-muted-foreground italic">Kişi bulunamadı</div>
                        )}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="flex-1 p-6">
                {groupMembers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-4 opacity-50">
                    <Users className="w-12 h-12 stroke-[1px]" />
                    <p className="text-sm italic">Bu grup henüz boş. Üstteki butondan üye ekleyebilirsiniz.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {groupMembers.map(m => (
                      <div key={m.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between group/member hover:border-primary/20 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-black uppercase ${m.profiles.role === 'teacher' ? 'bg-secondary/20 text-secondary border border-secondary/20' : 'bg-primary/10 text-primary'}`}>
                              {m.profiles.role === 'teacher' ? 'TR' : m.profiles.full_name.substring(0, 2)}
                            </div>
                            {m.profiles.class_name && (
                              <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[8px] font-black px-1 rounded-sm shadow-lg">
                                {m.profiles.class_name}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-bold">{m.profiles.full_name}</p>
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">{m.profiles.role === 'teacher' ? 'Öğretmen' : `No: ${m.profiles.school_number}`}</p>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 opacity-0 group-hover/member:opacity-100 transition-opacity hover:text-destructive"
                          onClick={() => handleRemoveMember(m.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="glass-card flex flex-col items-center justify-center min-h-[500px] text-muted-foreground space-y-4 italic">
              <Users className="w-16 h-16 opacity-10 stroke-[1px]" />
              <p>Üyeleri yönetmek için soldan bir grup seçin</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
