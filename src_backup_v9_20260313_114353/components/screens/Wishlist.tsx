import type { WishlistEntry } from '../../types';

interface WishlistProps {
  wishlist: WishlistEntry[];
  isActive: boolean;
  onBack: () => void;
  onRemove: (i: number) => void;
}

export default function Wishlist({ wishlist, isActive, onBack, onRemove }: WishlistProps) {
  return (
    <div className={`screen${isActive ? ' active' : ''}`} id="wishlist">
      <div className="tb mw">
        <button className="tbi" onClick={onBack}>←</button>
        <span className="tb-lbl">Guardados ♡</span>
        <div style={{ width: 36 }} />
      </div>

      <div className="wl-list sc">
        {wishlist.length === 0 ? (
          <div className="empty-state">
            <div className="es-em">♡</div>
            <div className="es-t">Ainda nada guardado</div>
            <div className="es-s">Explora as categorias e guarda o que te interessa</div>
          </div>
        ) : (
          wishlist.map((w, i) => (
            <div key={i} className="wl-item fade-in">
              <div className="wl-em">{w.emoji}</div>
              <div className="wl-info">
                <div className="wl-name">{w.title}</div>
                <div className="wl-meta">What to {w.cat}</div>
              </div>
              <button className="wl-del" onClick={() => onRemove(i)}>✕</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
