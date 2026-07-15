import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect } from "react";
import { listThreads, createThread } from "@/lib/finance.functions";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/app/chat/")({ component: ChatIndex });

function ChatIndex() {
  const navigate = useNavigate();
  const listT = useServerFn(listThreads);
  const createT = useServerFn(createThread);
  const qc = useQueryClient();

  useEffect(() => {
    (async () => {
      const threads = await listT();
      if (threads.length > 0) {
        navigate({ to: "/app/chat/$threadId", params: { threadId: threads[0].id }, replace: true });
      } else {
        const t = await createT({ data: { titulo: "Nova conversa" } });
        qc.invalidateQueries({ queryKey: ["threads"] });
        navigate({ to: "/app/chat/$threadId", params: { threadId: t.id }, replace: true });
      }
    })();
  }, []);

  return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Carregando conversa...</div>;
}