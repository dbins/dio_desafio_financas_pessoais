export const brl = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n || 0);

export const dateBR = (iso: string) =>
  new Date(iso + (iso.length === 10 ? "T00:00:00" : "")).toLocaleDateString("pt-BR");

export const CATEGORIAS_RECEITA = ["Salário", "Freelance", "Investimentos", "Vendas", "Outros"];
export const CATEGORIAS_DESPESA = [
  "Alimentação", "Mercado", "Transporte", "Saúde", "Educação",
  "Moradia", "Lazer", "Compras", "Assinaturas", "Contas", "Outros",
];