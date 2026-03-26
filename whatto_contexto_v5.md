# What to — Documento de Contexto V5
# Cola este documento no início de uma nova conversa para continuar o projecto
# Junta ao V4 — este documento cobre apenas o que foi feito nesta sessão

---

## ESTADO ACTUAL DA APP

**App online:** https://what-to-zdka.vercel.app
**Repositório:** github.com/Navidkya/What-to (branch main)
**Último commit conhecido:** V21 — 5 novas APIs + TMDB underground + YouTube melhorado
**Versão actual na app:** V21

**ATENÇÃO:** Os prompts I (V22), J (V23) foram escritos mas ainda NÃO foram executados.
Antes de qualquer nova feature, executar estes dois prompts por ordem.

---

## REGRAS DE TRABALHO (ACTUALIZADAS)

1. NUNCA gerar prompt sem confirmar primeiro
2. NUNCA assumir que algo funciona — sempre verificar com ficheiros reais
3. SEMPRE pedir os ficheiros actuais antes de escrever qualquer prompt
4. SEMPRE indicar o caminho completo dos ficheiros pedidos
5. Uma coisa de cada vez
6. Prompts são para o Claude Code — não editar ficheiros manualmente
7. Git push = deploy automático Vercel (1-2 min)
8. tsc --noEmit zero erros + npm run build antes de cada commit
9. Versão incrementa a cada prompt — aparece no ecrã de login E loading (src/version.ts)
10. No final de cada prompt executado: Claude Code imprime a versão no terminal

---

## O QUE FOI FEITO NESTA SESSÃO (por ordem de versão)

### V14 — Animação pan mais rápido + fade in mais espaçado
- Pan da imagem: 8s → 4s
- Fade in elementos: delays mais espaçados com cubic-bezier iOS/Netflix
- título (0.2s) → tags (0.55s) → descrição (0.9s) → resto (1.2s)

### V15 — Métricas completas + dashboard AdminPanel + credenciais seguras
- analytics.ts reescrito com novos eventos e device info
- Novos eventos: session_start, session_end, screen_view, influencer_view, influencer_accept, wrapped_shared, tracking_update, series_finished, plan_shared
- Tabela user_sessions criada no Supabase
- AdminPanel reescrito com tab Métricas: utilizadores activos, categorias, taxa aceitação, horas pico, top sugestões, dispositivos, funil, influencers
- Credenciais admin movidas para VITE_ADMIN_USER e VITE_ADMIN_PASS no Vercel
- NOTA: value chega NULL em muitos eventos — corrigido no V19

### V16 — Wrapped partilhável
- Componente WrappedGenerator.tsx criado
- Modos: plan (plano de noite), series (série acabada), monthly (resumo mensal), annual (resumo anual)
- Usa html2canvas para gerar imagem
- Card dark/gold com grain texture, glow, branding What to
- Botão Partilhar via Web Share API, fallback download
- PlanScreen integrado com botão Partilhar → abre Wrapped
- App.tsx tem funções openMonthlyWrapped e openAnnualWrapped
- Estrutura preparada para adicionar novos modos facilmente

### V17 — Amigos funcionais
- Tabela friendships criada no Supabase
- services/friends.ts criado com: searchUsers, sendFriendRequest, acceptFriendRequest, rejectFriendRequest, removeFriend, loadFriends, loadPendingRequests, getFriendshipStatus
- Friends.tsx reescrito com 3 tabs: Os meus amigos / Adicionar / Pedidos
- Badge no tab Amigos para pedidos pendentes
- Pop-up ao clicar num amigo

### V18 — Username + QR code + link de convite + perfil público
- Coluna username adicionada à tabela profiles no Supabase
- services/username.ts criado: suggestUsername, validateUsername, checkUsernameAvailable, saveUsername, getProfileByUsername
- Onboarding: novo step de username (step 1) com verificação de unicidade em tempo real
- Profile: secção "Perfil público" com username editável, QR code (qrcode.react), botão Partilhar link
- Friends: pesquisa por @username
- App.tsx: trata link de convite (?add=username) ao abrir a app

### V19 — Métricas corrigidas + dashboard rico + pesquisa amigos melhorada + convidar
- analytics.ts: value deixa de chegar NULL — enriquece sempre com hour_of_day, day_of_week, month
- Novos tipos de evento: friend_request_sent, friend_request_accepted, friend_invite_shared, card_view, profile_view
- AdminPanel: funil de conversão (abriu → inquérito → aceitou) + tabela utilizadores recentes com nome, @username, eventos, última actividade
- Friends: pesquisa por nome E username em simultâneo
- Botão "Convidar amigo para a app" no ecrã de Amigos

### V20 — Mensagens entre amigos
- Tabelas conversations e messages criadas no Supabase
- Supabase Realtime activado para messages
- services/messages.ts criado com: getOrCreateConversation, loadConversations, loadMessages, sendMessage, sendSuggestion, markAsRead, getTotalUnread
- MessagesScreen.tsx criado: inbox + conversa em tempo real + cards de sugestões partilhadas
- Friends.tsx: botão "Enviar mensagem" no pop-up do amigo
- Badge no tab Amigos soma pedidos pendentes + mensagens não lidas
- Sugestões partilháveis dentro das conversas (pendingSuggestion prop)

### V21 — 5 novas APIs + TMDB underground + YouTube melhorado
- services/igdb.ts: IGDB via Twitch OAuth, jogos mainstream/indie/underground
- services/lastfm.ts: Last.fm, álbuns + tracks por tag, underground
- services/itunes.ts: iTunes Search API, músicas/álbuns/podcasts sem chave
- services/openLibraryDiscover.ts: OpenLibrary subjects por género
- services/eventbrite.ts: eventos locais por coordenadas
- tmdb.ts: discoverTMDBUnderground + discoverTMDBWorldCinema (cinema mundial em 10 línguas)
- youtube.ts: 8 queries paralelas, maxResults 50, deduplicação
- Suggest.tsx: PLAY (RAWG+IGDB), LISTEN (iTunes+Last.fm), READ (Books+OpenLibrary), VISIT (FSQ+Eventbrite), WATCH (TMDB+underground+worldCinema)

---

## PROMPTS ESCRITOS MAS AINDA NÃO EXECUTADOS

### Prompt I (V22) — Sistema de cache no Supabase
**Ficheiro:** whatto_promptI_v22_cache.md
**O que faz:**
- Tabela suggestions_cache no Supabase (SQL já executado)
- services/suggestionCache.ts: loadCachedSuggestions, getCacheCount, getLastCacheUpdate
- Suggest.tsx: usa cache quando tem 50+ itens, senão vai às APIs
- Pool: 70% mainstream + 20% underground + 10% random

**IMPORTANTE:** SQL da tabela suggestions_cache JÁ FOI executado no Supabase.
Só falta executar o prompt no Claude Code.

### Prompt J (V23) — GitHub Actions cron
**Ficheiro:** whatto_promptJ_v23_cache_cron.md
**O que faz:**
- scripts/refresh-cache.mjs: script Node.js que popula o cache
- .github/workflows/cache-refresh.yml: cron às 3h todos os dias
- Popula: WATCH (TMDB ~600 itens), PLAY (RAWG+IGDB ~600), LISTEN (Last.fm+iTunes ~1000), READ (Books+OpenLibrary ~600), LEARN (YouTube ~500)
- Total estimado: 3000-5000 itens por run, cresce diariamente

**ANTES DE EXECUTAR:** Adicionar secrets no GitHub:
- SUPABASE_URL, SUPABASE_SERVICE_KEY (service_role key do Supabase)
- TMDB_KEY, RAWG_KEY, YOUTUBE_KEY
- IGDB_CLIENT_ID, IGDB_CLIENT_SECRET
- LASTFM_KEY, EVENTBRITE_TOKEN

---

## CHAVES API ACTUAIS

```
TMDB:           VITE_TMDB_KEY (já no Vercel)
RAWG:           8d32ce62092044fb8aa8402b2dc7763b
YouTube:        AIzaSyCKby0ZZRsluu1cRCWBYxUlVBJAfzrWZKE
Foursquare:     EOYZFOMKIJLFV2YNFCIJ22LCFZRWJSHZJA1TFEQNU0WDHGFG
Google Books:   mesma que YouTube
Supabase:       VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
IGDB Client ID: cbwu9iiw2lydihhzlpt5c9ii9u6k8e
IGDB Secret:    1lviaml8xjhx03t9r4p3vw4i389qdf
Last.fm:        66b467374a386ed1989375540704c27c
Eventbrite:     SFUZ5WNHUMGQHNN6YKZ5
iTunes:         sem chave
OpenLibrary:    sem chave
Admin user:     VITE_ADMIN_USER (no Vercel)
Admin pass:     VITE_ADMIN_PASS (no Vercel)
```

---

## TABELAS SUPABASE CRIADAS NESTA SESSÃO

```sql
user_sessions       — sessões com duração, dispositivo, OS (V15)
friendships         — pedidos de amizade e estado (V17)
profiles.username   — coluna adicionada (V18)
conversations       — conversas entre utilizadores (V20)
messages            — mensagens individuais com Realtime (V20)
suggestions_cache   — cache de sugestões de todas as APIs (SQL executado, aguarda V22)
```

---

## FICHEIROS PRINCIPAIS CRIADOS/ALTERADOS NESTA SESSÃO

```
src/version.ts                                    — V21
src/services/analytics.ts                         — reescrito V15
src/services/friends.ts                           — novo V17
src/services/username.ts                          — novo V18
src/services/messages.ts                          — novo V20
src/services/igdb.ts                              — novo V21
src/services/lastfm.ts                            — novo V21
src/services/itunes.ts                            — novo V21
src/services/openLibraryDiscover.ts               — novo V21
src/services/eventbrite.ts                        — novo V21
src/services/suggestionCache.ts                   — escrito, aguarda V22
src/services/tmdb.ts                              — melhorado V21
src/services/youtube.ts                           — melhorado V21
src/components/screens/Friends.tsx                — reescrito V17→V18→V19
src/components/screens/MessagesScreen.tsx         — novo V20
src/components/screens/AdminPanel.tsx             — reescrito V15→V19
src/components/panels/WrappedGenerator.tsx        — novo V16
src/components/screens/Onboard.tsx                — +step username V18
src/components/screens/Profile.tsx                — +username+QR V18
src/components/screens/Suggest.tsx                — melhorado V14→V21
src/index.css                                     — animações V14
src/App.tsx                                       — múltiplas alterações
scripts/refresh-cache.mjs                         — escrito, aguarda V23
.github/workflows/cache-refresh.yml               — escrito, aguarda V23
```

---

## O QUE FALTA CONFIRMAR SE FUNCIONA (verificar antes de avançar)

1. **V17 — Amigos:** pesquisa por username funciona? pedidos enviados e recebidos?
2. **V18 — Username no onboarding:** step aparece correctamente? unicidade verifica?
3. **V18 — QR code:** aparece no Profile? link de partilha funciona?
4. **V19 — Métricas:** value já não chega NULL no Supabase?
5. **V20 — Mensagens:** inbox aparece? mensagens em tempo real funcionam?
6. **V20 — Realtime:** mensagem enviada aparece no outro dispositivo sem refresh?
7. **V21 — IGDB:** jogos indie aparecem no Jogar?
8. **V21 — iTunes:** músicas individuais aparecem no Ouvir?
9. **V21 — OpenLibrary:** livros aparecem no Ler?
10. **V21 — TMDB underground:** filmes menos conhecidos mas bem avaliados aparecem?
11. **Logout Android:** ainda pede login ao fechar e reabrir? (V13 tentou resolver, pode não estar resolvido)
12. **Sugestões infinitas:** passa de 8 cards sem parar? (V10 corrigiu, confirmar)

---

## FEATURES EM FALTA (identificadas mas não implementadas)

### Próximas a implementar
1. **Match online real** — Supabase Realtime, dois telemóveis em simultâneo, votação síncrona
2. **Filtros/questionários** — verificar se influenciam correctamente as sugestões em todas as 8 categorias
3. **Documentário e Anime** — verificar strictFilter no Suggest

### Médio prazo
4. **PlanScreen — partilha melhorada** — Wrapped do plano já existe (V16), falta polir e testar
5. **Mensagens — partilha de sugestão** — estrutura existe (pendingSuggestion), falta ligar ao botão no Suggest
6. **Perfil de amigo mais rico** — stats do amigo no pop-up (quantas actividades, categorias favoritas)

### Dependente de domínio próprio
7. **Facebook/Instagram login**
8. **Email de confirmação influencers** (via Resend)
9. **Push notifications completas**
10. **Google Play Store** → app nativa → logout Android resolvido de vez

### Quando tiver domínio (whatto.pt ou similar)
- Comprar domínio: ~12€/ano (Namecheap, GoDaddy, PTDOM)
- Ligar ao Vercel: 30 min
- Facebook/Instagram login + Resend emails: 1 sessão
- Google Play Store: 1-2 sessões + 25€ taxa + 3-7 dias revisão Google

---

## MODELO DE NEGÓCIO (decisões tomadas)

- Freemium: app gratuita para utilizadores
- B2B listings: restaurantes/parceiros pagam para aparecer em destaque
- Influencer tiers: Base (grátis), Silver (pago), Gold (pago)
- Comissão de reservas: parceiros locais pagam comissão
- Links afiliados: Prime, Steam, Amazon (para implementar)
- Target: 1000€/mês via parcerias locais + reservas

---

## SISTEMA DE INFLUENCERS (já implementado)

- Tiers: Base (3 sugestões, 7 dias), Silver (8, 30 dias), Gold (20, 90 dias)
- Fluxo: código convite → email+password+username → dashboard directo
- Admin panel: /#admin (credenciais nas env vars do Vercel)
- Badges: app normal (✦ What to), Silver (◈), Gold (✦ dourado)
- Frequência no Suggest: Gold pos 2/5/7, Silver pos 8, Base pos 14

---

## STACK TÉCNICA ACTUAL

```
Frontend:     React 19 + TypeScript + Vite 7.3
Styling:      CSS puro (index.css)
State:        localStorage (wt6_*) + Supabase sync
Database:     Supabase (PostgreSQL) + RLS
Auth:         Supabase Auth (Google OAuth + email/password)
Deploy:       Vercel (auto-deploy git push main)
PWA:          vite-plugin-pwa, skipWaiting, clientsClaim
QR Code:      qrcode.react 4.2
Wrapped:      html2canvas

APIs activas:
  TMDB, RAWG, YouTube, Foursquare, Google Books,
  MealDB, OpenLibrary (capas), Supabase,
  IGDB (Twitch), Last.fm, iTunes, OpenLibrary (discover), Eventbrite

APIs pendentes/futuras:
  Spoonacular (receitas — requer pagamento ~$10/mês)
  Google Places (restaurantes — requer cartão, $200 crédito grátis/mês)
  Facebook/Instagram (requer domínio)
```

---

## QUANDO LERES ESTE DOCUMENTO NUMA NOVA CONVERSA

Apresenta imediatamente:
1. Lista do que falta executar (Prompts I e J)
2. Lista do que falta confirmar se funciona (secção acima)
3. Pergunta qual a prioridade para esta sessão
4. Não escrever nenhum prompt sem confirmação prévia
