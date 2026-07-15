import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { getProfile } from "@/lib/finance.functions";
import { supabase } from "@/integrations/supabase/client";
import { Home, MessageCircle, ListOrdered, BarChart3, Target, Wand2, LogOut, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app")({ component: AppShell });

const NAV: { to: string; label: string; icon: any; exact?: boolean }[] = [
  { to: "/app", label: "Home", icon: Home, exact: true },
  { to: "/app/chat", label: "Chat", icon: MessageCircle },
  { to: "/app/historico", label: "Histórico", icon: ListOrdered },
  { to: "/app/dashboard", label: "Dashboard", icon: BarChart3 },
  { to: "/app/metas", label: "Metas", icon: Target },
  { to: "/app/agente", label: "Agente IA", icon: Wand2 },
];

function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const qc = useQueryClient();
  const getP = useServerFn(getProfile);
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: () => getP() });

  useEffect(() => {
    if (profile && !profile.onboarding_completo && !location.pathname.includes("onboarding")) {
      navigate({ to: "/onboarding" });
    }
  }, [profile, location.pathname, navigate]);

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex items-center gap-2 px-6 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold">Finance AI</span>
        </div>
        <nav className="flex-1 px-3 py-2 space-y-1">
          {NAV.map((n) => {
            const active = n.exact ? location.pathname === n.to : location.pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to as any}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                  active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50"
                }`}
              >
                <n.icon className="h-4 w-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-sidebar-border p-4">
          <div className="mb-3 text-xs">
            <div className="font-medium">{profile?.nome || "Usuário"}</div>
            <div className="text-sidebar-foreground/60">{profile?.email}</div>
          </div>
          <button onClick={signOut} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-sidebar-accent/50">
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </div>
      </aside>

      <div className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between bg-sidebar text-sidebar-foreground px-4 py-3 md:hidden">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-sidebar-primary" />
          <span className="font-semibold">Finance AI</span>
        </div>
        <button onClick={signOut} className="text-sm"><LogOut className="h-4 w-4" /></button>
      </div>

      <main className="flex-1 md:pt-0 pt-14">
        <Outlet />
        <div className="fixed bottom-0 left-0 right-0 z-30 flex justify-around border-t border-border bg-card py-2 md:hidden">
          {NAV.slice(0, 5).map((n) => {
            const active = n.exact ? location.pathname === n.to : location.pathname.startsWith(n.to);
            return (
              <Link key={n.to} to={n.to as any} className={`flex flex-col items-center px-2 py-1 text-[10px] ${active ? "text-primary" : "text-muted-foreground"}`}>
                <n.icon className="h-5 w-5" />
                {n.label}
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}