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
  color_theme?: string | null;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  updateColorTheme: (themeId: string) => Promise<void>;
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

export const colorThemesList = [
  "theme-zumrut", "theme-bogazici", "theme-lale", "theme-gece", 
  "theme-akademi", "theme-kulliye", "theme-sahaf", "theme-okyanus"
];

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  updateColorTheme: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Tema Sınıfını DOM'a Yükle
  const applyTheme = (themeId: string) => {
    document.documentElement.classList.remove(...colorThemesList);
    document.documentElement.classList.add(themeId);
    localStorage.setItem("color-theme", themeId);
  };

  const fetchProfile = async (userId: string) => {
    const { data } = await (supabase.from("profiles") as any)
      .select("id, full_name, role, school_number, class_name, last_device, color_theme")
      .eq("id", userId)
      .single();
    
    if (data) {
      setProfile(data as Profile);

      if (data.color_theme) {
        applyTheme(data.color_theme);
      }

      const currentDevice = getDeviceInfo();
      if (data.last_device !== currentDevice) {
        await (supabase.from("profiles") as any)
          .update({ last_device: currentDevice })
          .eq("id", userId);
      }
    }
  };

  const updateColorTheme = async (themeId: string) => {
    applyTheme(themeId);
    
    if (session?.user) {
      setProfile(prev => prev ? { ...prev, color_theme: themeId } : null);
      await (supabase.from("profiles") as any)
        .update({ color_theme: themeId })
        .eq("id", session.user.id);
    }
  };

  useEffect(() => {
    // İlk Yüklemede LocalStorage Temasını Uygula
    const savedTheme = localStorage.getItem("color-theme") || "theme-zumrut";
    applyTheme(savedTheme);

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
    <AuthContext.Provider value={{ session, user: session?.user ?? null, profile, loading, signOut, updateColorTheme }}>
      {children}
    </AuthContext.Provider>
  );
}
