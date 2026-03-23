import { useState, useCallback } from 'react';
import type { Profile, HistoryEntry, TrackingMap, PrefsMap, WishlistEntry, ScheduleEntry, EatPrefs, WatchPrefs, ListenPrefs, ReadPrefs, PlayPrefs, LearnPrefs, VisitPrefs, DoPrefs, UserList, PermanentPrefs, NightPlan } from '../types';

// ══════════════════════════════════════
// localStorage helpers
// ══════════════════════════════════════
function load<T>(k: string, d: T): T {
  try {
    const v = localStorage.getItem(k);
    return v != null ? (JSON.parse(v) as T) : d;
  } catch {
    return d;
  }
}

function save(k: string, v: unknown) {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch { /* quota exceeded */ }
}

// ══════════════════════════════════════
// App Store Hook
// ══════════════════════════════════════
export function useAppStore() {
  const [profile, setProfileRaw] = useState<Profile>(() =>
    load('wt6_profile', { name: '', onboarded: false, platforms: [], blockedPlatforms: [], savedPeople: [] })
  );
  const [wishlist, setWishlistRaw] = useState<WishlistEntry[]>(() => load('wt6_wl', []));
  const [history, setHistoryRaw] = useState<HistoryEntry[]>(() => load('wt6_hist', []));
  const [tracking, setTrackingRaw] = useState<TrackingMap>(() => load('wt6_track', {}));
  const [prefs, setPrefsRaw] = useState<PrefsMap>(() => load('wt6_prefs', {}));
  const [disliked, setDislikedRaw] = useState<string[]>(() => load('wt6_dis', []));
  const [schedules, setSchedulesRaw] = useState<ScheduleEntry[]>(() => load('wt6_sched', []));
  const [eatPrefs, setEatPrefsRaw] = useState<EatPrefs>(() =>
    load('wt6_eatprefs', { done: false, local: [], fome: 'normal', budget: 'medio', restrictions: [], tempo: 'normal',
      nivelCozinheiro: undefined, quantas: undefined, cozinha: [], ocasiao: undefined,
      abertoAgora: false, petFriendly: false, esplanada: false })
  );
  const [watchPrefs, setWatchPrefsRaw] = useState<WatchPrefs>(() =>
    load('wt6_watchprefs', { done: false, type: 'Ambos', genres: [], duration: 'normal', discovery: 'mistura',
      conQuem: undefined, humor: undefined, classificacao: undefined, gatilhos: undefined, reassistir: undefined })
  );
  const [listenPrefs, setListenPrefsRaw] = useState<ListenPrefs>(() =>
    load('wt6_listenprefs', { done: false, type: 'Ambos' as const, genres: [], energia: 'mistura' as const,
      momento: undefined, lingua: undefined, duracao: undefined, novidade: undefined })
  );
  const [readPrefs, setReadPrefsRaw] = useState<ReadPrefs>(() =>
    load('wt6_readprefs', { done: false, type: 'Ambos' as const, genres: [], peso: 'mistura' as const,
      comprimento: undefined, lingua: undefined, formato: undefined, standalone: undefined, tempoReal: undefined })
  );
  const [playPrefs, setPlayPrefsRaw] = useState<PlayPrefs>(() =>
    load('wt6_playprefs', { done: false, type: 'Ambos' as const, genres: [], dificuldade: 'normal' as const,
      jogadores: undefined, online: undefined, duracao: undefined, experiencia: undefined })
  );
  const [learnPrefs, setLearnPrefsRaw] = useState<LearnPrefs>(() =>
    load('wt6_learnprefs', { done: false, formato: 'Ambos' as const, genres: [], duracao: 'normal' as const,
      nivel: undefined, gratis: false, certificado: false, lingua: undefined, objetivo: undefined })
  );
  const [visitPrefs, setVisitPrefsRaw] = useState<VisitPrefs>(() =>
    load('wt6_visitprefs', { done: false, tipo: [], custo: 'qualquer' as const, distancia: 'qualquer' as const,
      altura: undefined, conQuem: undefined, interior: undefined, tempoVisita: undefined, acessivel: false,
      reserva: undefined, mobilidade: undefined })
  );
  const [doPrefs, setDoPrefsRaw] = useState<DoPrefs>(() =>
    load('wt6_doprefs', { done: false, contexto: 'qualquer' as const, local: 'qualquer' as const, custo: 'qualquer' as const,
      duracao: undefined, energia: undefined, objetivo: undefined, meteorologia: undefined, animais: false })
  );
  const [userLists, setUserListsRaw] = useState<UserList[]>(() =>
    load('wt6_lists', [])
  );
  const [permanentPrefs, setPermanentPrefsRaw] = useState<PermanentPrefs>(() =>
    load('wt6_permprefs', {
      foodAllergies: [],
      foodDislikes: [],
      alwaysGenres: {},
      neverGenres: {},
      preferredLanguage: 'any',
    })
  );
  const [plans, setPlansRaw] = useState<NightPlan[]>(() =>
    load('wt6_plans', [])
  );

  const updateProfile = useCallback((p: Profile) => {
    setProfileRaw(p);
    save('wt6_profile', p);
  }, []);

  const updateWishlist = useCallback((w: WishlistEntry[]) => {
    setWishlistRaw(w);
    save('wt6_wl', w);
  }, []);

  const updateHistory = useCallback((h: HistoryEntry[]) => {
    setHistoryRaw(h);
    save('wt6_hist', h);
  }, []);

  const updateTracking = useCallback((t: TrackingMap) => {
    setTrackingRaw(t);
    save('wt6_track', t);
  }, []);

  const updatePrefs = useCallback((p: PrefsMap) => {
    setPrefsRaw(p);
    save('wt6_prefs', p);
  }, []);

  const updateDisliked = useCallback((d: string[]) => {
    setDislikedRaw(d);
    save('wt6_dis', d);
  }, []);

  const updateSchedules = useCallback((s: ScheduleEntry[]) => {
    setSchedulesRaw(s);
    save('wt6_sched', s);
  }, []);

  const updateEatPrefs = useCallback((p: EatPrefs) => {
    setEatPrefsRaw(p);
    save('wt6_eatprefs', p);
  }, []);

  const updateWatchPrefs = useCallback((p: WatchPrefs) => {
    setWatchPrefsRaw(p);
    save('wt6_watchprefs', p);
  }, []);

  const updateListenPrefs = useCallback((p: ListenPrefs) => {
    setListenPrefsRaw(p);
    save('wt6_listenprefs', p);
  }, []);

  const updateReadPrefs = useCallback((p: ReadPrefs) => {
    setReadPrefsRaw(p);
    save('wt6_readprefs', p);
  }, []);

  const updatePlayPrefs = useCallback((p: PlayPrefs) => {
    setPlayPrefsRaw(p);
    save('wt6_playprefs', p);
  }, []);

  const updateLearnPrefs = useCallback((p: LearnPrefs) => {
    setLearnPrefsRaw(p);
    save('wt6_learnprefs', p);
  }, []);

  const updateVisitPrefs = useCallback((p: VisitPrefs) => {
    setVisitPrefsRaw(p);
    save('wt6_visitprefs', p);
  }, []);

  const updateDoPrefs = useCallback((p: DoPrefs) => {
    setDoPrefsRaw(p);
    save('wt6_doprefs', p);
  }, []);

  const updateUserLists = useCallback((l: UserList[]) => {
    setUserListsRaw(l);
    save('wt6_lists', l);
  }, []);

  const updatePermanentPrefs = useCallback((p: PermanentPrefs) => {
    setPermanentPrefsRaw(p);
    save('wt6_permprefs', p);
  }, []);

  const updatePlans = useCallback((p: NightPlan[]) => {
    setPlansRaw(p);
    save('wt6_plans', p);
  }, []);

  const clearAll = useCallback(() => {
    const empty: HistoryEntry[] = [];
    const emptyWL: WishlistEntry[] = [];
    const emptyT: TrackingMap = {};
    const emptyP: PrefsMap = {};
    setHistoryRaw(empty); save('wt6_hist', empty);
    setWishlistRaw(emptyWL); save('wt6_wl', emptyWL);
    setTrackingRaw(emptyT); save('wt6_track', emptyT);
    setPrefsRaw(emptyP); save('wt6_prefs', emptyP);
  }, []);

  return {
    profile, updateProfile,
    wishlist, updateWishlist,
    history, updateHistory,
    tracking, updateTracking,
    prefs, updatePrefs,
    disliked, updateDisliked,
    schedules, updateSchedules,
    eatPrefs, updateEatPrefs,
    watchPrefs, updateWatchPrefs,
    listenPrefs, updateListenPrefs,
    readPrefs, updateReadPrefs,
    playPrefs, updatePlayPrefs,
    learnPrefs, updateLearnPrefs,
    visitPrefs, updateVisitPrefs,
    doPrefs, updateDoPrefs,
    userLists, updateUserLists,
    permanentPrefs, updatePermanentPrefs,
    plans, updatePlans,
    clearAll,
  };
}

export type AppStore = ReturnType<typeof useAppStore>;
