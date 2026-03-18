import { useState, useEffect } from 'react';
import type { ListenPrefs } from '../../types';

interface Props {
  isOpen: boolean;
  currentPrefs: ListenPrefs;
  onClose: (prefs: ListenPrefs) => void;
}

const LISTEN_GENRES = ['Pop', 'Hip-Hop', 'Jazz', 'Electrónica', 'Rock', 'Clássica', 'R&B', 'Indie', 'Ciência', 'Tecnologia', 'True Crime', 'Cultura'];

export default function ListenOnboard({ isOpen, currentPrefs, onClose }: Props) {
  const [type, setType] = useState<'Álbum' | 'Podcast' | 'Ambos'>(currentPrefs.type || 'Ambos');
  const [genres, setGenres] = useState<string[]>(currentPrefs.genres || []);
  const [energia, setEnergia] = useState<'relaxante' | 'energetico' | 'mistura'>(currentPrefs.energia || 'mistura');

  useEffect(() => {
    if (isOpen) {
      setType(currentPrefs.type || 'Ambos');
      setGenres(currentPrefs.genres || []);
      setEnergia(currentPrefs.energia || 'mistura');
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (g: string) => setGenres(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);
  const handleSave = (skip = false) => onClose(skip
    ? { done: true, type: 'Ambos', genres: [], energia: 'mistura' }
    : { done: true, type, genres, energia }
  );

  if (!isOpen) return null;
  return (
    <div className="ov on" style={{ zIndex: 400 }}>
      <div className="panel eat-ob-panel">
        <div className="panel-drag" />
        <button className="btn-x" style={{ marginBottom: 14 }} onClick={() => handleSave(true)}>Saltar tudo →</button>
        <div className="eat-ob-title">
          <span>🎵</span>
          <div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, fontStyle: 'italic' }}>O que ouvir?</div>
            <div style={{ fontSize: 11, color: 'var(--mu)', marginTop: 2 }}>Para este momento</div>
          </div>
        </div>
        <div className="eat-ob-section">
          <div className="eat-ob-lbl">Preferes?</div>
          <div className="eat-ob-row">
            {(['Álbum', 'Podcast', 'Ambos'] as const).map(t => (
              <button key={t} className={`eat-ob-toggle${type === t ? ' on' : ''}`} onClick={() => setType(t)}>{t}</button>
            ))}
          </div>
        </div>
        <div className="eat-ob-section">
          <div className="eat-ob-lbl">Géneros favoritos</div>
          <div className="eat-ob-row" style={{ flexWrap: 'wrap' }}>
            {LISTEN_GENRES.map(g => (
              <button key={g} className={`eat-ob-toggle${genres.includes(g) ? ' on' : ''}`} onClick={() => toggle(g)}>{g}</button>
            ))}
          </div>
        </div>
        <div className="eat-ob-section">
          <div className="eat-ob-lbl">Energia?</div>
          <div className="eat-ob-row">
            {([['relaxante', '😌 Relaxante'], ['energetico', '🔥 Energético'], ['mistura', '✦ Mistura']] as [string, string][]).map(([v, l]) => (
              <button key={v} className={`eat-ob-toggle${energia === v ? ' on' : ''}`} onClick={() => setEnergia(v as any)}>{l}</button>
            ))}
          </div>
        </div>
        <button className="eat-ob-save" onClick={() => handleSave(false)}>Aplicar preferências</button>
      </div>
    </div>
  );
}
