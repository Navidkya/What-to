import type { HistoryEntry, TrackingMap } from '../../types';

interface WrappedOverlayProps {
  history: HistoryEntry[];
  tracking: TrackingMap;
  isOpen: boolean;
  onClose: () => void;
  onToast: (msg: string) => void;
}

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export default function WrappedOverlay({ history, tracking, isOpen, onClose, onToast }: WrappedOverlayProps) {
  if (!isOpen) return null;

  const now = new Date();
  const done = history.filter(h => h.action === 'agora' || h.action === 'hoje');
  const w = done.filter(h => h.catId === 'watch').length;
  const e = done.filter(h => h.catId === 'eat').length;
  const r = done.filter(h => h.catId === 'read').length;
  const eH = done.filter(h => h.catId === 'eat' && h.type === 'Receita').length;
  const gc: Record<string, number> = {};
  done.forEach(h => { if (h.genre) gc[h.genre] = (gc[h.genre] || 0) + 1; });
  const tG = Object.entries(gc).sort((a, b) => b[1] - a[1])[0];

  const stats = [
    { n: w, l: '🎬 Títulos' },
    { n: e, l: '🍽️ Refeições' },
    { n: r, l: '📚 Leituras' },
    { n: `€${eH * 12}`, l: '💰 Poupados' },
    { n: done.length, l: '✅ Total' },
    { n: Object.keys(tracking).length, l: '📺 Track' },
  ];

  const phrase = (tG ? `O teu género favorito foi ${tG[0]}. ` : '') + 'Cada decisão boa começa com uma boa sugestão.';

  const copyWrapped = () => {
    const txt = `O meu What to:\n🎬 ${w} títulos\n🍽️ ${e} refeições\n📚 ${r} livros\n✅ ${done.length} decisões\n\nfeito com What to`;
    if (navigator.clipboard) navigator.clipboard.writeText(txt).then(() => onToast('✓ Copiado!'));
    else onToast('Copia o texto manualmente');
  };

  return (
    <div className="wrapped-overlay">
      <div className="wc">
        <div className="wc-logo">What to</div>
        <div className="wc-period">{MONTHS[now.getMonth()]} {now.getFullYear()}</div>
        <div className="wc-stats">
          {stats.map((s, i) => (
            <div key={i} className="wcs">
              <div className="wcs-n">{s.n}</div>
              <div className="wcs-l">{s.l}</div>
            </div>
          ))}
        </div>
        <div className="wc-phrase">{phrase}</div>
        <div className="wc-tag">feito com <span>What to</span></div>
        <div className="wc-btns">
          <button className="wc-btn" onClick={onClose}>Fechar</button>
          <button className="wc-btn main" onClick={copyWrapped}>Copiar texto</button>
        </div>
      </div>
    </div>
  );
}
