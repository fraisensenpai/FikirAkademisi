import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GitCommit, Calendar, Clock, Sparkles, Rocket, Shield, Bug, Zap } from "lucide-react";

interface UpdateEntry {
  id: string;
  date: string;
  time: string;
  title: string;
  description: string;
  type: "feat" | "fix" | "style" | "chore";
}

const UPDATES: UpdateEntry[] = [
  {
    id: "7218529",
    date: "9 Nisan 2024",
    time: "16:40",
    title: "Kullanıcı Yasaklama Sistemi",
    description: "Yetkililer için kullanıcıları mesajlaşmadan ve kişi listesinden yasaklama özelliği eklendi. Yasaklı kullanıcılara özel bilgilendirme ekranı tasarlandı.",
    type: "feat"
  },
  {
    id: "bc94df2",
    date: "9 Nisan 2024",
    time: "16:27",
    title: "Yanıt Sistemi İyileştirmesi",
    description: "Mesaj yanıtlarında görünen hayalet 'Kullanıcı' yazısı giderildi, yanıt görünümleri saflaştırıldı.",
    type: "fix"
  },
  {
    id: "f13b6e7",
    date: "9 Nisan 2024",
    time: "16:24",
    title: "Stabil Mesajlaşma Altyapısı",
    description: "Realtime bağlantı kopmaları giderildi, mesajların anlık düşme performansı %100 stabil hale getirildi.",
    type: "fix"
  },
  {
    id: "694f208",
    date: "8 Nisan 2024",
    time: "18:45",
    title: "Gelişmiş Real-time Motoru",
    description: "Mesajlaşma altyapısı Supabase Realtime v2'ye taşındı, manuel isim eşleştirme ile hız kazandırıldı.",
    type: "fix"
  },
  {
    id: "b0af284",
    date: "8 Nisan 2024",
    time: "18:35",
    title: "Mesaj Yanıtlama Özelliği",
    description: "Instagram stili mesaj yanıtlama ve alıntılama özelliği tüm sohbetlere eklendi.",
    type: "feat"
  },
  {
    id: "0ce87c0",
    date: "8 Nisan 2024",
    time: "16:56",
    title: "Akıllı Okuma Zamanlayıcısı",
    description: "Kitap okuma sayfasındaki sayaç useRef ile stabilize edildi, 20 saniyelik zorunlu kilit sistemi getirildi.",
    type: "fix"
  },
  {
    id: "19d39da",
    date: "8 Nisan 2024",
    time: "16:32",
    title: "Anti-Kopya & Ödev Görünümü",
    description: "Okuma sayfasında gelişmiş anti-kopya sistemi ve kitaplar sayfasında kişisel/sınıf ödevlerinin ayrıştırılması sağlandı.",
    type: "feat"
  },
  {
    id: "20163bc",
    date: "8 Nisan 2024",
    time: "15:47",
    title: "Gerçek Zamanlı Aktivite Takibi",
    description: "Öğrencilerin kitap okuma süreçleri anlık olarak takip edilebilir hale getirildi.",
    type: "feat"
  },
  {
    id: "c069138",
    date: "7 Nisan 2024",
    time: "19:37",
    title: "Grup Sohbetleri",
    description: "Sınıflar ve özel çalışma grupları için toplu mesajlaşma özelliği aktif edildi.",
    type: "feat"
  },
  {
    id: "a4a5695",
    date: "7 Nisan 2024",
    time: "19:17",
    title: "Mesaj Reaksiyonları",
    description: "Mesajlara emoji ile tepki verme (reaksiyon) özelliği eklendi.",
    type: "feat"
  },
  {
    id: "1f16020",
    date: "6 Nisan 2024",
    time: "19:32",
    title: "Dinamik Tema Sistemi",
    description: "8 farklı renk teması (Zümrüt, Boğaziçi, Lale, Gece vb.) ve veri tabanı senkronizasyonu eklendi.",
    type: "feat"
  },
  {
    id: "92ba42a",
    date: "5 Nisan 2024",
    time: "21:01",
    title: "Gelişmiş Analitik Paneli",
    description: "Okul geneli liderlik tabloları ve sınıf bazlı detaylı raporlama sistemi hayata geçirildi.",
    type: "feat"
  }
];

export default function Updates() {
  const getTypeConfig = (type: UpdateEntry["type"]) => {
    switch (type) {
      case "feat": return { label: "YENİLİK", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", icon: Sparkles };
      case "fix": return { label: "DÜZELTME", color: "bg-amber-500/10 text-amber-500 border-amber-500/20", icon: Bug };
      case "style": return { label: "TASARIM", color: "bg-purple-500/10 text-purple-500 border-purple-500/20", icon: Zap };
      default: return { label: "GÜNCELLEME", color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: GitCommit };
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in py-10 px-6">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary/10 text-primary mb-2">
          <Rocket className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-display font-bold text-foreground tracking-tight">Gelişim Günlüğü</h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Fikir Akademisi platformuna eklenen en son özellikleri, yapılan iyileştirmeleri ve hata düzeltmelerini buradan takip edebilirsiniz.
        </p>
      </div>

      <div className="relative space-y-6 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-primary/20 before:to-transparent">
        {UPDATES.map((update, idx) => {
          const config = getTypeConfig(update.type);
          const Icon = config.icon;

          return (
            <div key={update.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
              {/* Dot */}
              <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white/10 bg-background shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-all group-hover:scale-110 group-hover:border-primary/50">
                <Icon className="w-4 h-4 text-primary" />
              </div>

              {/* Card */}
              <Card className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-6 glass-card border-white/5 hover:border-primary/20 transition-all translate-y-0 hover:-translate-y-1 shadow-xl">
                <div className="flex flex-col space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className={`font-bold tracking-widest text-[10px] ${config.color}`}>
                      {config.label}
                    </Badge>
                    <div className="flex items-center text-[10px] text-muted-foreground font-medium uppercase tracking-widest bg-white/5 px-2 py-1 rounded-lg">
                      <Clock className="w-3 h-3 mr-1" /> {update.time}
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[10px] text-primary/60 font-black tracking-[0.2em] uppercase">
                       <Calendar className="w-3 h-3" /> {update.date}
                    </div>
                    <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors italic">
                      {update.title}
                    </h3>
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {update.description}
                  </p>

                  <div className="pt-2 flex items-center justify-between border-t border-white/5">
                    <span className="text-[10px] font-mono text-muted-foreground/30">#{update.id}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary/40 group-hover:text-primary/100 transition-colors">
                      Fikir Akademisi v1.4
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          );
        })}
      </div>

      <div className="py-10 text-center">
        <p className="text-muted-foreground text-xs uppercase tracking-[0.5em] font-black italic opacity-30">
          Sürekli Gelişim, Daimi Başarı
        </p>
      </div>
    </div>
  );
}
