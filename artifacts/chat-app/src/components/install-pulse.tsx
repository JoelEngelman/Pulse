import { useEffect, useState } from "react";
import { Download, MonitorSmartphone, Smartphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true;
}

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function InstallPulse() {
  const [prompt, setPrompt] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (isStandalone()) { setInstalled(true); return; }
    const handler = (event: Event) => {
      event.preventDefault();
      setPrompt(event);
    };
    window.addEventListener("beforeinstallprompt", handler);
    // Show on every normal web launch. Closing it only closes this launch;
    // the standalone check above prevents it from appearing inside the installed app.
    setOpen(true);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    const onInstalled = () => { setInstalled(true); setOpen(false); setPrompt(null); };
    window.addEventListener("appinstalled", onInstalled);
    return () => window.removeEventListener("appinstalled", onInstalled);
  }, []);

  if (installed || !open) return null;

  const install = async () => {
    if (prompt) {
      await prompt.prompt();
      const result = await prompt.userChoice.catch(() => null);
      if (result?.outcome === "accepted") setOpen(false);
      return;
    }
    setOpen(false);
  };

  const ios = isIOS();

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/55 backdrop-blur-md">
      <div className="relative w-full max-w-md rounded-[2rem] border border-white/15 bg-background/95 shadow-2xl p-6 sm:p-7">
        <button aria-label="Close" onClick={() => setOpen(false)} className="absolute right-4 top-4 p-2 rounded-full hover:bg-secondary/70 text-muted-foreground"><X className="w-5 h-5" /></button>
        <div className="w-16 h-16 rounded-2xl bg-primary/15 grid place-items-center mb-5 shadow-inner"><Download className="w-8 h-8 text-primary" /></div>
        <h2 className="text-2xl font-bold">Get Pulse on your device</h2>
        <p className="mt-2 text-sm text-muted-foreground">Install Pulse like an app for a faster, cleaner experience. Your account and messages stay with your Pulse account.</p>
        <div className="grid grid-cols-2 gap-3 mt-5">
          <div className="rounded-2xl border border-border bg-secondary/20 p-4"><MonitorSmartphone className="w-5 h-5 text-primary mb-2" /><p className="font-medium text-sm">Computer</p><p className="text-xs text-muted-foreground mt-1">Windows, macOS and Linux</p></div>
          <div className="rounded-2xl border border-border bg-secondary/20 p-4"><Smartphone className="w-5 h-5 text-primary mb-2" /><p className="font-medium text-sm">Mobile</p><p className="text-xs text-muted-foreground mt-1">Android, iPhone and iPad</p></div>
        </div>
        {ios ? (
          <div className="mt-5 rounded-2xl bg-primary/8 border border-primary/15 p-4 text-sm"><p className="font-semibold">Install on iPhone or iPad</p><p className="text-muted-foreground mt-1">Tap <b>Share</b> in Safari, then choose <b>Add to Home Screen</b>. Pulse will open from your Home Screen like an app.</p></div>
        ) : (
          <p className="mt-5 text-xs text-muted-foreground">Your browser will show its normal install confirmation when supported. Otherwise use the browser's <b>Install app</b>, <b>Add to Home screen</b>, or <b>Create shortcut</b> option.</p>
        )}
        <div className="flex gap-3 mt-6">{!ios && <Button onClick={install} className="flex-1"><Download className="w-4 h-4 mr-2" />Install Pulse</Button>}<Button variant="outline" onClick={() => setOpen(false)} className={ios ? "w-full" : "flex-1"}>Not now</Button></div>
      </div>
    </div>
  );
}
