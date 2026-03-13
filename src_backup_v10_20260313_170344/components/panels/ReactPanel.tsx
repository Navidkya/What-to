import type { DataItem, Category } from '../../types';

interface ReactPanelProps {
  item: DataItem | null;
  cat: Category | null;
  isOpen: boolean;
  onClose: () => void;
  onNow: () => void;
  onReact: (type: 'hoje' | 'save' | 'skip' | 'next') => void;
  onWhy: () => void;
  onTracking: () => void;
  onSchedule?: () => void;
}

const CAT_GRADIENT: Record<string, string> = {
  watch: '135deg, #0a1628, #1a2a4a',
  eat: '135deg, #2a0f05, #1a1205',
  read: '135deg, #0f0a28, #1a1235',
  listen: '135deg, #28051a, #1a0512',
  play: '135deg, #052812, #081a0a',
  learn: '135deg, #28250a, #1a1805',
  visit: '135deg, #280a0a, #1a0505',
  do: '135deg, #052828, #051a1a',
};

export default function ReactPanel({ item, cat, isOpen, onClose, onNow, onReact, onWhy, onTracking, onSchedule }: ReactPanelProps) {
  if (!item) return null;

  const posterUrl = (item as DataItem & { posterUrl?: string }).posterUrl;
  const catGrad = cat ? (CAT_GRADIENT[cat.id] || '135deg, #111, #222') : '135deg, #111, #222';

  return (
    <div className={`ov${isOpen ? ' on' : ''}`} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="panel">
        <div className="panel-drag" />

        {/* Header with poster image */}
        <div className="rp-header">
          {posterUrl ? (
            <div
              className="rp-poster"
              style={{ backgroundImage: `url(${posterUrl})` }}
            />
          ) : (
            <div
              className="rp-poster rp-poster-fallback"
              style={{ background: `linear-gradient(${catGrad})` }}
            >
              <span style={{ fontSize: 36 }}>{item.emoji}</span>
            </div>
          )}
          <div className="rp-header-info">
            <div className="rp-title">{item.title}</div>
            <div className="rp-cat">{cat?.name}</div>
          </div>
        </div>

        {/* 2-column grid for main actions */}
        <div className="rp-grid">
          <button
            className="rp-btn"
            style={{ background: '#0d2212', borderColor: '#4a8c5c', color: '#6ab87a', height: 56 }}
            onClick={onNow}
          >
            <span>▷</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 12 }}>Sim, agora!</div>
              <div style={{ fontSize: 9, color: 'rgba(106,184,122,.6)', marginTop: 1 }}>Abrir e acompanhar</div>
            </div>
          </button>

          <button
            className="rp-btn"
            style={{ background: '#0d1829', borderColor: '#3a6a9a', color: '#6ab4e0', height: 56 }}
            onClick={() => onReact('hoje')}
          >
            <span>✓</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 12 }}>Sim, hoje!</div>
              <div style={{ fontSize: 9, color: 'rgba(106,180,224,.6)', marginTop: 1 }}>Marcar para hoje</div>
            </div>
          </button>

          <button
            className="rp-btn"
            style={{ background: '#1a1428', borderColor: '#6a4a8a', color: '#9a7ac4', height: 56 }}
            onClick={() => onReact('save')}
          >
            <span>♡</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 12 }}>Guardar</div>
              <div style={{ fontSize: 9, color: 'rgba(154,122,196,.6)', marginTop: 1 }}>Para outro dia</div>
            </div>
          </button>

          <button
            className="rp-btn"
            style={{ background: '#1a1a24', borderColor: 'rgba(255,255,255,0.08)', color: '#7a8499', height: 56 }}
            onClick={() => onReact('skip')}
          >
            <span>✕</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 12 }}>Hoje não</div>
              <div style={{ fontSize: 9, color: 'rgba(122,132,153,.6)', marginTop: 1 }}>Talvez depois</div>
            </div>
          </button>
        </div>

        {/* Full-width secondary buttons */}
        <button
          className="rp-btn-full"
          style={{ background: '#1a1a24', borderColor: 'rgba(255,255,255,0.08)', color: '#7a8499', height: 48 }}
          onClick={onWhy}
        >
          <span>💭</span> Não… porquê
        </button>

        <button
          className="rp-btn-full"
          style={{ background: '#1a1a24', borderColor: 'rgba(255,255,255,0.08)', color: '#7a8499', height: 48 }}
          onClick={() => onReact('next')}
        >
          <span>✨</span> Outra sugestão
        </button>

        {cat?.trackable && (
          <button
            className="rp-btn-full"
            style={{ background: '#1a1a24', borderColor: 'rgba(255,255,255,0.08)', color: '#7a8499', height: 48 }}
            onClick={onTracking}
          >
            <span>📺</span> Tracking
          </button>
        )}

        {onSchedule && (
          <button
            className="rp-btn-full"
            style={{ background: '#1a1508', borderColor: 'rgba(200,151,74,0.25)', color: '#c8974a', height: 48 }}
            onClick={onSchedule}
          >
            <span>🗓️</span> Agendar
          </button>
        )}

        <button className="btn-x" style={{ color: '#3a4558' }} onClick={onClose}>FECHAR</button>
      </div>
    </div>
  );
}
