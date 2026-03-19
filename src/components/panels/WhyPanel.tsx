import type { DataItem, Category, WhyReason } from '../../types';
import { WHY_EXTRA } from '../../data';

interface WhyPanelProps {
  item: DataItem | null;
  cat: Category | null;
  isOpen: boolean;
  onClose: () => void;
  onPick: (reason: WhyReason) => void;
  apiContext?: { type?: string; genre?: string; rating?: number };
}

export default function WhyPanel({ item, cat, isOpen, onClose, onPick, apiContext }: WhyPanelProps) {
  if (!item || !cat) return null;

  // Use apiContext data when available, fall back to DataItem fields
  const itemType = apiContext?.type || item.type;
  const itemGenre = apiContext?.genre || item.genre;
  const itemRating = apiContext?.rating;

  // Filtra opções irrelevantes com base no tipo e género do item
  const reasons = (WHY_EXTRA[cat.id] || []).filter(r => {
    // Tipo já definido — remove opções de mudar tipo
    if (itemType === 'Filme'   && r.p === 'type' && r.v === 'Filme')   return false;
    if (itemType === 'Série'   && r.p === 'type' && r.v === 'Série')   return false;
    if (itemType === 'Podcast' && r.p === 'type' && r.v === 'Podcast') return false;
    if (itemType === 'Álbum'   && r.p === 'type' && r.v === 'Álbum')   return false;
    if (itemType === 'Receita' && r.p === 'type' && r.v === 'Receita') return false;

    // Géneros leves — remove razões de "muita acção"
    const lightGenres = ['Comédia', 'Romance', 'Animação', 'Família'];
    if (lightGenres.includes(itemGenre) && r.l.toLowerCase().includes('acção')) return false;

    // Géneros pesados — remove razões de "muito pesado"
    const heavyGenres = ['Terror', 'Suspense', 'Crime', 'Guerra', 'Violência'];
    if (heavyGenres.includes(itemGenre) && r.l.toLowerCase().includes('pesado')) return false;

    // Séries — remove razões de duração de filme
    if (itemType === 'Série' && r.l.toLowerCase().includes('longo')) return false;

    // Item bem avaliado (>= 7.5) — remove razões negativas de qualidade
    if (itemRating !== undefined && itemRating >= 7.5 && r.l.toLowerCase().includes('qualidade')) return false;

    return true;
  });

  return (
    <div className={`ov${isOpen ? ' on' : ''}`} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="panel why-panel">
        <div className="panel-drag" />

        <div className="why-header">
          <div className="why-item-title">{item.title}</div>
          <div className="why-subtitle">porquê não?</div>
        </div>

        <div className="why-list">
          {reasons.map((r, i) => (
            <button key={i} className="why-btn" onClick={() => onPick(r)}>
              <span className="why-icon">{r.icon}</span>
              <div className="why-text">
                <div className="why-lbl">{r.l}</div>
                <div className="why-sub">{r.s}</div>
              </div>
              <span className="why-arrow">›</span>
            </button>
          ))}
        </div>

        <button className="why-back-btn" onClick={onClose}>← voltar</button>
      </div>
    </div>
  );
}
