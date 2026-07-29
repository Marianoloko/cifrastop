## Especificação do App — CifraStop / CifraVocal Pro

Documento para você recriar o app em outra plataforma. Nada é alterado aqui; é só o "script" do funcionamento.

### 1. Conceito

App mobile-first para músicos: não é só cifra. Reúne repertório com transposição, retorno de áudio ao vivo, afinador, metrônomo e gravador. Acesso liberado por **teste grátis de 4 horas corridas** a partir do cadastro; depois disso, paywall com planos vendidos via WhatsApp.

Inspirações visuais: Cifra Club (organização do repertório) + apps de estúdio iOS (GarageBand/Voice Memos) na parte de ferramentas. Estética creme/âmbar, cantos arredondados, tipografia de sistema, cifras em fonte monoespaçada.

### 2. Paleta de cores (OKLCH, tema claro)

```text
background        oklch(0.985 0.008 90)   creme claro
foreground        oklch(0.22 0.02 60)     marrom quase preto
card              oklch(1 0 0)            branco
primary           oklch(0.72 0.16 60)     âmbar
primary-foreground oklch(1 0 0)
secondary         oklch(0.955 0.02 85)
muted             oklch(0.955 0.015 85)
muted-foreground  oklch(0.5 0.03 70)
accent            oklch(0.94 0.05 80)
destructive       oklch(0.6 0.22 27)      vermelho
border            oklch(0.9 0.02 80)
input             oklch(0.92 0.02 80)
ring              oklch(0.72 0.16 60)
amber             oklch(0.75 0.17 65)
amber-soft        oklch(0.94 0.07 80)
emerald           oklch(0.65 0.16 155)    afinado / ok
teal              oklch(0.65 0.12 200)
tom               oklch(0.62 0.19 45)     laranja-queimado (acordes, destaque)
```

Tema escuro:

```text
background  oklch(0.18 0.01 60)    grafite
foreground  oklch(0.95 0.01 80)
card        oklch(0.22 0.015 60)
primary     oklch(0.78 0.16 65)
muted-fg    oklch(0.68 0.02 70)
border      oklch(0.32 0.015 60)
amber       oklch(0.78 0.17 68)
amber-soft  oklch(0.34 0.06 70)
tom         oklch(0.72 0.18 50)
```

Raio base: `0.75rem` (cards `rounded-2xl`, botões `rounded-full` na navegação).
Fonte: stack de sistema (`-apple-system, Segoe UI, Roboto...`). Cifras/acordes: `SF Mono / Menlo / Consolas`, bold, cor `tom`.

### 3. Estrutura de telas

```text
/                 landing pública (hero, recursos, planos, botão Entrar)
/auth             cadastro e login
/reset-password   redefinir senha
/app              app protegido (requer login)
/admin            painel do dono (requer papel admin)
```

### 4. Cadastro e login

- Campos: **e-mail, senha, telefone/WhatsApp**. Nada mais.
- Botão principal: **"Criar Conta e Testar Grátis por 4 Horas"**.
- Login social com Google.
- Ao criar conta, gravar no perfil: `phone` e `trial_started_at = agora` (servidor).
- Recuperação de senha por e-mail.

### 5. Regra do teste grátis (4 horas)

- Constante: `TRIAL_MS = 4 * 60 * 60 * 1000`.
- Estado de acesso calculado assim, nesta ordem:
  1. assinatura com `status = active` → **assinante** (sem banner, acesso total);
  2. `trial_started_at + 4h > agora` → **trial**, com `remainingMs`;
  3. caso contrário → **expirado** (paywall).
- Contagem **corrida**, não pausa quando o usuário sai.
- Banner fixo no topo durante o trial: relógio, texto "Teste grátis", cronômetro `HH:MM:SS` regressivo atualizado a cada segundo, e botão "Assinar". Fundo cor `tom`, texto branco.
- O relógio é só formatação no cliente; a verdade é o `trial_started_at` no banco.

### 6. Paywall e venda por WhatsApp

Ao expirar, a tela inteira vira a grade de planos (3 cards):

| Plano | Preço | Período | Duração | Selo |
|---|---|---|---|---|
| Mensal | R$ 15,00 | por mês | 30 dias | Popular |
| Personalizado | Sob consulta | 3 a 6 meses | 90 dias | Flexível |
| Anual | R$ 120,00 | por ano | 365 dias | Melhor Valor (destaque) |

- Sem checkout automático, sem PIX na plataforma.
- Cada card tem uma mensagem própria pré-configurada e abre `https://wa.me/5598987150431?text=<mensagem>` em nova aba.
- Card em destaque: borda `primary`, leve escala maior, fundo `primary/5`, selo no canto superior direito.
- Após o pagamento, o dono libera o acesso manualmente pelo painel admin.

### 7. Funcionalidades do app (5 abas)

Navegação em pílulas horizontais roláveis, aba ativa com fundo `tom` e texto branco.

**Repertório** — lista de músicas com busca por título/artista; cadastro com título, artista, tom, capotraste e corpo da cifra; visualização com:
- transposição de tom (+/- semitons, reescrevendo os acordes do texto),
- diagramas de acorde em SVG gerados dinamicamente,
- rolagem automática com velocidade ajustável,
- Modo Palco (fonte grande, alto contraste).

**Retorno de áudio** — microfone direto no fone via Web Audio API, com ganho, reverb por convolução e delay ajustáveis. Aviso para usar fone (evita microfonia).

**Afinador** — cromático, detecção de pitch por autocorrelação, mostra nota, oitava e desvio em cents com indicador visual (verde quando afinado).

**Metrônomo** — BPM 40–240, tap tempo, compassos 2/4, 3/4, 4/4, 6/8, clique acentuado no primeiro tempo e marcação visual dos tempos.

**Gravador** — grava ensaio via MediaRecorder, reproduz e permite baixar o arquivo.

Extras globais: alternador de tema claro/escuro no cabeçalho (persistido no navegador), cabeçalho fixo com logo "CV" âmbar e botão sair.

### 8. Dados (modelo de banco)

```text
profiles       id (=usuário), phone, trial_started_at, created_at
songs          id, user_id, title, artist, key, capo, body, created_at
subscriptions  user_id, status, current_period_end, plan_id
plans          id, name, description, price_label, period_label,
               duration_days, badge, featured, whatsapp_message,
               features[], rules{}, active, sort_order
user_roles     user_id, role (admin | user)   -- tabela separada, nunca no perfil
```

Regra de segurança: cada usuário só lê/escreve as próprias linhas de `songs`, `profiles` e `subscriptions`. `plans` é leitura pública, escrita só admin. Papel de admin sempre verificado no servidor, nunca no cliente.

### 9. Painel admin

- Busca de usuário por e-mail, com liberação manual de plano (define `status = active` e `current_period_end = hoje + duration_days`).
- CRUD de planos: preço, período, duração, selo, destaque, lista de recursos e um campo de **regras em JSON** para limites por plano (ex.: `{"minutos_gravacao": 120, "limite_musicas": "ilimitado"}`).

### 10. Textos-chave

- Botão de cadastro: "Criar Conta e Testar Grátis por 4 Horas"
- Banner: "Teste grátis • 03:41:12 restantes • Assinar"
- Paywall título: "Escolha seu Plano de Acesso"
- Paywall subtítulo: "Assine diretamente pelo WhatsApp e libere seu acesso instantaneamente."
- Botão do card: "Assinar via WhatsApp"
- Rodapé: "Feito para músicos · Sincronizado na nuvem"

### Observação

A especificação acima já está com o trial em **4 horas**. O app atual está com 2 horas. Se quiser, eu ajusto o app daqui para 4 horas também — é uma constante e os textos do cadastro; diga se quer.
