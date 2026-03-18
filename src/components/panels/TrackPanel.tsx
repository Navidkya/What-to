import { useState } from 'react';
import type { DataItem, TrackingMap } from '../../types';
import { TSTATE } from '../../data';

interface TrackPanelProps {
  item: DataItem | null;
  catId: string;
  tracking: TrackingMap;
  isOpen: boolean;
  onClose: () => void;
  onSave: (tracking: TrackingMap) => void;
  onToast: (msg: string) => void;
}

export default function TrackPanel({ item, catId, tracking, isOpen, onClose, onSave, onToast }: TrackPanelProps) {
  if (!item) return null;
  const key = catId + ':' + item.title;
  const tr = tracking[key] || { state: 'want' };
  const [selectedState, setSelectedState] = useState<'watching' | 'paused' | 'done' | 'dropped' | 'want'>(tr.state || 'want');
  const [season, setSeason] = useState(tr.s || 1);
  const [episode, setEpisode] = useState(tr.e || 1);
  const isSeries = item.type === 'Série';

  const save = () => {
    const updated: TrackingMap = {
      ...tracking,
      [key]: {
        state: selectedState as 'watching' | 'paused' | 'done' | 'dropped' | 'want',
        title: item.title,
        emoji: item.emoji,
        cat: catId,
        catId,
        ...(isSeries ? { s: season, e: episode } : {}),
      },
    };
    onSave(updated);
    onClose();
    onToast('📺 Tracking guardado!');
  };

  return (
    <div className={`ov${isOpen ? ' on' : ''}`} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="panel">
        <div className="panel-drag" />
        <div className="panel-title">
          <b>{item.title}</b>progresso
        </div>
        <div className="track-states">
          {TSTATE.map(s => (
            <button
              key={s.id}
              className={`ts-btn${selectedState === s.id ? ' on' : ''}`}
              onClick={() => setSelectedState(s.id as 'watching' | 'paused' | 'done' | 'dropped' | 'want')}
            >
              {s.i} {s.l}
            </button>
          ))}
        </div>
        {isSeries && (
          <div className="ep-row">
            <label>Temp.</label>
            <input className="ep-input" type="number" min={1} max={20} value={season} onChange={e => setSeason(Number(e.target.value))} style={{ maxWidth: 55 }} />
            <label>Ep.</label>
            <input className="ep-input" type="number" min={1} max={30} value={episode} onChange={e => setEpisode(Number(e.target.value))} style={{ maxWidth: 55 }} />
          </div>
        )}
        <button className="btn-primary" style={{ width: '100%', marginTop: 4 }} onClick={save}>✓ Guardar progresso</button>
        <button className="btn-x" onClick={onClose}>fechar</button>
      </div>
    </div>
  );
}
