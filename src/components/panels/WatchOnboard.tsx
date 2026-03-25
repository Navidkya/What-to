import { useState } from 'react';
import type { WatchPrefs } from '../../types';

interface Props { isOpen?: boolean; currentPrefs: WatchPrefs; onClose: (prefs: WatchPrefs) => void; }

function toggleVal(arr: string[], val: string): string[] {
  if (val === 'Qualquer') return arr.includes('Qualquer') ? [] : ['Qualquer'];
  const without = arr.filter(v => v !== 'Qualquer');
  return without.includes(val) ? without.filter(v => v !== val) : [...without, val];
}

const GENRE_MAP: Record<string, string[]> = {
  'Filme': ['Ação','Aventura','Comédia','Crime','Drama','Fantasia','Sci-Fi','Terror','Mistério','Romance','Suspense','Animação','Biográfico','Guerra','Musical','Faroeste'],
  'Série': ['Ação','Comédia','Crime','Drama','Fantasia','Sci-Fi','Terror','Mistério','Romance','Suspense','Histórico','Médico','Legal','Espionagem','Reality'],
  'Documentário': ['Natureza','Crime','História','Ciência','Tecnologia','Desporto','Arte','Sociedade','Culinária','Viagens','Política','Filosofia','Espaço'],
  'Anime': ['Shonen','Shojo','Seinen','Isekai','Mecha','Slice of Life','Terror','Fantasia'],
  'default': ['Ação','Comédia','Drama','Terror','Sci-Fi','Romance','Anime','Documentário'],
};

export default function WatchOnboard({ isOpen, currentPrefs, onClose }: Props) {
  if (!isOpen) return null;
  const [types, setTypes] = useState<string[]>(currentPrefs.type ? [currentPrefs.type] : []);
  const [genres, setGenres] = useState<string[]>(currentPrefs.genres || []);
  const [advanced, setAdvanced] = useState(false);
  const [duration, setDuration] = useState<string[]>(currentPrefs.duration ? [currentPrefs.duration] : []);
  const [origem, setOrigem] = useState<string[]>(currentPrefs.origem ? [currentPrefs.origem] : []);
  const [lingua, setLingua] = useState<string[]>(currentPrefs.lingua ? [currentPrefs.lingua] : []);
  const [epoca, setEpoca] = useState<string[]>(currentPrefs.epoca && currentPrefs.epoca !== 'qualquer' ? [currentPrefs.epoca] : []);
  const [minRating, setMinRating] = useState<string[]>(currentPrefs.minRating ? [currentPrefs.minRating] : []);

  const activeTypes = types.filter(t => t !== 'Qualquer');
  const genreOptions = activeTypes.length === 1 ? (GENRE_MAP[activeTypes[0]] || GENRE_MAP.default) : GENRE_MAP.default;

  const btn = (active: boolean) => ({
    borderRadius: 20, padding: '6px 14px', fontSize: 13, cursor: 'pointer',
    border: `1px solid ${active ? 'rgba(200,155,60,0.4)' : 'rgba(255,255,255,0.1)'}`,
    background: active ? 'rgba(200,155,60,0.9)' : 'rgba(255,255,255,0.06)',
    color: active ? '#0b0d12' : 'rgba(245,241,235,0.7)',
    fontFamily: "'Outfit', sans-serif", fontWeight: active ? 600 : 400,
    margin: '3px',
  });

  const lbl = { fontSize: 12, color: '#8a94a8', textTransform: 'uppercase' as const, letterSpacing: '0.08em', margin: '16px 0 8px' };

  const save = () => {
    const t = types.filter(v => v !== 'Qualquer' && v !== 'Ambos');
    const singleType = t.length === 1 ? t[0] : 'Ambos';
    onClose({
      done: true,
      type: singleType,
      genres: genres.filter(v => v !== 'Qualquer'),
      duration: duration.filter(v => v !== 'Qualquer')[0] || 'normal',
      discovery: 'mistura',
      origem: origem.filter(v => v !== 'Qualquer')[0],
      lingua: lingua.filter(v => v !== 'Qualquer')[0],
      epoca: epoca.filter(v => v !== 'Qualquer')[0] || 'qualquer',
      minRating: minRating.filter(v => v !== 'Qualquer')[0],
    });
  };

  return (
    <div className="ov on" style={{ zIndex: 400 }}>
      <div className="panel eat-ob-panel" style={{ overflowY: 'auto', maxHeight: '85vh' }}>
        <div className="panel-drag" />
    <div style={{ fontFamily: "'Outfit', sans-serif", padding: '0 4px' }}>
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontStyle: 'italic', fontWeight: 600, color: '#f5f1eb', marginBottom: 4 }}>What to Watch</div>
      <div style={{ fontSize: 13, color: '#8a94a8', marginBottom: 20 }}>Personaliza as tuas sugestões</div>

      <div style={lbl}>Tipo</div>
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {['Qualquer','Filme','Série','Documentário','Stand-up','Anime','Desporto','YouTube','Twitch'].map(v => (
          <button key={v} style={btn(types.includes(v) || (v === 'Qualquer' && types.length === 0))} onClick={() => setTypes(prev => toggleVal(prev, v))}>{v}</button>
        ))}
      </div>

      <div style={lbl}>Géneros</div>
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {['Qualquer', ...genreOptions].map(v => (
          <button key={v} style={btn(genres.includes(v) || (v === 'Qualquer' && genres.length === 0))} onClick={() => setGenres(prev => toggleVal(prev, v))}>{v}</button>
        ))}
      </div>

      <button onClick={() => setAdvanced(a => !a)} style={{ background: 'none', border: 'none', color: '#8a94a8', fontSize: 13, cursor: 'pointer', padding: '12px 0 4px', width: '100%', textAlign: 'left' }}>
        {advanced ? '▲ Menos opções' : '▼ Mais opções'}
      </button>

      {advanced && (<>
        <div style={lbl}>Duração</div>
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          {['Qualquer','Curto (-90min)','Normal (90-150min)','Longo (+150min)'].map(v => (
            <button key={v} style={btn(duration.includes(v) || (v === 'Qualquer' && duration.length === 0))} onClick={() => setDuration(prev => toggleVal(prev, v))}>{v}</button>
          ))}
        </div>

        <div style={lbl}>Origem</div>
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          {['Qualquer','Americano','Europeu','Asiático','Português','Latino'].map(v => (
            <button key={v} style={btn(origem.includes(v) || (v === 'Qualquer' && origem.length === 0))} onClick={() => setOrigem(prev => toggleVal(prev, v))}>{v}</button>
          ))}
        </div>

        <div style={lbl}>Língua</div>
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          {['Qualquer','Português','Inglês','Legendado'].map(v => (
            <button key={v} style={btn(lingua.includes(v) || (v === 'Qualquer' && lingua.length === 0))} onClick={() => setLingua(prev => toggleVal(prev, v))}>{v}</button>
          ))}
        </div>

        <div style={lbl}>Época</div>
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          {['Qualquer','Recente (+2015)','Anos 2000-2015','Anos 90 (1980-2000)','Anos 70-80','Clássico (-1960)'].map(v => (
            <button key={v} style={btn(epoca.includes(v) || (v === 'Qualquer' && epoca.length === 0))} onClick={() => setEpoca(prev => toggleVal(prev, v))}>{v}</button>
          ))}
        </div>

        <div style={lbl}>Rating mínimo</div>
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          {['Qualquer','7+','8+','8.5+'].map(v => (
            <button key={v} style={btn(minRating.includes(v) || (v === 'Qualquer' && minRating.length === 0))} onClick={() => setMinRating(prev => toggleVal(prev, v))}>{v}</button>
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
