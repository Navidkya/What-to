import { useState, useEffect } from 'react';
import type { ReadPrefs } from '../../types';

interface Props {
  isOpen: boolean;
  currentPrefs: ReadPrefs;
  onClose: (prefs: ReadPrefs) => void;
}

const READ_GENRES = ['Psicologia', 'Sci-Fi', 'Romance', 'História', 'Filosofia', 'Negócios', 'Biografia', 'Auto-ajuda', 'Ficção', 'Thriller', 'Fantasia', 'Ciência'];

export default function ReadOnboard({ isOpen, currentPrefs, onClose }: Props) {
  const [type, setType] = useState<'Livro' | 'Artigo' | 'Ambos'>(currentPrefs.type || 'Ambos');
  const [genres, setGenres] = useState<string[]>(currentPrefs.genres || []);
  const [peso, setPeso] = useState<'leve' | 'denso' | 'mistura'>(currentPrefs.peso || 'mistura');

  useEffect(() => {
    if (isOpen) {
      setType(currentPrefs.type || 'Ambos');
      setGenres(currentPrefs.genres || []);
      setPeso(currentPrefs.peso || 'mistura');
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (g: string) => setGenres(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);
  const handleSave = (skip = false) => onClose(skip
    ? { done: true, type: 'Ambos', genres: [], peso: 'mistura' }
    : { done: true, type, genres, peso }
  );

  if (!isOpen) return null;
  return (
    <div className="ov on" style={{ zIndex: 400 }}>
      <div className="panel eat-ob-panel">
        <div className="panel-drag" />
        <button className="btn-x" style={{ marginBottom: 14 }} onClick={() => handleSave(true)}>Saltar tudo →</button>
        <div className="eat-ob-title">
          <span>📚</span>
          <div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, fontStyle: 'italic' }}>O que ler?</div>
            <div style={{ fontSize: 11, color: 'var(--mu)', marginTop: 2 }}>Para esta sessão</div>
          </div>
        </div>
        <div className="eat-ob-section">
          <div className="eat-ob-lbl">Preferes?</div>
          <div className="eat-ob-row">
            {(['Livro', 'Artigo', 'Ambos'] as const).map(t => (
              <button key={t} className={`eat-ob-toggle${type === t ? ' on' : ''}`} onClick={() => setType(t)}>{t}</button>
            ))}
          </div>
        </div>
        <div className="eat-ob-section">
          <div className="eat-ob-lbl">Géneros favoritos</div>
          <div className="eat-ob-row" style={{ flexWrap: 'wrap' }}>
            {READ_GENRES.map(g => (
              <button key={g} className={`eat-ob-toggle${genres.includes(g) ? ' on' : ''}`} onClick={() => toggle(g)}>{g}</button>
            ))}
          </div>
        </div>
        <div className="eat-ob-section">
          <div className="eat-ob-lbl">Ritmo de leitura?</div>
          <div className="eat-ob-row">
            {([['leve', '📖 Leve'], ['denso', '🧠 Denso'], ['mistura', '✦ Mistura']] as [string, string][]).map(([v, l]) => (
              <button key={v} className={`eat-ob-toggle${peso === v ? ' on' : ''}`} onClick={() => setPeso(v as any)}>{l}</button>
            ))}
          </div>
        </div>
        <button className="eat-ob-save" onClick={() => handleSave(false)}>Aplicar preferências</button>
      </div>
    </div>
  );
}
