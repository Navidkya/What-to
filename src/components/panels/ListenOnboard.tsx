import { useState, useEffect } from 'react';
import type { ListenPrefs } from '../../types';

interface Props {
  isOpen: boolean;
  currentPrefs: ListenPrefs;
  onClose: (prefs: ListenPrefs) => void;
}

function Toggle({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button className={`eat-ob-toggle${active ? ' on' : ''}`} onClick={onClick}>{label}</button>
  );
}

const MUSIC_GENRES = ['Pop', 'Hip-Hop', 'Jazz', 'Electrónica', 'Rock', 'Clássica', 'R&B', 'Indie'];
const MUSIC_GENRES_EXTRA = ['Funk', 'Soul', 'Metal', 'Country', 'Blues', 'Reggae'];
const PODCAST_GENRES = ['Ciência', 'Tecnologia', 'True Crime', 'Cultura', 'Negócios', 'Saúde', 'Desporto', 'Histórias'];
const PODCAST_GENRES_EXTRA = ['Filosofia', 'Política', 'Psicologia', 'Arte', 'Futurismo', 'Educação'];
const AMBOS_GENRES = ['Pop', 'Rock', 'Hip-Hop', 'Jazz', 'True Crime', 'Ciência', 'Cultura', 'Indie'];
const AMBOS_GENRES_EXTRA = ['Electrónica', 'Clássica', 'R&B', 'Negócios', 'Tecnologia', 'Saúde'];

export default function ListenOnboard({ isOpen, currentPrefs, onClose }: Props) {
  const [type, setType] = useState<'Álbum' | 'Podcast' | 'Ambos'>(currentPrefs.type || 'Ambos');
  const [genres, setGenres] = useState<string[]>(currentPrefs.genres || []);
  const [energia, setEnergia] = useState<'relaxante' | 'energetico' | 'mistura'>(currentPrefs.energia || 'mistura');
  const [showExtra, setShowExtra] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setType(currentPrefs.type || 'Ambos');
      setGenres(currentPrefs.genres || []);
      setEnergia(currentPrefs.energia || 'mistura');
      setShowExtra(false);
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTypeChange = (t: 'Álbum' | 'Podcast' | 'Ambos') => {
    setType(t);
    setGenres([]);
    setShowExtra(false);
  };

  const toggle = (g: string) => setGenres(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);

  const getGenres = () => {
    if (type === 'Álbum') return { main: MUSIC_GENRES, extra: MUSIC_GENRES_EXTRA };
    if (type === 'Podcast') return { main: PODCAST_GENRES, extra: PODCAST_GENRES_EXTRA };
    return { main: AMBOS_GENRES, extra: AMBOS_GENRES_EXTRA };
  };

  const handleSave = (skip = false) => onClose(skip
    ? { done: true, type: 'Ambos', genres: [], energia: 'mistura' }
    : { done: true, type, genres, energia }
  );

  if (!isOpen) return null;
  const { main, extra } = getGenres();

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
              <Toggle key={t} label={t === 'Álbum' ? '🎵 Álbum' : t === 'Podcast' ? '🎙 Podcast' : '✦ Ambos'} active={type === t} onClick={() => handleTypeChange(t)} />
            ))}
          </div>
        </div>

        <div className="eat-ob-section">
          <div className="eat-ob-lbl">{type === 'Podcast' ? 'Temas favoritos' : 'Géneros favoritos'}</div>
          <div className="eat-ob-row" style={{ flexWrap: 'wrap' }}>
            {main.map(g => <Toggle key={g} label={g} active={genres.includes(g)} onClick={() => toggle(g)} />)}
            {showExtra && extra.map(g => <Toggle key={g} label={g} active={genres.includes(g)} onClick={() => toggle(g)} />)}
          </div>
          <button
            onClick={() => setShowExtra(v => !v)}
            style={{ background: 'none', border: 'none', color: 'var(--ac)', fontSize: 12, cursor: 'pointer', marginTop: 6, padding: 0 }}
          >
            {showExtra ? '▲ menos opções' : '▼ mais opções'}
          </button>
        </div>

        <div className="eat-ob-section">
          <div className="eat-ob-lbl">Energia?</div>
          <div className="eat-ob-row">
            {([['relaxante', '😌 Relaxante'], ['energetico', '🔥 Energético'], ['mistura', '✦ Mistura']] as [string, string][]).map(([v, l]) => (
              <Toggle key={v} label={l} active={energia === v} onClick={() => setEnergia(v as 'relaxante' | 'energetico' | 'mistura')} />
            ))}
          </div>
        </div>

        <button className="eat-ob-save" onClick={() => handleSave(false)}>Aplicar preferências</button>
      </div>
    </div>
  );
}
