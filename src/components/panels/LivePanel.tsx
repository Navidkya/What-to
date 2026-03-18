import { useState } from 'react';
import type { TrackingMap, TrackingEntry } from '../../types';
import { CATS } from '../../data';

interface LivePanelProps {
  title: string;
  emoji: string;
  catId: string;
  tracking: TrackingMap;
  isOpen: boolean;
  onClose: () => void;
  onUpdateTracking: (t: TrackingMap) => void;
  onToast: (msg: string) => void;
}

const STATUSES = [
  { id: 'watching', l: '▶ A ver/jogar' },
  { id: 'paused', l: '⏸ Em pausa' },
  { id: 'done', l: '✅ Terminei' },
  { id: 'dropped', l: '🚫 Desisti' },
];

const FEELS = ['😍 Adorei', '😄 Estou a gostar', '😐 Mais ou menos', '😬 Não estou a gostar', '😴 Entediado', '🤯 Mind blown', '😢 Emocionante', '😂 Engraçado'];

export default function LivePanel({ title, emoji, catId, tracking, isOpen, onClose, onUpdateTracking, onToast }: LivePanelProps) {
  const key = catId + ':' + title;
  const tr: TrackingEntry = tracking[key] || { state: 'watching', title, emoji, cat: catId, catId };
  const cat = CATS.find(c => c.id === catId);
  const isSeries = tr.type === 'Série' || cat?.trackable;

  const [season, setSeason] = useState(tr.s || 1);
  const [episode, setEpisode] = useState(tr.e || 1);
  const [note, setNote] = useState(tr.note || '');
  const [feel, setFeel] = useState(tr.feel || '');
  const [status, setStatus] = useState(tr.state || 'watching');

  const setLiveStatus = (state: string) => {
    setStatus(state as TrackingEntry['state']);
    const updated = { ...tracking, [key]: { ...tr, state: state as TrackingEntry['state'] } };
    onUpdateTracking(updated);
    onToast('Estado actualizado');
  };

  const saveLiveEp = () => {
    const updated = { ...tracking, [key]: { ...tr, s: season, e: episode } };
    onUpdateTracking(updated);
    onToast('📺 Progresso guardado!');
  };

  const setLiveFeel = (f: string) => {
    setFeel(f);
    const updated = { ...tracking, [key]: { ...tr, feel: f } };
    onUpdateTracking(updated);
  };

  const saveLiveNote = () => {
    const updated = { ...tracking, [key]: { ...tr, note } };
    onUpdateTracking(updated);
    onToast('📝 Nota guardada!');
  };

  return (
    <div className={`ov${isOpen ? ' on' : ''}`} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="panel" style={{ maxHeight: '90vh' }}>
        <div className="panel-drag" />
        <div className="panel-title">
          <b>{title}</b>a acompanhar
        </div>
        <div className="live-card">
          <div className="live-card-top">
            <div className="live-card-em">{emoji}</div>
            <div className="live-card-info">
              <div className="live-card-title">{title}</div>
              <div className="live-card-meta">{cat?.icon || ''} {cat?.name || ''}{tr.s ? ` · T${tr.s} Ep${tr.e}` : ''}</div>
            </div>
          </div>
          <div className="live-status-row">
            {STATUSES.map(s => (
              <button
                key={s.id}
                className={`live-status${status === s.id ? ' active-st' : ''}`}
                onClick={() => setLiveStatus(s.id)}
              >
                {s.l}
              </button>
            ))}
          </div>
          {isSeries && (
            <div className="live-ep-row">
              <label>Temp.</label>
              <input className="live-ep-num" type="number" min={1} max={20} value={season} onChange={e => setSeason(Number(e.target.value))} />
              <label>Ep.</label>
              <input className="live-ep-num" type="number" min={1} max={30} value={episode} onChange={e => setEpisode(Number(e.target.value))} />
              <button
                onClick={saveLiveEp}
                style={{ background: 'var(--ac2)', border: '1px solid var(--ac)', borderRadius: 7, padding: '5px 10px', color: 'var(--ac)', fontFamily: 'Outfit, sans-serif', fontSize: 11, cursor: 'pointer' }}
              >
                Guardar
              </button>
            </div>
          )}
          <div className="live-feel-lbl">Como está a correr?</div>
          <div className="live-feel-row">
            {FEELS.map(f => (
              <button key={f} className={`feel-btn${feel === f ? ' on' : ''}`} onClick={() => setLiveFeel(f)}>{f}</button>
            ))}
          </div>
          <textarea
            className="live-note"
            placeholder="Nota rápida — o que estás a pensar..."
            value={note}
            onChange={e => setNote(e.target.value)}
          />
          <button className="btn-primary" style={{ width: '100%', marginTop: 4 }} onClick={saveLiveNote}>✓ Guardar nota</button>
        </div>
        <button className="btn-x" onClick={onClose}>fechar</button>
      </div>
    </div>
  );
}
