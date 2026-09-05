import { useState } from "react";
import { useListConversations, useListUsers, useCreateConversation, useGetMe, Conversation, User, getListConversationsQueryKey } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { getInitials } from "@/lib/utils";
import { Search, MessageSquarePlus, UsersRound } from "lucide-react";

export function ConversationsList({ activeId }: { activeId?: number }) {
  const [search, setSearch] = useState(""); const [, setLocation] = useLocation();
  const { data: currentUser } = useGetMe();
  const { data: conversations, isLoading } = useListConversations({ query: { refetchInterval: 3000, queryKey: getListConversationsQueryKey() } });
  const { data: users } = useListUsers({ search: search.length >= 1 ? search : undefined }, { query: { enabled: true } });
  const createConversation = useCreateConversation();
  const startChat = (userId: number) => createConversation.mutate({ data: { participantId: userId } }, { onSuccess: conv => { setSearch(""); setLocation(`/conversations/${conv.id}`); } });
  if (isLoading) return <div className="p-4 text-sm text-muted-foreground">Loading conversations…</div>;
  const hasConversations = !!conversations?.length;
  const filteredUsers = (users ?? []).filter((u: User) => u.id !== currentUser?.id);
  return <div className="flex flex-col w-full h-full overflow-hidden">
    <div className="p-3 border-b border-border flex-shrink-0"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"/><Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search people…" className="pl-9 h-9 bg-secondary/40 border-transparent focus:border-primary text-sm"/></div></div>
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      {search && <div className="flex flex-col p-2 gap-1">{filteredUsers.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No users found</p>}{filteredUsers.map((user: User) => <button key={user.id} onClick={() => startChat(user.id)} disabled={createConversation.isPending} className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/60 transition-all text-left w-full cursor-pointer"><Avatar className="w-10 h-10"><AvatarImage src={user.avatarUrl || ""}/><AvatarFallback>{getInitials(user.displayName)}</AvatarFallback></Avatar><div className="flex-1 min-w-0"><p className="font-semibold text-sm truncate">{user.displayName}</p><p className="text-xs text-muted-foreground truncate">@{user.username}</p></div><MessageSquarePlus className="w-4 h-4 text-primary"/></button>)}</div>}
      {!search && !hasConversations && <div className="p-6 text-center text-sm text-muted-foreground">No conversations yet. Search for someone to message.</div>}
      {!search && hasConversations && <div className="flex flex-col p-2 gap-1">{(conversations ?? []).map((conv: Conversation) => { const isGroup = !!(conv as any).isGroup; const otherUser = conv.participants.find(p => p.id !== currentUser?.id) || conv.participants[0]; const title = isGroup ? ((conv as any).name || `${conv.participants.length} person group`) : otherUser?.displayName; const isActive = activeId === conv.id; const hasUnread = conv.unreadCount > 0; return <Link key={conv.id} href={`/conversations/${conv.id}`} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${isActive ? "bg-secondary text-foreground" : "hover:bg-secondary/50"}`}><div className="relative flex-shrink-0"><Avatar className="w-12 h-12"><AvatarImage src={isGroup ? "" : otherUser?.avatarUrl || ""}/><AvatarFallback>{isGroup ? <UsersRound className="w-5 h-5"/> : getInitials(otherUser?.displayName || "?")}</AvatarFallback></Avatar></div><div className="flex-1 min-w-0"><div className="flex justify-between items-baseline gap-2"><span className={`font-semibold text-sm truncate ${hasUnread ? "text-foreground" : ""}`}>{title}</span>{conv.lastMessage && <span className="text-xs flex-shrink-0 opacity-60">{formatDistanceToNow(new Date(conv.lastMessage.createdAt), { addSuffix: false }).replace("about ", "")}</span>}</div><span className={`text-xs truncate block ${hasUnread ? "font-medium text-foreground" : "text-muted-foreground"}`}>{conv.lastMessage?.content || (isGroup ? "Group chat created" : "Start the conversation")}</span></div>{hasUnread && <div className="bg-primary text-primary-foreground text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">{conv.unreadCount}</div>}</Link>; })}</div>}
    </div>
  </div>;
}
