import { useState } from 'react';
import type { ReactElement } from 'react';
import type { HistoryEntry, TrackingMap } from '../../types';
import { CATS, TSTATE, TCOLOR } from '../../data';
import { Film, Utensils, BookOpen, Headphones, Gamepad2, Zap, Clock, Search } from 'lucide-react';

interface ChecklistProps {
  history: HistoryEntry[];
  tracking: TrackingMap;
  isActive: boolean;
  onBack: () => void;
  onRemoveHistory?: (index: number) => void;
}

const CAT_PT: Record<string, string> = {
  watch: 'Ver', eat: 'Comer', play: 'Jogar', read: 'Ler',
  do: 'Fazer', listen: 'Ouvir', visit: 'Visitar', learn: 'Aprender',
};







const CAT_COLORS: Record<string, string> = {
  watch: '#c8974a',
  eat: '#4a8c5c',
  play: '#4a6a9a',
  read: '#9a7ac4',
  do: '#c85050',
  listen: '#4a9a8c',
  learn: '#9a7a50',
  visit: '#c87a4a',
};

function fmtDate(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

function getDateBucket(iso: string): 'hoje' | 'ontem' | 'semana' | 'antigo' {
  if (!iso) return 'antigo';
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  if (diffDays < 1) return 'hoje';
  if (diffDays < 2) return 'ontem';
  if (diffDays < 7) return 'semana';
  return 'antigo';
}

const BUCKET_LABELS: Record<string, string> = {
  hoje: 'Hoje',
  ontem: 'Ontem',
  semana: 'Esta semana',
  antigo: 'Mais antigo',
};


function getTMDBThumb(title: string): string | null {
  const cacheKey = `wt_tmdb_ps_${title.toLowerCase().replace(/\s+/g, '_')}`;
  return localStorage.getItem(cacheKey) || null;
}

// Unified filter tabs: hist + trackable cats
const CAT_FILTERS: { id: string; label: string; icon: ReactElement }[] = [
  { id: 'hist',   label: 'Histórico', icon: <Clock size={13} /> },
  { id: 'watch',  label: 'Ver',       icon: <Film size={13} /> },
  { id: 'eat',    label: 'Comer',     icon: <Utensils size={13} /> },
  { id: 'play',   label: 'Jogar',     icon: <Gamepad2 size={13} /> },
  { id: 'read',   label: 'Ler',       icon: <BookOpen size={13} /> },
  { id: 'do',     label: 'Fazer',     icon: <Zap size={13} /> },
  { id: 'listen', label: 'Ouvir',     icon: <Headphones size={13} /> },
];

export default function Checklist({ history, tracking, isActive, onBack, onRemoveHistory }: ChecklistProps) {
  const [tab, setTab] = useState('hist');
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState<HistoryEntry | null>(null);

  const renderList = () => {
    const q = search.toLowerCase();
    if (tab === 'hist') {
      let items = [...history];
      if (q) items = items.filter(h => h.title.toLowerCase().includes(q));

      if (!items.length) return (
        <div className="empty-state">
          <div className="empty-icon">✦</div>
          <p className="empty-title">Ainda sem histórico</p>
          <p className="empty-sub">As tuas sugestões aceites aparecem aqui.</p>
          <p className="empty-quote">"A melhor altura para começar foi ontem.<br/>A segunda melhor é agora."</p>
        </div>
      );

      // Group by date bucket
      const buckets: Record<string, HistoryEntry[]> = { hoje: [], ontem: [], semana: [], antigo: [] };
      items.forEach(h => {
        const b = getDateBucket(h.date);
        buckets[b].push(h);
      });

      const rendered: ReactElement[] = [];
      (['hoje', 'ontem', 'semana', 'antigo'] as const).forEach(bucket => {
        const group = buckets[bucket];
        if (!group.length) return;
        rendered.push(
          <div key={bucket} className="history-date-separator">
            <span className="history-date-label">{BUCKET_LABELS[bucket]}</span>
            <div className="history-date-line" />
          </div>
        );
        group.forEach((h, i) => {
          const thumb = h.catId === 'watch' ? getTMDBThumb(h.title) : null;
          const catColor = CAT_COLORS[h.catId] || 'var(--mu)';
          rendered.push(
            <div key={`${bucket}-${i}`} className="cl-item card-base fade-in" style={{ cursor: 'pointer', gap: 10 }} onClick={() => setSelectedItem(h)}>
              {thumb ? (
                <img src={thumb} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
              ) : (
                <div className="cl-em" style={{ background: catColor + '22', borderRadius: 8, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{h.emoji}</div>
              )}
              <div className="cl-info">
                <div className="cl-title">{h.title}</div>
                <div className="cl-meta" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: catColor, flexShrink: 0 }} />
                  {CAT_PT[h.catId] ?? h.cat} · {fmtDate(h.date)}
                </div>
              </div>
              <span className="cl-state" style={{
                background: h.action === 'agora' ? 'var(--gn2)' : 'var(--ac2)',
                color: h.action === 'agora' ? 'var(--gn)' : 'var(--ac)',
                borderRadius: 8,
                fontSize: 10,
                padding: '3px 8px',
              }}>
                {h.action === 'agora' ? '✅' : '♡'}
              </span>
            </div>
          );
        });
      });
      return rendered;
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
          <div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontStyle: 'italic', fontWeight: 700, color: '#f5f1eb' }}>Histórico</div>
            <div style={{ fontSize: 12, color: 'var(--mu)', marginTop: 2 }}>{history.length} actividades</div>
          </div>
        </div>
        <div style={{ width: 36 }} />
      </div>

      {/* Filter pills */}
      <div className="history-filters">
        {CAT_FILTERS.map(t => (
          <button
            key={t.id}
            className={`history-filter-pill${tab === t.id ? ' active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      <div className="history-search-wrap mw">
        <Search size={15} className="history-search-icon" />
        <input
          className="history-search"
          placeholder="pesquisar..."
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
