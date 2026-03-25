import { useState } from 'react';
import type { LearnPrefs } from '../../types';

interface Props { isOpen?: boolean; currentPrefs: LearnPrefs; onClose: (prefs: LearnPrefs) => void; }

function toggleVal(arr: string[], val: string): string[] {
  if (val === 'Qualquer') return arr.includes('Qualquer') ? [] : ['Qualquer'];
  const without = arr.filter(v => v !== 'Qualquer');
  return without.includes(val) ? without.filter(v => v !== val) : [...without, val];
}

export default function LearnOnboard({ isOpen, currentPrefs, onClose }: Props) {
  if (!isOpen) return null;
  const [formatos, setFormatos] = useState<string[]>(currentPrefs.formato && currentPrefs.formato !== 'Ambos' ? [currentPrefs.formato] : []);
  const [genres, setGenres] = useState<string[]>(currentPrefs.genres || []);
  const [duracao, setDuracao] = useState<string[]>(currentPrefs.duracao ? [currentPrefs.duracao] : []);
  const [advanced, setAdvanced] = useState(false);
  const [nivel, setNivel] = useState<string[]>(currentPrefs.nivel ? [currentPrefs.nivel] : []);
  const [lingua, setLingua] = useState<string[]>(currentPrefs.lingua ? [currentPrefs.lingua] : []);

  const TEMAS = ['IA','Design','Programação','Negócios','Psicologia','Ciência','Arte','Línguas','Meditação','Filosofia','História','Marketing','Matemática','Física','Economia','Fotografia','Música','Culinária','Fitness','Finanças'];

  const btn = (active: boolean) => ({
    borderRadius: 20, padding: '6px 14px', fontSize: 13, cursor: 'pointer',
    border: `1px solid ${active ? 'rgba(200,155,60,0.4)' : 'rgba(255,255,255,0.1)'}`,
    background: active ? 'rgba(200,155,60,0.9)' : 'rgba(255,255,255,0.06)',
    color: active ? '#0b0d12' : 'rgba(245,241,235,0.7)',
    fontFamily: "'Outfit', sans-serif", fontWeight: active ? 600 : 400, margin: '3px',
  });
  const lbl = { fontSize: 12, color: '#8a94a8', textTransform: 'uppercase' as const, letterSpacing: '0.08em', margin: '16px 0 8px' };

  const save = () => {
    const f = formatos.filter(v => v !== 'Qualquer');
    const d = duracao.filter(v => v !== 'Qualquer');
    onClose({
      done: true,
      formato: (f.length === 1 ? f[0] : 'Ambos') as LearnPrefs['formato'],
      genres: genres.filter(v => v !== 'Qualquer'),
      duracao: (d[0] as LearnPrefs['duracao']) || 'normal',
      nivel: nivel.filter(v => v !== 'Qualquer')[0],
      lingua: lingua.filter(v => v !== 'Qualquer')[0],
    });
  };

  return (
    <div className="ov on" style={{ zIndex: 400 }}>
      <div className="panel eat-ob-panel" style={{ overflowY: 'auto', maxHeight: '85vh' }}>
        <div className="panel-drag" />
    <div style={{ fontFamily: "'Outfit', sans-serif", padding: '0 4px' }}>
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontStyle: 'italic', fontWeight: 600, color: '#f5f1eb', marginBottom: 4 }}>What to Learn</div>
      <div style={{ fontSize: 13, color: '#8a94a8', marginBottom: 20 }}>Personaliza as tuas sugestões</div>

      <div style={lbl}>Tipo de conteúdo</div>
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {['Qualquer','Vídeo/YouTube','Documentário'].map(v => (
          <button key={v} style={btn(formatos.includes(v) || (v === 'Qualquer' && formatos.length === 0))} onClick={() => setFormatos(prev => toggleVal(prev, v))}>{v}</button>
        ))}
      </div>

      <div style={lbl}>Temas</div>
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {['Qualquer', ...TEMAS].map(v => (
          <button key={v} style={btn(genres.includes(v) || (v === 'Qualquer' && genres.length === 0))} onClick={() => setGenres(prev => toggleVal(prev, v))}>{v}</button>
        ))}
      </div>

      <div style={lbl}>Duração</div>
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {['Qualquer','Curta (-15min)','Normal (15-45min)','Longa (+45min)'].map(v => (
          <button key={v} style={btn(duracao.includes(v) || (v === 'Qualquer' && duracao.length === 0))} onClick={() => setDuracao(prev => toggleVal(prev, v))}>{v}</button>
        ))}
      </div>

      <button onClick={() => setAdvanced(a => !a)} style={{ background: 'none', border: 'none', color: '#8a94a8', fontSize: 13, cursor: 'pointer', padding: '12px 0 4px', width: '100%', textAlign: 'left' }}>
        {advanced ? '▲ Menos opções' : '▼ Mais opções'}
      </button>

      {advanced && (<>
        <div style={lbl}>Nível</div>
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          {['Qualquer','Iniciante','Intermédio','Avançado'].map(v => (
            <button key={v} style={btn(nivel.includes(v) || (v === 'Qualquer' && nivel.length === 0))} onClick={() => setNivel(prev => toggleVal(prev, v))}>{v}</button>
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
