import { useState } from 'react';
import type { ListenPrefs } from '../../types';

interface Props { isOpen?: boolean; currentPrefs: ListenPrefs; onClose: (prefs: ListenPrefs) => void; }

function toggleVal(arr: string[], val: string): string[] {
  if (val === 'Qualquer') return arr.includes('Qualquer') ? [] : ['Qualquer'];
  const without = arr.filter(v => v !== 'Qualquer');
  return without.includes(val) ? without.filter(v => v !== val) : [...without, val];
}

const GENRE_MAP: Record<string, string[]> = {
  music: ['Pop','Hip-Hop','Rock','Jazz','Electrónica','R&B','Clássica','Indie','Metal','Soul','Funk','Reggae','Country','Blues','Bossa Nova','Fado'],
  podcast: ['Ciência','Tecnologia','True Crime','Cultura','Negócios','Saúde','Desporto','Histórias','Filosofia','Política','Psicologia','Arte','Comédia','Educação'],
};

export default function ListenOnboard({ isOpen, currentPrefs, onClose }: Props) {
  if (!isOpen) return null;
  const [types, setTypes] = useState<string[]>(currentPrefs.type && currentPrefs.type !== 'Ambos' ? [currentPrefs.type] : []);
  const [genres, setGenres] = useState<string[]>(currentPrefs.genres || []);
  const [energia, setEnergia] = useState<string[]>(currentPrefs.energia && currentPrefs.energia !== 'mistura' ? [currentPrefs.energia] : []);
  const [advanced, setAdvanced] = useState(false);
  const [momento, setMomento] = useState<string[]>(currentPrefs.momento ? [currentPrefs.momento] : []);
  const [duracao, setDuracao] = useState<string[]>(currentPrefs.duracao ? [currentPrefs.duracao] : []);
  const [lingua, setLingua] = useState<string[]>(currentPrefs.lingua ? [currentPrefs.lingua] : []);
  const [novidade, setNovidade] = useState<string[]>(currentPrefs.novidade ? [currentPrefs.novidade] : []);

  const isPodcast = types.includes('Podcast');
  const isMusic = types.some(t => ['Álbum','Single','Live'].includes(t));
  const genreOptions = isPodcast && !isMusic ? GENRE_MAP.podcast : isMusic && !isPodcast ? GENRE_MAP.music : [...GENRE_MAP.music, ...GENRE_MAP.podcast];

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
    const e = energia.filter(v => v !== 'Qualquer');
    onClose({
      done: true,
      type: (t.length === 1 ? t[0] : 'Ambos') as ListenPrefs['type'],
      genres: genres.filter(v => v !== 'Qualquer'),
      energia: (e[0] as ListenPrefs['energia']) || 'mistura',
      momento: momento.filter(v => v !== 'Qualquer')[0],
      duracao: duracao.filter(v => v !== 'Qualquer')[0],
      lingua: lingua.filter(v => v !== 'Qualquer')[0],
      novidade: novidade.filter(v => v !== 'Qualquer')[0],
    });
  };

  return (
    <div className="ov on" style={{ zIndex: 400 }}>
      <div className="panel eat-ob-panel" style={{ overflowY: 'auto', maxHeight: '85vh' }}>
        <div className="panel-drag" />
    <div style={{ fontFamily: "'Outfit', sans-serif", padding: '0 4px' }}>
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontStyle: 'italic', fontWeight: 600, color: '#f5f1eb', marginBottom: 4 }}>What to Listen</div>
      <div style={{ fontSize: 13, color: '#8a94a8', marginBottom: 20 }}>Personaliza as tuas sugestões</div>

      <div style={lbl}>Tipo</div>
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {['Qualquer','Álbum','Single/EP','Podcast','Audiobook','Rádio','Live/Concerto'].map(v => (
          <button key={v} style={btn(types.includes(v) || (v === 'Qualquer' && types.length === 0))} onClick={() => setTypes(prev => toggleVal(prev, v))}>{v}</button>
        ))}
      </div>

      <div style={lbl}>Géneros</div>
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {['Qualquer', ...genreOptions].map(v => (
          <button key={v} style={btn(genres.includes(v) || (v === 'Qualquer' && genres.length === 0))} onClick={() => setGenres(prev => toggleVal(prev, v))}>{v}</button>
        ))}
      </div>

      <div style={lbl}>Energia</div>
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {['Qualquer','Relaxante','Energético'].map(v => (
          <button key={v} style={btn(energia.includes(v) || (v === 'Qualquer' && energia.length === 0))} onClick={() => setEnergia(prev => toggleVal(prev, v))}>{v}</button>
        ))}
      </div>

      <button onClick={() => setAdvanced(a => !a)} style={{ background: 'none', border: 'none', color: '#8a94a8', fontSize: 13, cursor: 'pointer', padding: '12px 0 4px', width: '100%', textAlign: 'left' }}>
        {advanced ? '▲ Menos opções' : '▼ Mais opções'}
      </button>

      {advanced && (<>
        <div style={lbl}>Momento</div>
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          {['Qualquer','Trabalhar/Focar','Treinar','Relaxar','Adormecer','Conduzir','Festejar'].map(v => (
            <button key={v} style={btn(momento.includes(v) || (v === 'Qualquer' && momento.length === 0))} onClick={() => setMomento(prev => toggleVal(prev, v))}>{v}</button>
          ))}
        </div>

        {(isPodcast || types.length === 0) && (<>
          <div style={lbl}>Duração (podcast)</div>
          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            {['Qualquer','Curto (-20min)','Normal (20-60min)','Longo (+60min)'].map(v => (
              <button key={v} style={btn(duracao.includes(v) || (v === 'Qualquer' && duracao.length === 0))} onClick={() => setDuracao(prev => toggleVal(prev, v))}>{v}</button>
            ))}
          </div>
        </>)}

        <div style={lbl}>Língua</div>
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          {['Qualquer','Português','Inglês'].map(v => (
            <button key={v} style={btn(lingua.includes(v) || (v === 'Qualquer' && lingua.length === 0))} onClick={() => setLingua(prev => toggleVal(prev, v))}>{v}</button>
          ))}
        </div>

        <div style={lbl}>Novidade</div>
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          {['Qualquer','Descobrir algo novo','Artistas conhecidos'].map(v => (
            <button key={v} style={btn(novidade.includes(v) || (v === 'Qualquer' && novidade.length === 0))} onClick={() => setNovidade(prev => toggleVal(prev, v))}>{v}</button>
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
