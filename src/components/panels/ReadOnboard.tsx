import { useState } from 'react';
import type { ReadPrefs } from '../../types';

interface Props { isOpen?: boolean; currentPrefs: ReadPrefs; onClose: (prefs: ReadPrefs) => void; }

function toggleVal(arr: string[], val: string): string[] {
  if (val === 'Qualquer') return arr.includes('Qualquer') ? [] : ['Qualquer'];
  const without = arr.filter(v => v !== 'Qualquer');
  return without.includes(val) ? without.filter(v => v !== val) : [...without, val];
}

const GENRE_MAP: Record<string, string[]> = {
  'Livro': ['Ficção','Romance','Sci-Fi','Fantasia','Terror','Thriller','Histórica','Aventura','Distopia','Humor','Faroeste','Satíra','Policíaco','Biográfico','Ciência','Tecnologia','Psicologia','Negócios','História','Arte','Filosofia','Sociedade'],
  'BD/Manga': ['Manga','Comic','Graphic Novel','Superhéroi','Shonen','Shojo','Seinen'],
  'default': ['Ficção','Não-ficção','Ciência','Psicologia','Negócios','História','Fantasia','Romance','Thriller','Tecnologia'],
};

export default function ReadOnboard({ isOpen, currentPrefs, onClose }: Props) {
  if (!isOpen) return null;
  const [types, setTypes] = useState<string[]>(currentPrefs.type && currentPrefs.type !== 'Ambos' ? [currentPrefs.type] : []);
  const [genres, setGenres] = useState<string[]>(currentPrefs.genres || []);
  const [peso, setPeso] = useState<string[]>(currentPrefs.peso && currentPrefs.peso !== 'mistura' ? [currentPrefs.peso] : []);
  const [advanced, setAdvanced] = useState(false);
  const [tempoReal, setTempoReal] = useState<string[]>(currentPrefs.tempoReal ? [currentPrefs.tempoReal] : []);
  const [comprimento, setComprimento] = useState<string[]>(currentPrefs.comprimento ? [currentPrefs.comprimento] : []);
  const [lingua, setLingua] = useState<string[]>(currentPrefs.lingua ? [currentPrefs.lingua] : []);

  const activeTypes = types.filter(t => t !== 'Qualquer');
  const genreOptions = activeTypes.length === 1 ? (GENRE_MAP[activeTypes[0]] || GENRE_MAP.default) : GENRE_MAP.default;

  const btn = (active: boolean) => ({
    borderRadius: 20, padding: '6px 14px', fontSize: 13, cursor: 'pointer',
    border: `1px solid ${active ? 'rgba(200,155,60,0.4)' : 'rgba(255,255,255,0.1)'}`,
    background: active ? 'rgba(200,155,60,0.9)' : 'rgba(255,255,255,0.06)',
    color: active ? '#0b0d12' : 'rgba(245,241,235,0.7)',
    fontFamily: "'Outfit', sans-serif", fontWeight: active ? 600 : 400, margin: '3px',
  });
  const lbl = { fontSize: 12, color: '#8a94a8', textTransform: 'uppercase' as const, letterSpacing: '0.08em', margin: '16px 0 8px' };

  const save = () => {
    const t = types.filter(v => v !== 'Qualquer');
    const p = peso.filter(v => v !== 'Qualquer');
    onClose({
      done: true,
      type: (t.length === 1 ? t[0] : 'Ambos') as ReadPrefs['type'],
      genres: genres.filter(v => v !== 'Qualquer'),
      peso: (p[0] as ReadPrefs['peso']) || 'mistura',
      tempoReal: tempoReal.filter(v => v !== 'Qualquer')[0],
      comprimento: comprimento.filter(v => v !== 'Qualquer')[0],
      lingua: lingua.filter(v => v !== 'Qualquer')[0],
    });
  };

  return (
    <div className="ov on" style={{ zIndex: 400 }}>
      <div className="panel eat-ob-panel" style={{ overflowY: 'auto', maxHeight: '85vh' }}>
        <div className="panel-drag" />
    <div style={{ fontFamily: "'Outfit', sans-serif", padding: '0 4px' }}>
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontStyle: 'italic', fontWeight: 600, color: '#f5f1eb', marginBottom: 4 }}>What to Read</div>
      <div style={{ fontSize: 13, color: '#8a94a8', marginBottom: 20 }}>Personaliza as tuas sugestões</div>

      <div style={lbl}>Tipo</div>
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {['Qualquer','Livro','BD/Manga'].map(v => (
          <button key={v} style={btn(types.includes(v) || (v === 'Qualquer' && types.length === 0))} onClick={() => setTypes(prev => toggleVal(prev, v))}>{v}</button>
        ))}
      </div>

      <div style={lbl}>Géneros</div>
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {['Qualquer', ...genreOptions].map(v => (
          <button key={v} style={btn(genres.includes(v) || (v === 'Qualquer' && genres.length === 0))} onClick={() => setGenres(prev => toggleVal(prev, v))}>{v}</button>
        ))}
      </div>

      <div style={lbl}>Peso</div>
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {['Qualquer','Leve','Denso'].map(v => (
          <button key={v} style={btn(peso.includes(v) || (v === 'Qualquer' && peso.length === 0))} onClick={() => setPeso(prev => toggleVal(prev, v))}>{v}</button>
        ))}
      </div>

      <button onClick={() => setAdvanced(a => !a)} style={{ background: 'none', border: 'none', color: '#8a94a8', fontSize: 13, cursor: 'pointer', padding: '12px 0 4px', width: '100%', textAlign: 'left' }}>
        {advanced ? '▲ Menos opções' : '▼ Mais opções'}
      </button>

      {advanced && (<>
        <div style={lbl}>Tempo disponível</div>
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          {['Qualquer','15 minutos','1 hora','Quero mergulhar'].map(v => (
            <button key={v} style={btn(tempoReal.includes(v) || (v === 'Qualquer' && tempoReal.length === 0))} onClick={() => setTempoReal(prev => toggleVal(prev, v))}>{v}</button>
          ))}
        </div>

        <div style={lbl}>Comprimento</div>
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          {['Qualquer','Curto (-200p)','Normal (200-400p)','Épico (+400p)'].map(v => (
            <button key={v} style={btn(comprimento.includes(v) || (v === 'Qualquer' && comprimento.length === 0))} onClick={() => setComprimento(prev => toggleVal(prev, v))}>{v}</button>
          ))}
        </div>

        <div style={lbl}>Língua</div>
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          {['Qualquer','Português','Inglês'].map(v => (
            <button key={v} style={btn(lingua.includes(v) || (v === 'Qualquer' && lingua.length === 0))} onClick={() => setLingua(prev => toggleVal(prev, v))}>{v}</button>
          ))}
        </div>
      </>)}

      <button onClick={save} style={{ marginTop: 24, width: '100%', padding: '14px', background: 'rgba(200,155,60,0.9)', border: 'none', borderRadius: 12, color: '#0b0d12', fontFamily: "'Outfit', sans-serif", fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
        Guardar preferências
      </button>
      <button onClick={() => onClose({ ...currentPrefs, done: false })} style={{ marginTop: 8, width: '100%', padding: '10px', background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#8a94a8', fontFamily: "'Outfit', sans-serif", fontSize: 13, cursor: 'pointer' }}>
        Saltar por agora
      </button>
    </div>
      </div>
    </div>
  );
}
