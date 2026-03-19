import { useState, useCallback, useRef } from 'react';
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
import ForYou from './components/screens/ForYou';

import ReactPanel from './components/panels/ReactPanel';
import WhyPanel from './components/panels/WhyPanel';
import LinkPanel from './components/panels/LinkPanel';
import LivePanel from './components/panels/LivePanel';
import TrackPanel from './components/panels/TrackPanel';
import WrappedOverlay from './components/panels/WrappedOverlay';
import SchedulePanel from './components/panels/SchedulePanel';
import AddToListPanel from './components/panels/AddToListPanel';

const SWIPE_THRESHOLD = 60;

export default function App() {
  const store = useAppStore();
  const { msg, visible, toast } = useToast();

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
  const [wrappedOpen, setWrappedOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  // Link panel data
  const [linkData, setLinkData] = useState({ title: '', name: '', url: '', color: '' });
  // Live panel data
  const [liveData, setLiveData] = useState({ title: '', emoji: '', catId: '' });

  // Gesture detection refs
  const gestureStartX = useRef<number | null>(null);
  const gestureStartY = useRef<number | null>(null);

  const goHome = useCallback(() => {
    setScreen('home');
  }, []);

  const goBack = useCallback(() => {
    setScreen(prevScreen);
  }, [prevScreen]);

  const navTo = useCallback((s: Screen) => {
    setPrevScreen(prev => screen !== s ? screen : prev);
    setScreen(s);
  }, [screen]);

  const openCat = useCallback((id: string, item?: DataItem) => {
    const cat = CATS.find(c => c.id === id);
    if (!cat) return;
    setCurCat(cat);
    setCurSugg(item || null);
    setPrevScreen('home');
    setScreen('suggest');
    if (id === 'eat')    setEatObOpen(true);
    if (id === 'watch')  setWatchObOpen(true);
    if (id === 'listen') setListenObOpen(true);
    if (id === 'read')   setReadObOpen(true);
    if (id === 'play')   setPlayObOpen(true);
    if (id === 'learn')  setLearnObOpen(true);
    if (id === 'visit')  setVisitObOpen(true);
    if (id === 'do')     setDoObOpen(true);
  }, []);

  const surpriseMe = useCallback(() => {
    openCat(CATS[Math.floor(Math.random() * CATS.length)].id);
  }, [openCat]);

  const openReact = useCallback(() => setReactOpen(true), []);

  const openLink = useCallback((url: string, name: string, color: string) => {
    setLinkData({ title: curSugg?.title || '', name, url, color });
    setLinkOpen(true);
  }, [curSugg]);

  const openLive = useCallback((title: string, emoji: string, catId: string) => {
    setLiveData({ title, emoji, catId });
    setLiveOpen(true);
  }, []);



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
    // Se mudou o tipo de conteúdo, actualiza também watchPrefs para forçar re-discover imediato
    if (reason.p === 'type' && curCat?.id === 'watch' && typeof reason.v === 'string') {
      store.updateWatchPrefs({ ...store.watchPrefs, type: reason.v as 'Filme' | 'Série' | 'Ambos' });
    }
    toast(`${reason.icon} Percebido!`);
    // Load next suggestion immediately
    setAfterReactGenre(curSugg.genre || null);
    setAfterReactTrigger(t => t + 1);
  }, [curSugg, curCat, store, toast]);

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
      if (dx < -SWIPE_THRESHOLD) navTo('friends');
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
  const showBottomNav = isOnboarded && !['onboard', 'suggest'].includes(screen);
  const hSlot = screen === 'friends' ? 0 : screen === 'profile' ? 2 : 1;
  const overlayActive = !['home', 'friends', 'profile'].includes(screen);

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
          style={{ width: '100%', height: '100%' }}
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
              <Friends isActive={true} onNav={navTo} onToast={toast} />
            </div>
            <div className="h-pane">
              <Home
                profile={store.profile}
                history={store.history}
                tracking={store.tracking}
                schedules={store.schedules}
                onOpenCat={openCat}
                onSurprise={surpriseMe}
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
                onResetEatPrefs={() => store.updateEatPrefs({ done: false, local: [], fome: 'normal', budget: 'medio', restrictions: [], tempo: 'normal' })}
                onResetWatchPrefs={() => store.updateWatchPrefs({ done: false, genres: [], duration: 'normal', type: 'Ambos', discovery: 'mistura' })}
                onResetListenPrefs={() => store.updateListenPrefs({ done: false, type: 'Ambos', genres: [], energia: 'mistura' })}
                onResetReadPrefs={() => store.updateReadPrefs({ done: false, type: 'Ambos', genres: [], peso: 'mistura' })}
                onResetPlayPrefs={() => store.updatePlayPrefs({ done: false, type: 'Ambos', genres: [], dificuldade: 'normal' })}
                onResetLearnPrefs={() => store.updateLearnPrefs({ done: false, formato: 'Ambos', genres: [], duracao: 'normal' })}
                onResetVisitPrefs={() => store.updateVisitPrefs({ done: false, tipo: [], custo: 'qualquer', distancia: 'qualquer' })}
                onResetDoPrefs={() => store.updateDoPrefs({ done: false, contexto: 'qualquer', local: 'qualquer', custo: 'qualquer' })}
                permanentPrefs={store.permanentPrefs}
                onUpdatePermanentPrefs={store.updatePermanentPrefs}
                onToast={toast}
              />
            </div>
          </div>

          <Suggest
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

          <Metrics
            history={store.history}
            tracking={store.tracking}
            isActive={screen === 'metrics'}
            onBack={goHome}
            onShowWrapped={() => setWrappedOpen(true)}
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
          />

          <B2B
            isActive={screen === 'b2b'}
            onBack={goHome}
            onToast={toast}
          />

          <FeedSocial
            isActive={screen === 'feed'}
            onNav={navTo}
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
            <BottomNav activeScreen={screen} onNav={navTo} />
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

          <WrappedOverlay
            history={store.history}
            tracking={store.tracking}
            isOpen={wrappedOpen}
            onClose={() => setWrappedOpen(false)}
            onToast={toast}
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
            title={curSugg?.title || ''}
            emoji={curSugg?.emoji || '✦'}
            catId={curCat?.id || ''}
            cat={curCat?.name || ''}
            type={curSugg?.type || ''}
            lists={store.userLists}
            onClose={() => setAddToListOpen(false)}
            onAddToList={(listId: string) => {
              if (!curSugg || !curCat) return;
              const newItem: import('./types').UserListItem = {
                id: Math.random().toString(36).slice(2, 9),
                title: curSugg.title,
                emoji: curSugg.emoji,
                catId: curCat.id,
                cat: curCat.name,
                type: curSugg.type,
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
            onClose={(prefs) => { store.updateEatPrefs(prefs); setEatObOpen(false); }}
          />

          <WatchOnboard
            isOpen={watchObOpen}
            currentPrefs={store.watchPrefs}
            onClose={(prefs) => { store.updateWatchPrefs(prefs); setWatchObOpen(false); }}
          />
          <ListenOnboard
            isOpen={listenObOpen}
            currentPrefs={store.listenPrefs}
            onClose={(prefs) => { store.updateListenPrefs(prefs); setListenObOpen(false); }}
          />
          <ReadOnboard
            isOpen={readObOpen}
            currentPrefs={store.readPrefs}
            onClose={(prefs) => { store.updateReadPrefs(prefs); setReadObOpen(false); }}
          />
          <PlayOnboard
            isOpen={playObOpen}
            currentPrefs={store.playPrefs}
            onClose={(prefs) => { store.updatePlayPrefs(prefs); setPlayObOpen(false); }}
          />
          <LearnOnboard
            isOpen={learnObOpen}
            currentPrefs={store.learnPrefs}
            onClose={(prefs) => { store.updateLearnPrefs(prefs); setLearnObOpen(false); }}
          />
          <VisitOnboard
            isOpen={visitObOpen}
            currentPrefs={store.visitPrefs}
            onClose={(prefs) => { store.updateVisitPrefs(prefs); setVisitObOpen(false); }}
          />
          <DoOnboard
            isOpen={doObOpen}
            currentPrefs={store.doPrefs}
            onClose={(prefs) => { store.updateDoPrefs(prefs); setDoObOpen(false); }}
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
