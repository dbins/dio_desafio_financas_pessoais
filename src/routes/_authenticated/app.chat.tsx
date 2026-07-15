import { createFileRoute, Link, Outlet, useNavigate, useParams } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listThreads, createThread, deleteThread } from "@/lib/finance.functions";
import { Plus, MessageSquare, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/app/chat")({ component: ChatLayout });

function ChatLayout() {
  const listT = useServerFn(listThreads);
  const createT = useServerFn(createThread);
  const delT = useServerFn(deleteThread);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const params = useParams({ strict: false }) as { threadId?: string };

  const { data: threads = [] } = useQuery({ queryKey: ["threads"], queryFn: () => listT() });

  async function novaConversa() {
    const t = await createT({ data: { titulo: "Nova conversa" } });
    qc.invalidateQueries({ queryKey: ["threads"] });
    navigate({ to: "/app/chat/$threadId", params: { threadId: t.id } });
  }

  async function apagar(id: string) {
    await delT({ data: { id } });
    qc.invalidateQueries({ queryKey: ["threads"] });
    if (params.threadId === id) navigate({ to: "/app/chat" });
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] md:h-screen">
      <div className="w-64 shrink-0 border-r border-border bg-card p-3 hidden md:flex flex-col">
        <Button onClick={novaConversa} className="mb-3 gap-2"><Plus className="h-4 w-4" /> Nova conversa</Button>
        <div className="flex-1 overflow-y-auto space-y-1">
          {threads.length === 0 && <p className="text-xs text-muted-foreground p-2">Nenhuma conversa ainda.</p>}
          {threads.map((t: any) => (
            <div key={t.id} className={`group flex items-center gap-2 rounded-lg px-2 py-2 text-sm ${params.threadId === t.id ? "bg-secondary" : "hover:bg-secondary/50"}`}>
              <Link to="/app/chat/$threadId" params={{ threadId: t.id }} className="flex flex-1 items-center gap-2 min-w-0">
                <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{t.titulo}</span>
              </Link>
              <button onClick={() => apagar(t.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 min-w-0"><Outlet /></div>
    </div>
  );
}