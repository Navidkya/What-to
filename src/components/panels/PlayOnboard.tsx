import { useState } from 'react';
import type { PlayPrefs } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: (prefs: PlayPrefs) => void;
}

const PLAY_GENRES = ['RPG', 'Estratégia', 'Puzzle', 'Ação', 'Plataforma', 'Roguelite', 'Cooperativo', 'Competitivo', 'Sandbox', 'Aventura', 'Simulação', 'Indie'];

export default function PlayOnboard({ isOpen, onClose }: Props) {
  const [type, setType] = useState<'Videojogo' | 'Tabuleiro' | 'Ambos'>('Ambos');
  const [genres, setGenres] = useState<string[]>([]);
  const [dificuldade, setDificuldade] = useState<'casual' | 'normal' | 'desafiante'>('normal');

  const toggle = (g: string) => setGenres(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);
  const handleSave = (skip = false) => onClose(skip
    ? { done: true, type: 'Ambos', genres: [], dificuldade: 'normal' }
    : { done: true, type, genres, dificuldade }
  );

  if (!isOpen) return null;
  return (
    <div className="ov on" style={{ zIndex: 400 }}>
      <div className="panel eat-ob-panel">
        <div className="panel-drag" />
        <button className="btn-x" style={{ marginBottom: 14 }} onClick={() => handleSave(true)}>Saltar tudo →</button>
        <div className="eat-ob-title">
          <span>🎮</span>
          <div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 700 }}>O que jogar?</div>
            <div style={{ fontSize: 11, color: 'var(--mu)', marginTop: 2 }}>Personaliza as sugestões de Jogar</div>
          </div>
        </div>
        <div className="eat-ob-section">
          <div className="eat-ob-lbl">Preferes?</div>
          <div className="eat-ob-row">
            {(['Videojogo', 'Tabuleiro', 'Ambos'] as const).map(t => (
              <button key={t} className={`eat-ob-toggle${type === t ? ' on' : ''}`} onClick={() => setType(t)}>{t}</button>
            ))}
          </div>
        </div>
        <div className="eat-ob-section">
          <div className="eat-ob-lbl">Géneros favoritos</div>
          <div className="eat-ob-row" style={{ flexWrap: 'wrap' }}>
            {PLAY_GENRES.map(g => (
              <button key={g} className={`eat-ob-toggle${genres.includes(g) ? ' on' : ''}`} onClick={() => toggle(g)}>{g}</button>
            ))}
          </div>
        </div>
        <div className="eat-ob-section">
          <div className="eat-ob-lbl">Dificuldade?</div>
          <div className="eat-ob-row">
            {([['casual', '🌸 Casual'], ['normal', '🎯 Normal'], ['desafiante', '💀 Desafiante']] as [string, string][]).map(([v, l]) => (
              <button key={v} className={`eat-ob-toggle${dificuldade === v ? ' on' : ''}`} onClick={() => setDificuldade(v as any)}>{l}</button>
            ))}
          </div>
        </div>
        <button className="eat-ob-save" onClick={() => handleSave(false)}>Aplicar preferências</button>
      </div>
    </div>
  );
}
