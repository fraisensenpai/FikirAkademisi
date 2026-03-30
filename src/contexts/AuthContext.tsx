import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface Profile {
  id: string;
  full_name: string;
  role: AppRole;
  school_number: string | null;
  class_name: string | null;
  last_device?: string | null;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const getDeviceInfo = () => {
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return "Android Telefon";
  if (/iPhone|iPad|iPod/i.test(ua)) return "iPhone/iPad";
  if (/windows/i.test(ua)) return "Windows Bilgisayar";
  if (/macintosh/i.test(ua)) return "Mac Bilgisayar";
  if (/linux/i.test(ua)) return "Linux";
  return "Mobil/Diğer Cihaz";
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    // any cast kullanarak yeni sütun hatasını engelliyoruz
    const { data } = await (supabase.from("profiles") as any)
      .select("id, full_name, role, school_number, class_name, last_device")
      .eq("id", userId)
      .single();
    
    if (data) {
      setProfile(data as Profile);

      // Cihaz bilgisini güncelle (Arka planda sessizce yap)
      const currentDevice = getDeviceInfo();
      if (data.last_device !== currentDevice) {
        await (supabase.from("profiles") as any)
          .update({ last_device: currentDevice })
          .eq("id", userId);
      }
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        if (session?.user) {
          setTimeout(() => fetchProfile(session.user.id), 0);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
