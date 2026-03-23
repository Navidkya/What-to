# What to — Documento de Contexto V4
*Cola este documento no início de uma nova conversa para continuar o projecto*
*Junta ao V3 — este documento cobre apenas o que foi feito nesta sessão*

---

## ESTADO ACTUAL DA APP

**App online:** https://what-to-zdka.vercel.app
**Repositório:** github.com/Navidkya/What-to (branch main)
**Último commit conhecido:** V9 — sugestões infinitas + netflix pan effect + logout fix
**Versão actual na app:** V9 (aparece no ecrã de login e loading)

⚠️ **AVISO IMPORTANTE:** Os prompts desta sessão foram executados mas NÃO foram todos verificados a funcionar correctamente. Antes de avançar para qualquer nova feature, testar cada ponto em baixo.

---

## REGRAS DE TRABALHO (ACTUALIZADAS)

1. **NUNCA gerar prompt sem confirmar primeiro** — sempre discutir e pedir confirmação
2. **NUNCA assumir que algo funciona** — sempre verificar com ficheiros reais
3. **SEMPRE pedir os ficheiros actuais** antes de escrever qualquer prompt — nunca trabalhar com versões antigas
4. **SEMPRE indicar o caminho completo** dos ficheiros pedidos (ex: `src/components/screens/Suggest.tsx`)
5. **Uma coisa de cada vez** — quando uma funcionalidade se aplica a uma categoria, aplica-se a TODAS
6. **Perguntar sempre** se uma feature deve ser aplicada a todas as categorias ou só a uma
7. **Prompts são para o Claude Code** — não editar ficheiros manualmente
8. **Git push = deploy automático Vercel** (1-2 min). Se Vercel falhar, verificar build local
9. **tsc --noEmit zero erros + npm run build** antes de cada commit
10. **Versão incrementa a cada prompt** — V1, V2, V3... Aparece no ecrã de login E no ecrã de loading. Definida em `src/version.ts`
11. **No final de cada prompt executado:** Claude Code imprime a versão no terminal

---

## O QUE FOI FEITO NESTA SESSÃO (por ordem)

### Prompts executados:

**V1 (base anterior)** — estado inicial desta sessão

**V2** — fix logout mobile + remoção mocks feed + filtros genreIds Watch
- ⚠️ Logout ao fechar app: AINDA NÃO FUNCIONA
- ⚠️ Pull-to-refresh: AINDA NÃO FUNCIONA
- ✅ Feed: mocks de amigos removidos do FeedScreen
- ⚠️ Filtros Watch: parcialmente funciona, incompleto

**V3** — overscroll + sem mocks Friends + sidebar feed + filtros re-disparo
- ⚠️ overscroll-behavior: incerto se foi aplicado
- ⚠️ Friends.tsx: Pedro/Maria/João podem ainda aparecer — verificar
- ✅ Barra lateral de contactos no Feed: aparece (ícone visível)
- ⚠️ Filtros/questionários: AINDA NÃO FUNCIONAM correctamente

**V4** — filtros via key remount + postFilter universal + watch tipo correcto
- ✅ suggestKey implementado — Suggest remonta quando inquérito fecha
- ⚠️ postFilter: implementado mas incompleto — The Office continuava a aparecer

**V5** — tags múltiplas + filtro tipo agressivo + sugestões infinitas
- ✅ Tags múltiplas nos cards (cin-tags)
- ⚠️ Filtro tipo agressivo: parcialmente funciona
- ⚠️ Sugestões infinitas: NÃO FUNCIONA — continuam a aparecer só 6-7

**V6** — strictFilter todos os parâmetros todas as categorias
- ✅ strictFilter implementado
- ⚠️ Documentário e Anime: podem não funcionar correctamente
- ⚠️ The Office: pode continuar a aparecer com Filme seleccionado
- ⚠️ Sugestões: AINDA POUCAS

**V7** — deezer pesquisa real + watch tipo correcto + pool mínimo 20
- ✅ Deezer: pesquisa por álbuns via query em vez de artistas
- ⚠️ Pool mínimo: implementado mas pode não funcionar

**V8** — sugestões infinitas + inquéritos expandidos
- ✅ Todos os 8 Onboards reescritos com novos campos
- ✅ Múltipla selecção em todos os campos
- ✅ "Qualquer" em todos os campos (equivale a deixar em branco)
- ✅ Campos avançados recolhidos em "▼ Mais opções"
- ⚠️ Sugestões infinitas: AINDA NÃO FUNCIONA — verificar
- ⚠️ Novos tipos nos inquéritos podem ter problemas de TypeScript

**V9** — sugestões infinitas + netflix pan effect + logout fix
- ⚠️ Sugestões infinitas: loop de carga até 30 items — A VERIFICAR
- ⚠️ Ken Burns / pan effect nos cards: A VERIFICAR
- ⚠️ Logo ✦ whatto no canto inferior direito dos cards: A VERIFICAR
- ⚠️ Logout ao fechar app: A VERIFICAR
- ⚠️ Pull-to-refresh: A VERIFICAR

---

## ARQUITECTURA DO SISTEMA DE FILTROS

### Como funciona (quando está a funcionar)

1. Utilizador abre categoria → inquérito abre (`setXxxObOpen(true)`)
2. Utilizador escolhe filtros → clica "Aplicar preferências" → `done: true`
3. Onboard fecha → App.tsx chama `setSuggestKey(v => v + 1)`
4. Suggest remonta (key muda) → useEffect de discovery re-corre com prefs novas
5. API é chamada com parâmetros correctos
6. `strictFilter` filtra pós-API: remove o que não corresponde
7. Pool mínimo de 30 items garantido pelo loop de carga
8. Quando utilizador passa todos os cards → embaralha e carrega mais em background

### strictFilter (src/components/screens/Suggest.tsx)
Função universal que filtra pós-API. Recebe `StrictFilterPrefs` com campos opcionais.
Para adicionar novo parâmetro: adicionar campo em `StrictFilterPrefs` + regra na função.
Não tem condição de mínimo — se escolheste X, só aparece X.

### handleLoadMore
Carrega mais páginas quando pool está a acabar. Passa pelo strictFilter antes de adicionar.
Para Watch e Play: busca 3 páginas de cada vez.
Para Listen/Learn: rota por géneros diferentes.
Para Read: usa startIndex crescente.

---

## NOVOS TIPOS NOS INQUÉRITOS (V8)

### WatchPrefs — novos campos
```typescript
type: string  // agora aceita: 'Filme' | 'Série' | 'Documentário' | 'Stand-up' | 'Anime' | 'Desporto' | 'YouTube' | 'Twitch'
conQuem?: string    // 'sozinho' | 'a_dois' | 'familia' | 'grupo'
humor?: string      // 'serio' | 'leve' | 'qualquer'
classificacao?: string
gatilhos?: string[]
reassistir?: string
// Campos avançados: origem, lingua, epoca, minRating, discovery, duration (já existiam)
```

### ListenPrefs — novos campos
```typescript
type: agora aceita: 'Álbum' | 'Single' | 'Podcast' | 'Audiobook' | 'Radio' | 'Live' | 'Ambos'
momento?: string    // 'trabalhar' | 'treinar' | 'relaxar' | 'adormecer' | 'conduzir'
lingua?: string
duracao?: string
novidade?: string
```

### ReadPrefs — novos campos
```typescript
type: agora aceita: 'Livro' | 'Artigo' | 'BD' | 'Newsletter' | 'Ensaio' | 'Conto' | 'Ambos'
comprimento?: string  // 'curto' | 'normal' | 'epico'
lingua?: string
formato?: string      // 'fisico' | 'ebook' | 'audiobook'
standalone?: string
tempoReal?: string
```

### PlayPrefs — novos campos
```typescript
type: agora aceita: 'Videojogo' | 'Tabuleiro' | 'Cartas' | 'RPGMesa' | 'Mobile' | 'Arcade' | 'Ambos'
jogadores?: string
online?: string       // 'online' | 'offline' | 'local_coop'
duracao?: string
experiencia?: string
```

### LearnPrefs — novos campos
```typescript
formato: agora aceita: 'video' | 'curso' | 'artigo' | 'podcast' | 'livro' | 'Ambos'
nivel?: string        // 'iniciante' | 'intermedio' | 'avancado'
gratis?: boolean
certificado?: boolean
lingua?: string
objetivo?: string
```

### EatPrefs — novos campos
```typescript
nivelCozinheiro?: string
quantas?: string
cozinha?: string[]
ocasiao?: string
abertoAgora?: boolean
petFriendly?: boolean
esplanada?: boolean
```

### VisitPrefs — novos campos
```typescript
distancia: agora aceita: 'perto' | 'proximo' | 'qualquer'
altura?: string       // 'manha' | 'tarde' | 'noite'
conQuem?: string
interior?: string
tempoVisita?: string
acessivel?: boolean
reserva?: string
mobilidade?: string
```

### DoPrefs — novos campos
```typescript
duracao?: string
energia?: string
objetivo?: string
meteorologia?: string
animais?: boolean
```

---

## FEED SOCIAL — ESTADO ACTUAL

### FeedScreen.tsx (src/components/screens/FeedScreen.tsx)
- Busca eventos reais da tabela `feed_events` no Supabase
- Busca tendências da tabela `feed_events` (agregado)
- Busca trending real das APIs (TMDB, RAWG, Deezer, etc.) via `trendingFeed.ts`
- Busca influencers do Supabase
- Cards individuais fictícios (nomes portugueses) vêm de `trendingFeed.ts` — foram pedidos para remover mas podem ainda aparecer
- Barra lateral de contactos: existe mas está vazia (sem amigos reais)

### Publicar eventos no feed
Quando utilizador clica "Sim agora" ou "Sim mais tarde" em qualquer sugestão,
publica automaticamente na tabela `feed_events` (silencioso, não quebra a app).
Ficheiro: `src/services/feedEvents.ts`

### Privacidade do feed
Toggle no Profile — "Feed Social" — partilha por defeito, pode desligar.
Guarda em `localStorage('wt_feed_public')`.
Quando false, não publica eventos.

---

## TABELAS SUPABASE CRIADAS NESTA SESSÃO

```sql
feed_events    — id, user_id, display_name, cat_id, cat_name, title, emoji,
                 action_type, img, rating, is_public, created_at
analytics_events — id, user_id, session_id, event_type, cat_id, value, created_at
```

⚠️ Estas tabelas precisam de ser criadas manualmente no Supabase Dashboard.
Os ficheiros SQL estão em `sql/feed_events.sql` e `sql/analytics_events.sql`.

---

## MÉTRICAS — EVENTOS INSTRUMENTADOS

Ficheiro: `src/services/analytics.ts`
Eventos gravados: `suggest_open`, `suggest_accept`, `suggest_why`, `suggest_session_end`,
`inquerito_complete`, `inquerito_skip`, `feed_open`, `suggest_skip`

---

## ESTÉTICA DOS CARDS (V9)

### Ken Burns effect (pan lento)
Classes CSS: `cin-poster-img.pan-left` e `cin-poster-img.pan-right`
Animações: `panLeft` e `panRight` (8s, ease-in-out)
Alterna direcção entre cards via `panDirRef`

### Overlay cinematográfico
Classe: `cin-overlay-netflix`
Gradiente mais suave que o anterior, escurece mais na parte inferior

### Fade in do corpo
Classe: `cin-body-netflix`
Animação: `fadeInUp` (0.5s)

### Logo What to
Classe: `cin-whatto-badge`
Posição: canto inferior direito do poster
Só aparece quando não é sugestão de influencer

---

## O QUE FALTA FAZER (por ordem de prioridade)

### Imediato — verificar se V9 funciona
1. Sugestões infinitas (passa 30+ cards sem acabar)
2. Ken Burns effect nos cards
3. Pull-to-refresh não recarrega
4. Logout ao fechar app e reabrir

### A seguir (confirmado nesta sessão)
5. **Mensagens** — conversas entre utilizadores, badge no tab Amigos, Supabase Realtime
6. **Push notifications** — até onde é possível sem domínio próprio, preparado para ligar depois
7. **Documento de contexto V5** — quando acabar a próxima sessão

### Quando tiver domínio próprio
- Facebook/Instagram login
- Email de confirmação de influencers via Resend
- Push notifications completas
- Google Play Store (após PWA estável)

### Pendente de sessões anteriores (pode ainda ter problemas)
- Friends.tsx: verificar se Pedro/Maria/João ainda aparecem
- FeedScreen: verificar se cards individuais fictícios ainda aparecem
- Filtros em todas as categorias: verificar cada uma individualmente

---

## FICHEIROS PRINCIPAIS ALTERADOS NESTA SESSÃO

```
src/version.ts                              — versão da app (V9)
src/App.tsx                                 — suggestKey, auth, onboards
src/components/screens/Suggest.tsx         — strictFilter, handleLoadMore, ken burns
src/components/screens/ForYou.tsx          — ken burns effect
src/components/screens/FeedScreen.tsx      — feed real + trending
src/components/screens/Friends.tsx         — remoção de mocks
src/components/panels/WatchOnboard.tsx     — inquérito expandido
src/components/panels/EatOnboard.tsx       — inquérito expandido
src/components/panels/ListenOnboard.tsx    — inquérito expandido
src/components/panels/ReadOnboard.tsx      — inquérito expandido
src/components/panels/PlayOnboard.tsx      — inquérito expandido
src/components/panels/LearnOnboard.tsx     — inquérito expandido
src/components/panels/VisitOnboard.tsx     — inquérito expandido
src/components/panels/DoOnboard.tsx        — inquérito expandido
src/types/index.ts                          — novos campos nas interfaces de prefs
src/store/index.ts                          — valores por defeito actualizados
src/services/feedEvents.ts                 — publicar/ler eventos do feed
src/services/analytics.ts                  — tracking de eventos
src/services/trendingFeed.ts               — trending real das APIs
src/services/deezer.ts                     — pesquisa por álbuns corrigida
src/index.css                              — ken burns, cin-tags, overscroll, spinner
sql/feed_events.sql                        — tabela Supabase (criar manualmente)
sql/analytics_events.sql                   — tabela Supabase (criar manualmente)
```

---

## COMMITS DESTA SESSÃO

```
V2: fix logout mobile + sem mocks feed + filtros genreIds
V3: overscroll + sem mocks friends + sidebar feed + filtros redisparo
V4: filtros via key remount + postFilter universal + watch tipo correcto
V5: tags multiplas + filtro tipo agressivo + sugestoes infinitas
fix: allGenres no DiscoverItem no tmdb.ts (hotfix do V5)
V6: strictFilter todos os parametros todas as categorias
V7: deezer pesquisa real + watch tipo correcto + pool minimo 20
V8: sugestoes infinitas + inqueritos expandidos + qualquer em tudo
V9: sugestoes infinitas + netflix pan effect + logout fix
```
