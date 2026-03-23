import { useRef, useState } from 'react';
import type { HistoryEntry, NightPlan, TrackingMap } from '../../types';
import { trackAsync } from '../../services/analytics';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface WrappedDataPlan {
  mode: 'plan';
  plan: NightPlan;
}

export interface WrappedDataSeries {
  mode: 'series';
  title: string;
  emoji: string;
  catId: string;
  cat: string;
  totalEpisodes?: number;
  feel?: string;
}

export interface WrappedDataPeriod {
  mode: 'monthly' | 'annual';
  history: HistoryEntry[];
  tracking: TrackingMap;
  monthName?: string;
  year?: number;
}

export type WrappedData = WrappedDataPlan | WrappedDataSeries | WrappedDataPeriod;

interface Props {
  data: WrappedData | null;
  isOpen: boolean;
  onClose: () => void;
  onToast: (msg: string) => void;
  userId?: string | null;
}

const MONTHS = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
];

// ── Main component ────────────────────────────────────────────────────────────

export default function WrappedGenerator({ data, isOpen, onClose, onToast, userId }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [capturing, setCapturing] = useState(false);

  if (!isOpen || !data) return null;

  const handleShareImage = async () => {
    if (!cardRef.current) return;
    setCapturing(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#0B0D12',
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const blob = await new Promise<Blob | null>(resolve =>
        canvas.toBlob(resolve, 'image/png')
      );
      if (!blob) { onToast('Erro ao gerar imagem'); return; }
      const file = new File([blob], 'whatto-wrapped.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'What to · Wrapped' });
        trackAsync({ userId, eventType: 'wrapped_shared', value: { mode: data.mode } });
      } else if (navigator.share) {
        await navigator.share({ title: 'What to · Wrapped', text: buildShareText(data) });
        trackAsync({ userId, eventType: 'wrapped_shared', value: { mode: data.mode } });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'whatto-wrapped.png';
        a.click();
        URL.revokeObjectURL(url);
        onToast('Imagem guardada!');
        trackAsync({ userId, eventType: 'wrapped_shared', value: { mode: data.mode, fallback: 'download' } });
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        onToast('Erro ao partilhar');
      }
    } finally {
      setCapturing(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.92)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px 20px',
      zIndex: 700,
      overflowY: 'auto',
    }}>

      {/* Card capturável */}
      <div ref={cardRef} style={{ width: '100%', maxWidth: 360 }}>
        {renderCard(data)}
      </div>

      {/* Botões de acção */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 360, marginTop: 16 }}>
        <button
          onClick={handleShareImage}
          disabled={capturing}
          style={{
            width: '100%', padding: '14px', borderRadius: 14,
            background: 'linear-gradient(135deg,#C89B3C,#a87535)',
            border: 'none', color: '#0B0D12',
            fontFamily: "'Outfit',sans-serif", fontSize: 14, fontWeight: 700,
            cursor: capturing ? 'wait' : 'pointer',
            opacity: capturing ? 0.7 : 1,
            transition: 'opacity 0.2s',
          }}>
          {capturing ? 'A gerar…' : '↑ Partilhar imagem'}
        </button>
        <button
          onClick={onClose}
          style={{
            width: '100%', padding: '11px', borderRadius: 14,
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.07)',
            color: 'rgba(156,165,185,0.5)',
            fontFamily: "'Outfit',sans-serif", fontSize: 12,
            cursor: 'pointer',
          }}>
          ← fechar
        </button>
      </div>
    </div>
  );
}

// ── Routing ───────────────────────────────────────────────────────────────────

function renderCard(data: WrappedData) {
  if (data.mode === 'plan')   return <PlanCard plan={data.plan} />;
  if (data.mode === 'series') return <SeriesCard data={data} />;
  return <PeriodCard data={data} />;
}

function buildShareText(data: WrappedData): string {
  if (data.mode === 'plan') {
    return (
      `✦ ${data.plan.name}\n` +
      data.plan.items.map(i => `${i.emoji} ${i.title}`).join('\n') +
      '\n\n— what to · decide less. live more.'
    );
  }
  if (data.mode === 'series') {
    return `✦ Terminei "${data.title}"!\n\n— what to · decide less. live more.`;
  }
  const done = data.history.filter(h => h.action === 'agora' || h.action === 'hoje');
  return (
    `✦ O meu What to:\n` +
    `🎬 ${done.filter(h => h.catId === 'watch').length} títulos\n` +
    `🍽️ ${done.filter(h => h.catId === 'eat').length} refeições\n` +
    `📚 ${done.filter(h => h.catId === 'read').length} leituras\n` +
    `✅ ${done.length} total\n\n` +
    `— what to · decide less. live more.`
  );
}

// ── Plan Card ─────────────────────────────────────────────────────────────────

function PlanCard({ plan }: { plan: NightPlan }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg,#0d1020,#0B0D12)',
      border: '1px solid rgba(200,155,60,0.3)',
      borderRadius: 24, padding: '28px 24px 24px',
      boxShadow: '0 0 60px rgba(200,155,60,0.1)',
    }}>
      <CardHeader label="plano" />

      <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 30, fontWeight: 700, fontStyle: 'italic', color: '#f5f1eb', lineHeight: 1.15, marginBottom: 6 }}>
        {plan.name}
      </div>
      <div style={{ fontSize: 11, color: 'rgba(156,165,185,0.5)', marginBottom: 20 }}>
        {new Date(plan.createdAt).toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: plan.participants.length > 1 ? 16 : 0 }}>
        {plan.items.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(200,155,60,0.1)', border: '1px solid rgba(200,155,60,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 16 }}>{item.emoji}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#f5f1eb', fontFamily: "'Outfit',sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.title}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(156,165,185,0.4)', marginTop: 1 }}>{item.cat}</div>
            </div>
          </div>
        ))}
      </div>

      {plan.participants.length > 1 && (
        <div style={{ fontSize: 11, color: 'rgba(156,165,185,0.4)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 12, marginTop: 4 }}>
          com {plan.participants.join(', ')}
        </div>
      )}

      <CardFooter />
    </div>
  );
}

// ── Series Card ───────────────────────────────────────────────────────────────

function SeriesCard({ data }: { data: WrappedDataSeries }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg,#0d1020,#0B0D12)',
      border: '1px solid rgba(200,155,60,0.3)',
      borderRadius: 24, padding: '28px 24px 24px',
      boxShadow: '0 0 60px rgba(200,155,60,0.1)',
    }}>
      <CardHeader label="terminei" />

      <div style={{ fontSize: 56, textAlign: 'center', marginBottom: 8 }}>{data.emoji}</div>
      <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 28, fontWeight: 700, fontStyle: 'italic', color: '#f5f1eb', lineHeight: 1.15, textAlign: 'center', marginBottom: 6 }}>
        {data.title}
      </div>
      <div style={{ fontSize: 11, color: 'rgba(156,165,185,0.5)', textAlign: 'center', marginBottom: 20 }}>
        {data.cat}
      </div>

      {!!data.totalEpisodes && (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <div style={{ padding: '8px 20px', background: 'rgba(200,155,60,0.08)', border: '1px solid rgba(200,155,60,0.2)', borderRadius: 20, fontSize: 12, color: '#C89B3C', fontFamily: "'Outfit',sans-serif" }}>
            {data.totalEpisodes} episódios
          </div>
        </div>
      )}

      {data.feel && (
        <div style={{ textAlign: 'center', fontSize: 13, color: 'rgba(156,165,185,0.6)', fontStyle: 'italic', marginBottom: 16 }}>
          "{data.feel}"
        </div>
      )}

      <CardFooter />
    </div>
  );
}

// ── Period Card (monthly / annual) ────────────────────────────────────────────

function PeriodCard({ data }: { data: WrappedDataPeriod }) {
  const now = new Date();
  const done = data.history.filter(h => h.action === 'agora' || h.action === 'hoje');

  const counts = {
    watch: done.filter(h => h.catId === 'watch').length,
    eat:   done.filter(h => h.catId === 'eat').length,
    read:  done.filter(h => h.catId === 'read').length,
    play:  done.filter(h => h.catId === 'play').length,
    listen:done.filter(h => h.catId === 'listen').length,
    learn: done.filter(h => h.catId === 'learn').length,
  };

  const gc: Record<string, number> = {};
  done.forEach(h => { if (h.genre) gc[h.genre] = (gc[h.genre] || 0) + 1; });
  const topGenre = Object.entries(gc).sort((a, b) => b[1] - a[1])[0];
  const seriesDone = Object.values(data.tracking).filter(t => t.state === 'done').length;

  const periodLabel = data.mode === 'annual'
    ? String(data.year ?? now.getFullYear())
    : (data.monthName ?? MONTHS[now.getMonth()]);

  const blocks = [
    { n: counts.watch,   l: 'Títulos' },
    { n: counts.eat,     l: 'Refeições' },
    { n: counts.read,    l: 'Leituras' },
    { n: counts.play,    l: 'Jogos' },
    { n: counts.listen,  l: 'Músicas' },
    { n: seriesDone,     l: 'Séries' },
  ].filter(b => b.n > 0).slice(0, 6);

  return (
    <div style={{
      background: 'linear-gradient(135deg,#0d1020,#0B0D12)',
      border: '1px solid rgba(200,155,60,0.3)',
      borderRadius: 24, padding: '28px 24px 24px',
      boxShadow: '0 0 60px rgba(200,155,60,0.1)',
    }}>
      <CardHeader label={data.mode === 'annual' ? 'annual wrapped' : 'wrapped'} />

      <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 38, fontWeight: 700, fontStyle: 'italic', color: '#f5f1eb', lineHeight: 1.1, marginBottom: 4 }}>
        {periodLabel}
      </div>
      <div style={{ fontSize: 12, color: 'rgba(156,165,185,0.4)', marginBottom: 24 }}>
        {done.length} decisões no total
      </div>

      {blocks.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
          {blocks.map((b, i) => (
            <div key={i} style={{ padding: '12px 8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#C89B3C', fontFamily: "'Outfit',sans-serif", lineHeight: 1 }}>{b.n}</div>
              <div style={{ fontSize: 9, color: 'rgba(156,165,185,0.5)', marginTop: 4, fontFamily: "'Outfit',sans-serif", letterSpacing: 0.5 }}>{b.l}</div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', fontSize: 13, color: 'rgba(156,165,185,0.4)', marginBottom: 20 }}>
          Ainda sem actividades registadas
        </div>
      )}

      {topGenre && (
        <div style={{ fontSize: 12, color: 'rgba(156,165,185,0.5)', textAlign: 'center', marginBottom: 4 }}>
          género favorito: <span style={{ color: '#C89B3C' }}>{topGenre[0]}</span>
        </div>
      )}

      <CardFooter />
    </div>
  );
}

// ── Shared UI pieces ──────────────────────────────────────────────────────────

function CardHeader({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="#C89B3C" stroke="none">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
      <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 11, letterSpacing: 3, color: 'rgba(200,155,60,0.7)', textTransform: 'uppercase' }}>
        what to · {label}
      </span>
    </div>
  );
}

function CardFooter() {
  return (
    <div style={{ marginTop: 20, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'flex-end' }}>
      <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 10, letterSpacing: 2, color: 'rgba(200,155,60,0.4)', textTransform: 'uppercase' }}>
        decide less. live more.
      </span>
    </div>
  );
}
