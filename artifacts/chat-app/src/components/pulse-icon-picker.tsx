import { useEffect, useState } from "react";
import { Check, Image as ImageIcon, Loader2 } from "lucide-react";

const ICON_KEY = "pulse-selected-icon";
const PACKS = [
  { id: "1", name: "Pulse 1", url: "https://raw.githubusercontent.com/JoelEngelman/icons/main/pulse1.zip" },
  { id: "2", name: "Pulse 2", url: "https://raw.githubusercontent.com/JoelEngelman/icons/main/Pulse2_release_pack.zip" },
  { id: "3", name: "Pulse 3", url: "https://raw.githubusercontent.com/JoelEngelman/icons/main/Pulse3_release_pack.zip" },
  { id: "4", name: "Pulse 4", url: "https://raw.githubusercontent.com/JoelEngelman/icons/main/Pulse4_release_pack.zip" },
  { id: "5", name: "Pulse 5", url: "https://raw.githubusercontent.com/JoelEngelman/icons/main/Pulse5_release_pack.zip" },
];

function setFavicon(url: string) {
  let link = document.querySelector<HTMLLinkElement>('link[data-pulse-favicon="true"]');
  if (!link) { link = document.createElement("link"); link.rel = "icon"; link.dataset.pulseFavicon = "true"; document.head.appendChild(link); }
  link.href = url;
}

export function PulseIconPicker() {
  const [icons, setIcons] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState(() => localStorage.getItem(ICON_KEY) || "1");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const JSZip = (window as any).JSZip;
      if (!JSZip) { setLoading(false); return; }
      const found: Record<string, string> = {};
      await Promise.all(PACKS.map(async pack => {
        try {
          const response = await fetch(pack.url);
          if (!response.ok) return;
          const zip = await JSZip.loadAsync(await response.arrayBuffer());
          const names = Object.keys(zip.files).filter(name => /\.(png|jpe?g|webp|gif|svg)$/i.test(name) && !zip.files[name].dir);
          const preferred = names.find(name => /(512|1024|icon|app)/i.test(name)) || names[0];
          if (!preferred) return;
          const file = zip.files[preferred];
          const ext = preferred.split(".").pop()?.toLowerCase() || "png";
          const blob = await file.async("blob");
          found[pack.id] = URL.createObjectURL(new Blob([blob], { type: ext === "svg" ? "image/svg+xml" : `image/${ext === "jpg" ? "jpeg" : ext}` }));
        } catch {}
      }));
      if (!cancelled) setIcons(found); else Object.values(found).forEach(URL.revokeObjectURL);
      setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const choose = (id: string) => {
    setSelected(id);
    localStorage.setItem(ICON_KEY, id);
    if (icons[id]) setFavicon(icons[id]);
    window.dispatchEvent(new CustomEvent("pulse-icon-changed", { detail: { id } }));
  };

  return <section className="glass-panel rounded-3xl p-5 mb-5">
    <div className="flex items-center gap-3 mb-4"><div className="p-2 rounded-xl bg-primary/10 text-primary"><ImageIcon className="w-5 h-5" /></div><div><h2 className="font-semibold">Pulse app icon</h2><p className="text-xs text-muted-foreground">Choose one of the five Pulse icons from your icon packs.</p></div></div>
    {loading ? <div className="flex items-center gap-2 text-sm text-muted-foreground py-5"><Loader2 className="w-4 h-4 animate-spin" />Loading Pulse icons…</div> : <div className="grid grid-cols-5 gap-3">{PACKS.map(pack => <button key={pack.id} onClick={() => choose(pack.id)} aria-label={`Use ${pack.name}`} className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all hover:scale-105 ${selected === pack.id ? "border-primary ring-2 ring-primary/30" : "border-border"}`}>
      {icons[pack.id] ? <img src={icons[pack.id]} alt={pack.name} className="w-full h-full object-cover" /> : <div className="w-full h-full grid place-items-center bg-secondary/40 text-xs font-semibold">P{pack.id}</div>}
      {selected === pack.id && <span className="absolute right-1.5 top-1.5 grid place-items-center w-6 h-6 rounded-full bg-primary text-primary-foreground shadow-lg"><Check className="w-3.5 h-3.5" /></span>}
    </button>)}</div>}
    <p className="text-[11px] text-muted-foreground mt-3">The selected icon updates Pulse's browser icon immediately. If Pulse is already installed as a PWA, the operating system may keep the icon it used when the app was installed.</p>
  </section>;
}
