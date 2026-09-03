import { useEffect, useMemo, useState } from "react";
import { Download, Monitor, Smartphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";

declare global {
  interface Window { pulseDesktop?: { installed: boolean; platform: string; version: string } }
}

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true;
}

function platform() {
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  if (/mac os x/.test(ua)) return "mac";
  if (/windows/.test(ua)) return "windows";
  if (/linux/.test(ua)) return "linux";
  return "other";
}

const RELEASES = "https://github.com/JoelEngelman/Pulse/releases/latest";

export function InstallPulse() {
  const [open, setOpen] = useState(false);
  const [installed, setInstalled] = useState(false);
  const device = useMemo(platform, []);

  useEffect(() => {
    if (window.pulseDesktop?.installed || isStandalone()) { setInstalled(true); return; }
    setOpen(true);
    const onInstalled = () => { setInstalled(true); setOpen(false); };
    window.addEventListener("appinstalled", onInstalled);
    return () => window.removeEventListener("appinstalled", onInstalled);
  }, []);

  if (installed || !open) return null;

  const label = device === "windows" ? "Download for Windows" : device === "mac" ? "Download for macOS" : device === "linux" ? "Download for Linux" : device === "android" ? "Download for Android" : device === "ios" ? "Get Pulse for iPhone / iPad" : "View Pulse downloads";
  const install = () => { window.location.href = RELEASES; };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="relative w-full max-w-md rounded-[2rem] border border-white/15 bg-background/95 shadow-2xl p-6 sm:p-7">
        <button aria-label="Close" onClick={() => setOpen(false)} className="absolute right-4 top-4 p-2 rounded-full hover:bg-secondary/70 text-muted-foreground"><X className="w-5 h-5" /></button>
        <div className="w-16 h-16 rounded-2xl bg-primary/15 grid place-items-center mb-5 shadow-inner"><Download className="w-8 h-8 text-primary" /></div>
        <h2 className="text-2xl font-bold">Get the Pulse app</h2>
        <p className="mt-2 text-sm text-muted-foreground">Use Pulse as a real app with its own window, icon and launcher entry — no browser tab required.</p>
        <div className="grid grid-cols-2 gap-3 mt-5">
          <div className="rounded-2xl border border-border bg-secondary/20 p-4"><Monitor className="w-5 h-5 text-primary mb-2" /><p className="font-medium text-sm">Desktop</p><p className="text-xs text-muted-foreground mt-1">Windows · macOS · Linux</p></div>
          <div className="rounded-2xl border border-border bg-secondary/20 p-4"><Smartphone className="w-5 h-5 text-primary mb-2" /><p className="font-medium text-sm">Mobile</p><p className="text-xs text-muted-foreground mt-1">Android · iPhone · iPad</p></div>
        </div>
        <div className="mt-5 rounded-2xl bg-primary/8 border border-primary/15 p-4 text-sm"><p className="font-semibold">Your device: {device === "ios" ? "iPhone / iPad" : device === "android" ? "Android" : device === "mac" ? "macOS" : device === "windows" ? "Windows" : device === "linux" ? "Linux" : "Computer"}</p><p className="text-muted-foreground mt-1">Download the native Pulse build for your platform from the official releases.</p></div>
        <div className="flex gap-3 mt-6"><Button onClick={install} className="flex-1"><Download className="w-4 h-4 mr-2" />{label}</Button><Button variant="outline" onClick={() => setOpen(false)}>Not now</Button></div>
        <p className="text-[11px] text-muted-foreground text-center mt-4">Pulse also remains available in your browser.</p>
      </div>
    </div>
  );
}
