import type { DataItem, Category, WhyReason } from '../../types';
import { WHY_EXTRA } from '../../data';

interface WhyPanelProps {
  item: DataItem | null;
  cat: Category | null;
  isOpen: boolean;
  onClose: () => void;
  onPick: (reason: WhyReason) => void;
  apiContext?: { type?: string; genre?: string; rating?: number };
  onSkipNow: () => void;
}

const WHY_ICONS: Record<string, React.ReactNode> = {
  '◷': <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
  '◶': <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l-3 3"/></svg>,
  '⚡': <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  '◈': <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  '◇': <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  '↺': <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 .49-4.5"/></svg>,
  '⊘': <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8m-4-4v4"/><line x1="2" y1="3" x2="22" y2="17"/></svg>,
  '◉': <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/></svg>,
  '★': <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  '▭': <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="13" rx="2"/><path d="M16 2l-4 5-4-5"/></svg>,
  '▬': <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="13" rx="2"/><path d="M2 12h20"/></svg>,
  '◆': <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>,
  '○': <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h0a2 2 0 0 0 2-2V2"/><path d="M5 2v20"/><path d="M21 2c0 0-2 2-2 8h4c0-6-2-8-2-8z"/><path d="M19 10v12"/></svg>,
  '⊟': <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
  '◎': <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  '⌂': <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  '↗': <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8l4 4-4 4M8 12h8"/></svg>,
};

export default function WhyPanel({ item, cat, isOpen, onClose, onPick, apiContext, onSkipNow }: WhyPanelProps) {
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

        {/* Botão principal — sem dar razão */}
        <button
          className="why-skip-btn"
          onClick={() => { onSkipNow(); onClose(); }}
        >
          <span>→</span>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--tx)' }}>Próxima sugestão</div>
            <div style={{ fontSize: 12, color: 'var(--mu)', marginTop: 2 }}>Avançar sem dar razão</div>
          </div>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '14px 0 10px' }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
          <div style={{ fontSize: 10, color: 'var(--mu)', letterSpacing: 1, textTransform: 'uppercase' }}>ou diz porquê</div>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
        </div>

        <div className="why-list">
          {reasons.map((r, i) => (
            <button key={i} className="why-btn" onClick={() => onPick(r)}>
              <span className="why-icon">
                {WHY_ICONS[r.icon] || <span style={{ fontSize: 14 }}>{r.icon}</span>}
              </span>
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
