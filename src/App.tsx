import { useState, useCallback, useRef, useEffect } from 'react';
import { APP_VERSION } from './version';
import type { Screen, Category, DataItem, HistoryEntry, WishlistEntry, WhyReason, ScheduleEntry } from './types';
import { CATS, getPlatformId } from './data';
import { useAppStore } from './store';
import EatOnboard from './components/panels/EatOnboard';
import WatchOnboard from './components/panels/WatchOnboard';
import ListenOnboard from './components/panels/ListenOnboard';
import ReadOnboard from './components/panels/ReadOnboard';
import PlayOnboard from './components/panels/PlayOnboard';
import LearnOnboard from './components/panels/LearnOnboard';
import VisitOnboard from './components/panels/VisitOnboard';
import DoOnboard from './components/panels/DoOnboard';
import RecipePanel from './components/panels/RecipePanel';

import Toast, { useToast } from './components/layout/Toast';
import BottomNav from './components/layout/BottomNav';

import Onboard from './components/screens/Onboard';
import Home from './components/screens/Home';
import Suggest from './components/screens/Suggest';
import Checklist from './components/screens/Checklist';
import Metrics from './components/screens/Metrics';
import Match from './components/screens/Match';
import Wishlist from './components/screens/Wishlist';
import ListsScreen from './components/screens/ListsScreen';
import Profile from './components/screens/Profile';
import B2B from './components/screens/B2B';
import Friends from './components/screens/Friends';
import FeedSocial from './components/screens/FeedSocial';
import FeedScreen from './components/screens/FeedScreen';
import ForYou from './components/screens/ForYou';

import ReactPanel from './components/panels/ReactPanel';
import WhyPanel from './components/panels/WhyPanel';
import LinkPanel from './components/panels/LinkPanel';
import LivePanel from './components/panels/LivePanel';
import TrackPanel from './components/panels/TrackPanel';
import WrappedGenerator from './components/panels/WrappedGenerator';
import type { WrappedData } from './components/panels/WrappedGenerator';
import SchedulePanel from './components/panels/SchedulePanel';
import AddToListPanel from './components/panels/AddToListPanel';
import AuthScreen from './components/screens/AuthScreen';
import PlanScreen from './components/screens/PlanScreen';
import CreatorDashboard from './components/screens/CreatorDashboard';
import AdminPanel from './components/screens/AdminPanel';
import { supabase } from './lib/supabase';
import { signOut } from './services/auth';
import { loadInfluencerProfile } from './services/influencers';
import { loadAllFromSupabase, syncProfileToSupabase, syncHistoryToSupabase, syncTrackingToSupabase, syncListsToSupabase, syncPrefsToSupabase } from './services/sync';
import { publishFeedEvent } from './services/feedEvents';
import { trackAsync, trackSessionStart, trackSessionEnd } from './services/analytics';

const SWIPE_THRESHOLD = 60;


export default function App() {
  const store = useAppStore();
  const { msg, visible, toast } = useToast();

  // Auth state
  const [authUser, setAuthUser] = useState<{ id: string; email?: string } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [friendPendingCount, setFriendPendingCount] = useState(0);

  // Navigation
  const [screen, setScreen] = useState<Screen>(store.profile.onboarded ? 'home' : 'onboard');
  const [prevScreen, setPrevScreen] = useState<Screen>('home');

  // Current suggest state
  const [curCat, setCurCat] = useState<Category | null>(null);
  const [curSugg, setCurSugg] = useState<DataItem | null>(null);
  const [curSuggImg, setCurSuggImg] = useState<string | null>(null);
  const [curSuggApiContext, setCurSuggApiContext] = useState<{ type?: string; genre?: string; rating?: number } | undefined>(undefined);
  const [afterReactTrigger, setAfterReactTrigger] = useState(0);
  const [addToListOpen, setAddToListOpen] = useState(false);
  const [curDisplayItem, setCurDisplayItem] = useState<{ title: string; emoji: string; catId: string; cat: string; type: string } | null>(null);
  const [afterReactGenre, setAfterReactGenre] = useState<string | null>(null);

  // Category onboarding
  const [eatObOpen, setEatObOpen] = useState(false);
  const [watchObOpen, setWatchObOpen] = useState(false);
  const [listenObOpen, setListenObOpen] = useState(false);
  const [readObOpen, setReadObOpen] = useState(false);
  const [playObOpen, setPlayObOpen] = useState(false);
  const [learnObOpen, setLearnObOpen] = useState(false);
  const [visitObOpen, setVisitObOpen] = useState(false);
  const [doObOpen, setDoObOpen] = useState(false);

  // Recipe panel
  const [recipeOpen, setRecipeOpen] = useState(false);

  // Overlays
  const [reactOpen, setReactOpen] = useState(false);
  const [whyOpen, setWhyOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [liveOpen, setLiveOpen] = useState(false);
  const [trackOpen, setTrackOpen] = useState(false);
  const [wrappedGenData, setWrappedGenData] = useState<WrappedData | null>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [suggestKey, setSuggestKey] = useState(0);

  // Link panel data
  const [linkData, setLinkData] = useState({ title: '', name: '', url: '', color: '' });
  // Live panel data
  const [liveData, setLiveData] = useState({ title: '', emoji: '', catId: '' });

  // Gesture detection refs
  const gestureStartX = useRef<number | null>(null);
  const gestureStartY = useRef<number | null>(null);
  const sessionStartedAt = useRef<number>(Date.now());

  const goHome = useCallback(() => {
    setScreen('home');
  }, []);

  const goBack = useCallback(() => {
    setScreen(prevScreen);
  }, [prevScreen]);

  const navTo = useCallback((s: Screen) => {
    setPrevScreen(prev => screen !== s ? screen : prev);
    setScreen(s);
    trackAsync({ userId: authUser?.id, eventType: 'screen_view', value: { screen: s } });
  }, [screen, authUser]);

  const openCat = useCallback((id: string, item?: DataItem) => {
    const cat = CATS.find(c => c.id === id);
    if (!cat) return;
    setCurCat(cat);
    setCurSugg(item || null);
    setPrevScreen('home');
    setScreen('suggest');
    trackAsync({ userId: authUser?.id, eventType: 'suggest_open', catId: id });
    if (id === 'eat')    setEatObOpen(true);
    if (id === 'watch')  setWatchObOpen(true);
    if (id === 'listen') setListenObOpen(true);
    if (id === 'read')   setReadObOpen(true);
    if (id === 'play')   setPlayObOpen(true);
    if (id === 'learn')  setLearnObOpen(true);
    if (id === 'visit')  setVisitObOpen(true);
    if (id === 'do')     setDoObOpen(true);
  }, []);

  const openReact = useCallback(() => setReactOpen(true), []);

  const openLink = useCallback((url: string, name: string, color: string) => {
    setLinkData({ title: curSugg?.title || '', name, url, color });
    setLinkOpen(true);
  }, [curSugg]);

  const openLive = useCallback((title: string, emoji: string, catId: string) => {
    setLiveData({ title, emoji, catId });
    setLiveOpen(true);
  }, []);

  const MONTHS_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

  const openMonthlyWrapped = useCallback(() => {
    const now = new Date();
    setWrappedGenData({
      mode: 'monthly',
      history: store.history,
      tracking: store.tracking,
      monthName: MONTHS_PT[now.getMonth()],
      year: now.getFullYear(),
    });
  }, [store.history, store.tracking]);

  const openAnnualWrapped = useCallback(() => {
    setWrappedGenData({
      mode: 'annual',
      history: store.history,
      tracking: store.tracking,
      year: new Date().getFullYear(),
    });
  }, [store.history, store.tracking]);


  // React actions
  const reactNow = useCallback(() => {
    if (!curSugg || !curCat) return;
    setReactOpen(false);

    const entry: HistoryEntry = {
      catId: curCat.id, title: curSugg.title, emoji: curSugg.emoji,
      cat: curCat.name, date: new Date().toISOString(),
      type: curSugg.type, genre: curSugg.genre, action: 'agora',
    };
    store.updateHistory([entry, ...store.history]);

    const key = curCat.id + ':' + curSugg.title;
    store.updateTracking({
      ...store.tracking,
      [key]: { state: 'watching', title: curSugg.title, emoji: curSugg.emoji, cat: curCat.name, catId: curCat.id },
    });
    trackAsync({ userId: authUser?.id, eventType: 'tracking_update',
      catId: curCat.id, value: { title: curSugg.title, state: 'watching' } });

    if (authUser && store.profile.name) {
      publishFeedEvent({
        userId: authUser.id,
        displayName: store.profile.name,
        catId: curCat.id,
        catName: curCat.name,
        title: curSugg.title,
        emoji: curSugg.emoji,
        actionType: 'started',
        img: curSuggImg || null,
      });
    }
    trackAsync({ userId: authUser?.id, eventType: 'suggest_accept', catId: curCat.id,
      value: { title: curSugg.title, type: curSugg.type, genre: curSugg.genre, action: 'agora' } });

    // For recipes: open the recipe panel instead of a platform link
    if (curCat.id === 'eat' && curSugg.type === 'Receita') {
      setRecipeOpen(true);
      toast('🍳 A ver a receita!');
    } else if (curSugg.platforms?.length) {
      const p = curSugg.platforms[0];
      openLink(p.url, p.n, p.c);
      toast('▶ A começar! Acompanha no painel.');
    } else {
      toast('▶ A começar!');
    }

    setAfterReactGenre(curSugg.genre || null);
    setAfterReactTrigger(t => t + 1);
  }, [curSugg, curCat, store, openLink, toast]);

  const reactAction = useCallback((type: 'hoje' | 'save' | 'skip' | 'next') => {
    if (!curSugg || !curCat) return;
    setReactOpen(false);
    const key = curCat.id + ':' + curSugg.title;
    const base = {
      catId: curCat.id, title: curSugg.title, emoji: curSugg.emoji,
      cat: curCat.name, date: new Date().toISOString(),
      type: curSugg.type, genre: curSugg.genre,
    };
    if (type === 'hoje') {
      store.updateHistory([{ ...base, action: 'hoje' }, ...store.history]);
      toast('✅ Marcado para hoje!');
      if (authUser && store.profile.name) {
        publishFeedEvent({
          userId: authUser.id,
          displayName: store.profile.name,
          catId: curCat.id,
          catName: curCat.name,
          title: curSugg.title,
          emoji: curSugg.emoji,
          actionType: 'marked_today',
        });
      }
      trackAsync({ userId: authUser?.id, eventType: 'suggest_accept', catId: curCat.id,
        value: { title: curSugg.title, type: curSugg.type, genre: curSugg.genre, action: 'hoje' } });
    } else if (type === 'save') {
      if (!store.wishlist.find(w => w.key === key)) {
        const wEntry: WishlistEntry = { key, ...base, action: 'save' };
        store.updateWishlist([...store.wishlist, wEntry]);
      }
      store.updateHistory([{ ...base, action: 'save' }, ...store.history]);
      toast('♡ Guardado para outro dia');
    } else if (type === 'skip') {
      toast('⏭ Ok, próxima!');
    }
    setAfterReactGenre(curSugg.genre || null);
    setAfterReactTrigger(t => t + 1);
  }, [curSugg, curCat, store, toast]);

  const pickWhy = useCallback((reason: WhyReason) => {
    if (!curSugg || !curCat) return;
    setWhyOpen(false);
    const newPrefs = { ...store.prefs };
    if (!newPrefs[curCat.id]) newPrefs[curCat.id] = {};

    if (reason.blockPlat && curSugg.platforms?.length) {
      const blocked = [...(store.profile.blockedPlatforms || [])];
      curSugg.platforms.forEach(p => {
        const pid = getPlatformId(p.n);
        if (pid && !blocked.includes(pid)) blocked.push(pid);
      });
      store.updateProfile({ ...store.profile, blockedPlatforms: blocked });
      toast('🚫 Plataforma bloqueada nas sugestões');
    }
    if (reason.block) {
      const key = curCat.id + ':' + curSugg.title;
      if (!store.disliked.includes(key)) store.updateDisliked([...store.disliked, key]);
    }
    if (reason.p && reason.v !== undefined && !reason.blockPlat) {
      newPrefs[curCat.id][reason.p] = reason.v;
    }
    store.updatePrefs(newPrefs);
    trackAsync({ userId: authUser?.id, eventType: 'suggest_why', catId: curCat?.id,
      value: { reason: reason.s, title: curSugg?.title } });
    // Se mudou o tipo de conteúdo, actualiza também watchPrefs para forçar re-discover imediato
    if (reason.p === 'type' && curCat?.id === 'watch' && typeof reason.v === 'string') {
      store.updateWatchPrefs({ ...store.watchPrefs, type: reason.v as 'Filme' | 'Série' | 'Ambos' });
    }
    toast(`${reason.icon} Percebido!`);
    // Load next suggestion immediately
    setAfterReactGenre(curSugg.genre || null);
    setAfterReactTrigger(t => t + 1);
  }, [curSugg, curCat, store, toast]);

  // ─── Auth + Sync ────────────────────────────────────────────────
  const handleLogin = async (userId: string, userName: string) => {
    setSyncing(true);
    try {
      const remote = await loadAllFromSupabase(userId);
      if (remote.profile) {
        store.updateProfile({
          ...store.profile,
          ...remote.profile,
          name: remote.profile.name || userName || store.profile.name,
          onboarded: true,
        });
      } else if (userName) {
        store.updateProfile({ ...store.profile, name: userName, onboarded: true });
      }
      if (remote.history.length > 0) store.updateHistory(remote.history);
      if (Object.keys(remote.tracking).length > 0) store.updateTracking(remote.tracking);
      if (remote.lists.length > 0) store.updateUserLists(remote.lists);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (remote.prefs.eat) store.updateEatPrefs(remote.prefs.eat as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (remote.prefs.watch) store.updateWatchPrefs(remote.prefs.watch as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (remote.prefs.listen) store.updateListenPrefs(remote.prefs.listen as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (remote.prefs.read) store.updateReadPrefs(remote.prefs.read as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (remote.prefs.play) store.updatePlayPrefs(remote.prefs.play as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (remote.prefs.learn) store.updateLearnPrefs(remote.prefs.learn as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (remote.prefs.visit) store.updateVisitPrefs(remote.prefs.visit as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (remote.prefs.do) store.updateDoPrefs(remote.prefs.do as any);
      trackSessionStart(userId).catch(() => {});
      sessionStartedAt.current = Date.now();
      setScreen('home');
    } catch (e) {
      console.error('Sync error:', e);
      setScreen('home');
    } finally {
      setSyncing(false);
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    setAuthUser(null);
    setScreen('onboard');
  };

  // Processa utilizador autenticado — carrega perfil de influencer ou faz login normal
  const processUser = useCallback(async (user: { id: string; email?: string; user_metadata?: Record<string, unknown> }) => {
    try {
      const influencerProfile = await loadInfluencerProfile(user.id);
      if (influencerProfile) {
        setAuthUser({ id: user.id, email: user.email });
        setIsCreator(true);
        setAuthLoading(false);
        return;
      }
    } catch { /* não é influencer */ }
    setAuthUser({ id: user.id, email: user.email });
    await handleLogin(
      user.id,
      (user.user_metadata?.full_name as string) || (user.user_metadata?.name as string) || ''
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Timeout de segurança — se ao fim de 8s ainda não há resposta, mostra login
    const timeout = setTimeout(() => {
      setAuthLoading(false);
    }, 8000);

    // Tenta restaurar sessão existente
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      clearTimeout(timeout);
      if (session?.user) {
        await processUser(session.user);
      } else {
        setAuthLoading(false);
      }
    });

    // Listener para mudanças de auth (login novo, token refresh, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // Só processa se ainda não está autenticado (evita duplicação com getSession)
        if (!authUser) {
          await processUser(session.user);
        }
      } else if (event === 'SIGNED_OUT') {
        // Ignorado intencionalmente — o Android emite SIGNED_OUT ao relançar o processo.
        // O logout real é feito apenas pelo botão explícito (handleLogout).
        // Não fazer nada aqui.
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        // Token renovado — actualiza authUser se necessário
        if (!authUser) {
          setAuthUser({ id: session.user.id, email: session.user.email });
        }
      }
    });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Restaura sessão quando a app volta ao foreground (PWA mobile)
  useEffect(() => {
    const handleVisibility = async () => {
      if (document.visibilityState === 'hidden' && authUser) {
        trackSessionEnd(authUser.id, sessionStartedAt.current).catch(() => {});
      }
      if (document.visibilityState === 'visible' && !authUser) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await processUser(session.user);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [authUser, processUser]); // eslint-disable-line react-hooks/exhaustive-deps

  // 6d — Sync automático
  useEffect(() => {
    if (!authUser || syncing) return;
    const timer = setTimeout(() => {
      syncProfileToSupabase(authUser.id, store.profile).catch(console.error);
    }, 1000);
    return () => clearTimeout(timer);
  }, [store.profile, authUser]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!authUser || syncing) return;
    const timer = setTimeout(() => {
      syncHistoryToSupabase(authUser.id, store.history).catch(console.error);
    }, 2000);
    return () => clearTimeout(timer);
  }, [store.history, authUser]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!authUser || syncing) return;
    const timer = setTimeout(() => {
      syncTrackingToSupabase(authUser.id, store.tracking).catch(console.error);
    }, 2000);
    return () => clearTimeout(timer);
  }, [store.tracking, authUser]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!authUser || syncing) return;
    const timer = setTimeout(() => {
      syncListsToSupabase(authUser.id, store.userLists).catch(console.error);
    }, 1000);
    return () => clearTimeout(timer);
  }, [store.userLists, authUser]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!authUser || syncing) return;
    const timer = setTimeout(() => {
      syncPrefsToSupabase(authUser.id, {
        eat: store.eatPrefs, watch: store.watchPrefs,
        listen: store.listenPrefs, read: store.readPrefs,
        play: store.playPrefs, learn: store.learnPrefs,
        visit: store.visitPrefs, do: store.doPrefs,
      }).catch(console.error);
    }, 2000);
    return () => clearTimeout(timer);
  }, [store.eatPrefs, store.watchPrefs, store.listenPrefs, store.readPrefs, store.playPrefs, store.learnPrefs, store.visitPrefs, store.doPrefs, authUser]); // eslint-disable-line react-hooks/exhaustive-deps

  // Track feed_open
  useEffect(() => {
    if (screen === 'feed') {
      trackAsync({ userId: authUser?.id, eventType: 'feed_open' });
    }
  }, [screen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Swipe gesture handlers (for screen-level navigation on home/friends/feed)
  const handleGestureStart = useCallback((e: React.TouchEvent) => {
    if (!['home', 'friends', 'feed'].includes(screen)) return;
    gestureStartX.current = e.touches[0].clientX;
    gestureStartY.current = e.touches[0].clientY;
  }, [screen]);

  const handleGestureEnd = useCallback((e: React.TouchEvent) => {
    if (gestureStartX.current === null || gestureStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - gestureStartX.current;
    const dy = e.changedTouches[0].clientY - gestureStartY.current;

    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy) * 1.5) {
      gestureStartX.current = null;
      gestureStartY.current = null;
      return;
    }

    if (screen === 'home') {
      if (dx < -SWIPE_THRESHOLD) navTo('feed');
      else if (dx > SWIPE_THRESHOLD) navTo('profile');
    } else if (screen === 'friends') {
      if (dx > SWIPE_THRESHOLD) navTo('home');
    } else if (screen === 'feed') {
      if (dx > SWIPE_THRESHOLD) navTo('home');
    }

    gestureStartX.current = null;
    gestureStartY.current = null;
  }, [screen, navTo]);

  const isOnboarded = store.profile.onboarded;
  const showBottomNav = isOnboarded && screen !== 'onboard';
  const hSlot = screen === 'friends' ? 0 : screen === 'profile' ? 2 : 1;
  const overlayActive = !['home', 'friends', 'profile'].includes(screen);

  // Rota admin secreta
  if (window.location.hash === '#admin') {
    return <AdminPanel />;
  }

  // Auth guards
  if (authLoading) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#0B0D12', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
        <div className="logo-spinner">what<em>to</em></div>
        <div className="logo-spinner-ring" />
        <div style={{ fontSize: 11, color: 'rgba(200,155,60,0.35)', fontFamily: "'Outfit',sans-serif", letterSpacing: 2, marginTop: 8 }}>{APP_VERSION}</div>
      </div>
    );
  }

  if (!authUser && !isCreator) {
    return (
      <>
        <AuthScreen onSuccess={() => {}} onToast={toast} onCreatorLogin={() => { setIsCreator(true); }} />
        <Toast message={msg} visible={visible} />
      </>
    );
  }

  if (isCreator) {
    return (
      <>
        <CreatorDashboard isActive={true} onBack={() => { setIsCreator(false); setAuthUser(null); signOut(); }} onToast={toast} userId={authUser?.id || ''} />
        <Toast message={msg} visible={visible} />
      </>
    );
  }

  return (
    <>
      {!isOnboarded ? (
        <Onboard
          profile={store.profile}
          onFinish={p => {
            store.updateProfile(p);
            setScreen('home');
          }}
        />
      ) : (
        <div
          style={{ width: '100%', height: '100%', overscrollBehavior: 'none' }}
          onTouchStart={handleGestureStart}
          onTouchEnd={handleGestureEnd}
        >
          {/* Horizontal navigation: Friends | Home | Profile */}
          <div
            className="h-nav"
            style={{
              transform: `translateX(${-hSlot * 100}vw)`,
              ...(overlayActive ? { visibility: 'hidden' } : {}),
            }}
          >
            <div className="h-pane">
              <Friends
                isActive={true}
                onNav={navTo}
                onToast={toast}
                userId={authUser?.id}
                onPendingCount={setFriendPendingCount}
              />
            </div>
            <div className="h-pane">
              <Home
                profile={store.profile}
                history={store.history}
                tracking={store.tracking}
                schedules={store.schedules}
                onOpenCat={openCat}
                onOpenPlan={() => navTo('plan')}
                onOpenLive={openLive}
                onNav={navTo}
                isActive={true}
                onHideTracking={(key) => {
                  const updated = { ...store.tracking };
                  if (updated[key]) updated[key] = { ...updated[key], state: 'paused' };
                  store.updateTracking(updated);
                }}
                onRemoveTracking={(key) => {
                  const updated = { ...store.tracking };
                  delete updated[key];
                  store.updateTracking(updated);
                }}
                onClearTracking={() => {
                  store.updateTracking({});
                  store.updateHistory(store.history.filter(h => h.action !== 'hoje'));
                }}
              />
            </div>
            <div className="h-pane">
              <Profile
                profile={store.profile}
                history={store.history}
                tracking={store.tracking}
                prefs={store.prefs}
                wishlist={store.wishlist}
                isActive={true}
                onBack={goBack}
                onUpdateProfile={store.updateProfile}
                onUpdatePrefs={store.updatePrefs}
                onClearAll={store.clearAll}
                onResetEatPrefs={() => store.updateEatPrefs({ done: false, local: [], fome: 'normal', budget: 'medio', restrictions: [], tempo: 'normal', nivelCozinheiro: undefined, quantas: undefined, cozinha: [], ocasiao: undefined, abertoAgora: false, petFriendly: false, esplanada: false })}
                onResetWatchPrefs={() => store.updateWatchPrefs({ done: false, type: 'Ambos', genres: [], duration: 'normal', discovery: 'mistura', conQuem: undefined, humor: undefined, classificacao: undefined, gatilhos: undefined, reassistir: undefined })}
                onResetListenPrefs={() => store.updateListenPrefs({ done: false, type: 'Ambos', genres: [], energia: 'mistura', momento: undefined, lingua: undefined, duracao: undefined, novidade: undefined })}
                onResetReadPrefs={() => store.updateReadPrefs({ done: false, type: 'Ambos', genres: [], peso: 'mistura', comprimento: undefined, lingua: undefined, formato: undefined, standalone: undefined, tempoReal: undefined })}
                onResetPlayPrefs={() => store.updatePlayPrefs({ done: false, type: 'Ambos', genres: [], dificuldade: 'normal', jogadores: undefined, online: undefined, duracao: undefined, experiencia: undefined })}
                onResetLearnPrefs={() => store.updateLearnPrefs({ done: false, formato: 'Ambos', genres: [], duracao: 'normal', nivel: undefined, gratis: false, certificado: false, lingua: undefined, objetivo: undefined })}
                onResetVisitPrefs={() => store.updateVisitPrefs({ done: false, tipo: [], custo: 'qualquer', distancia: 'qualquer', altura: undefined, conQuem: undefined, interior: undefined, tempoVisita: undefined, acessivel: false, reserva: undefined, mobilidade: undefined })}
                onResetDoPrefs={() => store.updateDoPrefs({ done: false, contexto: 'qualquer', local: 'qualquer', custo: 'qualquer', duracao: undefined, energia: undefined, objetivo: undefined, meteorologia: undefined, animais: false })}
                permanentPrefs={store.permanentPrefs}
                onUpdatePermanentPrefs={store.updatePermanentPrefs}
                onLogout={handleLogout}
                onToast={toast}
                userId={authUser?.id}
              />
            </div>
          </div>

          <Suggest
            key={`${curCat?.id || 'none'}-${suggestKey}`}
            cat={curCat || CATS[0]}
            profile={store.profile}
            tracking={store.tracking}
            prefs={store.prefs}
            disliked={store.disliked}
            isActive={screen === 'suggest'}
            afterReactTrigger={afterReactTrigger}
            afterReactGenre={afterReactGenre}
            onBack={() => setScreen(prevScreen)}
            onOpenReact={openReact}
            onOpenLink={openLink}
            onOpenWishlist={() => navTo('wishlist')}
            onSwipeYes={() => {
              if (curSugg && curCat) {
                const base = {
                  catId: curCat.id, title: curSugg.title, emoji: curSugg.emoji,
                  cat: curCat.name, date: new Date().toISOString(),
                  type: curSugg.type, genre: curSugg.genre,
                };
                store.updateHistory([{ ...base, action: 'hoje' }, ...store.history]);
                toast('✅ Marcado para hoje!');
              }
            }}
            onSwipeNo={() => {
              toast('⏭ Ok, próxima!');
            }}
            onOpenWhy={() => setWhyOpen(true)}
            onOpenAddToList={() => setAddToListOpen(true)}
            onDisplayItemResolved={(item) => setCurDisplayItem(item)}
            onImgResolved={(img) => setCurSuggImg(img)}
            onApiContextResolved={(ctx) => setCurSuggApiContext(ctx)}
            curSugg={curSugg}
            setCurSugg={setCurSugg}
            watchPrefs={store.watchPrefs}
            eatPrefs={store.eatPrefs}
            listenPrefs={store.listenPrefs}
            readPrefs={store.readPrefs}
            playPrefs={store.playPrefs}
            learnPrefs={store.learnPrefs}
            visitPrefs={store.visitPrefs}
            doPrefs={store.doPrefs}
            permanentPrefs={store.permanentPrefs}
            prefsVersion={suggestKey}
            userId={authUser?.id}
            onReopenOnboard={() => {
              const id = curCat?.id;
              if (id === 'eat')    setEatObOpen(true);
              if (id === 'watch')  setWatchObOpen(true);
              if (id === 'listen') setListenObOpen(true);
              if (id === 'read')   setReadObOpen(true);
              if (id === 'play')   setPlayObOpen(true);
              if (id === 'learn')  setLearnObOpen(true);
              if (id === 'visit')  setVisitObOpen(true);
              if (id === 'do')     setDoObOpen(true);
            }}
          />

          {/* Overlay screens */}
          <Checklist
            history={store.history}
            tracking={store.tracking}
            isActive={screen === 'checklist'}
            onBack={goHome}
            onRemoveHistory={i => {
              const updated = store.history.filter((_, idx) => idx !== i);
              store.updateHistory(updated);
            }}
          />

          <PlanScreen
            profile={store.profile}
            plans={store.plans}
            onUpdatePlans={store.updatePlans}
            onOpenCat={openCat}
            isActive={screen === 'plan'}
            onToast={toast}
            userId={authUser?.id}
          />

          <Metrics
            history={store.history}
            tracking={store.tracking}
            isActive={screen === 'metrics'}
            onBack={goHome}
            onShowWrapped={openMonthlyWrapped}
            onShowAnnualWrapped={openAnnualWrapped}
          />

          <Match
            profile={store.profile}
            isActive={screen === 'match-screen'}
            onBack={goHome}
            onToast={toast}
          />

          <Wishlist
            wishlist={store.wishlist}
            isActive={screen === 'wishlist'}
            onBack={goBack}
            onRemove={i => {
              const updated = store.wishlist.filter((_, idx) => idx !== i);
              store.updateWishlist(updated);
            }}
          />

          <ListsScreen
            lists={store.userLists}
            isActive={screen === 'lista'}
            onUpdateLists={store.updateUserLists}
            onToast={toast}
            onBack={goHome}
          />

          <B2B
            isActive={screen === 'b2b'}
            onBack={goHome}
            onToast={toast}
          />

          <FeedSocial
            isActive={false}
            onNav={navTo}
          />

          <FeedScreen
            profile={store.profile}
            history={store.history}
            isActive={screen === 'feed'}
            onToast={toast}
            userId={authUser?.id}
            userName={store.profile.name}
          />

          <ForYou
            profile={store.profile}
            history={store.history}
            tracking={store.tracking}
            lists={store.userLists}
            isActive={screen === 'para-ti'}
            onBack={() => setScreen('home')}
            onNav={navTo}
            onUpdateLists={store.updateUserLists}
            onToast={toast}
          />

          {/* Bottom Nav */}
          {showBottomNav && (
            <BottomNav activeScreen={screen} onNav={navTo} friendBadge={friendPendingCount} />
          )}

          {/* Panels */}
          <ReactPanel
            item={curSugg}
            cat={curCat}
            isOpen={reactOpen}
            onClose={() => setReactOpen(false)}
            onNow={reactNow}
            onReact={reactAction}
            resolvedImg={curSuggImg}
            actionUrl={curSugg?.platforms?.[0]?.url || null}
            catId={curCat?.id || ''}
          />

          <WhyPanel
            item={curSugg}
            cat={curCat}
            isOpen={whyOpen}
            onClose={() => setWhyOpen(false)}
            onPick={reason => pickWhy(reason)}
            apiContext={curSuggApiContext}
            onSkipNow={() => {
              setWhyOpen(false);
              setAfterReactGenre(null);
              setAfterReactTrigger(t => t + 1);
            }}
          />

          <LinkPanel
            title={linkData.title}
            name={linkData.name}
            url={linkData.url}
            color={linkData.color}
            isOpen={linkOpen}
            onClose={() => setLinkOpen(false)}
            onToast={toast}
          />

          <LivePanel
            title={liveData.title}
            emoji={liveData.emoji}
            catId={liveData.catId}
            tracking={store.tracking}
            isOpen={liveOpen}
            onClose={() => setLiveOpen(false)}
            onUpdateTracking={store.updateTracking}
            onToast={toast}
          />

          <TrackPanel
            item={curSugg}
            catId={curCat?.id || ''}
            tracking={store.tracking}
            isOpen={trackOpen}
            onClose={() => setTrackOpen(false)}
            onSave={store.updateTracking}
            onToast={toast}
          />

          <WrappedGenerator
            data={wrappedGenData}
            isOpen={wrappedGenData !== null}
            onClose={() => setWrappedGenData(null)}
            onToast={toast}
            userId={authUser?.id}
          />

          <SchedulePanel
            item={curSugg}
            catId={curCat?.id || ''}
            catName={curCat?.name || ''}
            isOpen={scheduleOpen}
            onClose={() => setScheduleOpen(false)}
            onSave={(entry: ScheduleEntry) => {
              store.updateSchedules([...store.schedules, entry]);
            }}
            onToast={toast}
          />

          <AddToListPanel
            isOpen={addToListOpen}
            title={curDisplayItem?.title || curSugg?.title || ''}
            emoji={curDisplayItem?.emoji || curSugg?.emoji || '✦'}
            catId={curDisplayItem?.catId || curCat?.id || ''}
            cat={curDisplayItem?.cat || curCat?.name || ''}
            type={curDisplayItem?.type || curSugg?.type || ''}
            lists={store.userLists}
            onClose={() => setAddToListOpen(false)}
            onAddToList={(listId: string) => {
              if (listId.startsWith('__new__')) {
                const parts = listId.split('__');
                // format: ['', 'new', id, emoji, ...name]
                const newListId = parts[2];
                const newListEmoji = parts[3];
                const newListName = parts.slice(4).join('__');
                const newItem: import('./types').UserListItem = {
                  id: Math.random().toString(36).slice(2, 9),
                  title: curDisplayItem?.title || curSugg?.title || '',
                  emoji: curDisplayItem?.emoji || curSugg?.emoji || '❖',
                  catId: curDisplayItem?.catId || curCat?.id || '',
                  cat: curDisplayItem?.cat || curCat?.name || '',
                  type: curDisplayItem?.type || curSugg?.type || '',
                  addedAt: new Date().toISOString(),
                };
                const newList: import('./types').UserList = {
                  id: newListId,
                  name: newListName,
                  emoji: newListEmoji,
                  createdAt: new Date().toISOString(),
                  items: [newItem],
                };
                store.updateUserLists([...store.userLists, newList]);
                toast(`♡ Lista "${newListName}" criada e guardado`);
                setAddToListOpen(false);
                return;
              }
              const itemTitle = curDisplayItem?.title || curSugg?.title || '';
              const itemEmoji = curDisplayItem?.emoji || curSugg?.emoji || '❖';
              const itemCatId = curDisplayItem?.catId || curCat?.id || '';
              const itemCat = curDisplayItem?.cat || curCat?.name || '';
              const itemType = curDisplayItem?.type || curSugg?.type || '';
              if (!itemTitle) return;
              const newItem: import('./types').UserListItem = {
                id: Math.random().toString(36).slice(2, 9),
                title: itemTitle,
                emoji: itemEmoji,
                catId: itemCatId,
                cat: itemCat,
                type: itemType,
                addedAt: new Date().toISOString(),
              };
              const updatedLists = store.userLists.map(l =>
                l.id === listId
                  ? { ...l, items: [...l.items.filter(i => i.title !== newItem.title), newItem] }
                  : l
              );
              store.updateUserLists(updatedLists);
              const listName = store.userLists.find(l => l.id === listId)?.name || '';
              toast(`♡ Guardado em "${listName}"`);
              setAddToListOpen(false);
            }}
            onCreateAndAdd={() => {}}
            onToast={toast}
          />

          <EatOnboard
            isOpen={eatObOpen}
            currentPrefs={store.eatPrefs}
            onClose={(prefs) => { store.updateEatPrefs(prefs); if (prefs.done) { setSuggestKey(v => v + 1); trackAsync({ userId: authUser?.id, eventType: 'inquerito_complete', catId: 'eat' }); } else { trackAsync({ userId: authUser?.id, eventType: 'inquerito_skip', catId: 'eat' }); } setEatObOpen(false); }}
          />

          <WatchOnboard
            isOpen={watchObOpen}
            currentPrefs={store.watchPrefs}
            onClose={(prefs) => { store.updateWatchPrefs(prefs); if (prefs.done) { setSuggestKey(v => v + 1); trackAsync({ userId: authUser?.id, eventType: 'inquerito_complete', catId: 'watch' }); } else { trackAsync({ userId: authUser?.id, eventType: 'inquerito_skip', catId: 'watch' }); } setWatchObOpen(false); }}
          />
          <ListenOnboard
            isOpen={listenObOpen}
            currentPrefs={store.listenPrefs}
            onClose={(prefs) => { store.updateListenPrefs(prefs); if (prefs.done) { setSuggestKey(v => v + 1); trackAsync({ userId: authUser?.id, eventType: 'inquerito_complete', catId: 'listen' }); } else { trackAsync({ userId: authUser?.id, eventType: 'inquerito_skip', catId: 'listen' }); } setListenObOpen(false); }}
          />
          <ReadOnboard
            isOpen={readObOpen}
            currentPrefs={store.readPrefs}
            onClose={(prefs) => { store.updateReadPrefs(prefs); if (prefs.done) { setSuggestKey(v => v + 1); trackAsync({ userId: authUser?.id, eventType: 'inquerito_complete', catId: 'read' }); } else { trackAsync({ userId: authUser?.id, eventType: 'inquerito_skip', catId: 'read' }); } setReadObOpen(false); }}
          />
          <PlayOnboard
            isOpen={playObOpen}
            currentPrefs={store.playPrefs}
            onClose={(prefs) => { store.updatePlayPrefs(prefs); if (prefs.done) { setSuggestKey(v => v + 1); trackAsync({ userId: authUser?.id, eventType: 'inquerito_complete', catId: 'play' }); } else { trackAsync({ userId: authUser?.id, eventType: 'inquerito_skip', catId: 'play' }); } setPlayObOpen(false); }}
          />
          <LearnOnboard
            isOpen={learnObOpen}
            currentPrefs={store.learnPrefs}
            onClose={(prefs) => { store.updateLearnPrefs(prefs); if (prefs.done) { setSuggestKey(v => v + 1); trackAsync({ userId: authUser?.id, eventType: 'inquerito_complete', catId: 'learn' }); } else { trackAsync({ userId: authUser?.id, eventType: 'inquerito_skip', catId: 'learn' }); } setLearnObOpen(false); }}
          />
          <VisitOnboard
            isOpen={visitObOpen}
            currentPrefs={store.visitPrefs}
            onClose={(prefs) => { store.updateVisitPrefs(prefs); if (prefs.done) { setSuggestKey(v => v + 1); trackAsync({ userId: authUser?.id, eventType: 'inquerito_complete', catId: 'visit' }); } else { trackAsync({ userId: authUser?.id, eventType: 'inquerito_skip', catId: 'visit' }); } setVisitObOpen(false); }}
          />
          <DoOnboard
            isOpen={doObOpen}
            currentPrefs={store.doPrefs}
            onClose={(prefs) => { store.updateDoPrefs(prefs); if (prefs.done) { setSuggestKey(v => v + 1); trackAsync({ userId: authUser?.id, eventType: 'inquerito_complete', catId: 'do' }); } else { trackAsync({ userId: authUser?.id, eventType: 'inquerito_skip', catId: 'do' }); } setDoObOpen(false); }}
          />

          <RecipePanel
            item={curSugg}
            isOpen={recipeOpen}
            onClose={() => setRecipeOpen(false)}
          />
        </div>
      )}

      <Toast message={msg} visible={visible} />
    </>
  );
}
