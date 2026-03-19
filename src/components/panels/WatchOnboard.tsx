import { useState, useEffect } from 'react';
import type { WatchPrefs } from '../../types';

interface WatchOnboardProps {
  isOpen: boolean;
  currentPrefs: WatchPrefs;
  onClose: (prefs: WatchPrefs) => void;
}

function Toggle({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button className={`eat-ob-toggle${active ? ' on' : ''}`} onClick={onClick}>
      {label}
    </button>
  );
}

const GENRES = ['Ação', 'Comédia', 'Drama', 'Terror', 'Sci-Fi', 'Romance', 'Documentário', 'Anime'];

export default function WatchOnboard({ isOpen, currentPrefs, onClose }: WatchOnboardProps) {
  const [genres, setGenres] = useState<string[]>(currentPrefs.genres || []);
  const [duration, setDuration] = useState(currentPrefs.duration || 'normal');
  const [type, setType] = useState(currentPrefs.type || 'Ambos');
  const [discovery, setDiscovery] = useState(currentPrefs.discovery || 'mistura');

  useEffect(() => {
    if (isOpen) {
      setGenres(currentPrefs.genres || []);
      setDuration(currentPrefs.duration || 'normal');
      setType(currentPrefs.type || 'Ambos');
      setDiscovery(currentPrefs.discovery || 'mistura');
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleGenre = (g: string) => {
    if (genres.includes(g)) setGenres(genres.filter(x => x !== g));
    else setGenres([...genres, g]);
  };

  const handleSave = (skip = false) => {
    onClose({
      done: true,
      genres: skip ? [] : genres,
      duration: skip ? 'normal' : duration,
      type: skip ? 'Ambos' : type,
      discovery: skip ? 'mistura' : discovery,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="ov on" style={{ zIndex: 400 }}>
      <div className="panel eat-ob-panel">
        <div className="panel-drag" />

        <button className="btn-x" style={{ marginBottom: 14 }} onClick={() => handleSave(true)}>
          Saltar tudo →
        </button>

        <div className="eat-ob-title">
          <span>🎬</span>
          <div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, fontStyle: 'italic' }}>O que ver?</div>
            <div style={{ fontSize: 11, color: 'var(--mu)', marginTop: 2 }}>Para esta sessão</div>
          </div>
        </div>

        <div className="eat-ob-section">
          <div className="eat-ob-lbl">Géneros?</div>
          <div className="eat-ob-row" style={{ flexWrap: 'wrap' }}>
            {GENRES.map(g => (
              <Toggle key={g} label={g} active={genres.includes(g)} onClick={() => toggleGenre(g)} />
            ))}
          </div>
        </div>

        {type !== 'Série' && (
          <div className="eat-ob-section">
            <div className="eat-ob-lbl">Duração?</div>
            <div className="eat-ob-row">
              {([['curto', '⚡ -90min'], ['normal', '🎬 90-120min'], ['longo', '🍿 +120min']] as [string, string][]).map(([v, l]) => (
                <Toggle key={v} label={l} active={duration === v} onClick={() => setDuration(v)} />
              ))}
            </div>
          </div>
        )}

        <div className="eat-ob-section">
          <div className="eat-ob-lbl">Tipo?</div>
          <div className="eat-ob-row">
            {([['Filme', '🎞 Filme'], ['Série', '📺 Série'], ['Ambos', '✦ Ambos']] as [string, string][]).map(([v, l]) => (
              <Toggle key={v} label={l} active={type === v} onClick={() => setType(v)} />
            ))}
          </div>
        </div>

        <div className="eat-ob-section">
          <div className="eat-ob-lbl">Descoberta?</div>
          <div className="eat-ob-row">
            {([['populares', '⭐ Só populares'], ['mistura', '🎭 Mistura'], ['surpresa', '🎲 Surpreende-me']] as [string, string][]).map(([v, l]) => (
              <Toggle key={v} label={l} active={discovery === v} onClick={() => setDiscovery(v)} />
            ))}
          </div>
        </div>

        <button className="eat-ob-save" onClick={() => handleSave(false)}>Aplicar preferências</button>
      </div>
    </div>
  );
}
