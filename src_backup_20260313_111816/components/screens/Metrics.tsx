import type { HistoryEntry, TrackingMap } from '../../types';

interface MetricsProps {
  history: HistoryEntry[];
  tracking: TrackingMap;
  isActive: boolean;
  onBack: () => void;
  onShowWrapped: () => void;
}

export default function Metrics({ history, tracking, isActive, onBack, onShowWrapped }: MetricsProps) {
  const now = new Date();
  const m = now.getMonth();
  const thisM = history.filter(h => new Date(h.date).getMonth() === m);
  const done = history.filter(h => h.action === 'agora' || h.action === 'hoje');
  const wDone = done.filter(h => h.catId === 'watch');
  const eDone = done.filter(h => h.catId === 'eat');
  const rDone = done.filter(h => h.catId === 'read');
  const eHome = eDone.filter(h => h.type === 'Receita');
  const eOut = eDone.filter(h => ['Restaurante', 'Delivery'].includes(h.type));
  const saving = eHome.length * 12;

  const gc: Record<string, number> = {};
  done.forEach(h => { if (h.genre) gc[h.genre] = (gc[h.genre] || 0) + 1; });
  const topG = Object.entries(gc).sort((a, b) => b[1] - a[1])[0];

  const trW = Object.values(tracking);

  return (
    <div className={`screen${isActive ? ' active' : ''}`} id="metrics">
      <div className="tb mw">
        <button className="tbi" onClick={onBack}>←</button>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontStyle: 'italic', fontWeight: 600, color: '#f5f1eb' }}>Métricas</div>
        <div style={{ width: 36 }} />
      </div>

      <div className="metrics-inner sc">
        <div className="mc">
          <div className="mc-lbl">Este mês</div>
          <div className="mc-big">{thisM.length}<span> decisões</span></div>
          <div className="mc-grid" style={{ marginTop: 12 }}>
            <div className="mc-mini">
              <div className="mc-mini-n">{thisM.filter(h => h.catId === 'watch').length}</div>
              <div className="mc-mini-l">🎬 Vistas</div>
            </div>
            <div className="mc-mini">
              <div className="mc-mini-n">{thisM.filter(h => h.catId === 'eat').length}</div>
              <div className="mc-mini-l">🍽️ Refeições</div>
            </div>
            <div className="mc-mini">
              <div className="mc-mini-n">{thisM.filter(h => h.catId === 'read').length}</div>
              <div className="mc-mini-l">📚 Lidas</div>
            </div>
          </div>
        </div>

        <div className="mc">
          <div className="mc-lbl">Total histórico</div>
          <div className="mc-big">{done.length}<span> coisas feitas</span></div>
          <div className="mc-pills">
            {wDone.length > 0 && <span className="mc-pill">🎬 {wDone.length} títulos</span>}
            {eDone.length > 0 && <span className="mc-pill">🍽️ {eDone.length} refeições</span>}
            {rDone.length > 0 && <span className="mc-pill">📚 {rDone.length} livros</span>}
          </div>
          {topG && (
            <div className="mc-insight">
              O teu género favorito é <b>{topG[0]}</b> — visto {topG[1]} vez{topG[1] > 1 ? 'es' : ''}.
            </div>
          )}
        </div>

        {eHome.length > 0 && (
          <div className="mc">
            <div className="mc-lbl">Poupança estimada</div>
            <div className="mc-big">€{saving}<span> poupados</span></div>
            <div className="mc-insight">
              {eHome.length} receita{eHome.length > 1 ? 's' : ''} em casa vs {eOut.length} saída{eOut.length !== 1 ? 's' : ''}. Cada refeição caseira poupa ~€12 em média.
            </div>
          </div>
        )}

        <div className="mc">
          <div className="mc-lbl">Tracking activo</div>
          <div className="mc-grid">
            <div className="mc-mini">
              <div className="mc-mini-n">{trW.filter(t => t.state === 'watching').length}</div>
              <div className="mc-mini-l">▶️ A ver</div>
            </div>
            <div className="mc-mini">
              <div className="mc-mini-n">{trW.filter(t => t.state === 'done').length}</div>
              <div className="mc-mini-l">✅ Terminados</div>
            </div>
            <div className="mc-mini">
              <div className="mc-mini-n">{trW.filter(t => t.state === 'want').length}</div>
              <div className="mc-mini-l">⭐ Quero</div>
            </div>
          </div>
        </div>

        <button className="wrapped-btn" onClick={onShowWrapped}>✨ Gerar o meu Wrapped</button>
      </div>
    </div>
  );
}
