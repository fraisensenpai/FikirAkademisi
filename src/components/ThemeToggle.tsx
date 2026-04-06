import { Moon, Sun, Palette, CheckCircle2 } from "lucide-react"
import { useTheme } from "./theme-provider"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const COLOR_THEMES = [
  { id: "theme-zumrut", name: "Fikir Zümrüdü", colorClass: "bg-emerald-500" },
  { id: "theme-bogazici", name: "Boğaziçi Turkuazı", colorClass: "bg-[#0db4e3]" },
  { id: "theme-lale", name: "Lale Pembesi", colorClass: "bg-pink-500" },
  { id: "theme-gece", name: "Gece Mavisi", colorClass: "bg-indigo-500" },
  { id: "theme-akademi", name: "Akademi Kırmızısı", colorClass: "bg-red-600" },
  { id: "theme-kulliye", name: "Külliye Altını", colorClass: "bg-amber-500" },
  { id: "theme-sahaf", name: "Sahaf Kahvesi", colorClass: "bg-[#994d26]" },
  { id: "theme-okyanus", name: "Okyanus Derinliği", colorClass: "bg-blue-500" },
]

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()
  const { profile, updateColorTheme } = useAuth()
  
  const currentThemeId = profile?.color_theme || "theme-zumrut"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full w-10 h-10 border border-border/50 bg-background/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all relative overflow-hidden group"
        >
          <Palette className="h-[1.2rem] w-[1.2rem] text-muted-foreground group-hover:text-secondary transition-colors" />
          <span className="sr-only">Tema Seç</span>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-64 rounded-2xl glass-premium border-white/10 p-2 shadow-2xl">
        <DropdownMenuLabel className="font-display font-black uppercase tracking-widest text-[10px] text-muted-foreground/60 mb-1 ml-1">Aydınlatma (Arka Plan)</DropdownMenuLabel>
        <DropdownMenuGroup className="grid grid-cols-2 gap-1">
          <DropdownMenuItem 
            onClick={() => setTheme("light")}
            className={`rounded-xl flex items-center justify-center py-2.5 cursor-pointer transition-colors ${theme === 'light' ? 'bg-blue-500/10 text-blue-500 font-bold' : 'text-muted-foreground'}`}
          >
            <Sun className="h-4 w-4 mr-2" /> Gündüz
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => setTheme("dark")}
            className={`rounded-xl flex items-center justify-center py-2.5 cursor-pointer transition-colors ${theme === 'dark' ? 'bg-indigo-500/10 text-indigo-400 font-bold' : 'text-muted-foreground'}`}
          >
            <Moon className="h-4 w-4 mr-2" /> Gece
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="bg-white/10 my-3" />
        
        <DropdownMenuLabel className="font-display font-black uppercase tracking-widest text-[10px] text-muted-foreground/60 mb-1 ml-1 flex items-center gap-2">
            Vurgu Rengi
        </DropdownMenuLabel>

        <DropdownMenuGroup className="grid grid-cols-1 gap-1">
          {COLOR_THEMES.map((t) => (
            <DropdownMenuItem 
                key={t.id}
                onClick={() => updateColorTheme(t.id)}
                className={`rounded-xl cursor-pointer flex items-center justify-between py-2 transition-all ${currentThemeId === t.id ? 'bg-secondary/15 text-foreground font-bold' : 'text-muted-foreground'}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-md shadow-inner border border-white/20 ${t.colorClass}`} />
                <span className="text-sm">{t.name}</span>
              </div>
              {currentThemeId === t.id && <CheckCircle2 className="w-5 h-5 text-secondary" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
