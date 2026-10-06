import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Switch, Route, Redirect, Router as WouterRouter } from "wouter";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ThemeProvider } from "@/hooks/use-theme";
import { CookieBanner } from "@/components/cookie-banner";
import { InstallPulse } from "@/components/install-pulse";
import { NameVoteCard } from "@/components/name-vote-card";
import { CallManager } from "@/components/calling/call-manager";
import { AppLayout } from "@/components/layout/app-layout";
import Login from "@/pages/login"; import Register from "@/pages/register"; import Home from "@/pages/home"; import Social from "@/pages/social"; import Conversations from "@/pages/conversations"; import Chat from "@/pages/chat"; import Users from "@/pages/users"; import Search from "@/pages/search"; import Profile from "@/pages/profile"; import Settings from "@/pages/settings"; import Badges from "@/pages/badges"; import Safety from "@/pages/safety"; import Communities from "@/pages/communities"; import Notifications from "@/pages/notifications"; import AI from "@/pages/ai"; import CreatorStudio from "@/pages/creator-studio"; import Admin from "@/pages/admin"; import PublicProfile from "@/pages/public-profile"; import NotFound from "@/pages/not-found";
import "./pulse-motion.css";

function SchoolHoursGate({ children }: { children: React.ReactNode }) {
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    const checkSchoolHours = () => {
      const now = new Date();
      const day = now.getDay();
      const minutes = now.getHours() * 60 + now.getMinutes();
      const isWeekday = day >= 1 && day <= 5;
      const isSchoolHours = minutes >= 8 * 60 + 30 && minutes <= 15 * 60 + 30;
      setBlocked(isWeekday && isSchoolHours);
    };

    checkSchoolHours();
    const interval = window.setInterval(checkSchoolHours, 30_000);
    return () => window.clearInterval(interval);
  }, []);

  if (blocked) {
    return (
      <div className="relative h-[100dvh] w-full overflow-hidden bg-background px-6 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,hsl(var(--primary)/0.12),transparent_45%)]" />
        <a
          href="https://joelengelman.github.io/pulse-help/privacy.html"
          target="_blank"
          rel="noreferrer"
          aria-label="Open Pulse privacy and school safety information"
          className="absolute right-5 top-5 rounded-xl outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-primary sm:right-8 sm:top-8"
        >
          <img
            src="https://elsternwickps.vic.edu.au/wp-content/uploads/2020/10/EPS_logo_primary-c-1536x583.png"
            alt="Elsternwick Primary School — open Pulse privacy and school safety information"
            className="w-36 max-w-[28vw] object-contain sm:w-44"
          />
        </a>
        <div className="relative flex h-full items-center justify-center">
          <div className="w-full max-w-xl rounded-3xl border border-border/60 bg-background/80 px-8 py-10 shadow-2xl shadow-primary/5 backdrop-blur-xl sm:px-12 sm:py-12">
            <div className="mx-auto mb-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" aria-hidden="true">
                <path d="M7 10V8a5 5 0 0 1 10 0v2M6 10h12a1 1 0 0 1 1 1v9H5v-9a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="mb-3 text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Pulse
            </p>
            <h1 className="text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
              Sorry! Due to privacy reasons, Pulse is only available out of school!
            </h1>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Pulse will be available again after school hours.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType<any> }) { const { isAuthenticated, isLoading } = useAuth(); if (isLoading) return <div className="h-[100dvh] w-full flex items-center justify-center bg-background"><div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>; if (!isAuthenticated) return <Redirect to="/login" />; return <AppLayout><div className="pulse-page-transition"><Component /></div></AppLayout>; }
function HomeRedirect() { const { isAuthenticated, isLoading } = useAuth(); if (isLoading) return <div className="h-[100dvh] w-full flex items-center justify-center bg-background"><div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>; if (isAuthenticated) return <Redirect to="/feed" />; return <Redirect to="/login" />; }
const queryClient = new QueryClient();
export default function App(){return <ThemeProvider><QueryClientProvider client={queryClient}><TooltipProvider><SchoolHoursGate><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/,"")}><AuthProvider><CallManager/><Switch><Route path="/" component={HomeRedirect}/><Route path="/login" component={Login}/><Route path="/register" component={Register}/><Route path="/u/:username" component={PublicProfile}/><Route path="/feed" component={()=> <ProtectedRoute component={Home}/>}/><Route path="/social" component={()=> <ProtectedRoute component={Social}/>}/><Route path="/conversations" component={()=> <ProtectedRoute component={Conversations}/>}/><Route path="/conversations/:id" component={()=> <ProtectedRoute component={Chat}/>}/><Route path="/users" component={()=> <ProtectedRoute component={Users}/>}/><Route path="/search" component={()=> <ProtectedRoute component={Search}/>}/><Route path="/profile" component={()=> <ProtectedRoute component={Profile}/>}/><Route path="/settings" component={()=> <ProtectedRoute component={Settings}/>}/><Route path="/safety" component={()=> <ProtectedRoute component={Safety}/>}/><Route path="/communities" component={()=> <ProtectedRoute component={Communities}/>}/><Route path="/notifications" component={()=> <ProtectedRoute component={Notifications}/>}/><Route path="/ai" component={()=> <ProtectedRoute component={AI}/>}/><Route path="/creator-studio" component={()=> <ProtectedRoute component={CreatorStudio}/>}/><Route path="/admin" component={()=> <ProtectedRoute component={Admin}/>}/><Route path="/badges" component={()=> <ProtectedRoute component={Badges}/>}/><Route component={NotFound}/></Switch></AuthProvider></WouterRouter></SchoolHoursGate><Toaster/><CookieBanner/><InstallPulse/><NameVoteCard/></TooltipProvider></QueryClientProvider></ThemeProvider>;}
