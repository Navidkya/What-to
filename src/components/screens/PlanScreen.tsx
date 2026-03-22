import { useState } from 'react';
import type { Profile, NightPlan, PlanItem } from '../../types';
import { DATA, CATS } from '../../data';

interface Props {
  profile: Profile;
  plans: NightPlan[];
  onUpdatePlans: (plans: NightPlan[]) => void;
  onOpenCat: (catId: string) => void;
  isActive: boolean;
  onToast: (msg: string) => void;
}

function genId(): string {
  return Math.random().toString(36).slice(2, 9);
}

function generateAutoPlan(): PlanItem[] {
  const pick = (catId: string): PlanItem | null => {
    const cat = CATS.find(c => c.id === catId);
    const pool = DATA[catId];
    if (!pool || !pool.length || !cat) return null;
    const item = pool[Math.floor(Math.random() * pool.length)];
    return {
      id: genId(),
      title: item.title,
      emoji: item.emoji,
      catId,
      cat: cat.name,
      type: item.type,
      desc: item.desc,
    };
  };
  const items: PlanItem[] = [];
  const eat = pick('eat');
  const watch = pick('watch');
  const doItem = pick('do');
  if (eat) items.push(eat);
  if (watch) items.push(watch);
  if (doItem) items.push(doItem);
  return items;
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' });
  } catch {
    return iso;
  }
}

const PLAN_EMOJIS = ['🌙', '✨', '🎉', '🍿', '🎶', '🥂', '🌟', '🎯', '🧩', '🌃'];

function pickEmoji(items: PlanItem[]): string {
  if (items[0]) {
    return items[0].emoji;
  }
  return PLAN_EMOJIS[Math.floor(Math.random() * PLAN_EMOJIS.length)];
}

export default function PlanScreen({ profile, plans, onUpdatePlans, onOpenCat, isActive, onToast }: Props) {
  const [view, setView] = useState<'list' | 'create' | 'detail'>('list');
  const [activePlan, setActivePlan] = useState<NightPlan | null>(null);
  const [planName, setPlanName] = useState('');
  const [planParticipants, setPlanParticipants] = useState<string[]>([profile.name || 'Eu']);
  const [planItems, setPlanItems] = useState<PlanItem[]>([]);
  const [showShare, setShowShare] = useState(false);
  const [newPersonInput, setNewPersonInput] = useState('');
  const [newItemCat, setNewItemCat] = useState('watch');
  const [newItemTitle, setNewItemTitle] = useState('');
  const [isAutoMode, setIsAutoMode] = useState(false);

  const resetCreate = () => {
    setPlanName('');
    setPlanParticipants([profile.name || 'Eu']);
    setPlanItems([]);
    setNewPersonInput('');
    setNewItemCat('watch');
    setNewItemTitle('');
    setIsAutoMode(false);
  };

  const openCreate = (auto = false) => {
    resetCreate();
    if (auto) {
      const items = generateAutoPlan();
      setPlanItems(items);
      setPlanName('Plano surpresa');
      setIsAutoMode(true);
    }
    setView('create');
  };

  const addPerson = () => {
    const name = newPersonInput.trim();
    if (!name) return;
    if (planParticipants.includes(name)) { onToast('Já está na lista'); return; }
    setPlanParticipants(p => [...p, name]);
    setNewPersonInput('');
  };

  const removePerson = (i: number) => {
    if (i === 0) return;
    setPlanParticipants(p => p.filter((_, idx) => idx !== i));
  };

  const addItem = () => {
    const title = newItemTitle.trim();
    if (!title) { onToast('Escreve um título'); return; }
    const cat = CATS.find(c => c.id === newItemCat);
    if (!cat) return;
    const pool = DATA[newItemCat] || [];
    const match = pool.find(d => d.title.toLowerCase() === title.toLowerCase());
    const item: PlanItem = {
      id: genId(),
      title: match ? match.title : title,
      emoji: match ? match.emoji : cat.icon,
      catId: newItemCat,
      cat: cat.name,
      type: match ? match.type : '',
    };
    setPlanItems(prev => [...prev, item]);
    setNewItemTitle('');
  };

  const removeItem = (id: string) => {
    setPlanItems(prev => prev.filter(it => it.id !== id));
  };

  const savePlan = () => {
    if (!planName.trim() || planItems.length === 0) return;
    const newPlan: NightPlan = {
      id: genId(),
      name: planName.trim(),
      emoji: pickEmoji(planItems),
      items: planItems,
      participants: planParticipants,
      createdAt: new Date().toISOString(),
      isAuto: isAutoMode,
    };
    onUpdatePlans([newPlan, ...plans]);
    onToast('✦ Plano criado!');
    resetCreate();
    setView('list');
  };

  const deletePlan = (id: string) => {
    onUpdatePlans(plans.filter(p => p.id !== id));
    setActivePlan(null);
    setView('list');
    onToast('Plano apagado');
  };

  const handleShare = () => {
    if (!activePlan) return;
    if (navigator.share) {
      navigator.share({
        title: activePlan.name,
        text: activePlan.items.map(i => i.title).join(' · '),
        url: window.location.href,
      }).catch(() => {});
    } else {
      try {
        navigator.clipboard.writeText(
          `${activePlan.emoji} ${activePlan.name}\n${activePlan.items.map(i => `${i.emoji} ${i.title}`).join('\n')}`
        );
        onToast('Copiado para a área de transferência');
      } catch {
        onToast('Partilha não disponível neste browser');
      }
    }
  };

  if (!isActive) return null;

  // ── SHARE OVERLAY ──
  if (showShare && activePlan) {
    return (
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 200,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}>
        <div id="plan-share-card" style={{
          background: '#0B0D12', border: '1px solid rgba(200,155,60,0.3)', borderRadius: 20,
          padding: 24, maxWidth: 340, margin: '0 auto', width: '100%',
        }}>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 11, letterSpacing: 3, color: 'rgba(200,155,60,0.6)', marginBottom: 16, textTransform: 'uppercase' }}>
            what to · plano
          </div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 28, fontWeight: 700, fontStyle: 'italic', color: '#f5f1eb', marginBottom: 8 }}>
            {activePlan.emoji} {activePlan.name}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(156,165,185,0.7)', marginBottom: 20 }}>
            {fmtDate(activePlan.createdAt)}
          </div>
          {activePlan.items.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: 20 }}>{item.emoji}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#f5f1eb' }}>{item.title}</div>
                <div style={{ fontSize: 11, color: 'rgba(156,165,185,0.6)' }}>{item.cat}</div>
              </div>
            </div>
          ))}
          {activePlan.participants.length > 1 && (
            <div style={{ marginTop: 16, fontSize: 11, color: 'rgba(156,165,185,0.6)' }}>
              com {activePlan.participants.join(', ')}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 20, width: '100%', maxWidth: 340 }}>
          <button
            onClick={handleShare}
            style={{ flex: 1, padding: '13px', borderRadius: 14, background: 'linear-gradient(135deg,#C89B3C,#a87535)', border: 'none', color: '#0B0D12', fontFamily: "'Outfit',sans-serif", fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
          >
            Partilhar
          </button>
          <button
            onClick={() => setShowShare(false)}
            style={{ flex: 1, padding: '13px', borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#f5f1eb', fontFamily: "'Outfit',sans-serif", fontSize: 14, cursor: 'pointer' }}
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }

  // ── VIEW 'detail' ──
  if (view === 'detail' && activePlan) {
    return (
      <div className="screen active" style={{ background: '#0B0D12' }}>
        <div className="tb mw">
          <button className="tbi" onClick={() => setView('list')}>←</button>
          <span className="tb-lbl">{activePlan.emoji} {activePlan.name}</span>
          <div style={{ width: 36 }} />
        </div>
        <div className="sc" style={{ padding: '16px 16px 100px' }}>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 32, fontWeight: 700, fontStyle: 'italic', color: '#f5f1eb', marginBottom: 4 }}>
            {activePlan.emoji} {activePlan.name}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(156,165,185,0.6)', marginBottom: 16 }}>
            {fmtDate(activePlan.createdAt)}
          </div>

          {activePlan.participants.length > 0 && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
              {activePlan.participants.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'rgba(200,155,60,0.08)', border: '1px solid rgba(200,155,60,0.2)', borderRadius: 20 }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(200,155,60,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#C89B3C' }}>
                    {p[0]?.toUpperCase() || '?'}
                  </div>
                  <span style={{ fontSize: 12, color: '#f5f1eb', fontFamily: "'Outfit',sans-serif" }}>{p}</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {activePlan.items.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14 }}>
                <span style={{ fontSize: 26 }}>{item.emoji}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#f5f1eb', fontFamily: "'Outfit',sans-serif" }}>{item.title}</div>
                  <div style={{ fontSize: 11, color: 'rgba(156,165,185,0.6)' }}>{item.cat}{item.type ? ` · ${item.type}` : ''}</div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setShowShare(true)}
            style={{ width: '100%', padding: '14px', borderRadius: 14, background: 'linear-gradient(135deg,#C89B3C,#a87535)', border: 'none', color: '#0B0D12', fontFamily: "'Outfit',sans-serif", fontSize: 14, fontWeight: 700, cursor: 'pointer', marginBottom: 12 }}
          >
            Partilhar plano
          </button>
          <button
            onClick={() => deletePlan(activePlan.id)}
            style={{ width: '100%', padding: '14px', borderRadius: 14, background: 'rgba(224,112,112,0.08)', border: '1px solid rgba(224,112,112,0.25)', color: '#e07070', fontFamily: "'Outfit',sans-serif", fontSize: 14, cursor: 'pointer' }}
          >
            Apagar plano
          </button>
        </div>
      </div>
    );
  }

  // ── VIEW 'create' ──
  if (view === 'create') {
    const canSave = planName.trim().length > 0 && planItems.length > 0;
    return (
      <div className="screen active" style={{ background: '#0B0D12' }}>
        <div className="tb mw">
          <button className="tbi" onClick={() => { resetCreate(); setView('list'); }}>←</button>
          <span className="tb-lbl">Criar Plano</span>
          <div style={{ width: 36 }} />
        </div>
        <div className="sc" style={{ padding: '16px 16px 100px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Nome do plano */}
          <div>
            <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(156,165,185,0.5)', marginBottom: 8 }}>Nome do plano</div>
            <input
              value={planName}
              onChange={e => setPlanName(e.target.value)}
              placeholder="Sexta à noite, Fim de semana..."
              style={{ width: '100%', padding: '13px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#f5f1eb', fontFamily: "'Outfit',sans-serif", fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {/* Participantes */}
          <div>
            <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(156,165,185,0.5)', marginBottom: 8 }}>Participantes</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
              {planParticipants.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'rgba(200,155,60,0.08)', border: '1px solid rgba(200,155,60,0.2)', borderRadius: 20 }}>
                  <span style={{ fontSize: 12, color: '#f5f1eb', fontFamily: "'Outfit',sans-serif" }}>{p}</span>
                  {i > 0 && (
                    <button onClick={() => removePerson(i)} style={{ background: 'none', border: 'none', color: 'rgba(156,165,185,0.5)', cursor: 'pointer', padding: 0, fontSize: 12, lineHeight: 1 }}>✕</button>
                  )}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={newPersonInput}
                onChange={e => setNewPersonInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addPerson(); }}
                placeholder="Adicionar pessoa..."
                style={{ flex: 1, padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#f5f1eb', fontFamily: "'Outfit',sans-serif", fontSize: 13, outline: 'none' }}
              />
              <button onClick={addPerson} style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(200,155,60,0.12)', border: '1px solid rgba(200,155,60,0.25)', color: '#C89B3C', cursor: 'pointer', fontFamily: "'Outfit',sans-serif", fontSize: 13 }}>+</button>
            </div>
          </div>

          {/* Itens do plano */}
          <div>
            <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(156,165,185,0.5)', marginBottom: 8 }}>Itens do plano</div>
            {planItems.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                {planItems.map(item => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12 }}>
                    <span style={{ fontSize: 20 }}>{item.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#f5f1eb', fontFamily: "'Outfit',sans-serif" }}>{item.title}</div>
                      <div style={{ fontSize: 11, color: 'rgba(156,165,185,0.5)' }}>{item.cat}</div>
                    </div>
                    <button onClick={() => removeItem(item.id)} style={{ background: 'none', border: 'none', color: 'rgba(224,112,112,0.7)', cursor: 'pointer', fontSize: 16, padding: 4 }}>×</button>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12 }}>
              <div style={{ fontSize: 12, color: 'rgba(156,165,185,0.5)', marginBottom: 2 }}>Adicionar item</div>
              <select
                value={newItemCat}
                onChange={e => setNewItemCat(e.target.value)}
                style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#f5f1eb', fontFamily: "'Outfit',sans-serif", fontSize: 13, outline: 'none' }}
              >
                {CATS.map(c => (
                  <option key={c.id} value={c.id} style={{ background: '#121722' }}>{c.icon} {c.name}</option>
                ))}
              </select>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={newItemTitle}
                  onChange={e => setNewItemTitle(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addItem(); }}
                  placeholder="Título..."
                  style={{ flex: 1, padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#f5f1eb', fontFamily: "'Outfit',sans-serif", fontSize: 13, outline: 'none' }}
                />
                <button
                  onClick={addItem}
                  style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(200,155,60,0.12)', border: '1px solid rgba(200,155,60,0.25)', color: '#C89B3C', cursor: 'pointer', fontFamily: "'Outfit',sans-serif", fontSize: 13 }}
                >
                  +
                </button>
              </div>
              <button
                onClick={() => { const c = CATS.find(c => c.id === newItemCat); if (c) onOpenCat(c.id); }}
                style={{ padding: '9px', borderRadius: 10, background: 'none', border: '1px dashed rgba(255,255,255,0.1)', color: 'rgba(156,165,185,0.5)', cursor: 'pointer', fontFamily: "'Outfit',sans-serif", fontSize: 12 }}
              >
                Explorar sugestões de {CATS.find(c => c.id === newItemCat)?.name || ''} →
              </button>
            </div>
          </div>

          <button
            onClick={savePlan}
            disabled={!canSave}
            style={{ width: '100%', padding: '15px', borderRadius: 14, background: canSave ? 'linear-gradient(135deg,#C89B3C,#a87535)' : 'rgba(200,155,60,0.15)', border: 'none', color: canSave ? '#0B0D12' : 'rgba(200,155,60,0.4)', fontFamily: "'Outfit',sans-serif", fontSize: 15, fontWeight: 700, cursor: canSave ? 'pointer' : 'default' }}
          >
            Guardar plano
          </button>
        </div>
      </div>
    );
  }

  // ── VIEW 'list' ──
  return (
    <div className="screen active" style={{ background: '#0B0D12' }}>
      <div className="tb mw">
        <div style={{ width: 36 }} />
        <span className="tb-lbl" style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: 20 }}>Os meus planos</span>
        <div style={{ width: 36 }} />
      </div>
      <div className="sc" style={{ padding: '16px 16px 120px' }}>

        {plans.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontStyle: 'italic', color: 'rgba(245,241,235,0.5)' }}>Ainda sem planos</div>
            <div style={{ fontSize: 13, color: 'rgba(156,165,185,0.4)', marginTop: 8 }}>Cria o teu primeiro plano de noite</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
            {plans.map(plan => (
              <div
                key={plan.id}
                onClick={() => { setActivePlan(plan); setView('detail'); }}
                style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(200,155,60,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                  {plan.emoji}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 14, fontWeight: 600, color: '#f5f1eb', marginBottom: 2 }}>{plan.name}</div>
                  <div style={{ fontSize: 11, color: 'rgba(156,165,185,0.5)' }}>
                    {plan.items.length} {plan.items.length === 1 ? 'item' : 'itens'} · {plan.participants.length > 1 ? plan.participants.join(', ') : plan.participants[0]}
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(156,165,185,0.35)', marginTop: 2 }}>{fmtDate(plan.createdAt)}</div>
                </div>
                <span style={{ color: 'rgba(156,165,185,0.4)', fontSize: 18 }}>›</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, position: 'fixed', bottom: 80, left: 0, right: 0, padding: '0 16px' }}>
          <button
            onClick={() => openCreate(true)}
            style={{ width: '100%', padding: '14px', borderRadius: 14, background: 'rgba(200,155,60,0.08)', border: '1px solid rgba(200,155,60,0.3)', color: '#C89B3C', fontFamily: "'Outfit',sans-serif", fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <span>✦</span> Surpreende-me
          </button>
          <button
            onClick={() => openCreate(false)}
            style={{ width: '100%', padding: '14px', borderRadius: 14, background: 'linear-gradient(135deg,#C89B3C,#a87535)', border: 'none', color: '#0B0D12', fontFamily: "'Outfit',sans-serif", fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
          >
            + Criar plano
          </button>
        </div>
      </div>
    </div>
  );
}
