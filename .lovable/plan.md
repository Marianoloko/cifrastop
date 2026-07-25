## Escopo

1. **Backend (Lovable Cloud)** — ativar Cloud, criar tabelas e políticas.
2. **Autenticação** — cadastro/login com email+senha+telefone e Google.
3. **Trial de 2h corridas** — banner com contagem regressiva no topo.
4. **Paywall** — bloqueio ao expirar, com botão de assinar R$ 15/mês.
5. **Pagamento Stripe** — PIX + cartão, assinatura mensal recorrente.
6. **Migração de dados** — repertório sai do localStorage e vai pra nuvem.
7. **Modo escuro** — toggle no header.

## Passos

### 1. Cloud + esquema
- Ativar Lovable Cloud.
- Tabelas:
  - `profiles` (id, phone, trial_started_at, created_at) — auto-criada por trigger no signup.
  - `songs` (id, user_id, title, artist, key, capo, body, created_at) — RLS por dono.
  - `subscriptions` (user_id, status, current_period_end, stripe_customer_id, stripe_subscription_id).
  - `user_roles` (separada, com enum `app_role` e função `has_role`).
- RLS: cada usuário só lê/edita suas próprias linhas.

### 2. Auth
- Rota pública `/auth` com tabs "Entrar" / "Criar conta".
- Formulário de cadastro: email, senha, telefone/WhatsApp.
- Botão principal: **"Criar Conta e Testar Grátis por 2 Horas"**.
- Login com Google (via `supabase--configure_social_auth`).
- Após signup: trigger salva `trial_started_at = now()` no profile.
- Rota `/reset-password` para recuperação por email.

### 3. Trial + Paywall
- Hook `useAccessStatus()` calcula: `assinante ativo` | `trial ativo (Xh Ym restantes)` | `expirado`.
- Banner fixo no topo do app quando em trial: "⏰ Teste grátis: 1h 23m restantes • Assinar".
- Quando expira sem assinatura: tela `Paywall` cobre tudo, botão "Assinar R$ 15/mês".
- Assinantes ativos: sem banner, acesso pleno.

### 4. Stripe
- Ativar `enable_stripe_payments` (built-in, sem chaves manuais).
- Criar produto único: "CifraVocal Pro — Mensal R$ 15,00" recorrente.
- Server function `create-checkout` cria sessão Stripe (PIX + cartão habilitados).
- Server route `/api/public/webhooks/stripe` recebe eventos e atualiza `subscriptions`.
- Página `/success` após pagamento.

### 5. Migração do repertório
- Trocar `useSongs` do localStorage por consultas Supabase (TanStack Query).
- Primeiro login: se houver dados no localStorage, oferecer "Importar repertório antigo" (opt-in).
- Todas as músicas passam a ter `user_id`.

### 6. Modo escuro
- Toggle no header (ícone sol/lua).
- Estado persistido em localStorage.
- Adicionar variantes `.dark` no `styles.css` mantendo a paleta creme/âmbar (versão escura harmônica: fundos grafite, âmbar preservado como acento).

### 7. Estrutura de rotas
```
/                      → app (protegido, trial ou assinante)
/auth                  → cadastro/login público
/reset-password        → redefinir senha
/success               → confirmação pós-checkout
```
`/` fica sob layout `_authenticated` (redireciona pra `/auth` se deslogado). O paywall aparece dentro de `/` quando o trial expira sem assinatura.

## Detalhes técnicos

- **Google OAuth**: usa broker do Lovable (`lovable.auth.signInWithOAuth("google", ...)`) com popup — funciona no preview do editor.
- **Stripe recorrente**: modo `subscription`, moeda BRL, métodos `["card", "pix"]`.
- **Webhook**: verifica assinatura Stripe, atualiza `subscriptions.status` em `active|past_due|canceled`.
- **`trial_started_at`**: fonte da verdade é o servidor; frontend só formata o countdown a cada segundo.
- **Trial não pausa** — 2h corridas conforme você pediu.
- **Preço R$ 15,00** — cobrado como 1500 centavos, `interval: month`.

## Pré-requisitos que dependem de você

1. **Plano Pro do Lovable** — pagamentos só ativam com Pro. Se sua conta não tiver, o `enable_stripe_payments` falha e eu paro nesse ponto pra você fazer upgrade.
2. **Ativar PIX no Stripe** — após ativar, PIX precisa ser habilitado no dashboard Stripe (leva ~1 min). Vou te instruir quando chegar lá.
3. **Configurar Google OAuth** — chamo `supabase--configure_social_auth` automaticamente; não requer ação sua.

## Ordem de execução

1. Ativar Cloud + migrations (schema + trigger de profile).
2. Configurar Google auth.
3. Rota `/auth`, `/reset-password`, layout `_authenticated`.
4. Migrar `useSongs` para Supabase + botão de importar do localStorage.
5. Modo escuro (rápido, feito em paralelo).
6. Ativar Stripe payments + criar produto R$ 15/mês.
7. Checkout server function + webhook + tabela `subscriptions`.
8. Hook `useAccessStatus`, banner de countdown, tela de paywall.
9. Publicar e testar fluxo completo.

Aprova pra eu começar?