import { useEffect, useState } from "react";
import { Bell, Check, Loader2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

const API="https://lbphvoonoxpbvpovozuo.supabase.co/functions/v1/pulse-notifications";
const TOKEN_KEY="pulse-supabase-access-token";
function authHeaders():HeadersInit{const token=typeof window!=="undefined"?localStorage.getItem(TOKEN_KEY):null;return token?{Authorization:`Bearer ${token}`}:{};}

export default function Notifications(){
 const [,navigate]=useLocation();
 const [items,setItems]=useState<any[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState("");
 const load=async(silent=false)=>{if(!silent)setLoading(true);try{const r=await fetch(API,{headers:authHeaders()});const d=await r.json().catch(()=>[]);if(!r.ok)throw new Error(d.error||"Couldn't load notifications.");if(Array.isArray(d))setItems(d);setError("");}catch(e:any){if(!silent)setError(e.message||"Couldn't load notifications.");}finally{if(!silent)setLoading(false)}};
 useEffect(()=>{load();const timer=window.setInterval(()=>load(true),5000);return()=>window.clearInterval(timer)},[]);
 const read=async()=>{try{const r=await fetch(API,{method:"PATCH",headers:authHeaders()});if(!r.ok)throw new Error();setItems(x=>x.map(n=>({...n,read:true})));}catch{setError("Couldn't mark notifications as read.")}};
 const open=(n:any)=>{if(n.link)navigate(n.link);};
 return <div className="w-full h-full overflow-y-auto"><div className="max-w-2xl mx-auto px-4 py-8"><div className="flex items-center justify-between mb-7"><div><div className="flex items-center gap-2"><Bell className="w-6 h-6 text-primary"/><h1 className="text-3xl font-bold">Notifications</h1></div><p className="text-muted-foreground mt-1">Replies, follows and important Pulse activity.</p></div><Button variant="outline" onClick={read} disabled={!items.some(n=>!n.read)}><Check className="w-4 h-4 mr-2"/>Mark all read</Button></div>{error&&<div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive p-3 text-sm">{error}</div>}{loading?<div className="flex justify-center py-16"><Loader2 className="animate-spin"/></div>:items.length===0?<div className="bg-card border border-border rounded-2xl p-10 text-center text-muted-foreground">You're all caught up 🎉</div>:<div className="space-y-2">{items.map(n=><button type="button" onClick={()=>open(n)} key={n.id} className={`w-full text-left flex gap-3 p-4 rounded-2xl border transition-colors hover:bg-secondary/60 ${n.read?"border-border bg-card":"border-primary/30 bg-primary/5"}`}><div className="w-10 h-10 rounded-full bg-primary/10 grid place-items-center text-primary shrink-0">{n.type==="message"?<MessageCircle className="w-5 h-5"/>:<Bell className="w-5 h-5"/>}</div><div className="min-w-0"><p className="font-medium">{n.message}</p><p className="text-xs text-muted-foreground mt-1">{new Date(n.createdAt).toLocaleString()}</p></div></button>)}</div>}</div></div>;
}
