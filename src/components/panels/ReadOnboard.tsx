import { useState, useEffect } from 'react';
import type { ReadPrefs } from '../../types';

interface Props {
  isOpen: boolean;
  currentPrefs: ReadPrefs;
  onClose: (prefs: ReadPrefs) => void;
}

function Toggle({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button className={`eat-ob-toggle${active ? ' on' : ''}`} onClick={onClick}>{label}</button>
  );
}

const BOOK_GENRES = ['Ficção', 'Romance', 'Sci-Fi', 'Fantasia', 'Terror', 'Thriller', 'Histórica', 'Aventura'];
const BOOK_GENRES_EXTRA = ['Distopia', 'Humor', 'Conto', 'Faroeste', 'Satíra', 'Drama'];
const ARTICLE_GENRES = ['Ciência', 'Tecnologia', 'Psicologia', 'Negócios', 'História', 'Arte', 'Filosofia', 'Sociedade'];
const ARTICLE_GENRES_EXTRA = ['Política', 'Economia', 'Saúde', 'Ambiente', 'Cultura', 'Design'];
const AMBOS_GENRES = ['Ficção', 'Sci-Fi', 'Psicologia', 'Negócios', 'Romance', 'Ciência', 'Filosofia', 'Thriller'];
const AMBOS_GENRES_EXTRA = ['Fantasia', 'Terror', 'Arte', 'História', 'Sociedade', 'Tecnologia'];

export default function ReadOnboard({ isOpen, currentPrefs, onClose }: Props) {
  const [type, setType] = useState<'Livro' | 'Artigo' | 'Ambos'>(currentPrefs.type || 'Ambos');
  const [genres, setGenres] = useState<string[]>(currentPrefs.genres || []);
  const [peso, setPeso] = useState<'leve' | 'denso' | 'mistura'>(currentPrefs.peso || 'mistura');
  const [showExtra, setShowExtra] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setType(currentPrefs.type || 'Ambos');
      setGenres(currentPrefs.genres || []);
      setPeso(currentPrefs.peso || 'mistura');
      setShowExtra(false);
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTypeChange = (t: 'Livro' | 'Artigo' | 'Ambos') => {
    setType(t);
    setGenres([]);
    setShowExtra(false);
  };

  const toggle = (g: string) => setGenres(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);

  const getGenres = () => {
    if (type === 'Livro') return { main: BOOK_GENRES, extra: BOOK_GENRES_EXTRA };
    if (type === 'Artigo') return { main: ARTICLE_GENRES, extra: ARTICLE_GENRES_EXTRA };
    return { main: AMBOS_GENRES, extra: AMBOS_GENRES_EXTRA };
  };

  const handleSave = (skip = false) => onClose(skip
    ? { done: false, type: 'Ambos', genres: [], peso: 'mistura' }
    : { done: true, type, genres, peso }
  );

  if (!isOpen) return null;
  const { main, extra } = getGenres();

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
              <Toggle key={t} label={t === 'Livro' ? '📖 Livro' : t === 'Artigo' ? '📰 Artigo' : '✦ Ambos'} active={type === t} onClick={() => handleTypeChange(t)} />
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
          <div className="eat-ob-lbl">Ritmo de leitura?</div>
          <div className="eat-ob-row">
            {([['leve', '📖 Leve'], ['denso', '🧠 Denso'], ['mistura', '✦ Mistura']] as [string, string][]).map(([v, l]) => (
              <Toggle key={v} label={l} active={peso === v} onClick={() => setPeso(v as 'leve' | 'denso' | 'mistura')} />
            ))}
          </div>
        </div>

        {type === 'Livro' && (
          <div className="eat-ob-section">
            <div className="eat-ob-lbl">Comprimento?</div>
            <div className="eat-ob-row">
              {([['⚡ Curto -200p', 'curto'], ['🎯 Normal', 'normal'], ['📚 Épico +400p', 'longo']] as [string, string][]).map(([l, _v]) => (
                <Toggle key={l} label={l} active={false} onClick={() => {}} />
              ))}
            </div>
          </div>
        )}

        <button className="eat-ob-save" onClick={() => handleSave(false)}>Aplicar preferências</button>
      </div>
    </div>
  );
}
