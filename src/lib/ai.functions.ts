import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3-flash-preview";

const CATEGORIAS_DESPESA = ["Alimentação","Mercado","Transporte","Saúde","Educação","Moradia","Lazer","Compras","Assinaturas","Contas","Outros"];
const CATEGORIAS_RECEITA = ["Salário","Freelance","Investimentos","Vendas","Outros"];

async function callGateway(messages: Array<{ role: string; content: string }>, tools?: any[]) {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
    body: JSON.stringify({ model: MODEL, messages, ...(tools ? { tools, tool_choice: "auto" } : {}) }),
  });
  if (res.status === 429) throw new Error("Muitas requisições, tente novamente em alguns segundos.");
  if (res.status === 402) throw new Error("Créditos de IA esgotados. Adicione créditos no workspace.");
  if (!res.ok) throw new Error(`Erro na IA: ${res.status} ${await res.text()}`);
  return res.json();
}

const SYSTEM_PROMPT = `Você é o Finance AI, um assistente financeiro brasileiro amigável.
Sua missão: ajudar o usuário a registrar receitas/despesas em linguagem natural e responder dúvidas sobre suas finanças.

Regras para extração de transações:
- Identifique valores em Reais (R$).
- Identifique datas relativas (hoje, ontem, semana passada). Use formato YYYY-MM-DD. Hoje: ${new Date().toISOString().slice(0,10)}.
- Classifique categoria. Despesa: ${CATEGORIAS_DESPESA.join(", ")}. Receita: ${CATEGORIAS_RECEITA.join(", ")}.
- Se a mensagem descreve uma transação clara, chame a ferramenta registrar_transacao.
- Se faltar valor ou tipo, peça confirmação em texto (não chame a ferramenta).
- Nunca invente valores. Nunca apague ou altere registros sem confirmação.
- Responda sempre em português brasileiro, tom conversacional e curto.`;

const tools = [
  {
    type: "function",
    function: {
      name: "registrar_transacao",
      description: "Registra uma receita ou despesa quando a mensagem do usuário descreve claramente uma movimentação financeira.",
      parameters: {
        type: "object",
        properties: {
          tipo: { type: "string", enum: ["receita", "despesa"] },
          valor: { type: "number", description: "valor em reais, positivo" },
          categoria: { type: "string" },
          descricao: { type: "string" },
          data_transacao: { type: "string", description: "YYYY-MM-DD" },
          confianca: { type: "number", description: "0 a 100" },
        },
        required: ["tipo", "valor", "categoria"],
      },
    },
  },
];

export const sendChatMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z.object({ threadId: z.string().uuid(), mensagem: z.string().min(1) }).parse(v),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Insert user message
    await supabase.from("conversas").insert({
      thread_id: data.threadId,
      usuario_id: userId,
      tipo_mensagem: "usuario",
      mensagem: data.mensagem,
    });

    // Fetch conversation history
    const { data: history } = await supabase
      .from("conversas")
      .select("tipo_mensagem, mensagem")
      .eq("thread_id", data.threadId)
      .order("criado_em", { ascending: true })
      .limit(30);

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...(history ?? []).map((m) => ({
        role: m.tipo_mensagem === "usuario" ? "user" : "assistant",
        content: m.mensagem,
      })),
    ];

    const result = await callGateway(messages, tools);
    const choice = result.choices?.[0]?.message;
    let respostaTexto: string = choice?.content ?? "";
    let transacaoCriada: any = null;

    const toolCall = choice?.tool_calls?.[0];
    if (toolCall && toolCall.function?.name === "registrar_transacao") {
      try {
        const args = JSON.parse(toolCall.function.arguments || "{}");
        const { data: novaTrans, error } = await supabase
          .from("transacoes")
          .insert({
            usuario_id: userId,
            tipo: args.tipo,
            valor: Number(args.valor),
            categoria: args.categoria,
            descricao: args.descricao ?? "",
            data_transacao: args.data_transacao ?? new Date().toISOString().slice(0, 10),
            origem_registro: "chat",
            confianca_ia: args.confianca ?? null,
          })
          .select()
          .single();
        if (error) throw error;
        transacaoCriada = novaTrans;
        const emoji = args.tipo === "receita" ? "💚" : "✅";
        respostaTexto =
          respostaTexto ||
          `${emoji} Registrei sua ${args.tipo} de R$ ${Number(args.valor).toFixed(2).replace(".", ",")} em ${args.categoria}${args.descricao ? ` (${args.descricao})` : ""}.`;
      } catch (e) {
        respostaTexto = respostaTexto || "Não consegui registrar a transação. Pode me dar mais detalhes?";
      }
    }

    if (!respostaTexto) respostaTexto = "Pode me contar um pouco mais sobre essa movimentação?";

    await supabase.from("conversas").insert({
      thread_id: data.threadId,
      usuario_id: userId,
      tipo_mensagem: "assistente",
      mensagem: respostaTexto,
      dados_extraidos: transacaoCriada ? (transacaoCriada as any) : null,
    });

    // Touch thread updated_at + set title if first message
    const { data: thread } = await supabase
      .from("conversation_threads")
      .select("titulo")
      .eq("id", data.threadId)
      .single();
    const patch: any = { atualizado_em: new Date().toISOString() };
    if (thread?.titulo === "Nova conversa") {
      patch.titulo = data.mensagem.slice(0, 40);
    }
    await supabase.from("conversation_threads").update(patch).eq("id", data.threadId);

    return { resposta: respostaTexto, transacao: transacaoCriada };
  });

export const gerarRecomendacoes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: transacoes } = await supabase
      .from("transacoes")
      .select("tipo, valor, categoria, data_transacao")
      .eq("usuario_id", userId)
      .order("data_transacao", { ascending: false })
      .limit(200);
    const { data: metas } = await supabase
      .from("metas_financeiras")
      .select("nome, valor_objetivo, valor_atual, prazo, status")
      .eq("usuario_id", userId);

    if (!transacoes || transacoes.length === 0) {
      return { recomendacoes: ["Registre suas primeiras movimentações no chat para receber recomendações personalizadas."] };
    }

    const prompt = `Analise os dados financeiros do usuário e gere 3 a 5 recomendações práticas e curtas em português.
Use APENAS os dados fornecidos. Nunca invente números.
Cada recomendação em uma linha, começando com "- ".

Transações (JSON): ${JSON.stringify(transacoes)}
Metas (JSON): ${JSON.stringify(metas ?? [])}`;

    const result = await callGateway([
      { role: "system", content: "Você é um analista financeiro objetivo." },
      { role: "user", content: prompt },
    ]);
    const texto = result.choices?.[0]?.message?.content ?? "";
    const recs = texto
      .split("\n")
      .map((l: string) => l.replace(/^\s*[-*•]\s*/, "").trim())
      .filter((l: string) => l.length > 5);
    return { recomendacoes: recs.length ? recs : [texto] };
  });