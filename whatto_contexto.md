# What to — Documento de Contexto
# Cola este documento no início de uma nova conversa para continuar o projecto

---

## O PROJECTO

**Nome:** What to  
**Tagline:** decide less. live more.  
**Tipo:** App mobile web de sugestões de entretenimento e actividades  
**Target:** Casais e grupos de amigos  
**Localização do código:** `C:\Users\USER\whatto\whatto-app\`  
**Dev server:** `http://localhost:5173`  
**Stack:** React + TypeScript + Vite  
**Último commit conhecido:** após super pack de polimento + Para ti + Supabase setup

---

## IDENTIDADE VISUAL

- **Background:** `#0B0D12`
- **Gold accent:** `#C89B3C` / `#a87535`
- **Tipografia:** Cormorant Garamond (headings, italic) + Outfit (body)
- **Estilo:** dark, cinematic, grain texture, luxury
- **CSS vars principais:** `--ac` (gold), `--bg`, `--tx`, `--mu`, `--rd`, `--gn`

---

## STACK TÉCNICA

```
Frontend:     React + TypeScript + Vite
Styling:      CSS puro (index.css + App.css)
State:        localStorage (store/index.ts) + sincronização Supabase
Database:     Supabase (PostgreSQL)
Auth:         Supabase Auth (Google OAuth + email/password)
APIs externas:
  - TMDB (filmes/séries) — VITE_TMDB_KEY
  - RAWG (jogos) — VITE_RAWG_KEY=8d32ce62092044fb8aa8402b2dc7763b
  - YouTube Data API (aprender) — VITE_YOUTUBE_KEY=AIzaSyCKby0ZZRsluu1cRCWBYxUlVBJAfzrWZKE
  - Foursquare (locais) — VITE_FOURSQUARE_KEY=EOYZFOMKIJLFV2YNFCIJ22LCFZRWJSHZJA1TFEQNU0WDHGFG
  - Google Books — VITE_GOOGLE_BOOKS_KEY (mesma que YouTube)
  - Deezer (música) — sem chave, API pública
  - MealDB (receitas) — sem chave, API pública
  - OpenLibrary (livros) — sem chave, API pública
  - Supabase — VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
```

---

## CATEGORIAS

```
watch  → Ver       (filmes, séries, documentários) — TMDB Discover
eat    → Comer     (receitas, restaurantes) — MealDB
read   → Ler       (livros, artigos) — Google Books
listen → Ouvir     (música, podcasts) — Deezer
play   → Jogar     (videojogos, tabuleiro) — RAWG
learn  → Aprender  (vídeos educativos) — YouTube
visit  → Visitar   (locais, experiências) — Foursquare + GPS
do     → Fazer     (actividades, experiências) — conteúdo editorial
```

---

## ECRÃS EXISTENTES

```
Onboard         — registo inicial de nome + plataformas
Home            — hero "Para ti", explorer grid 4×2, surpreende-me, match card
ForYou          — carrossel Netflix de 10 sugestões personalizadas (sem questionário)
Suggest         — sugestões por categoria com questionário de mood check
Checklist       — histórico de actividades
ListsScreen     — listas pessoais criadas pelo utilizador
Match           — modo de votação em grupo
Wishlist        — lista de desejos (legacy)
Profile         — perfil, plataformas, preferências permanentes, localização GPS
Friends         — ecrã de amigos (mock)
FeedSocial      — feed social (mock)
AuthScreen      — login/registo (Google + email)
```

---

## PAINÉIS / OVERLAYS

```
ReactPanel      — acções após aceitar sugestão (agora/mais tarde/calendar)
WhyPanel        — razões para recusar (com ícones SVG Feather)
AddToListPanel  — adicionar sugestão a uma lista
RecipePanel     — ver receita completa com ingredientes e passos
EatOnboard      — mood check para Comer (adaptativo: casa vs sair)
WatchOnboard    — mood check para Ver (tipo, género, duração, origem, língua, rating)
ListenOnboard   — mood check para Ouvir
ReadOnboard     — mood check para Ler
PlayOnboard     — mood check para Jogar
LearnOnboard    — mood check para Aprender
VisitOnboard    — mood check para Visitar
DoOnboard       — mood check para Fazer
ConfirmModal    — modal de confirmação elegante (substitui confirm() nativo)
```

---

## BARRA INFERIOR (6 tabs)

```
Início | Histórico | Lista | Amigos | Match | Perfil
```

---

## STORE (src/store/index.ts)

Todos os dados em localStorage com chaves `wt6_*`:

```
profile         — nome, plataformas, localização, onboarded
history         — histórico de sugestões aceites
tracking        — "a acompanhar" (watching, paused, done, dropped, want)
prefs           — preferências dinâmicas por categoria
disliked        — títulos recusados
schedules       — agendamentos
wishlist        — lista de desejos (legacy)
userLists       — listas pessoais com itens
eatPrefs        — preferências de Comer
watchPrefs      — preferências de Ver
listenPrefs     — preferências de Ouvir
readPrefs       — preferências de Ler
playPrefs       — preferências de Jogar
learnPrefs      — preferências de Aprender
visitPrefs      — preferências de Visitar
doPrefs         — preferências de Fazer
permanentPrefs  — alergias, língua preferida (guardadas para sempre)
```

---

## SUPABASE — TABELAS CRIADAS

```sql
profiles          — id, name, platforms, blocked_platforms, location
category_prefs    — user_id, category, prefs (jsonb)
history           — user_id, cat_id, title, emoji, cat, date, type, genre, action
tracking          — user_id, key, data (jsonb)
user_lists        — user_id, name, emoji, created_at
list_items        — list_id, user_id, title, emoji, cat_id, cat, type, added_at
```

Row Level Security activo em todas as tabelas.
Trigger automático cria perfil quando utilizador se regista.

---

## SUPABASE — AUTH CONFIGURADO

- Google OAuth: Client ID + Secret configurados
- Email/password: activo
- Facebook/Instagram: pendente (só funciona após deploy Vercel)

---

## FICHEIROS PRINCIPAIS

```
src/App.tsx                           — componente raiz, navegação, estado global
src/store/index.ts                    — store com localStorage
src/types/index.ts                    — todos os tipos TypeScript
src/data/index.ts                     — dados mock, CATS, WHY_EXTRA, GENRES
src/index.css                         — todos os estilos
src/lib/supabase.ts                   — cliente Supabase
src/services/auth.ts                  — login/logout/Google
src/services/sync.ts                  — sincronização localStorage ↔ Supabase
src/services/tmdb.ts                  — TMDB fetch + discoverTMDB
src/services/mealdb.ts                — MealDB fetch + discoverMeals
src/services/rawg.ts                  — RAWG discover
src/services/youtube.ts               — YouTube discover
src/services/deezer.ts                — Deezer discover
src/services/foursquare.ts            — Foursquare discover (GPS)
src/services/googleBooks.ts           — Google Books discover
src/services/openLibrary.ts           — OpenLibrary capas + Steam URLs
```

---

## O QUE ESTÁ PENDENTE DE EXECUTAR

**Prompt pendente:** `whatto_supabase_prompt.md`
- Instalar @supabase/supabase-js
- Criar src/lib/supabase.ts
- Criar src/services/auth.ts
- Criar src/services/sync.ts
- Criar AuthScreen.tsx
- Integrar auth + sync no App.tsx
- Fix: barra inferior no Suggest
- Fix: AddToList guarda item correcto
- Fix: ForYou carrossel automático + sem botões extra

---

## O QUE FALTA FAZER (por ordem de prioridade)

### Imediato (após Supabase)
1. Deploy Vercel — URL público
2. PWA — instalar no telemóvel como app nativa
3. Facebook/Instagram login (só após deploy)

### Sistema de Influencers (próxima grande feature)
Ver secção detalhada abaixo.

### Polish restante
- Consistência tipográfica (Metrics, Wishlist, Friends)
- ReactPanel com imagem real do item da API
- Histórico de recusas por sessão

### Conteúdo
- Mais dados para Ouvir (5 itens) e Aprender (4 itens)
- Spoonacular para receitas melhores

### Produto
- Match online real (Supabase Realtime)
- "Plano da noite" — sequência automática após match
- Partilha de plano — imagem bonita

---

## SISTEMA DE INFLUENCERS — DECISÕES TOMADAS

### Conceito
Influencers do Instagram/TikTok com audiência relevante fazem curadoria de sugestões dentro da app. Modelo de negócio baseado em tiers pagos.

### Tipos de sugestão (visual distinto)
```
"What to sugere"          — sugestão nativa da app, sem badge
"@xxxx sugere"            — badge padrão do influencer
Badge Silver              — mais visibilidade
Badge Gold                — máxima visibilidade + prioritário no "Para ti" (pago)
```

### Acções num card de influencer
```
→ Aceitar sugestão → fluxo normal (Ver/Comer/Ler etc)
→ Abrir post original na plataforma do influencer
```

### Monetização por tiers
```
Base (gratuito)   — aparece nas sugestões, badge padrão
Silver (pago)     — mais visibilidade, badge prateado
Gold (pago)       — máxima visibilidade, badge dourado, prioritário
```
Pagamento: mensal ou anual (com desconto).

### Acesso ao painel de influencer
```
Login bifurcado na app:
  → Utilizador normal
  → Influencer (com código de convite ou candidatura)

Código de convite: gerado manualmente por nós, enviado ao influencer.
Na primeira entrada com código, tudo pré-preenchido por nós.

Candidatura: formulário simples dentro da app para quem quer aplicar.
Aprovação manual por nós no início.
```

### Painel do influencer (dentro da app, funciona em web e mobile)
```
- Perfil editável (foto, bio, links sociais)
- Adicionar/editar/remover sugestões curadas
- Ver métricas (visualizações, aceitações, cliques)
- Gerir subscrição/tier
```

### Perfil público do influencer (na app do utilizador)
```
- Pop-up/página com foto, nome, bio
- Link para perfil na plataforma (Instagram/TikTok)
- Botão "Seguir na app"
- Lista das suas sugestões
```

### Seguir influencers
```
- Por base: utilizador vê sugestões de TODOS os influencers
- Seguir: sugestões desse influencer aparecem mais frequentes e com prioridade
- Bloquear: opção de não receber sugestões de um influencer específico
```

### Algoritmo de sugestões (tudo interligado)
```
Pool =
  sugestões nativas app
  + sugestões influencers seguidos (boost de prioridade)
  + sugestões influencers não seguidos (prioridade base)
  - sugestões influencers bloqueados
  - sugestões de categorias/géneros recusados pelo utilizador
  - sugestões já vistas

Ordenação:
  1. Match com preferências do utilizador (mood check + histórico de recusas/aprovações)
  2. Tier do influencer (Gold > Silver > Base)
  3. Se segue o influencer → boost adicional
  4. Recência da sugestão
```

### Comentário/reacção a sugestão de influencer
```
- Utilizador pode comentar
- Comentário aparece na plataforma do influencer com texto gerado pela app
  (ex: "Via What to app — [comentário]")
```

### Tabelas Supabase a criar
```sql
influencers           — id, user_id, name, handle, bio, photo_url, platform, 
                        tier, invite_code, status (pending/active), created_at
influencer_suggestions — id, influencer_id, title, desc, emoji, cat_id, 
                         platform_url, post_url, created_at, active
user_follows          — user_id, influencer_id, created_at
user_blocks           — user_id, influencer_id, created_at
suggestion_metrics    — suggestion_id, views, accepts, clicks, date
```

---

## REGRAS DE TRABALHO (IMPORTANTE)

1. **Nunca gerar prompt sem confirmar primeiro** — sempre discutir e pedir confirmação
2. **Sempre fazer backup antes de editar** — `cp ficheiro ficheiro.bak`
3. **Sempre ler o ficheiro completo antes de editar** — nunca assumir nomes de classes
4. **tsc após cada parte** — `npx tsc --noEmit` zero erros antes de avançar
5. **Uma parte de cada vez** — não saltar partes
6. **No final de cada prompt executado pelo Claude Code:** `echo "TUDO PRONTO"`
7. **Nunca assumir que algo está feito** — sempre confirmar com ficheiros reais
