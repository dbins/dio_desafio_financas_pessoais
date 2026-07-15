
-- Enums
CREATE TYPE public.objetivo_financeiro AS ENUM ('economizar', 'controlar_gastos', 'sair_das_dividas', 'guardar_dinheiro', 'outro');
CREATE TYPE public.tipo_transacao AS ENUM ('receita', 'despesa');
CREATE TYPE public.origem_registro AS ENUM ('chat', 'manual');
CREATE TYPE public.status_meta AS ENUM ('ativa', 'concluida', 'cancelada');
CREATE TYPE public.tipo_mensagem AS ENUM ('usuario', 'assistente');

-- updated_at helper
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN NEW.atualizado_em = now(); RETURN NEW; END;
$$;

-- profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL,
  objetivo_financeiro public.objetivo_financeiro,
  onboarding_completo BOOLEAN NOT NULL DEFAULT false,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON public.profiles FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- transacoes
CREATE TABLE public.transacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo public.tipo_transacao NOT NULL,
  valor NUMERIC(14,2) NOT NULL CHECK (valor > 0),
  categoria TEXT NOT NULL,
  descricao TEXT NOT NULL DEFAULT '',
  data_transacao DATE NOT NULL DEFAULT CURRENT_DATE,
  origem_registro public.origem_registro NOT NULL DEFAULT 'manual',
  confianca_ia NUMERIC(5,2),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transacoes TO authenticated;
GRANT ALL ON public.transacoes TO service_role;
ALTER TABLE public.transacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own transacoes" ON public.transacoes FOR ALL USING (auth.uid() = usuario_id) WITH CHECK (auth.uid() = usuario_id);
CREATE INDEX idx_transacoes_usuario_data ON public.transacoes (usuario_id, data_transacao DESC);
CREATE TRIGGER trg_transacoes_updated BEFORE UPDATE ON public.transacoes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- metas_financeiras
CREATE TABLE public.metas_financeiras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  valor_objetivo NUMERIC(14,2) NOT NULL CHECK (valor_objetivo > 0),
  valor_atual NUMERIC(14,2) NOT NULL DEFAULT 0,
  prazo DATE,
  status public.status_meta NOT NULL DEFAULT 'ativa',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.metas_financeiras TO authenticated;
GRANT ALL ON public.metas_financeiras TO service_role;
ALTER TABLE public.metas_financeiras ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own metas" ON public.metas_financeiras FOR ALL USING (auth.uid() = usuario_id) WITH CHECK (auth.uid() = usuario_id);
CREATE TRIGGER trg_metas_updated BEFORE UPDATE ON public.metas_financeiras FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- conversation_threads
CREATE TABLE public.conversation_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL DEFAULT 'Nova conversa',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversation_threads TO authenticated;
GRANT ALL ON public.conversation_threads TO service_role;
ALTER TABLE public.conversation_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own threads" ON public.conversation_threads FOR ALL USING (auth.uid() = usuario_id) WITH CHECK (auth.uid() = usuario_id);
CREATE INDEX idx_threads_usuario_updated ON public.conversation_threads (usuario_id, atualizado_em DESC);
CREATE TRIGGER trg_threads_updated BEFORE UPDATE ON public.conversation_threads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- conversas (messages)
CREATE TABLE public.conversas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.conversation_threads(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo_mensagem public.tipo_mensagem NOT NULL,
  mensagem TEXT NOT NULL,
  dados_extraidos JSONB,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversas TO authenticated;
GRANT ALL ON public.conversas TO service_role;
ALTER TABLE public.conversas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own mensagens" ON public.conversas FOR ALL USING (auth.uid() = usuario_id) WITH CHECK (auth.uid() = usuario_id);
CREATE INDEX idx_conversas_thread ON public.conversas (thread_id, criado_em ASC);
