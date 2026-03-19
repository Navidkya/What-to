import { useState, useEffect } from 'react';
import type { PlayPrefs } from '../../types';

interface Props {
  isOpen: boolean;
  currentPrefs: PlayPrefs;
  onClose: (prefs: PlayPrefs) => void;
}

function Toggle({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button className={`eat-ob-toggle${active ? ' on' : ''}`} onClick={onClick}>{label}</button>
  );
}

const VIDEO_GENRES = ['RPG', 'Ação', 'Estratégia', 'Puzzle', 'Aventura', 'Plataforma', 'Roguelite', 'Sandbox'];
const VIDEO_GENRES_EXTRA = ['Simulação', 'Corrida', 'Terror', 'Luta', 'Stealth', 'Metroidvania'];
const BOARD_GENRES = ['Cooperativo', 'Competitivo', 'Estratégia', 'Party', 'Cartas', 'Dexterity'];
const BOARD_GENRES_EXTRA = ['Deck-building', 'Worker Placement', 'Eurogame', 'Solo', 'Puzzle', 'Legacy'];
const AMBOS_GENRES = ['RPG', 'Estratégia', 'Puzzle', 'Ação', 'Cooperativo', 'Aventura', 'Party', 'Indie'];
const AMBOS_GENRES_EXTRA = ['Plataforma', 'Roguelite', 'Sandbox', 'Cartas', 'Simulação', 'Terror'];

export default function PlayOnboard({ isOpen, currentPrefs, onClose }: Props) {
  const [type, setType] = useState<'Videojogo' | 'Tabuleiro' | 'Ambos'>(currentPrefs.type || 'Ambos');
  const [genres, setGenres] = useState<string[]>(currentPrefs.genres || []);
  const [dificuldade, setDificuldade] = useState<'casual' | 'normal' | 'desafiante'>(currentPrefs.dificuldade || 'normal');
  const [showExtra, setShowExtra] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setType(currentPrefs.type || 'Ambos');
      setGenres(currentPrefs.genres || []);
      setDificuldade(currentPrefs.dificuldade || 'normal');
      setShowExtra(false);
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTypeChange = (t: 'Videojogo' | 'Tabuleiro' | 'Ambos') => {
    setType(t);
    setGenres([]);
    setShowExtra(false);
  };

  const toggle = (g: string) => setGenres(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);

  const getGenres = () => {
    if (type === 'Videojogo') return { main: VIDEO_GENRES, extra: VIDEO_GENRES_EXTRA };
    if (type === 'Tabuleiro') return { main: BOARD_GENRES, extra: BOARD_GENRES_EXTRA };
    return { main: AMBOS_GENRES, extra: AMBOS_GENRES_EXTRA };
  };

  const handleSave = (skip = false) => onClose(skip
    ? { done: true, type: 'Ambos', genres: [], dificuldade: 'normal' }
    : { done: true, type, genres, dificuldade }
  );

  if (!isOpen) return null;
  const { main, extra } = getGenres();

  return (
    <div className="ov on" style={{ zIndex: 400 }}>
      <div className="panel eat-ob-panel">
        <div className="panel-drag" />
        <button className="btn-x" style={{ marginBottom: 14 }} onClick={() => handleSave(true)}>Saltar tudo →</button>
        <div className="eat-ob-title">
          <span>🎮</span>
          <div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, fontStyle: 'italic' }}>O que jogar?</div>
            <div style={{ fontSize: 11, color: 'var(--mu)', marginTop: 2 }}>Para esta sessão</div>
          </div>
        </div>

        <div className="eat-ob-section">
          <div className="eat-ob-lbl">Preferes?</div>
          <div className="eat-ob-row">
            {(['Videojogo', 'Tabuleiro', 'Ambos'] as const).map(t => (
              <Toggle key={t}
                label={t === 'Videojogo' ? '🎮 Videojogo' : t === 'Tabuleiro' ? '♟ Tabuleiro' : '✦ Ambos'}
                active={type === t} onClick={() => handleTypeChange(t)} />
            ))}
          </div>
        </div>

        <div className="eat-ob-section">
          <div className="eat-ob-lbl">Géneros favoritos</div>
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
          <div className="eat-ob-lbl">Dificuldade?</div>
          <div className="eat-ob-row">
            {([['casual', '🌸 Casual'], ['normal', '🎯 Normal'], ['desafiante', '💀 Desafiante']] as [string, string][]).map(([v, l]) => (
              <Toggle key={v} label={l} active={dificuldade === v} onClick={() => setDificuldade(v as 'casual' | 'normal' | 'desafiante')} />
            ))}
          </div>
        </div>

        {type === 'Tabuleiro' && (
          <div className="eat-ob-section">
            <div className="eat-ob-lbl">Nº de jogadores?</div>
            <div className="eat-ob-row">
              {(['Solo', '2 jogadores', '3-4 jogadores', '5+ jogadores'] as string[]).map(p => (
                <Toggle key={p} label={p} active={false} onClick={() => {}} />
              ))}
            </div>
          </div>
        )}

        <button className="eat-ob-save" onClick={() => handleSave(false)}>Aplicar preferências</button>
      </div>
    </div>
  );
}
