import { useEffect, useMemo, useState } from "react";
import { Download, Monitor, Smartphone, Apple, Chrome, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

declare global {
  interface Window {
    pulseDesktop?: { installed: boolean; platform: string; version: string };
    Capacitor?: { isNativePlatform?: () => boolean };
  }
}

function isNativeApp() {
  return Boolean(window.pulseDesktop?.installed || window.Capacitor?.isNativePlatform?.());
}
function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true;
}
function detectPlatform() {
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  if (/mac os x/.test(ua)) return "mac";
  if (/windows/.test(ua)) return "windows";
  if (/linux/.test(ua)) return "linux";
  return "windows";
}

const RELEASES = "https://github.com/JoelEngelman/Pulse/releases/latest";
const DOWNLOADS: Record<string, string> = {
  windows: "https://github.com/JoelEngelman/Pulse/releases/download/latest/Pulse-Windows-Setup.exe",
  mac: "https://github.com/JoelEngelman/Pulse/releases/download/latest/Pulse-macOS-1.0.0.dmg",
  linux: "https://github.com/JoelEngelman/Pulse/releases/download/latest/Pulse-Linux-1.0.0.AppImage",
  android: "https://github.com/JoelEngelman/Pulse/releases/download/latest/Pulse-Android.apk",
};

const DEVICE_OPTIONS = [
  { id: "windows", name: "Windows", detail: "Windows 10 & 11", icon: Monitor },
  { id: "mac", name: "macOS", detail: "Mac desktop & laptop", icon: Apple },
  { id: "linux", name: "Linux", detail: "AppImage", icon: Monitor },
  { id: "android", name: "Android", detail: "APK for phones & tablets", icon: Smartphone },
  { id: "ios", name: "iPhone / iPad", detail: "Use Pulse in Safari", icon: Apple },
];

export function InstallPulse() {
  const [open, setOpen] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [selected, setSelected] = useState(detectPlatform);

  useEffect(() => {
    const openDownload = () => setOpen(true);
    window.addEventListener("pulse:download", openDownload);

    if (isNativeApp() || isStandalone()) setInstalled(true);
    else setOpen(true);

    const onInstalled = () => { setInstalled(true); setOpen(false); };
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("pulse:download", openDownload);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed || !open) return null;

  const chosen = DEVICE_OPTIONS.find(d => d.id === selected)!;
  const Icon = chosen.icon;
  const isIOS = selected === "ios";

  const install = () => {
    if (isIOS) {
      window.location.href = "/Pulse/";
      return;
    }
    window.location.href = DOWNLOADS[selected] ?? RELEASES;
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="relative w-full max-w-xl rounded-[2rem] border border-white/15 bg-background/95 shadow-2xl p-6 sm:p-7 max-h-[92dvh] overflow-y-auto">
        <button aria-label="Close" onClick={() => setOpen(false)} className="absolute right-4 top-4 p-2 rounded-full hover:bg-secondary/70 text-muted-foreground">
          <X className="w-5 h-5" />
        </button>

        <div className="w-16 h-16 rounded-2xl bg-primary/15 grid place-items-center mb-5 shadow-inner">
          <Download className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Download Pulse</h2>
        <p className="mt-2 text-sm text-muted-foreground">Choose the device you want to install Pulse on.</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6">
          {DEVICE_OPTIONS.map(device => {
            const DeviceIcon = device.icon;
            const active = selected === device.id;
            return (
              <button
                key={device.id}
                onClick={() => setSelected(device.id)}
                className={`relative text-left rounded-2xl border p-4 transition-all cursor-pointer ${active ? "border-primary bg-primary/10 ring-2 ring-primary/20" : "border-border bg-secondary/20 hover:bg-secondary/50"}`}
              >
                {active && <span className="absolute right-2 top-2 rounded-full bg-primary text-primary-foreground p-1"><Check className="w-3 h-3" /></span>}
                <DeviceIcon className={`w-6 h-6 mb-3 ${active ? "text-primary" : "text-muted-foreground"}`} />
                <p className="font-semibold text-sm">{device.name}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{device.detail}</p>
              </button>
            );
          })}
        </div>

        <div className="mt-5 rounded-2xl bg-primary/8 border border-primary/15 p-4 flex gap-3 items-start">
          <Icon className="w-5 h-5 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">{chosen.name}</p>
            {isIOS ? (
              <p className="text-sm text-muted-foreground mt-1">Apple requires signing and distribution through Apple for a real public iPhone/iPad app. For now, Pulse opens directly in Safari instead of giving you a fake or unusable download.</p>
            ) : (
              <p className="text-sm text-muted-foreground mt-1">This downloads the real Pulse application for {chosen.name}, with its own app window and launcher entry.</p>
            )}
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button className="flex-1" onClick={install}>
            {isIOS ? <Chrome className="w-4 h-4 mr-2" /> : <Download className="w-4 h-4 mr-2" />}
            {isIOS ? "Use Pulse on iPhone / iPad" : `Install Pulse for ${chosen.name}`}
          </Button>
          <Button variant="outline" onClick={() => setOpen(false)}>Not now</Button>
        </div>
        <p className="text-[11px] text-muted-foreground text-center mt-4">You can open this chooser again from the Download button in Pulse.</p>
      </div>
    </div>
  );
}
