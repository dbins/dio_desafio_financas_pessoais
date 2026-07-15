import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { listMensagens } from "@/lib/finance.functions";
import { sendChatMessage } from "@/lib/ai.functions";
import { Button } from "@/components/ui/button";
import { Send, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/chat/$threadId")({ component: ChatThread });

function ChatThread() {
  const { threadId } = Route.useParams();
  const listM = useServerFn(listMensagens);
  const send = useServerFn(sendChatMessage);
  const qc = useQueryClient();

  const { data: mensagens = [] } = useQuery({
    queryKey: ["mensagens", threadId],
    queryFn: () => listM({ data: { threadId } }),
  });

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const mut = useMutation({
    mutationFn: (mensagem: string) => send({ data: { threadId, mensagem } }),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ["mensagens", threadId] });
      qc.invalidateQueries({ queryKey: ["threads"] });
      if (res?.transacao) {
        qc.invalidateQueries({ queryKey: ["transacoes"] });
        toast.success("Transação registrada!");
      }
    },
    onError: (err: any) => toast.error(err.message ?? "Erro ao enviar"),
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [mensagens.length, mut.isPending]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, [threadId]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || mut.isPending) return;
    const msg = input.trim();
    setInput("");
    mut.mutate(msg);
  }

  return (
    <div className="flex h-full flex-col">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6">
        {mensagens.length === 0 && (
          <div className="mx-auto max-w-lg text-center py-12">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Sparkles className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-foreground">Como posso te ajudar?</h2>
            <p className="mt-2 text-sm text-muted-foreground">Escreva uma mensagem como "Gastei R$ 30 no mercado" ou "Recebi R$ 3500 de salário".</p>
            <div className="mt-4 grid gap-2 text-left">
              {["Gastei R$ 45 no Uber","Recebi R$ 3500 de salário","Ontem paguei R$ 70 na farmácia"].map((s) => (
                <button key={s} onClick={() => setInput(s)} className="rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground hover:bg-secondary">{s}</button>
              ))}
            </div>
          </div>
        )}
        <div className="mx-auto flex max-w-2xl flex-col gap-3">
          {mensagens.map((m: any) => (
            <div key={m.id} className={`flex ${m.tipo_mensagem === "usuario" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap ${
                m.tipo_mensagem === "usuario"
                  ? "bg-primary text-primary-foreground rounded-tr-sm"
                  : "bg-secondary text-secondary-foreground rounded-tl-sm"
              }`}>{m.mensagem}</div>
            </div>
          ))}
          {mut.isPending && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-tl-sm bg-secondary px-4 py-2 text-sm text-muted-foreground">Pensando...</div>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={onSubmit} className="border-t border-border bg-card p-3 md:p-4">
        <div className="mx-auto flex max-w-2xl items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSubmit(e); } }}
            placeholder="Escreva sua mensagem..."
            rows={1}
            className="flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <Button type="submit" size="icon" disabled={!input.trim() || mut.isPending}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}