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

const FILM_GENRES = ['Comédia', 'Drama', 'Sci-Fi', 'Suspense', 'Terror', 'Romance', 'Ação', 'Animação'];
const SERIES_GENRES = ['Drama', 'Comédia', 'Crime', 'Sci-Fi', 'Thriller', 'Romance', 'Documentário', 'Anime'];
const DOC_GENRES = ['Natureza', 'Crime', 'História', 'Ciência', 'Tecnologia', 'Desporto', 'Arte', 'Sociedade'];
const AMBOS_GENRES = ['Ação', 'Comédia', 'Drama', 'Terror', 'Sci-Fi', 'Romance', 'Anime', 'Documentário'];

const FILM_GENRES_EXTRA = ['Faroeste', 'Musical', 'Biográfico', 'Guerra', 'Fantasia', 'Mistério'];
const SERIES_GENRES_EXTRA = ['Reality', 'Histórico', 'Sobrenatural', 'Espionagem', 'Médico', 'Legal'];
const DOC_GENRES_EXTRA = ['Culinária', 'Viagens', 'Política', 'Filosofia', 'Natureza Humana', 'Espaço'];
const AMBOS_GENRES_EXTRA = ['Faroeste', 'Musical', 'Biográfico', 'Guerra', 'Fantasia', 'Mistério'];

const EP_DURATIONS: [string, string][] = [
  ['curto', '⚡ -25min/ep'],
  ['normal', '🎬 25-50min/ep'],
  ['longo', '🍿 +50min/ep'],
];
const FILM_DURATIONS: [string, string][] = [
  ['curto', '⚡ -90min'],
  ['normal', '🎬 90-120min'],
  ['longo', '🍿 +120min'],
];

export default function WatchOnboard({ isOpen, currentPrefs, onClose }: WatchOnboardProps) {
  const [genres, setGenres] = useState<string[]>(currentPrefs.genres || []);
  const [duration, setDuration] = useState(currentPrefs.duration || 'normal');
  const [type, setType] = useState(currentPrefs.type || 'Ambos');
  const [discovery, setDiscovery] = useState(currentPrefs.discovery || 'mistura');
  const [showExtraGenres, setShowExtraGenres] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setGenres(currentPrefs.genres || []);
      setDuration(currentPrefs.duration || 'normal');
      setType(currentPrefs.type || 'Ambos');
      setDiscovery(currentPrefs.discovery || 'mistura');
      setShowExtraGenres(false);
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTypeChange = (newType: string) => {
    setType(newType);
    setGenres([]);
    setDuration('normal');
    setShowExtraGenres(false);
  };

  const toggleGenre = (g: string) => {
    if (genres.includes(g)) setGenres(genres.filter(x => x !== g));
    else setGenres([...genres, g]);
  };

  const getMainGenres = () => {
    if (type === 'Filme') return FILM_GENRES;
    if (type === 'Série') return SERIES_GENRES;
    if (type === 'Documentário') return DOC_GENRES;
    return AMBOS_GENRES;
  };

  const getExtraGenres = () => {
    if (type === 'Filme') return FILM_GENRES_EXTRA;
    if (type === 'Série') return SERIES_GENRES_EXTRA;
    if (type === 'Documentário') return DOC_GENRES_EXTRA;
    return AMBOS_GENRES_EXTRA;
  };

  const getDurations = (): [string, string][] => {
    return type === 'Série' ? EP_DURATIONS : FILM_DURATIONS;
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

  const mainGenres = getMainGenres();
  const extraGenres = getExtraGenres();

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
          <div className="eat-ob-lbl">Tipo?</div>
          <div className="eat-ob-row">
            {([['Filme', '🎞 Filme'], ['Série', '📺 Série'], ['Documentário', '🎙 Documentário'], ['Ambos', '✦ Ambos']] as [string, string][]).map(([v, l]) => (
              <Toggle key={v} label={l} active={type === v} onClick={() => handleTypeChange(v)} />
            ))}
          </div>
        </div>

        <div className="eat-ob-section">
          <div className="eat-ob-lbl">Géneros?</div>
          <div className="eat-ob-row" style={{ flexWrap: 'wrap' }}>
            {mainGenres.map(g => (
              <Toggle key={g} label={g} active={genres.includes(g)} onClick={() => toggleGenre(g)} />
            ))}
            {showExtraGenres && extraGenres.map(g => (
              <Toggle key={g} label={g} active={genres.includes(g)} onClick={() => toggleGenre(g)} />
            ))}
          </div>
          <button
            onClick={() => setShowExtraGenres(v => !v)}
            style={{ background: 'none', border: 'none', color: 'var(--ac)', fontSize: 12, cursor: 'pointer', marginTop: 6, padding: 0 }}
          >
            {showExtraGenres ? '▲ menos opções' : '▼ mais opções'}
          </button>
        </div>

        {type !== 'Ambos' && (
          <div className="eat-ob-section">
            <div className="eat-ob-lbl">{type === 'Série' ? 'Duração por episódio?' : 'Duração?'}</div>
            <div className="eat-ob-row">
              {getDurations().map(([v, l]) => (
                <Toggle key={v} label={l} active={duration === v} onClick={() => setDuration(v)} />
              ))}
            </div>
          </div>
        )}

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
