import { useState, useEffect } from 'react';
import type { Profile, HistoryEntry } from '../../types';
import { loadActiveSuggestions } from '../../services/influencers';
import type { InfluencerSuggestion } from '../../services/influencers';
import { loadFeedEvents, loadTrending } from '../../services/feedEvents';
import type { FeedEvent } from '../../services/feedEvents';
import { supabase } from '../../lib/supabase';

interface FeedCard {
  id: string;
  type: 'friend_activity' | 'influencer_post' | 'social_moment' | 'trending';
  // friend_activity / real event
  friendName?: string;
  friendInitial?: string;
  friendColor?: string;
  action?: string;
  userId?: string;
  // trending
  trendCount?: number;
  // influencer_post
  influencer?: { name: string; handle: string; tier: 'gold' | 'silver' | 'base'; platform?: string };
  // social_moment
  people?: string[];
  planItems?: string[];
  // shared
  title: string;
  subtitle?: string;
  img: string | null;
  catId: string;
  catName: string;
  timestamp: string;
  rating?: number;
}

interface Props {
  profile: Profile;
  history: HistoryEntry[];
  isActive: boolean;
  onToast: (msg: string) => void;
  userId?: string;
  userName?: string;
}

const MOCK_FRIENDS = [
  { name: 'Pedro', initial: 'P', color: '#6ab4e0' },
  { name: 'Maria', initial: 'M', color: '#e07b9a' },
  { name: 'João', initial: 'J', color: '#7be0a0' },
  { name: 'Ana', initial: 'A', color: '#e0c47b' },
];

const MOCK_ACTIONS = ['está a ver', 'acabou', 'começou', 'recomenda'];

const ACTION_LABEL: Record<string, string> = {
  started: 'começou',
  marked_today: 'marcou para hoje',
  finished: 'acabou',
  recommended: 'recomenda',
};

const FRIEND_COLORS = ['#6ab4e0', '#e07b9a', '#7be0a0', '#e0c47b', '#c47be0', '#e0a07b'];

function colorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return FRIEND_COLORS[Math.abs(hash) % FRIEND_COLORS.length];
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

const CAT_NAMES: Record<string, string> = {
  watch: 'Ver', eat: 'Comer', read: 'Ler', listen: 'Ouvir',
  play: 'Jogar', learn: 'Aprender', visit: 'Visitar', do: 'Fazer',
};

const MUTED_KEY = 'wt_muted_users';

function getMuted(): string[] {
  try { return JSON.parse(localStorage.getItem(MUTED_KEY) || '[]'); } catch { return []; }
}
function setMuted(ids: string[]) {
  try { localStorage.setItem(MUTED_KEY, JSON.stringify(ids)); } catch { /* */ }
}

function getCatIconSvg(catId: string) {
  const p = { width:12, height:12, viewBox:"0 0 24 24", fill:"none", stroke:"currentColor", strokeWidth:"1.5", strokeLinecap:"round" as const, strokeLinejoin:"round" as const };
  switch(catId) {
    case 'watch': return <svg {...p}><rect x="2" y="7" width="20" height="13" rx="2"/><path d="M16 2l-4 5-4-5"/></svg>;
    case 'eat': return <svg {...p}><path d="M3 2v7c0 1.1.9 2 2 2h0a2 2 0 0 0 2-2V2"/><path d="M5 2v20M21 2c0 0-2 2-2 8h4c0-6-2-8-2-8z"/><path d="M19 10v12"/></svg>;
    case 'read': return <svg {...p}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>;
    case 'listen': return <svg {...p}><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>;
    case 'play': return <svg {...p}><rect x="2" y="6" width="20" height="12" rx="3"/><path d="M6 12h4m-2-2v4"/><circle cx="16" cy="11" r="1" fill="currentColor" stroke="none"/><circle cx="18" cy="13" r="1" fill="currentColor" stroke="none"/></svg>;
    default: return <svg {...p}><circle cx="12" cy="12" r="10"/></svg>;
  }
}

export default function FeedScreen({ profile: _profile, history: _history, isActive, onToast, userId: _userId }: Props) {
  const [cards, setCards] = useState<FeedCard[]>([]);
  const [personPopup, setPersonPopup] = useState<{
    name: string; handle?: string; platform?: string; tier?: string;
    isInfluencer: boolean; userId?: string; isMuted?: boolean;
  } | null>(null);
  const [suggPopup, setSuggPopup] = useState<FeedCard | null>(null);
  const [friendsBarExpanded, setFriendsBarExpanded] = useState(false);
  const [following, setFollowing] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isActive) return;
    buildFeed();
  }, [isActive]); // eslint-disable-line react-hooks/exhaustive-deps

  const buildFeed = async () => {
    const muted = getMuted();

    // Fetch real events + trending in parallel
    const [realEvents, trending, infSuggs] = await Promise.all([
      loadFeedEvents(30),
      loadTrending(undefined, 5),
      loadActiveSuggestions().catch(() => [] as InfluencerSuggestion[]),
    ]);

    // Filter muted users from real events
    const filteredEvents = realEvents.filter(e => !muted.includes(e.userId));

    const feedCards: FeedCard[] = [];

    if (filteredEvents.length > 0) {
      // Build cards from real events
      filteredEvents.forEach((ev: FeedEvent) => {
        const color = colorForName(ev.displayName);
        feedCards.push({
          id: `ev-${ev.id}`,
          type: 'friend_activity',
          friendName: ev.displayName,
          friendInitial: ev.displayName[0]?.toUpperCase() || '?',
          friendColor: color,
          action: ACTION_LABEL[ev.actionType] || ev.actionType,
          userId: ev.userId,
          title: ev.title,
          subtitle: `${ev.catName} · ${ACTION_LABEL[ev.actionType] || ev.actionType}`,
          img: ev.img,
          catId: ev.catId,
          catName: ev.catName,
          timestamp: timeAgo(ev.createdAt),
          rating: ev.rating ?? undefined,
        });
      });
    } else {
      // Fallback: mock friends
      MOCK_FRIENDS.forEach((friend, i) => {
        const action = MOCK_ACTIONS[i % MOCK_ACTIONS.length];
        const titles = ['Severance', 'The Bear', 'Balatro', 'Dune: Part Two', 'Silo'];
        const imgs: (string | null)[] = [
          'https://image.tmdb.org/t/p/w780/HnE7z8dwLM6hNmBHD1JdVXbqSvL.jpg',
          'https://image.tmdb.org/t/p/w780/sJbJsEZ5SM5LFxCIAJoRS3pqxA.jpg',
          null,
          'https://image.tmdb.org/t/p/w780/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
          null,
        ];
        feedCards.push({
          id: `friend-${i}`,
          type: 'friend_activity',
          friendName: friend.name,
          friendInitial: friend.initial,
          friendColor: friend.color,
          action,
          title: titles[i] || 'Severance',
          subtitle: action === 'recomenda' ? 'Recomenda vivamente' : action === 'acabou' ? 'Acabou de ver' : 'A ver agora',
          img: imgs[i] || null,
          catId: 'watch',
          catName: 'Ver',
          timestamp: `${i + 1}h`,
          rating: action === 'recomenda' ? 9.1 : undefined,
        });
      });
    }

    // Build trending cards
    const trendCards: FeedCard[] = trending.map((t, i) => ({
      id: `trend-${i}`,
      type: 'trending' as const,
      trendCount: t.count,
      title: t.title,
      subtitle: `${t.count} ${t.count === 1 ? 'pessoa começou' : 'pessoas começaram'} esta semana`,
      img: t.img,
      catId: t.catId,
      catName: t.catName,
      timestamp: 'Tendência',
    }));

    // Build influencer cards
    const goldCards: FeedCard[] = infSuggs
      .filter((s: InfluencerSuggestion) => s.influencerTier === 'gold' && s.active)
      .slice(0, 3)
      .map((s: InfluencerSuggestion) => ({
        id: `inf-${s.id}`,
        type: 'influencer_post' as const,
        influencer: { name: s.influencerName, handle: s.influencerHandle, tier: 'gold' as const },
        title: s.title,
        subtitle: s.desc?.substring(0, 80),
        img: s.img || null,
        catId: s.catId,
        catName: CAT_NAMES[s.catId] || s.catId,
        timestamp: 'Sugestão',
        rating: s.rating || undefined,
      }));

    // Compose final feed order
    const result: FeedCard[] = [];
    let ei = 0; // event index
    let ti = 0; // trending index
    let gi = 0; // gold influencer index

    // pos 0: first real event (or mock)
    if (feedCards[ei]) result.push(feedCards[ei++]);
    // pos 1: trending #1
    if (trendCards[ti]) result.push(trendCards[ti++]);
    // pos 2-3: events
    if (feedCards[ei]) result.push(feedCards[ei++]);
    if (feedCards[ei]) result.push(feedCards[ei++]);
    // pos 4: gold influencer
    if (goldCards[gi]) result.push(goldCards[gi++]);
    // pos 5: trending #2
    if (trendCards[ti]) result.push(trendCards[ti++]);
    // rest: remaining events + remaining gold/silver influencers interleaved
    const remaining = feedCards.slice(ei);
    const silverCards = infSuggs
      .filter((s: InfluencerSuggestion) => (s.influencerTier === 'silver' || s.influencerTier === 'base') && s.active)
      .slice(0, 4)
      .map((s: InfluencerSuggestion) => ({
        id: `inf-s-${s.id}`,
        type: 'influencer_post' as const,
        influencer: { name: s.influencerName, handle: s.influencerHandle, tier: s.influencerTier as 'gold' | 'silver' | 'base' },
        title: s.title,
        subtitle: s.desc?.substring(0, 80),
        img: s.img || null,
        catId: s.catId,
        catName: CAT_NAMES[s.catId] || s.catId,
        timestamp: 'Sugestão',
        rating: s.rating || undefined,
      }));

    remaining.forEach((card, i) => {
      result.push(card);
      // interleave remaining gold + silver every 3 cards
      if (i % 3 === 1) {
        const inf = goldCards[gi] || silverCards[i % silverCards.length];
        if (inf) { result.push(inf); if (goldCards[gi]) gi++; }
      }
      // interleave remaining trending
      if (i % 4 === 2 && trendCards[ti]) result.push(trendCards[ti++]);
    });

    setCards(result);
  };

  const handleFollowUser = async (targetUserId: string | undefined, name: string) => {
    if (!targetUserId) { onToast('✦ A seguir ' + name + '!'); return; }
    try {
      await supabase.from('user_follows').insert({ follower_id: _userId, followed_id: targetUserId });
      setFollowing(prev => new Set([...prev, targetUserId]));
      onToast('✦ A seguir ' + name + '!');
    } catch {
      onToast('✦ A seguir ' + name + '!');
    }
  };

  const handleUnfollowUser = async (targetUserId: string | undefined, name: string) => {
    if (!targetUserId) { onToast('Deixaste de seguir ' + name); return; }
    try {
      await supabase.from('user_follows').delete().match({ follower_id: _userId, followed_id: targetUserId });
      setFollowing(prev => { const s = new Set(prev); s.delete(targetUserId); return s; });
      onToast('Deixaste de seguir ' + name);
    } catch {
      onToast('Deixaste de seguir ' + name);
    }
  };

  const handleMuteUser = (targetUserId: string | undefined, name: string) => {
    if (!targetUserId) { onToast('Silenciado'); return; }
    const muted = getMuted();
    if (!muted.includes(targetUserId)) setMuted([...muted, targetUserId]);
    setCards(prev => prev.filter(c => c.userId !== targetUserId));
    onToast('Silenciado: ' + name);
    setPersonPopup(null);
  };

  if (!isActive) return null;

  return (
    <div style={{ position:'fixed', inset:0, background:'#060810', overflowY:'auto', zIndex:10 }}>
      {/* Header */}
      <div style={{ position:'sticky', top:0, zIndex:20, background:'rgba(6,8,16,0.9)', backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)', padding:'52px 20px 12px', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, fontWeight:700, fontStyle:'italic', color:'#f5f1eb', letterSpacing:-0.3 }}>Feed</div>
      </div>

      {/* Barra lateral de amigos */}
      <div style={{ position:'fixed', left:0, top:'50%', transform:'translateY(-50%)', zIndex:50, display:'flex', flexDirection:'column', alignItems:'flex-start' }}>
        <div
          style={{ background:'rgba(10,12,20,0.92)', backdropFilter:'blur(20px)', border:'1px solid rgba(255,255,255,0.08)', borderLeft:'none', borderRadius:'0 16px 16px 0', padding:'10px 8px', display:'flex', flexDirection:'column', gap:8, cursor:'pointer', transition:'all 0.25s' }}
          onMouseEnter={() => setFriendsBarExpanded(true)}
          onMouseLeave={() => setFriendsBarExpanded(false)}
          onClick={() => setFriendsBarExpanded(v => !v)}
        >
          {MOCK_FRIENDS.map((f, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:friendsBarExpanded ? 10 : 0, overflow:'hidden', transition:'all 0.25s', width: friendsBarExpanded ? 'auto' : 28 }}>
              <div style={{ width:28, height:28, borderRadius:'50%', background:f.color+'22', border:`1.5px solid ${f.color}44`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:f.color, flexShrink:0, position:'relative' }}>
                {f.initial}
                <div style={{ position:'absolute', bottom:0, right:0, width:7, height:7, borderRadius:'50%', background:'#4ade80', border:'1.5px solid #060810' }} />
              </div>
              {friendsBarExpanded && (
                <span style={{ fontSize:11, color:'rgba(245,241,235,0.7)', fontFamily:"'Outfit',sans-serif", whiteSpace:'nowrap' }}>{f.name}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Cards */}
      <div style={{ padding:'12px 16px 100px' }}>
        {cards.map(card => (
          <div key={card.id} style={{ marginBottom:16, borderRadius:20, overflow:'hidden', background: card.type === 'trending' ? 'rgba(200,155,60,0.04)' : 'rgba(255,255,255,0.03)', border: card.type === 'trending' ? '1px solid rgba(200,155,60,0.15)' : '1px solid rgba(255,255,255,0.07)' }}>
            {/* Card header */}
            <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 14px 0' }}>
              {card.type === 'friend_activity' && (
                <>
                  <div onClick={() => setPersonPopup({ name: card.friendName!, isInfluencer: false, userId: card.userId, isMuted: getMuted().includes(card.userId || '') })}
                    style={{ width:32, height:32, borderRadius:'50%', background:(card.friendColor||'#C89B3C')+'22', border:`1.5px solid ${card.friendColor||'#C89B3C'}44`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:card.friendColor||'#C89B3C', cursor:'pointer', flexShrink:0 }}>
                    {card.friendInitial}
                  </div>
                  <div style={{ flex:1 }}>
                    <button onClick={() => setPersonPopup({ name: card.friendName!, isInfluencer: false, userId: card.userId, isMuted: getMuted().includes(card.userId || '') })}
                      style={{ background:'none', border:'none', padding:0, cursor:'pointer', fontFamily:"'Outfit',sans-serif", fontSize:13, fontWeight:600, color:'#f5f1eb' }}>
                      {card.friendName}
                    </button>
                    <span style={{ fontSize:12, color:'rgba(156,165,185,0.6)', marginLeft:6 }}>{card.action}</span>
                  </div>
                  <span style={{ fontSize:10, color:'rgba(156,165,185,0.35)' }}>{card.timestamp}</span>
                </>
              )}
              {card.type === 'trending' && (
                <>
                  <div style={{ width:32, height:32, borderRadius:'50%', background:'rgba(200,155,60,0.12)', border:'1.5px solid rgba(200,155,60,0.25)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#C89B3C" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  </div>
                  <div style={{ flex:1 }}>
                    <span style={{ fontFamily:"'Outfit',sans-serif", fontSize:12, fontWeight:600, color:'rgba(200,155,60,0.8)', letterSpacing:0.3 }}>✦ Tendência esta semana</span>
                  </div>
                  <span style={{ fontSize:10, color:'rgba(156,165,185,0.35)' }}>{card.trendCount} <span style={{ opacity:0.6 }}>pessoas</span></span>
                </>
              )}
              {card.type === 'influencer_post' && card.influencer && (
                <>
                  <div style={{ width:32, height:32, borderRadius:'50%', background:'rgba(200,155,60,0.15)', border:'1.5px solid rgba(200,155,60,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'#C89B3C', flexShrink:0 }}>
                    {card.influencer.name[0]}
                  </div>
                  <div style={{ flex:1 }}>
                    <button onClick={() => setPersonPopup({ name: card.influencer!.name, handle: card.influencer!.handle, platform: card.influencer!.platform, tier: card.influencer!.tier, isInfluencer: true })}
                      style={{ background:'none', border:'none', padding:0, cursor:'pointer', fontFamily:"'Outfit',sans-serif", fontSize:13, fontWeight:600, color:'#C89B3C' }}>
                      {card.influencer.name}
                    </button>
                    <span style={{ fontSize:11, color:'rgba(156,165,185,0.5)', marginLeft:6 }}>@{card.influencer.handle}</span>
                  </div>
                  <div style={{ fontSize:10, letterSpacing:1, color:'rgba(200,155,60,0.7)', background:'rgba(200,155,60,0.08)', border:'1px solid rgba(200,155,60,0.2)', borderRadius:6, padding:'2px 6px' }}>{card.influencer.tier.toUpperCase()}</div>
                </>
              )}
              {card.type === 'social_moment' && card.people && (
                <>
                  <div style={{ display:'flex' }}>
                    {card.people.slice(0,3).map((p, i) => (
                      <div key={i} style={{ width:24, height:24, borderRadius:'50%', background:'rgba(200,155,60,0.15)', border:'1.5px solid #060810', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:700, color:'#C89B3C', marginLeft: i>0?-8:0 }}>{p[0]}</div>
                    ))}
                  </div>
                  <div style={{ flex:1, fontSize:12, color:'rgba(245,241,235,0.7)', fontFamily:"'Outfit',sans-serif" }}>
                    {card.people.slice(0,2).join(' e ')} {card.people.length > 2 ? `+${card.people.length-2}` : ''} decidiram juntos
                  </div>
                  <span style={{ fontSize:10, color:'rgba(156,165,185,0.35)' }}>{card.timestamp}</span>
                </>
              )}
            </div>

            {/* Imagem */}
            {card.img && (
              <div style={{ margin:'10px 14px 0', borderRadius:14, overflow:'hidden', height:200, position:'relative', cursor:'pointer' }}
                onClick={() => setSuggPopup(card)}>
                <img src={card.img} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center' }} onError={e => { (e.currentTarget as HTMLImageElement).style.display='none'; }} />
                <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(6,8,16,0.7) 0%, transparent 50%)' }} />
                <div style={{ position:'absolute', bottom:10, left:12, right:12 }}>
                  <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:18, fontWeight:700, fontStyle:'italic', color:'#f5f1eb' }}>{card.title}</div>
                  {card.type === 'social_moment' && card.planItems && (
                    <div style={{ fontSize:11, color:'rgba(245,241,235,0.6)', marginTop:2 }}>{card.planItems.join(' · ')}</div>
                  )}
                  {card.type === 'trending' && card.subtitle && (
                    <div style={{ fontSize:11, color:'rgba(200,155,60,0.7)', marginTop:2 }}>{card.subtitle}</div>
                  )}
                </div>
              </div>
            )}

            {/* Título quando não há imagem */}
            {!card.img && (
              <div style={{ padding:'8px 14px 0' }}>
                <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:17, fontWeight:700, fontStyle:'italic', color:'#f5f1eb', cursor: card.type !== 'social_moment' ? 'pointer' : 'default' }}
                  onClick={() => card.type !== 'social_moment' && setSuggPopup(card)}>
                  {card.title}
                </div>
                {card.subtitle && <div style={{ fontSize:11, color: card.type === 'trending' ? 'rgba(200,155,60,0.65)' : 'rgba(156,165,185,0.5)', marginTop:3 }}>{card.subtitle}</div>}
              </div>
            )}

            {/* Info bar */}
            <div style={{ padding:'10px 14px 14px', display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ color:'rgba(156,165,185,0.4)' }}>{getCatIconSvg(card.catId)}</span>
              <span style={{ fontSize:11, color:'rgba(156,165,185,0.5)' }}>{card.catName}</span>
              {card.rating && <>
                <span style={{ color:'rgba(156,165,185,0.25)' }}>·</span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="#C89B3C" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                <span style={{ fontSize:11, color:'rgba(200,155,60,0.7)' }}>{card.rating}</span>
              </>}
              <div style={{ flex:1 }} />
              {card.type === 'social_moment' && (
                <button onClick={() => onToast('✦ Abrir plano')} style={{ fontSize:11, color:'#C89B3C', background:'rgba(200,155,60,0.08)', border:'1px solid rgba(200,155,60,0.2)', borderRadius:8, padding:'4px 10px', cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>
                  Criar plano igual
                </button>
              )}
              {(card.type === 'influencer_post' || card.type === 'trending') && (
                <button onClick={() => setSuggPopup(card)} style={{ fontSize:11, color:'#C89B3C', background:'rgba(200,155,60,0.08)', border:'1px solid rgba(200,155,60,0.2)', borderRadius:8, padding:'4px 10px', cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>
                  {card.type === 'trending' ? 'Ver sugestões' : 'Aceitar sugestão'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pop-up de pessoa */}
      {personPopup && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)', display:'flex', alignItems:'flex-end', justifyContent:'center', padding:'0 16px 24px', zIndex:200 }}
          onClick={() => setPersonPopup(null)}>
          <div style={{ width:'100%', maxWidth:480, background:'rgba(10,12,20,0.97)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:24, padding:'20px 20px 28px' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ width:36, height:3, background:'rgba(255,255,255,0.15)', borderRadius:10, margin:'0 auto 20px' }} />
            {personPopup.isInfluencer ? (
              <>
                <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:20 }}>
                  <div style={{ width:52, height:52, borderRadius:'50%', background:'rgba(200,155,60,0.15)', border:'2px solid rgba(200,155,60,0.4)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, fontWeight:700, color:'#C89B3C' }}>{personPopup.name[0]}</div>
                  <div>
                    <div style={{ fontFamily:"'Outfit',sans-serif", fontSize:16, fontWeight:700, color:'#f5f1eb' }}>{personPopup.name}</div>
                    <div style={{ fontSize:12, color:'rgba(200,155,60,0.7)', marginTop:2 }}>@{personPopup.handle} · {personPopup.platform || 'Instagram'}</div>
                  </div>
                  <div style={{ marginLeft:'auto', fontSize:10, color:'rgba(200,155,60,0.8)', background:'rgba(200,155,60,0.1)', border:'1px solid rgba(200,155,60,0.25)', borderRadius:8, padding:'3px 8px' }}>{(personPopup.tier || 'GOLD').toUpperCase()}</div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  <button onClick={() => { window.open(`https://instagram.com/${personPopup.handle}`, '_blank'); onToast('A abrir perfil...'); setPersonPopup(null); }}
                    style={{ padding:'13px 16px', background:'linear-gradient(135deg,rgba(200,155,60,0.15),rgba(168,117,53,0.08))', border:'1px solid rgba(200,155,60,0.35)', borderRadius:14, color:'#C89B3C', fontFamily:"'Outfit',sans-serif", fontSize:13, fontWeight:600, cursor:'pointer' }}>
                    Abrir perfil no {personPopup.platform || 'Instagram'}
                  </button>
                  <button onClick={() => { handleFollowUser(undefined, personPopup.handle || personPopup.name); setPersonPopup(null); }}
                    style={{ padding:'13px 16px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:14, color:'rgba(245,241,235,0.7)', fontFamily:"'Outfit',sans-serif", fontSize:13, cursor:'pointer' }}>
                    Seguir
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{ fontFamily:"'Outfit',sans-serif", fontSize:16, fontWeight:700, color:'#f5f1eb', marginBottom:16 }}>{personPopup.name}</div>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {[
                    { label: following.has(personPopup.userId || '') ? 'Deixar de seguir' : 'Seguir', icon: following.has(personPopup.userId || '') ? '×' : '+', action: () => { following.has(personPopup.userId || '') ? handleUnfollowUser(personPopup.userId, personPopup.name) : handleFollowUser(personPopup.userId, personPopup.name); setPersonPopup(null); }, danger: following.has(personPopup.userId || '') },
                    { label: 'Silenciar', icon: '○', action: () => handleMuteUser(personPopup.userId, personPopup.name), danger: false },
                  ].map((act, i) => (
                    <button key={i} onClick={act.action}
                      style={{ padding:'12px 16px', background: i===0 && !act.danger ? 'rgba(200,155,60,0.08)' : 'rgba(255,255,255,0.03)', border:`1px solid ${i===0 && !act.danger ? 'rgba(200,155,60,0.2)' : act.danger ? 'rgba(224,112,112,0.2)' : 'rgba(255,255,255,0.07)'}`, borderRadius:12, color: act.danger ? 'rgba(224,112,112,0.7)' : i===0 ? '#C89B3C' : 'rgba(245,241,235,0.7)', fontFamily:"'Outfit',sans-serif", fontSize:13, cursor:'pointer', textAlign:'left', display:'flex', alignItems:'center', gap:10 }}>
                      <span style={{ fontSize:14 }}>{act.icon}</span>{act.label}
                    </button>
                  ))}
                </div>
              </>
            )}
            <button onClick={() => setPersonPopup(null)} style={{ width:'100%', marginTop:14, padding:'11px', background:'transparent', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, color:'rgba(156,165,185,0.5)', fontSize:12, fontFamily:"'Outfit',sans-serif", cursor:'pointer' }}>fechar</button>
          </div>
        </div>
      )}

      {/* Pop-up de sugestão */}
      {suggPopup && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)', display:'flex', alignItems:'flex-end', justifyContent:'center', padding:'0 16px 24px', zIndex:200 }}
          onClick={() => setSuggPopup(null)}>
          <div style={{ width:'100%', maxWidth:480, background:'rgba(10,12,20,0.97)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:24, padding:'20px 20px 28px' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ width:36, height:3, background:'rgba(255,255,255,0.15)', borderRadius:10, margin:'0 auto 20px' }} />
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, fontWeight:700, fontStyle:'italic', color:'#f5f1eb', marginBottom:6 }}>{suggPopup.title}</div>
            <div style={{ fontSize:11, color:'rgba(156,165,185,0.5)', marginBottom:20 }}>{suggPopup.catName}{suggPopup.rating ? ` · ★ ${suggPopup.rating}` : ''}{suggPopup.type === 'trending' && suggPopup.subtitle ? ` · ${suggPopup.subtitle}` : ''}</div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <button onClick={() => { onToast('✦ Adicionado ao histórico'); setSuggPopup(null); }}
                style={{ padding:'13px 16px', background:'linear-gradient(135deg,rgba(200,155,60,0.15),rgba(168,117,53,0.08))', border:'1px solid rgba(200,155,60,0.35)', borderRadius:14, color:'#C89B3C', fontFamily:"'Outfit',sans-serif", fontSize:13, fontWeight:600, cursor:'pointer', textAlign:'left' }}>
                Ver agora
              </button>
              <button onClick={() => { onToast('Agendado'); setSuggPopup(null); }}
                style={{ padding:'13px 16px', background:'rgba(106,180,224,0.07)', border:'1px solid rgba(106,180,224,0.2)', borderRadius:14, color:'rgba(106,180,224,0.8)', fontFamily:"'Outfit',sans-serif", fontSize:13, cursor:'pointer', textAlign:'left' }}>
                Agendar
              </button>
              <button onClick={() => { onToast('Guardado'); setSuggPopup(null); }}
                style={{ padding:'13px 16px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, color:'rgba(245,241,235,0.6)', fontFamily:"'Outfit',sans-serif", fontSize:13, cursor:'pointer', textAlign:'left' }}>
                Guardar em lista
              </button>
            </div>
            <button onClick={() => setSuggPopup(null)} style={{ width:'100%', marginTop:14, padding:'11px', background:'transparent', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, color:'rgba(156,165,185,0.5)', fontSize:12, fontFamily:"'Outfit',sans-serif", cursor:'pointer' }}>fechar</button>
          </div>
        </div>
      )}
    </div>
  );
}
