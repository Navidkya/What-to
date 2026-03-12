import { useState } from 'react';
import type { HistoryEntry, TrackingMap } from '../../types';
import { CATS, TSTATE, TCOLOR } from '../../data';

interface ChecklistProps {
  history: HistoryEntry[];
  tracking: TrackingMap;
  isActive: boolean;
  onBack: () => void;
  onRemoveHistory?: (index: number) => void;
}

function fmtDate(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

export default function Checklist({ history, tracking, isActive, onBack, onRemoveHistory }: ChecklistProps) {
  const [tab, setTab] = useState('watch');
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState<HistoryEntry | null>(null);

  const trackCats = CATS.filter(c => c.trackable);

  const renderList = () => {
    const q = search.toLowerCase();
    if (tab === 'hist') {
      let items = history.slice(0, 50);
      if (q) items = items.filter(h => h.title.toLowerCase().includes(q));
      if (!items.length) return (
        <div className="empty-state">
          <div className="empty-icon">✦</div>
          <p className="empty-title">Ainda sem histórico</p>
          <p className="empty-sub">As tuas sugestões aceites aparecem aqui.</p>
          <p className="empty-quote">"A melhor altura para começar foi ontem.<br/>A segunda melhor é agora."</p>
        </div>
      );
      return items.map((h, i) => (
        <div key={i} className="cl-item fade-in" style={{ cursor: 'pointer' }} onClick={() => setSelectedItem(h)}>
          <div className="cl-em">{h.emoji}</div>
          <div className="cl-info">
            <div className="cl-title">{h.title}</div>
            <div className="cl-meta">What to {h.cat} · {fmtDate(h.date)}</div>
          </div>
          <span className="cl-state" style={{
            background: h.action === 'agora' ? 'var(--gn2)' : 'var(--ac2)',
            color: h.action === 'agora' ? 'var(--gn)' : 'var(--ac)',
          }}>
            {h.action === 'agora' ? '✅' : '♡'}
          </span>
        </div>
      ));
    }

    let items = Object.entries(tracking).filter(([k]) => k.startsWith(tab + ':'));
    if (q) items = items.filter(([, v]) => v.title.toLowerCase().includes(q));
    if (!items.length) {
      const cat = CATS.find(c => c.id === tab);
      return (
        <div className="empty-state">
          <div className="es-em">{cat?.icon || '📋'}</div>
          <div className="es-t">Nada em tracking</div>
          <div className="es-s">Abre a categoria e usa o botão de tracking nos cards</div>
        </div>
      );
    }
    return items.map(([k, v]) => {
      const st = TSTATE.find(s => s.id === v.state);
      return (
        <div key={k} className="cl-item fade-in">
          <div className="cl-em">{v.emoji || '🎬'}</div>
          <div className="cl-info">
            <div className="cl-title">{v.title}</div>
            <div className="cl-meta">{st ? st.l : ''}{v.s ? ` · T${v.s} Ep${v.e}` : ''}</div>
          </div>
          <span className="cl-state" style={{
            background: `${TCOLOR[v.state] || '#333'}22`,
            color: TCOLOR[v.state] || '#888',
          }}>
            {st ? st.i : ''}
          </span>
        </div>
      );
    });
  };

  return (
    <div className={`screen${isActive ? ' active' : ''}`} id="checklist">
      <div className="tb mw">
        <button className="tbi" onClick={onBack}>←</button>
        <div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontStyle: 'italic', fontWeight: 600, color: '#f5f1eb' }}>Histórico</div>
        </div>
        <div style={{ width: 36 }} />
      </div>

      <div className="cl-tabs">
        {trackCats.map(c => (
          <button
            key={c.id}
            className={`cl-tab${tab === c.id ? ' on' : ''}`}
            onClick={() => setTab(c.id)}
          >
            {c.icon} {c.name}
          </button>
        ))}
        <button
          className={`cl-tab${tab === 'hist' ? ' on' : ''}`}
          onClick={() => setTab('hist')}
        >
          📋 Histórico
        </button>
      </div>

      <div className="cl-search mw">
        <input
          placeholder="🔍  pesquisar..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          autoComplete="off"
        />
      </div>

      <div className="cl-list sc">
        {renderList()}
      </div>

      {selectedItem && (
        <div className="ov on" onClick={e => { if (e.target === e.currentTarget) setSelectedItem(null); }}>
          <div className="panel">
            <div className="panel-drag" />
            <div style={{ textAlign: 'center', padding: '12px 0 16px' }}>
              <div style={{ fontSize: 52, marginBottom: 10 }}>{selectedItem.emoji}</div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{selectedItem.title}</div>
              <div style={{ fontSize: 11, color: 'var(--mu2)', marginBottom: 2 }}>What to {selectedItem.cat}</div>
              <div style={{ fontSize: 11, color: 'var(--mu)', marginBottom: 16 }}>{fmtDate(selectedItem.date)} · {selectedItem.action}</div>
            </div>
            <button className="eat-ob-save" style={{ marginBottom: 8 }} onClick={() => setSelectedItem(null)}>
              ✦ Sugerir novamente
            </button>
            {onRemoveHistory && (
              <button className="eat-ob-save" style={{ marginBottom: 8, background: 'none', border: '1px solid var(--rd2)', color: 'var(--rd)' }}
                onClick={() => {
                  const idx = history.indexOf(selectedItem);
                  if (idx !== -1) onRemoveHistory(idx);
                  setSelectedItem(null);
                }}
              >
                Remover do histórico
              </button>
            )}
            <button className="btn-x" onClick={() => setSelectedItem(null)}>
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
