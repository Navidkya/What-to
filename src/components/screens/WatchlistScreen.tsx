import { useState } from 'react';
import type { WishlistEntry } from '../../types';
import { CATS } from '../../data';

interface Props {
  wishlist: WishlistEntry[];
  isActive: boolean;
  onRemove: (i: number) => void;
  onClearAll: () => void;
  onToast: (msg: string) => void;
  onOpenCat: (id: string) => void;
}

const CAT_SECTIONS = [
  { id: 'watch', label: 'Ver' },
  { id: 'read',  label: 'Ler' },
  { id: 'play',  label: 'Jogar' },
  { id: 'listen',label: 'Ouvir' },
  { id: 'eat',   label: 'Comer' },
  { id: 'visit', label: 'Visitar' },
  { id: 'learn', label: 'Aprender' },
  { id: 'do',    label: 'Fazer' },
];

export default function WatchlistScreen({ wishlist, isActive, onRemove, onClearAll, onToast, onOpenCat }: Props) {
  const [activeTab, setActiveTab] = useState('todos');

  const filtered = activeTab === 'todos'
    ? wishlist
    : wishlist.filter(w => w.catId === activeTab);

  const handleClearAll = () => {
    if (!confirm('Apagar toda a lista?')) return;
    onClearAll();
    onToast('Lista limpa');
  };

  const tabsWithContent = CAT_SECTIONS.filter(s => wishlist.some(w => w.catId === s.id));

  return (
    <div className={`screen${isActive ? ' active' : ''}`} id="watchlist-screen">
      <div style={{ width: '100%', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', height: '100%' }}>

        {/* Header */}
        <div style={{ padding: '56px 20px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 700, fontStyle: 'italic', color: 'var(--tx)' }}>
              A minha lista
            </div>
            <div style={{ fontSize: 12, color: 'var(--mu)', marginTop: 2 }}>
              {wishlist.length} {wishlist.length === 1 ? 'item' : 'itens'} guardados
            </div>
          </div>
          {wishlist.length > 0 && (
            <button
              onClick={handleClearAll}
              style={{ background: 'none', border: '1px solid rgba(224,112,112,0.3)', borderRadius: 8, padding: '6px 12px', color: 'var(--rd)', fontSize: 11, fontFamily: "'Outfit', sans-serif", cursor: 'pointer' }}
            >
              Limpar
            </button>
          )}
        </div>

        {/* Tabs por categoria */}
        {tabsWithContent.length > 1 && (
          <div style={{ display: 'flex', gap: 6, padding: '0 20px 12px', overflowX: 'auto', flexShrink: 0, scrollbarWidth: 'none' }}>
            <button
              onClick={() => setActiveTab('todos')}
              style={{ padding: '6px 14px', borderRadius: 50, border: activeTab === 'todos' ? '1px solid var(--ac)' : '1px solid rgba(255,255,255,0.1)', background: activeTab === 'todos' ? 'rgba(200,155,60,0.12)' : 'transparent', color: activeTab === 'todos' ? 'var(--ac)' : 'var(--mu)', fontSize: 12, fontFamily: "'Outfit', sans-serif", cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              Todos
            </button>
            {tabsWithContent.map(s => (
              <button
                key={s.id}
                onClick={() => setActiveTab(s.id)}
                style={{ padding: '6px 14px', borderRadius: 50, border: activeTab === s.id ? '1px solid var(--ac)' : '1px solid rgba(255,255,255,0.1)', background: activeTab === s.id ? 'rgba(200,155,60,0.12)' : 'transparent', color: activeTab === s.id ? 'var(--ac)' : 'var(--mu)', fontSize: 12, fontFamily: "'Outfit', sans-serif", cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}

        {/* Lista */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px', paddingBottom: 90 }}>
          {filtered.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, gap: 12 }}>
              <div style={{ fontSize: 32, opacity: 0.3 }}>♡</div>
              <div style={{ fontSize: 14, color: 'var(--mu)', textAlign: 'center' }}>
                {activeTab === 'todos' ? 'Ainda nada guardado' : 'Nada guardado nesta categoria'}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filtered.map((w) => {
                const cat = CATS.find(c => c.id === w.catId);
                const globalIdx = wishlist.indexOf(w);
                return (
                  <div
                    key={w.key}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14 }}
                  >
                    <span style={{ fontSize: 22, flexShrink: 0 }}>{w.emoji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--tx)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--mu)', marginTop: 2 }}>
                        {cat?.name || w.cat} · {w.type}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button
                        onClick={() => onOpenCat(w.catId)}
                        style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(200,155,60,0.1)', border: '1px solid rgba(200,155,60,0.3)', color: 'var(--ac)', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Ver sugestões desta categoria"
                      >
                        ›
                      </button>
                      <button
                        onClick={() => { onRemove(globalIdx); onToast('Removido da lista'); }}
                        style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(224,112,112,0.08)', border: '1px solid rgba(224,112,112,0.2)', color: 'var(--rd)', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Remover"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
