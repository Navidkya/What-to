import { supabase } from '../lib/supabase';

// ID de sessão único por visita (não persiste entre sessões)
const SESSION_ID = Math.random().toString(36).substring(2, 10);

type EventType =
  | 'suggest_open'        // utilizador abriu uma categoria
  | 'suggest_skip'        // clicou Não num card
  | 'suggest_accept'      // clicou Sim (agora ou mais tarde)
  | 'suggest_why'         // clicou "Não porque..."
  | 'suggest_session_end' // saiu do Suggest sem aceitar nada
  | 'onboard_complete'    // completou o onboarding inicial
  | 'inquerito_complete'  // completou o inquérito de uma categoria
  | 'inquerito_skip'      // saltou o inquérito de uma categoria
  | 'match_start'         // iniciou uma sessão de Match
  | 'match_complete'      // Match terminou com decisão
  | 'plan_created'        // criou um plano de noite
  | 'feed_open'           // abriu o Feed
  | 'feed_event_click';   // clicou num card do Feed

interface TrackParams {
  userId?: string | null;
  eventType: EventType;
  catId?: string;
  value?: Record<string, unknown>;
}

// Envia evento (silencioso — nunca quebra a app)
export async function track(params: TrackParams): Promise<void> {
  try {
    await supabase.from('analytics_events').insert({
      user_id: params.userId ?? null,
      session_id: SESSION_ID,
      event_type: params.eventType,
      cat_id: params.catId ?? null,
      value: params.value ?? null,
    });
  } catch { /* silencioso */ }
}

// Versão síncrona para usar em event handlers sem await (fire and forget)
export function trackAsync(params: TrackParams): void {
  track(params).catch(() => {});
}
