import { useState, useEffect } from 'react';
import type { LearnPrefs } from '../../types';

interface Props {
  isOpen: boolean;
  currentPrefs: LearnPrefs;
  onClose: (prefs: LearnPrefs) => void;
}

const LEARN_GENRES = ['IA', 'Design', 'Programação', 'Negócios', 'Psicologia', 'Ciência', 'Arte', 'Línguas', 'Meditação', 'Filosofia', 'História', 'Marketing'];

export default function LearnOnboard({ isOpen, currentPrefs, onClose }: Props) {
  const [formato, setFormato] = useState<'video' | 'texto' | 'Ambos'>(currentPrefs.formato || 'Ambos');
  const [genres, setGenres] = useState<string[]>(currentPrefs.genres || []);
  const [duracao, setDuracao] = useState<'curta' | 'normal' | 'longa'>(currentPrefs.duracao || 'normal');

  useEffect(() => {
    if (isOpen) {
      setFormato(currentPrefs.formato || 'Ambos');
      setGenres(currentPrefs.genres || []);
      setDuracao(currentPrefs.duracao || 'normal');
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (g: string) => setGenres(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);
  const handleSave = (skip = false) => onClose(skip
    ? { done: true, formato: 'Ambos', genres: [], duracao: 'normal' }
    : { done: true, formato, genres, duracao }
  );

  if (!isOpen) return null;
  return (
    <div className="ov on" style={{ zIndex: 400 }}>
      <div className="panel eat-ob-panel">
        <div className="panel-drag" />
        <button className="btn-x" style={{ marginBottom: 14 }} onClick={() => handleSave(true)}>Saltar tudo →</button>
        <div className="eat-ob-title">
          <span>🧠</span>
          <div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, fontStyle: 'italic' }}>O que aprender?</div>
            <div style={{ fontSize: 11, color: 'var(--mu)', marginTop: 2 }}>Para hoje</div>
          </div>
        </div>
        <div className="eat-ob-section">
          <div className="eat-ob-lbl">Formato preferido?</div>
          <div className="eat-ob-row">
            {(['video', 'texto', 'Ambos'] as const).map(f => (
              <button key={f} className={`eat-ob-toggle${formato === f ? ' on' : ''}`} onClick={() => setFormato(f)}>
                {f === 'video' ? '📹 Vídeo' : f === 'texto' ? '📄 Texto/Artigo' : '✦ Ambos'}
              </button>
            ))}
          </div>
        </div>
        <div className="eat-ob-section">
          <div className="eat-ob-lbl">Temas de interesse</div>
          <div className="eat-ob-row" style={{ flexWrap: 'wrap' }}>
            {LEARN_GENRES.map(g => (
              <button key={g} className={`eat-ob-toggle${genres.includes(g) ? ' on' : ''}`} onClick={() => toggle(g)}>{g}</button>
            ))}
          </div>
        </div>
        <div className="eat-ob-section">
          <div className="eat-ob-lbl">Duração da sessão?</div>
          <div className="eat-ob-row">
            {([['curta', '⚡ Curta (< 15 min)'], ['normal', '🎯 Normal (15–45 min)'], ['longa', '📚 Longa (45 min+)']] as [string, string][]).map(([v, l]) => (
              <button key={v} className={`eat-ob-toggle${duracao === v ? ' on' : ''}`} onClick={() => setDuracao(v as 'curta' | 'normal' | 'longa')}>{l}</button>
            ))}
          </div>
        </div>
        <button className="eat-ob-save" onClick={() => handleSave(false)}>Aplicar preferências</button>
      </div>
    </div>
  );
}
