import { useState, useCallback } from 'react';
import type { Profile, HistoryEntry, TrackingMap, PrefsMap, WishlistEntry, ScheduleEntry, EatPrefs, WatchPrefs } from '../types';

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
    load('wt6_eatprefs', { done: false, local: [], fome: 'normal', budget: 'medio', restrictions: [], tempo: 'normal' })
  );
  const [watchPrefs, setWatchPrefsRaw] = useState<WatchPrefs>(() =>
    load('wt6_watchprefs', { done: false, genres: [], duration: 'normal', type: 'Ambos', discovery: 'mistura' })
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
    clearAll,
  };
}

export type AppStore = ReturnType<typeof useAppStore>;
