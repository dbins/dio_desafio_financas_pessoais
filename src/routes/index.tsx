import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageCircle, Sparkles, TrendingUp, Target } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold text-foreground">Finance AI</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/auth" className="text-sm font-medium text-muted-foreground hover:text-foreground">Entrar</Link>
          <Link to="/auth" search={{ mode: "signup" }} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-[var(--shadow-soft)] hover:opacity-90">Começar grátis</Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-16 pt-10">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
              <Sparkles className="h-3 w-3" /> Organização financeira com IA
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-tight text-foreground sm:text-5xl lg:text-6xl">
              Organize suas finanças <span className="text-primary">conversando</span>.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              Registre receitas e despesas em linguagem natural. Nosso agente entende, classifica e organiza tudo para você. Sem planilhas. Sem formulários.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/auth" search={{ mode: "signup" }} className="rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-soft)] hover:opacity-90">
                Criar minha conta
              </Link>
              <Link to="/auth" className="rounded-md border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground hover:bg-secondary">
                Já tenho conta
              </Link>
            </div>
          </div>

          <div className="rounded-2xl p-1" style={{ background: "var(--gradient-hero)" }}>
            <div className="rounded-2xl bg-card p-6 shadow-[var(--shadow-soft)]">
              <div className="flex items-center gap-2 pb-4 text-xs text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-accent" /> chat com o Finance AI
              </div>
              <div className="space-y-3">
                <div className="ml-auto max-w-[75%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2 text-sm text-primary-foreground">
                  Gastei R$ 45 no Uber
                </div>
                <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-secondary px-4 py-2 text-sm text-secondary-foreground">
                  Registrei sua despesa de <b>R$ 45</b> em <b>Transporte</b>. ✅
                </div>
                <div className="ml-auto max-w-[75%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2 text-sm text-primary-foreground">
                  Recebi R$ 3500 de salário
                </div>
                <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-secondary px-4 py-2 text-sm text-secondary-foreground">
                  Receita de <b>R$ 3.500</b> em <b>Salário</b> adicionada. 💚
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-20 grid gap-6 sm:grid-cols-3">
          {[
            { icon: MessageCircle, title: "Chat inteligente", desc: "Descreva a movimentação como falaria com um amigo." },
            { icon: TrendingUp, title: "Dashboard automático", desc: "Saldo, categorias e evolução mensal atualizados em tempo real." },
            { icon: Target, title: "Metas com IA", desc: "Recomendações práticas geradas a partir dos seus próprios dados." },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border border-border bg-card p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
