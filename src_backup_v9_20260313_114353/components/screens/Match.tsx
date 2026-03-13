import { useState, useRef } from 'react';
import type { MatchState, DataItem, Profile } from '../../types';
import { CATS, DATA, GRAD } from '../../data';

const MAX_YES = 5;

interface MatchProps {
  profile: Profile;
  isActive: boolean;
  onBack: () => void;
  onToast: (msg: string) => void;
}

function initMatch(): MatchState {
  return { step: 'intro', mode: null, cat: null, sub: null, participants: [], pool: [], idx: 0, votes: {}, currentVoter: 0 };
}

const INTRO_CAT_IDS = ['watch', 'eat', 'play', 'read', 'do'];

const WHO_IMAGES: Record<string, string> = {
  sozinho: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&q=80',
  casal: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=200&q=80',
  amigos: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=200&q=80',
};

const MATCH_CAT_IMAGES: Record<string, string> = {
  watch: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=200&q=80',
  eat: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&q=80',
  read: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=200&q=80',
  listen: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=200&q=80',
  play: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=200&q=80',
  learn: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=200&q=80',
  visit: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=200&q=80',
  do: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&q=80',
};

const MATCH_CAT_SVGS: Record<string, React.ReactNode> = {
  watch: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="13" rx="2"/>
      <path d="M16 2l-4 5-4-5"/>
    </svg>
  ),
  eat: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 2v7c0 1.1.9 2 2 2h0a2 2 0 0 0 2-2V2"/>
      <path d="M5 2v20M21 2c0 0-2 2-2 8h4c0-6-2-8-2-8z"/>
      <path d="M19 10v12"/>
    </svg>
  ),
  play: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="12" rx="3"/>
      <path d="M6 12h4m-2-2v4"/>
      <circle cx="16" cy="11" r="1" fill="currentColor" stroke="none"/>
      <circle cx="18" cy="13" r="1" fill="currentColor" stroke="none"/>
    </svg>
  ),
  read: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
  ),
  do: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
};

const WHO_SVGS = {
  sozinho: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  casal: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  amigos: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
};

export default function Match({ profile, isActive, onBack, onToast }: MatchProps) {
  const [mS, setMS] = useState<MatchState>(initMatch);
  const addInputRef = useRef<HTMLInputElement>(null);

  // Intro questionnaire state
  const [introCat, setIntroCat] = useState<string | null>(null);
  const [introWho, setIntroWho] = useState<string | null>(null);

  const myName = profile.name || 'Eu';

  const reset = () => {
    setIntroCat(null);
    setIntroWho(null);
    setMS(initMatch());
  };

  const selectMode = (mode: 'offline' | 'online') => {
    setMS(s => ({ ...s, mode }));
  };

  const addPerson = (name: string) => {
    if (mS.participants.includes(name)) { onToast('Já está na lista'); return; }
    if (mS.participants.length >= 6) { onToast('Máximo 6 participantes'); return; }
    setMS(s => ({ ...s, participants: [...s.participants, name] }));
  };

  const addFromInput = () => {
    const name = addInputRef.current?.value.trim();
    if (!name) { onToast('Escreve um nome'); return; }
    if (mS.participants.includes(name)) { onToast('Já está na lista'); if (addInputRef.current) addInputRef.current.value = ''; return; }
    addPerson(name);
    if (addInputRef.current) addInputRef.current.value = '';
    onToast(`+ ${name} adicionado`);
  };

  const removePerson = (i: number) => {
    if (i === 0) { onToast('Não podes remover-te a ti mesmo'); return; }
    setMS(s => ({ ...s, participants: s.participants.filter((_, idx) => idx !== i) }));
  };

  const goToPickCat = () => {
    if (mS.participants.length < 2 && mS.mode !== 'online') { onToast('Adiciona pelo menos mais uma pessoa!'); return; }
    if (!mS.mode) { onToast('Escolhe o modo de jogo!'); return; }
    setMS(s => ({ ...s, step: 'pickCat' }));
  };

  const startVoting = () => {
    if (!mS.cat) { onToast('Escolhe uma categoria!'); return; }
    if (mS.cat === 'eat' && !mS.sub) { onToast('Casa ou sair?'); return; }
    let pool = [...DATA[mS.cat]];
    if (mS.cat === 'eat' && mS.sub) pool = pool.filter(i => i.local === mS.sub);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const votes: Record<string, DataItem[]> = {};
    mS.participants.forEach(n => { votes[n] = []; });
    setMS(s => ({ ...s, pool, votes, currentVoter: 0, idx: 0, step: 'vote_0' }));
  };

  const mVote = (v: 'yes' | 'no') => {
    const voter = mS.participants[mS.currentVoter];
    const item = mS.pool[mS.idx];
    if (!item) return;
    setMS(s => {
      const newVotes = { ...s.votes };
      if (v === 'yes') {
        if (newVotes[voter].length >= MAX_YES) { onToast(`Máximo de ${MAX_YES} atingido`); return s; }
        newVotes[voter] = [...newVotes[voter], item];
        const rem = MAX_YES - newVotes[voter].length;
        onToast(rem > 0 ? `♡ Guardado! Faltam ${rem}` : `✅ ${MAX_YES}/${MAX_YES}!`);
      }
      return { ...s, votes: newVotes, idx: s.idx + 1 };
    });
  };

  const mRemove = (i: number) => {
    const voter = mS.participants[mS.currentVoter];
    setMS(s => {
      const newVotes = { ...s.votes };
      newVotes[voter] = newVotes[voter].filter((_, idx) => idx !== i);
      return { ...s, votes: newVotes };
    });
    onToast('Removido');
  };

  const mConfirm = () => {
    const isLast = mS.currentVoter === mS.participants.length - 1;
    if (isLast) {
      setMS(s => ({ ...s, step: 'results' }));
    } else {
      setMS(s => ({ ...s, currentVoter: s.currentVoter + 1, idx: 0, step: 'wait' }));
    }
  };

  const startFromIntro = () => {
    if (!introCat) { onToast('Escolhe uma categoria!'); return; }
    if (!introWho) { onToast('Com quem vais jogar?'); return; }
    setMS(s => ({ ...s, cat: introCat, step: 'setup', participants: [myName] }));
  };

  const handleBack = () => {
    if (mS.step === 'intro') { onBack(); return; }
    if (mS.step === 'setup') { setMS(s => ({ ...s, step: 'intro' })); return; }
    if (mS.step === 'pickCat') { setMS(s => ({ ...s, step: 'setup' })); return; }
    if (mS.step === 'wait' || mS.step.startsWith('vote')) { setMS(s => ({ ...s, step: 'pickCat' })); return; }
    if (mS.step === 'results') { setMS(s => ({ ...s, step: 'setup' })); return; }
    onBack();
  };

  const voter = mS.participants[mS.currentVoter];
  const myVotes = mS.votes[voter] || [];
  const item = mS.pool[mS.idx];
  const limitReached = myVotes.length >= MAX_YES;
  const saved = profile.savedPeople || [];

  const renderIntro = () => (
    <>
      <div className="mx-hero fade-in">
        <div className="mx-hero-em">⚡</div>
        <div className="mx-hero-t">Modo Match</div>
        <div className="mx-hero-s">Decide em grupo. Cada um vota em secreto — a app revela o que toda a gente quer.</div>
      </div>

      <div className="mx-section fade-in">
        <div className="mx-section-lbl">O que querem decidir?</div>
        <div className="mx-catgrid-intro">
          {CATS.filter(c => INTRO_CAT_IDS.includes(c.id)).map(c => (
            <button
              key={c.id}
              className={`mx-cat${introCat === c.id ? ' on' : ''}`}
              onClick={() => setIntroCat(c.id)}
              style={{ height: 80, borderRadius: 14, position: 'relative', overflow: 'hidden', border: introCat === c.id ? '2px solid #c8974a' : '1px solid rgba(255,255,255,0.1)' }}
            >
              {MATCH_CAT_IMAGES[c.id] && (
                <>
                  <div className="mx-cat-bg" style={{ backgroundImage: `url(${MATCH_CAT_IMAGES[c.id]})` }} />
                  <div className="mx-cat-bg-overlay" />
                </>
              )}
              <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{MATCH_CAT_SVGS[c.id] || c.icon}</span>
              <span style={{ position: 'relative', zIndex: 1 }}>{c.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mx-section fade-in">
        <div className="mx-section-lbl">Com quem?</div>
        <div className="mx-mode-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {(['sozinho', 'casal', 'amigos'] as const).map(who => {
            const labels = { sozinho: ['Sozinho', 'Só eu'], casal: ['Casal', 'Nós dois'], amigos: ['Amigos', '3 ou mais'] };
            return (
              <div
                key={who}
                className={`mx-mode${introWho === who ? ' on' : ''}`}
                onClick={() => setIntroWho(who)}
                style={{ position: 'relative', overflow: 'hidden', backgroundImage: `url(${WHO_IMAGES[who]})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
              >
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.7))' }} />
                <div className="mm-i" style={{ display: 'flex', justifyContent: 'center', position: 'relative', zIndex: 1, color: '#fff' }}>{WHO_SVGS[who]}</div>
                <div className="mm-t" style={{ position: 'relative', zIndex: 1, color: '#fff' }}>{labels[who][0]}</div>
                <div className="mm-s" style={{ position: 'relative', zIndex: 1, color: 'rgba(255,255,255,0.7)' }}>{labels[who][1]}</div>
              </div>
            );
          })}
        </div>
      </div>

      <button className="mv-confirm" onClick={startFromIntro} style={{ background: 'var(--ac)', border: 'none' }}>
        Começar →
      </button>
      <div style={{ height: 16 }} />
    </>
  );

  const renderSetup = () => (
    <>
      <div className="mx-hero fade-in">
        <div className="mx-hero-em">⚡</div>
        <div className="mx-hero-t">Modo Match</div>
        <div className="mx-hero-s">Cada pessoa vota nas sugestões de forma independente. No final a app revela os matches.</div>
      </div>
      <div className="mx-section fade-in">
        <div className="mx-section-lbl">Modo de jogo</div>
        <div className="mx-mode-row">
          <div className={`mx-mode${mS.mode === 'offline' ? ' on' : ''}`} onClick={() => selectMode('offline')}>
            <div className="mm-i">📱</div>
            <div className="mm-t">Offline</div>
            <div className="mm-s">Partilham o telemóvel</div>
          </div>
          <div className={`mx-mode${mS.mode === 'online' ? ' on' : ''}`} onClick={() => selectMode('online')}>
            <div className="mm-i">🌐</div>
            <div className="mm-t">Online</div>
            <div className="mm-s">Cada um no seu</div>
          </div>
        </div>
      </div>
      {mS.mode === 'online' ? (
        <div className="mx-coming fade-in">
          <div style={{ fontSize: 36, marginBottom: 12 }}>🌐</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Online Match</div>
          <div style={{ fontSize: 12, color: 'var(--mu2)', lineHeight: 1.65 }}>Em breve — cada pessoa vota no seu próprio telemóvel em tempo real.</div>
          <div style={{ fontSize: 10, color: 'var(--ac)', marginTop: 12, letterSpacing: 1 }}>BREVEMENTE</div>
        </div>
      ) : (
        <div className="mx-section fade-in">
          <div className="mx-section-lbl">Participantes</div>
          <div className="mx-plist">
            {mS.participants.map((n, i) => (
              <div key={i} className="mx-pitem fade-in">
                <div className="px-av">{n[0]?.toUpperCase() || '?'}</div>
                <div className="px-n">{n}</div>
                {i === 0 ? <span className="px-you">tu</span> : (
                  <button className="px-rm" onClick={() => removePerson(i)}>✕</button>
                )}
              </div>
            ))}
          </div>
          {saved.length > 0 && (
            <>
              <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--mu)', marginBottom: 7, marginTop: 4 }}>Recentes</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                {saved.map(n => (
                  <button key={n} onClick={() => addPerson(n)} style={{ background: 'var(--sf2)', border: '1px solid var(--bd2)', borderRadius: 100, padding: '5px 12px', fontSize: 12, color: 'var(--mu2)', cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>
                    + {n}
                  </button>
                ))}
              </div>
            </>
          )}
          <div className="mx-add-row">
            <input
              ref={addInputRef}
              className="mx-add-input"
              placeholder="Nome do participante..."
              type="text"
              maxLength={20}
              autoComplete="off"
              onKeyDown={e => { if (e.key === 'Enter') addFromInput(); }}
            />
            <button className="mx-add-btn" onClick={addFromInput}>+ Adicionar</button>
          </div>
        </div>
      )}
      <button className="mv-confirm" onClick={goToPickCat} style={{ background: 'var(--ac)', border: 'none' }}>
        Escolher categoria →
      </button>
      <div style={{ height: 16 }} />
    </>
  );

  const renderPickCat = () => (
    <>
      <div className="mx-section fade-in">
        <div className="mx-section-lbl">Escolhe a categoria</div>
        <div className="mx-catgrid">
          {CATS.map(c => (
            <button
              key={c.id}
              className={`mx-cat${mS.cat === c.id ? ' on' : ''}`}
              onClick={() => setMS(s => ({ ...s, cat: c.id, sub: c.id !== 'eat' ? null : s.sub }))}
              style={{ height: 80, borderRadius: 14, position: 'relative', overflow: 'hidden', border: mS.cat === c.id ? '2px solid #c8974a' : '1px solid rgba(255,255,255,0.1)' }}
            >
              {MATCH_CAT_IMAGES[c.id] && (
                <>
                  <div className="mx-cat-bg" style={{ backgroundImage: `url(${MATCH_CAT_IMAGES[c.id]})` }} />
                  <div className="mx-cat-bg-overlay" />
                </>
              )}
              <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {MATCH_CAT_SVGS[c.id] || c.icon}
              </span>
              <span style={{ position: 'relative', zIndex: 1 }}>{c.name}</span>
            </button>
          ))}
        </div>
      </div>
      {mS.cat === 'eat' && (
        <div className="mx-section fade-in">
          <div className="mx-section-lbl">Em casa ou sair?</div>
          <div className="mx-loc-row">
            <button className={`mx-lb${mS.sub === 'casa' ? ' on' : ''}`} onClick={() => setMS(s => ({ ...s, sub: 'casa' }))}>🏠 Em casa</button>
            <button className={`mx-lb${mS.sub === 'fora' ? ' on' : ''}`} onClick={() => setMS(s => ({ ...s, sub: 'fora' }))}>🍴 Sair</button>
          </div>
        </div>
      )}
      <button className="mv-confirm" onClick={startVoting} style={{ background: 'var(--ac)', border: 'none' }}>
        Começar a votar ⚡
      </button>
      <div style={{ height: 16 }} />
    </>
  );

  const renderVote = () => {
    const dots = mS.participants.map((_, i) => (
      <div key={i} className="mv-wait-dot" style={{ background: i < mS.currentVoter ? 'var(--gn)' : i === mS.currentVoter ? 'var(--ac)' : 'var(--bd2)' }} />
    ));
    const isLast = mS.currentVoter === mS.participants.length - 1;
    const rem = MAX_YES - myVotes.length;

    return (
      <>
        <div className="mv-header fade-in">
          <div className="mv-who">
            <div className="mv-av">{voter[0]?.toUpperCase() || '?'}</div>
            <div className="mv-name">
              {voter}
              <small>{mS.currentVoter === 0 ? '(és tu)' : 'a votar agora'}</small>
            </div>
          </div>
          <div className="mv-counter">{myVotes.length} / {MAX_YES}</div>
        </div>
        <div className="mv-wait-prog">{dots}</div>

        {!item || mS.idx >= mS.pool.length ? (
          <div className="mv-card fade-in" style={{ padding: 30, textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>✅</div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>Viste tudo!</div>
            <div style={{ fontSize: 12, color: 'var(--mu)', marginTop: 6 }}>Confirma a tua lista abaixo.</div>
          </div>
        ) : (
          <div className="mv-card fade-in">
            <div className="mv-poster" style={{ background: `linear-gradient(${GRAD[mS.cat!] || '135deg,#111,#222'})` }}>
              <span style={{ fontSize: 50, position: 'relative', zIndex: 1 }}>{item.emoji}</span>
            </div>
            <div className="mv-body">
              <div className="mv-title">{item.title}</div>
              <div className="mv-meta">{item.type} · {item.genre}{item.rating ? ` · ⭐${item.rating}` : ''}</div>
              <div className="mv-desc">{item.desc}</div>
              <div className="mv-btns">
                <button className="mv-btn yes" onClick={() => mVote('yes')} disabled={limitReached} style={limitReached ? { opacity: .3, cursor: 'default' } : {}}>✅ Sim</button>
                <button className="mv-btn no" onClick={() => mVote('no')}>❌ Não</button>
              </div>
              {limitReached ? (
                <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--ac)', marginTop: 7 }}>Limite de {MAX_YES} atingido — confirma ou remove</div>
              ) : (
                <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--mu)', marginTop: 7 }}>Podes escolher mais {rem}</div>
              )}
            </div>
          </div>
        )}

        {myVotes.length > 0 && (
          <div className="mv-yeslist fade-in">
            <div className="mv-yes-lbl">As tuas escolhas ({myVotes.length}/{MAX_YES})</div>
            {myVotes.map((it, i) => (
              <div key={i} className="mv-yes-item">
                <span className="mv-yes-em">{it.emoji}</span>
                <span className="mv-yes-t">{it.title}</span>
                <button className="mv-yes-rm" onClick={() => mRemove(i)}>✕</button>
              </div>
            ))}
          </div>
        )}

        <button className="mv-confirm" onClick={mConfirm} disabled={myVotes.length === 0} style={{ background: 'var(--gn)', border: 'none' }}>
          {isLast ? 'Ver resultados 🎉' : 'Confirmar e passar →'}
        </button>
        <div style={{ height: 16 }} />
      </>
    );
  };

  const renderWait = () => {
    const next = mS.participants[mS.currentVoter];
    const endsA = next.endsWith('a');
    return (
      <>
        <div className="mv-wait fade-in">
          <div style={{ fontSize: 48, marginBottom: 14 }}>⏳</div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Passa o telemóvel</div>
          <div style={{ fontSize: 13, color: 'var(--mu2)', lineHeight: 1.65, marginBottom: 20 }}>
            É a vez de <span style={{ color: 'var(--ac)', fontWeight: 600 }}>{next}</span> votar. Mostra apenas quando estiver pronto{endsA ? 'a' : ''}.
          </div>
          <div className="mv-wait-prog" style={{ justifyContent: 'center' }}>
            {mS.participants.map((_, i) => (
              <div key={i} className="mv-wait-dot" style={{ background: i < mS.currentVoter ? 'var(--gn)' : i === mS.currentVoter ? 'var(--ac)' : 'var(--bd2)' }} />
            ))}
          </div>
        </div>
        <button
          className="mv-confirm"
          onClick={() => setMS(s => ({ ...s, step: 'vote_' + s.currentVoter }))}
          style={{ background: 'var(--ac)', border: 'none' }}
        >
          ▶ {next} está pronto{endsA ? 'a' : ''} — começar
        </button>
        <div style={{ height: 16 }} />
      </>
    );
  };

  const renderResults = () => {
    const allVotes = Object.values(mS.votes);
    const matches = allVotes[0]?.filter(item => allVotes.every(votes => votes.some(v => v.title === item.title))) || [];
    const partial = (allVotes[0] || []).filter(item =>
      !matches.some(m => m.title === item.title) &&
      allVotes.some(votes => votes.some(v => v.title === item.title))
    );

    return (
      <>
        <div className={`${matches.length ? 'mv-result-win' : 'mv-wait'} fade-in`} style={{ textAlign: 'center', padding: 22 }}>
          <div style={{ fontSize: 44, marginBottom: 10 }}>{matches.length ? '🎉' : '😅'}</div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 700, marginBottom: 6 }}>
            {matches.length ? `${matches.length} Match${matches.length > 1 ? 'es' : ''}!` : 'Sem matches perfeitos'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--mu2)' }}>
            {matches.length ? `Toda a equipa (${mS.participants.join(', ')}) concordou!` : 'Gostos muito diferentes hoje 😄'}
          </div>
        </div>

        {matches.length > 0 && (
          <>
            <div style={{ fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--mu)', padding: 2 }}>✅ Match perfeito — todos querem</div>
            {matches.map((item, i) => (
              <div key={i} className="mv-match-item fade-in">
                <span style={{ fontSize: 26 }}>{item.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{item.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--mu)' }}>{item.type} · {item.genre}</div>
                </div>
                <span>✅</span>
              </div>
            ))}
          </>
        )}

        {partial.length > 0 && (
          <>
            <div style={{ fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--mu)', padding: 2, marginTop: 4 }}>🤝 Quase match — maioria quis</div>
            {partial.slice(0, 3).map((item, i) => {
              const who = mS.participants.filter(n => mS.votes[n]?.some(v => v.title === item.title));
              return (
                <div key={i} className="mv-nomatch fade-in">
                  <span style={{ fontSize: 22 }}>{item.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{item.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--mu)' }}>{who.join(' e ')} quiseram</div>
                  </div>
                </div>
              );
            })}
          </>
        )}

        <button className="mv-confirm" onClick={reset} style={{ background: 'var(--ac)', border: 'none', marginTop: 4 }}>
          🔄 Jogar outra vez
        </button>
        <div style={{ height: 16 }} />
      </>
    );
  };

  return (
    <div className={`screen${isActive ? ' active' : ''}`} id="match-screen">
      <div className="tb mw">
        <button className="tbi" onClick={handleBack}>←</button>
        <span className="tb-lbl">Match ⚡</span>
        <div style={{ width: 36 }} />
      </div>
      <div className="mx-inner sc">
        {mS.step === 'intro' && renderIntro()}
        {mS.step === 'setup' && renderSetup()}
        {mS.step === 'pickCat' && renderPickCat()}
        {mS.step.startsWith('vote') && renderVote()}
        {mS.step === 'wait' && renderWait()}
        {mS.step === 'results' && renderResults()}
      </div>
    </div>
  );
}
