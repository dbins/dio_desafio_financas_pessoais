import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listTransacoes } from "@/lib/finance.functions";
import { brl } from "@/lib/format";
import { useMemo } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend,
} from "recharts";

export const Route = createFileRoute("/_authenticated/app/dashboard")({ component: DashboardPage });

const COLORS = ["#10B981","#0B3D2E","#059669","#34D399","#065F46","#6EE7B7","#047857","#A7F3D0"];

function DashboardPage() {
  const listT = useServerFn(listTransacoes);
  const { data: tx = [] } = useQuery({ queryKey: ["transacoes"], queryFn: () => listT() });

  const meses = useMemo(() => {
    const now = new Date();
    const arr: { mes: string; receitas: number; despesas: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString("pt-BR", { month: "short" });
      const r = tx.filter((t: any) => t.tipo === "receita" && sameMonth(t.data_transacao, d)).reduce((s: number, t: any) => s + Number(t.valor), 0);
      const dsp = tx.filter((t: any) => t.tipo === "despesa" && sameMonth(t.data_transacao, d)).reduce((s: number, t: any) => s + Number(t.valor), 0);
      arr.push({ mes: label, receitas: r, despesas: dsp });
    }
    return arr;
  }, [tx]);

  const categorias = useMemo(() => {
    const now = new Date();
    const mapa = new Map<string, number>();
    tx.filter((t: any) => t.tipo === "despesa" && sameMonth(t.data_transacao, now)).forEach((t: any) => {
      mapa.set(t.categoria, (mapa.get(t.categoria) ?? 0) + Number(t.valor));
    });
    return Array.from(mapa.entries()).map(([name, value]) => ({ name, value }));
  }, [tx]);

  return (
    <div className="mx-auto max-w-6xl p-6 pb-24 md:pb-6">
      <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
      <p className="text-sm text-muted-foreground">Visualize suas finanças em gráficos.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground">Receitas x Despesas (últimos 6 meses)</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={meses}>
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `R$${v}`} />
                <Tooltip formatter={(v: any) => brl(Number(v))} />
                <Legend />
                <Bar dataKey="receitas" fill="#10B981" radius={[6,6,0,0]} />
                <Bar dataKey="despesas" fill="#EF4444" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground">Despesas por categoria (mês atual)</h2>
          <div className="mt-4 h-64">
            {categorias.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem despesas neste mês.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categorias} dataKey="value" nameKey="name" outerRadius={90} label={(e: any) => e.name}>
                    {categorias.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => brl(Number(v))} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function sameMonth(iso: string, d: Date) {
  const t = new Date(iso);
  return t.getMonth() === d.getMonth() && t.getFullYear() === d.getFullYear();
}