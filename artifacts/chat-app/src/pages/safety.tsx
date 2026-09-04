import { useEffect, useState } from "react";
import { ShieldCheck, UserX, Flag, ExternalLink, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const API="https://pulse-api-proxy.joeldavidengelman.workers.dev";

type Blocked={id:number;username:string;displayName:string;avatarUrl:string|null};

export default function Safety(){
 const [blocked,setBlocked]=useState<Blocked[]>([]); const [loading,setLoading]=useState(true); const [message,setMessage]=useState("");
 const load=async()=>{try{const r=await fetch(`${API}/api/safety/blocks`,{credentials:"include"}); if(!r.ok) throw new Error(); setBlocked(await r.json());}catch{setMessage("Couldn't load your blocked accounts.");}finally{setLoading(false);}};
 useEffect(()=>{load();},[]);
 const unblock=async(id:number)=>{const r=await fetch(`${API}/api/safety/block/${id}`,{method:"DELETE",credentials:"include"}); if(r.ok)setBlocked(x=>x.filter(u=>u.id!==id));};
 return <div className="w-full h-full overflow-y-auto custom-scrollbar"><div className="max-w-2xl mx-auto px-4 py-8">
  <div className="flex items-center gap-3 mb-2"><div className="p-3 rounded-2xl bg-primary/10 text-primary"><ShieldCheck className="w-7 h-7"/></div><div><h1 className="text-3xl font-bold">Safety & Privacy</h1><p className="text-muted-foreground">Your controls for a kinder, safer Pulse.</p></div></div>
  <div className="glass-panel rounded-3xl p-5 mt-6 mb-5"><div className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-primary mt-0.5"/><div><h2 className="font-semibold">Pulse safety promise</h2><p className="text-sm text-muted-foreground mt-1 leading-6">You control who you communicate with. Pulse does not publish a public directory of everyone using the service. Searching for someone never gives permission to harass, pressure or repeatedly contact them.</p></div></div></div>
  <div className="glass-panel rounded-3xl p-5 mb-5"><div className="flex items-center gap-3 mb-4"><UserX className="w-5 h-5 text-primary"/><div><h2 className="font-semibold">Blocked accounts</h2><p className="text-xs text-muted-foreground">Blocked people should not be able to continue unwanted contact.</p></div></div>{loading?<p className="text-sm text-muted-foreground">Loading…</p>:blocked.length===0?<p className="text-sm text-muted-foreground">You haven't blocked anyone.</p>:<div className="space-y-2">{blocked.map(u=><div key={u.id} className="flex items-center gap-3 rounded-2xl bg-secondary/30 p-3"><div className="w-10 h-10 rounded-full overflow-hidden bg-secondary">{u.avatarUrl&&<img src={u.avatarUrl} alt="" className="w-full h-full object-cover"/>}</div><div className="flex-1 min-w-0"><p className="font-medium truncate">{u.displayName}</p><p className="text-xs text-muted-foreground truncate">@{u.username}</p></div><Button variant="outline" size="sm" onClick={()=>unblock(u.id)}>Unblock</Button></div>)}</div>}</div>
  {message&&<p className="text-sm text-destructive mb-4">{message}</p>}
  <div className="grid gap-4 sm:grid-cols-2"><a href="https://joelengelman.github.io/pulse-help/terms.html" target="_blank" rel="noreferrer" className="glass-panel rounded-3xl p-5 hover:border-primary/40 transition-colors"><Flag className="w-5 h-5 text-primary"/><h2 className="font-semibold mt-3">Community rules</h2><p className="text-sm text-muted-foreground mt-1">Read the kindness, privacy and child-safety standards.</p><span className="text-sm text-primary inline-flex items-center gap-1 mt-3">Open Terms <ExternalLink className="w-3.5 h-3.5"/></span></a><a href="https://joelengelman.github.io/pulse-help/report.html" target="_blank" rel="noreferrer" className="glass-panel rounded-3xl p-5 hover:border-primary/40 transition-colors"><Flag className="w-5 h-5 text-primary"/><h2 className="font-semibold mt-3">Report a problem</h2><p className="text-sm text-muted-foreground mt-1">Get help when someone is unsafe, abusive or violating the rules.</p><span className="text-sm text-primary inline-flex items-center gap-1 mt-3">Open Support <ExternalLink className="w-3.5 h-3.5"/></span></a></div>
 </div></div>;
}
