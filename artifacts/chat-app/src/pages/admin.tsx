import { useEffect, useMemo, useState } from "react";
import { Activity, ArrowLeft, BarChart3, Clock3, MessageSquare, RefreshCw, Users, Zap } from "lucide-react";
import { useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { getInitials } from "@/lib/utils";

const API="https://lbphvoonoxpbvpovozuo.supabase.co/functions/v1/pulse-account";
const TOKEN="pulse-supabase-access-token";
const OWNER="joeldavidengelman";

type Person={id:string;username:string;displayName:string;avatarUrl?:string|null;isOnline:boolean;lastSeen:string|null;createdAt:string};
type Analytics={stats:{users:number;activeUsers:number;posts:number;messages:number;conversations:number};people:Person[]};

function relative(value:string|null){if(!value)return "Never";const ms=Date.now()-new Date(value).getTime();if(ms<60000)return "Just now";if(ms<3600000)return `${Math.floor(ms/60000)}m ago`;if(ms<86400000)return `${Math.floor(ms/3600000)}h ago`;return new Date(value).toLocaleString();}

export default function Admin(){const[,setLocation]=useLocation();const{user}=useAuth();const[data,setData]=useState<Analytics|null>(null);const[loading,setLoading]=useState(true);const[error,setError]=useState("");const[query,setQuery]=useState("");
const load=async()=>{setLoading(true);setError("");try{const token=localStorage.getItem(TOKEN);const r=await fetch(`${API}/admin/analytics`,{headers:{Authorization:`Bearer ${token}`}});const d=await r.json();if(!r.ok)throw new Error(d.error||"Could not load analytics");setData(d);}catch(e:any){setError(e.message||"Could not load analytics.");}finally{setLoading(false);}};
useEffect(()=>{if(user?.username?.toLowerCase()!==OWNER){setLocation("/feed");return;}load();},[user?.username]);
const people=useMemo(()=>{const q=query.trim().toLowerCase();return (data?.people??[]).filter(p=>!q||`${p.username} ${p.displayName}`.toLowerCase().includes(q));},[data,query]);
if(user?.username?.toLowerCase()!==OWNER)return null;
return <div className="h-full overflow-y-auto"><div className="max-w-6xl mx-auto px-4 py-6 md:py-10 space-y-6"><div className="flex items-center justify-between gap-3"><div><button onClick={()=>setLocation("/feed")} className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-2 mb-3"><ArrowLeft className="w-4 h-4"/>Back</button><div className="flex items-center gap-3"><div className="rounded-2xl bg-primary/10 text-primary p-3"><BarChart3 className="w-6 h-6"/></div><div><h1 className="text-3xl font-bold tracking-tight">Pulse Analytics</h1><p className="text-sm text-muted-foreground">Private owner dashboard · your activity is excluded.</p></div></div></div><Button variant="outline" onClick={load} disabled={loading}><RefreshCw className={`w-4 h-4 mr-2 ${loading?"animate-spin":""}`}/>Refresh</Button></div>
{error&&<div className="rounded-2xl border border-destructive/30 bg-destructive/10 text-destructive p-4">{error}</div>}
<div className="grid grid-cols-2 lg:grid-cols-5 gap-3">{[[Users,"Users",data?.stats.users??0],[Activity,"Active now",data?.stats.activeUsers??0],[BarChart3,"Posts",data?.stats.posts??0],[MessageSquare,"Messages",data?.stats.messages??0],[Zap,"Conversations",data?.stats.conversations??0]].map(([Icon,label,value]:any)=><div key={label} className="rounded-2xl border border-border bg-card/70 p-4"><Icon className="w-5 h-5 text-primary mb-3"/><p className="text-2xl font-bold">{value}</p><p className="text-xs text-muted-foreground mt-1">{label}</p></div>)}</div>
<div className="rounded-2xl border border-border bg-card/70 overflow-hidden"><div className="p-5 border-b border-border flex flex-col md:flex-row md:items-center gap-3"><div className="flex-1"><h2 className="font-semibold text-lg">Everyone on Pulse</h2><p className="text-sm text-muted-foreground">Last activity, online state and account age for every other user.</p></div><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Filter users…" className="h-10 rounded-xl border border-border bg-background/60 px-3 text-sm outline-none md:w-64"/></div>{loading&&!data?<div className="p-12 text-center text-muted-foreground">Loading analytics…</div>:people.length===0?<div className="p-12 text-center text-muted-foreground">No users match.</div>:<div className="divide-y divide-border">{people.map(p=><div key={p.id} className="p-4 flex items-center gap-3"><Avatar className="w-11 h-11"><AvatarImage src={p.avatarUrl||""}/><AvatarFallback>{getInitials(p.displayName)}</AvatarFallback></Avatar><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="font-semibold truncate">{p.displayName}</p><span className={`w-2 h-2 rounded-full ${p.isOnline?"bg-emerald-500":"bg-muted-foreground/40"}`}/></div><p className="text-sm text-muted-foreground truncate">@{p.username}</p></div><div className="text-right hidden sm:block"><p className="text-sm font-medium">{relative(p.lastSeen)}</p><p className="text-xs text-muted-foreground flex items-center justify-end gap-1"><Clock3 className="w-3 h-3"/>{p.lastSeen?new Date(p.lastSeen).toLocaleString():"No activity yet"}</p></div></div>)}</div>}</div></div></div>;
}
