import type { DataItem, Category } from '../../types';

interface ReactPanelProps {
  item: DataItem | null;
  cat: Category | null;
  isOpen: boolean;
  onClose: () => void;
  onNow: () => void;
  onReact: (type: 'hoje' | 'save' | 'skip' | 'next') => void;
  resolvedImg?: string | null;
}

const CAT_GRADIENTS: Record<string, string> = {
  watch:  '135deg, #0a1628 0%, #1a2a4a 100%',
  eat:    '135deg, #2a0f05 0%, #1a1205 100%',
  read:   '135deg, #0f0a28 0%, #1a1235 100%',
  listen: '135deg, #28051a 0%, #1a0512 100%',
  play:   '135deg, #052812 0%, #081a0a 100%',
  learn:  '135deg, #28250a 0%, #1a1805 100%',
  visit:  '135deg, #280a0a 0%, #1a0505 100%',
  do:     '135deg, #052828 0%, #051a1a 100%',
};

export default function ReactPanel({ item, cat, isOpen, onClose, onNow, onReact, resolvedImg }: ReactPanelProps) {
  if (!item) return null;

  const imgUrl = resolvedImg || null;

  const gradient = CAT_GRADIENTS[cat?.id || 'watch'] || '135deg, #111 0%, #222 100%';

  return (
    <div className={`ov${isOpen ? ' on' : ''}`} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="panel">
        <div className="panel-drag" />

        {/* Header with poster image */}
        {(() => {
          return (
            <div className="rp-header">
              <div
                className="rp-poster"
                style={{
                  backgroundImage: imgUrl ? `url(${imgUrl})` : undefined,
                  background: !imgUrl ? `linear-gradient(${gradient})` : undefined,
                }}
              >
                {!imgUrl && (
                  <span style={{ fontSize: 40 }}>{item.emoji}</span>
                )}
              </div>
              <div className="rp-header-info">
                <div className="rp-cat-badge">{cat?.icon} {cat?.name}</div>
                <div className="rp-title">{item.title}</div>
                {item.year && <div className="rp-year">{item.year}</div>}
              </div>
            </div>
          );
        })()}

        {/* 3 Main simplified actions */}
        <div style={{ display: 'flex', gap: 10, marginTop: 16, marginBottom: 16 }}>
          <button
            className="rp-btn"
            style={{ flex: 1, padding: 18, borderRadius: 24, background: 'rgba(224,112,112,0.1)', border: '1px solid rgba(224,112,112,0.3)', color: '#e07070', fontSize: 16, fontWeight: 'bold' }}
            onClick={() => onReact('skip')}
          >
            ← Não
          </button>
          <button
            className="rp-btn"
            style={{ flex: 1, padding: 18, borderRadius: 24, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 16, fontWeight: 'bold' }}
            onClick={() => onReact('save')}
          >
            ↑ Guardar
          </button>
          <button
            className="rp-btn"
            style={{ flex: 1, padding: 18, borderRadius: 24, background: 'linear-gradient(135deg, #c8974a, #a87535)', border: 'none', color: '#000', fontSize: 16, fontWeight: 'bold' }}
            onClick={onNow}
          >
            Sim →
          </button>
        </div>

        <button className="btn-x" style={{ color: '#3a4558' }} onClick={onClose}>FECHAR</button>
      </div>
    </div>
  );
}
