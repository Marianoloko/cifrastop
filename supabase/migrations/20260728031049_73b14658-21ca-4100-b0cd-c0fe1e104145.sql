CREATE TABLE public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  price_label text NOT NULL DEFAULT '',
  period_label text NOT NULL DEFAULT '',
  duration_days integer NOT NULL DEFAULT 30,
  badge text,
  featured boolean NOT NULL DEFAULT false,
  whatsapp_message text NOT NULL DEFAULT '',
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  rules jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.plans TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plans TO authenticated;
GRANT ALL ON public.plans TO service_role;

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "plans_public_read" ON public.plans FOR SELECT TO anon, authenticated USING (active = true);
CREATE POLICY "plans_admin_read" ON public.plans FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "plans_admin_insert" ON public.plans FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "plans_admin_update" ON public.plans FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "plans_admin_delete" ON public.plans FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER plans_set_updated_at BEFORE UPDATE ON public.plans FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Admins podem consultar perfis e gerenciar assinaturas pelo painel
CREATE POLICY "admin_profiles_select" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_subscriptions_select" ON public.subscriptions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_subscriptions_insert" ON public.subscriptions FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_subscriptions_update" ON public.subscriptions FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
GRANT INSERT, UPDATE ON public.subscriptions TO authenticated;

INSERT INTO public.plans (name, description, price_label, period_label, duration_days, badge, featured, whatsapp_message, features, rules, sort_order) VALUES
('Plano Mensal', 'Acesso completo a todas as ferramentas por 30 dias.', 'R$ 15,00', 'por mês', 30, 'Popular', false, 'Olá! Gostaria de assinar o Plano Mensal de R$ 15,00 no CifraStop.', '["Acesso a cifras ilimitadas","Afinador e Metrônomo integrados","Gravador e Repertório"]'::jsonb, '{"limite_musicas":"ilimitado","minutos_gravacao":120}'::jsonb, 1),
('Plano Personalizado', 'Pacotes flexíveis para quem estuda música regularmente.', 'Sob Consulta', '3 a 6 meses', 90, 'Flexível', false, 'Olá! Tenho interesse em um Plano Personalizado no CifraStop. Pode me passar um orçamento?', '["Duração sob medida","Suporte direto no WhatsApp","Todos os recursos liberados"]'::jsonb, '{"limite_musicas":"ilimitado"}'::jsonb, 2),
('Plano Anual', 'Melhor custo-benefício! Economia garantida para o ano todo.', 'R$ 120,00', 'por ano', 365, 'Melhor Valor', true, 'Olá! Gostaria de aproveitar a promoção e assinar o Plano Anual de R$ 120,00 no CifraStop.', '["Acesso a cifras ilimitadas","Afinador e Metrônomo integrados","Gravador e Repertório","2 meses grátis"]'::jsonb, '{"limite_musicas":"ilimitado","minutos_gravacao":600}'::jsonb, 3);