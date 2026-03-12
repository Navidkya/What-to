import { useState } from 'react';
import type { ReactElement } from 'react';
import type { HistoryEntry, TrackingMap } from '../../types';
import { CATS, TSTATE, TCOLOR } from '../../data';

interface ChecklistProps {
  history: HistoryEntry[];
  tracking: TrackingMap;
  isActive: boolean;
  onBack: () => void;
  onRemoveHistory?: (index: number) => void;
}

const HIST_CAT_PT: Record<string, string> = { watch: 'Ver', eat: 'Comer', play: 'Jogar', read: 'Ler', do: 'Fazer' };

const MOCK_THUMBS: Record<string, string> = {
  'Oppenheimer': 'https://image.tmdb.org/t/p/w200/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
  'Pasta Carbonara': 'https://www.themealdb.com/images/media/meals/llcbn01574260722.jpg',
  'Dune: Part Two': 'https://image.tmdb.org/t/p/w200/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
  'Balatro': 'https://cdn.cloudflare.steamstatic.com/steam/apps/2379780/capsule_616x353.jpg',
  'The Bear S02': 'https://image.tmdb.org/t/p/w200/sHFlbKS3WLqMnp9t2ghADIJFnuQ.jpg',
  'Ramen Tonkotsu': 'https://www.themealdb.com/images/media/meals/wruvqy1503564open.jpg',
};

function mockDate(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  return d.toISOString();
}

const MOCK_HISTORY: HistoryEntry[] = [
  { catId: 'watch', title: 'Oppenheimer', emoji: '🎬', cat: 'Ver', date: mockDate(0), type: 'Filme', genre: 'Drama', action: 'agora' },
  { catId: 'eat', title: 'Pasta Carbonara', emoji: '🍽️', cat: 'Comer', date: mockDate(0), type: 'Receita', genre: 'Italiano', action: 'agora' },
  { catId: 'watch', title: 'Dune: Part Two', emoji: '🎬', cat: 'Ver', date: mockDate(1), type: 'Filme', genre: 'Sci-Fi', action: 'save' },
  { catId: 'play', title: 'Balatro', emoji: '🎮', cat: 'Jogar', date: mockDate(1), type: 'Videojogo', genre: 'Roguelite', action: 'agora' },
  { catId: 'watch', title: 'The Bear S02', emoji: '🎬', cat: 'Ver', date: mockDate(3), type: 'Série', genre: 'Drama', action: 'agora' },
  { catId: 'eat', title: 'Ramen Tonkotsu', emoji: '🍽️', cat: 'Comer', date: mockDate(4), type: 'Receita', genre: 'Japonês', action: 'save' },
];

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

const HIST_CATS = ['Tudo', 'watch', 'eat', 'play', 'read', 'do'];
const HIST_CAT_LABELS: Record<string, string> = { watch: '🎬', eat: '🍽', play: '🎮', read: '📚', do: '⚡' };

function getTMDBThumb(title: string): string | null {
  const cacheKey = `wt_tmdb_ps_${title.toLowerCase().replace(/\s+/g, '_')}`;
  return localStorage.getItem(cacheKey) || null;
}

export default function Checklist({ history, tracking, isActive, onBack, onRemoveHistory }: ChecklistProps) {
  const [tab, setTab] = useState('hist');
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState<HistoryEntry | null>(null);
  const [histCat, setHistCat] = useState('Tudo');

  const trackCats = CATS.filter(c => c.trackable);

  const renderList = () => {
    const q = search.toLowerCase();
    if (tab === 'hist') {
      // Merge real history with mock items (real items first)
      const realTitles = new Set(history.map(h => h.title));
      const mockItems = MOCK_HISTORY.filter(m => !realTitles.has(m.title));
      let items = [...history.slice(0, 44), ...mockItems];
      if (q) items = items.filter(h => h.title.toLowerCase().includes(q));
      if (histCat !== 'Tudo') items = items.filter(h => h.catId === histCat);

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
          <div key={bucket} style={{ fontSize: 10, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--mu)', padding: '8px 0 4px' }}>
            {BUCKET_LABELS[bucket]}
          </div>
        );
        group.forEach((h, i) => {
          const thumb = MOCK_THUMBS[h.title] || (h.catId === 'watch' ? getTMDBThumb(h.title) : null);
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
                  {h.cat} · {fmtDate(h.date)}
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

      {tab === 'hist' && (
        <div style={{ display: 'flex', gap: 6, padding: '0 20px 10px', overflowX: 'auto', scrollbarWidth: 'none', flexShrink: 0 }}>
          {HIST_CATS.map(c => (
            <button
              key={c}
              onClick={() => setHistCat(c)}
              style={{
                flexShrink: 0,
                background: histCat === c ? 'var(--ac2)' : 'var(--sf)',
                border: `1px solid ${histCat === c ? 'var(--ac)' : 'var(--bd2)'}`,
                borderRadius: 100,
                padding: '4px 13px',
                fontSize: 11,
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 500,
                color: histCat === c ? 'var(--ac)' : 'var(--mu2)',
                cursor: 'pointer',
                transition: 'all .2s',
                whiteSpace: 'nowrap',
              }}
            >
              {c === 'Tudo' ? 'Tudo' : (HIST_CAT_LABELS[c] + ' ' + (HIST_CAT_PT[c] ?? c))}
            </button>
          ))}
        </div>
      )}

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
