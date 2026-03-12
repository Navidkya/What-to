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
  return { step: 'setup', mode: null, cat: null, sub: null, participants: [], pool: [], idx: 0, votes: {}, currentVoter: 0 };
}

export default function Match({ profile, isActive, onBack, onToast }: MatchProps) {
  const [mS, setMS] = useState<MatchState>(initMatch);
  const addInputRef = useRef<HTMLInputElement>(null);

  const myName = profile.name || 'Eu';

  const reset = () => setMS({ ...initMatch(), participants: [myName] });

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

  const handleBack = () => {
    if (mS.step === 'setup') { onBack(); return; }
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
            >
              <span>{c.icon}</span>
              <span>{c.name}</span>
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
        {mS.step === 'setup' && renderSetup()}
        {mS.step === 'pickCat' && renderPickCat()}
        {mS.step.startsWith('vote') && renderVote()}
        {mS.step === 'wait' && renderWait()}
        {mS.step === 'results' && renderResults()}
      </div>
    </div>
  );
}
