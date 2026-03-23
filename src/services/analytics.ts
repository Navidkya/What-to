import { supabase } from '../lib/supabase';

// ID de sessão único por visita (não persiste entre sessões)
export const SESSION_ID = Math.random().toString(36).substring(2, 10);

type EventType =
  | 'suggest_open'
  | 'suggest_skip'
  | 'suggest_accept'
  | 'suggest_why'
  | 'suggest_session_end'
  | 'onboard_complete'
  | 'inquerito_complete'
  | 'inquerito_skip'
  | 'match_start'
  | 'match_complete'
  | 'plan_created'
  | 'plan_shared'
  | 'feed_open'
  | 'feed_event_click'
  | 'screen_view'
  | 'session_start'
  | 'session_end'
  | 'influencer_view'
  | 'influencer_accept'
  | 'wrapped_shared'
  | 'tracking_update'
  | 'series_finished';

interface TrackParams {
  userId?: string | null;
  eventType: EventType;
  catId?: string;
  value?: Record<string, unknown>;
}

// Detecta info do dispositivo
export function getDeviceInfo(): { deviceType: string; os: string; browser: string; isPwa: boolean } {
  const ua = navigator.userAgent;
  const isPwa = window.matchMedia('(display-mode: standalone)').matches
    || (navigator as any).standalone === true;
  const os = /android/i.test(ua) ? 'android'
    : /iphone|ipad|ipod/i.test(ua) ? 'ios'
    : /windows/i.test(ua) ? 'windows'
    : /mac/i.test(ua) ? 'mac' : 'other';
  const browser = /chrome/i.test(ua) && !/edge/i.test(ua) ? 'chrome'
    : /firefox/i.test(ua) ? 'firefox'
    : /safari/i.test(ua) && !/chrome/i.test(ua) ? 'safari'
    : /edge/i.test(ua) ? 'edge' : 'other';
  const deviceType = isPwa ? 'pwa' : /mobi/i.test(ua) ? 'mobile_browser' : 'browser';
  return { deviceType, os, browser, isPwa };
}

// Envia evento (silencioso — nunca quebra a app)
export async function track(params: TrackParams): Promise<void> {
  try {
    await supabase.from('analytics_events').insert({
      user_id: params.userId ?? null,
      session_id: SESSION_ID,
      event_type: params.eventType,
      cat_id: params.catId ?? null,
      value: {
        ...params.value ?? {},
        hour_of_day: new Date().getHours(),
        day_of_week: new Date().getDay(),
      },
    });
  } catch { /* silencioso */ }
}

// Versão síncrona para usar em event handlers sem await (fire and forget)
export function trackAsync(params: TrackParams): void {
  track(params).catch(() => {});
}

// Regista início de sessão
export async function trackSessionStart(userId?: string | null): Promise<void> {
  try {
    const device = getDeviceInfo();
    await supabase.from('user_sessions').insert({
      user_id: userId ?? null,
      session_id: SESSION_ID,
      started_at: new Date().toISOString(),
      device_type: device.deviceType,
      os: device.os,
      browser: device.browser,
      is_pwa: device.isPwa,
    });
    await track({ userId, eventType: 'session_start', value: { ...device } });
  } catch { /* silencioso */ }
}

// Regista fim de sessão com duração
export async function trackSessionEnd(userId?: string | null, startedAt: number = Date.now()): Promise<void> {
  try {
    const duration = Math.round((Date.now() - startedAt) / 1000);
    await supabase.from('user_sessions')
      .update({ ended_at: new Date().toISOString(), duration_seconds: duration })
      .eq('session_id', SESSION_ID);
    await track({ userId, eventType: 'session_end', value: { duration_seconds: duration } });
  } catch { /* silencioso */ }
}
