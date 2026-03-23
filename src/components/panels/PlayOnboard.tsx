import { useState } from 'react';
import type { PlayPrefs } from '../../types';

interface Props { isOpen?: boolean; currentPrefs: PlayPrefs; onClose: (prefs: PlayPrefs) => void; }

function toggleVal(arr: string[], val: string): string[] {
  if (val === 'Qualquer') return arr.includes('Qualquer') ? [] : ['Qualquer'];
  const without = arr.filter(v => v !== 'Qualquer');
  return without.includes(val) ? without.filter(v => v !== val) : [...without, val];
}

const GENRE_MAP: Record<string, string[]> = {
  'Videojogo': ['RPG','Ação','Estratégia','Puzzle','Aventura','Plataforma','Roguelite','Sandbox','Simulação','Corrida','Terror','Luta','Desporto','Indie','Cooperativo'],
  'Tabuleiro': ['Cooperativo','Competitivo','Estratégia','Party','Cartas','Deck-building','Worker Placement','Eurogame','Solo','Legacy','Puzzle'],
  'Mobile': ['Puzzle','Casual','RPG','Estratégia','Arcade','Simulação'],
  'default': ['RPG','Ação','Estratégia','Puzzle','Aventura','Casual','Cooperativo','Simulação'],
};

export default function PlayOnboard({ isOpen, currentPrefs, onClose }: Props) {
  if (!isOpen) return null;
  const [types, setTypes] = useState<string[]>(currentPrefs.type && currentPrefs.type !== 'Ambos' ? [currentPrefs.type] : []);
  const [genres, setGenres] = useState<string[]>(currentPrefs.genres || []);
  const [dificuldade, setDificuldade] = useState<string[]>(currentPrefs.dificuldade ? [currentPrefs.dificuldade] : []);
  const [advanced, setAdvanced] = useState(false);
  const [jogadores, setJogadores] = useState<string[]>(currentPrefs.jogadores ? [currentPrefs.jogadores] : []);
  const [online, setOnline] = useState<string[]>(currentPrefs.online ? [currentPrefs.online] : []);
  const [duracao, setDuracao] = useState<string[]>(currentPrefs.duracao ? [currentPrefs.duracao] : []);
  const [experiencia, setExperiencia] = useState<string[]>(currentPrefs.experiencia ? [currentPrefs.experiencia] : []);

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
    const d = dificuldade.filter(v => v !== 'Qualquer');
    onClose({
      done: true,
      type: (t.length === 1 ? t[0] : 'Ambos') as PlayPrefs['type'],
      genres: genres.filter(v => v !== 'Qualquer'),
      dificuldade: (d[0] as PlayPrefs['dificuldade']) || 'normal',
      jogadores: jogadores.filter(v => v !== 'Qualquer')[0],
      online: online.filter(v => v !== 'Qualquer')[0],
      duracao: duracao.filter(v => v !== 'Qualquer')[0],
      experiencia: experiencia.filter(v => v !== 'Qualquer')[0],
    });
  };

  return (
    <div className="ov on" style={{ zIndex: 400 }}>
      <div className="panel eat-ob-panel" style={{ overflowY: 'auto', maxHeight: '85vh' }}>
        <div className="panel-drag" />
    <div style={{ fontFamily: "'Outfit', sans-serif", padding: '0 4px' }}>
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontStyle: 'italic', fontWeight: 600, color: '#f5f1eb', marginBottom: 4 }}>What to Play</div>
      <div style={{ fontSize: 13, color: '#8a94a8', marginBottom: 20 }}>Personaliza as tuas sugestões</div>

      <div style={lbl}>Tipo</div>
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {['Qualquer','Videojogo','Tabuleiro','Jogo de Cartas','RPG de Mesa','Mobile','Arcade'].map(v => (
          <button key={v} style={btn(types.includes(v) || (v === 'Qualquer' && types.length === 0))} onClick={() => setTypes(prev => toggleVal(prev, v))}>{v}</button>
        ))}
      </div>

      <div style={lbl}>Géneros</div>
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {['Qualquer', ...genreOptions].map(v => (
          <button key={v} style={btn(genres.includes(v) || (v === 'Qualquer' && genres.length === 0))} onClick={() => setGenres(prev => toggleVal(prev, v))}>{v}</button>
        ))}
      </div>

      <div style={lbl}>Dificuldade</div>
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {['Qualquer','Casual','Normal','Desafiante'].map(v => (
          <button key={v} style={btn(dificuldade.includes(v) || (v === 'Qualquer' && dificuldade.length === 0))} onClick={() => setDificuldade(prev => toggleVal(prev, v))}>{v}</button>
        ))}
      </div>

      <button onClick={() => setAdvanced(a => !a)} style={{ background: 'none', border: 'none', color: '#8a94a8', fontSize: 13, cursor: 'pointer', padding: '12px 0 4px', width: '100%', textAlign: 'left' }}>
        {advanced ? '▲ Menos opções' : '▼ Mais opções'}
      </button>

      {advanced && (<>
        <div style={lbl}>Nº jogadores</div>
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          {['Qualquer','Solo','2 jogadores','3-4 jogadores','5+'].map(v => (
            <button key={v} style={btn(jogadores.includes(v) || (v === 'Qualquer' && jogadores.length === 0))} onClick={() => setJogadores(prev => toggleVal(prev, v))}>{v}</button>
          ))}
        </div>

        <div style={lbl}>Online/Offline</div>
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          {['Qualquer','Online','Offline','Co-op local'].map(v => (
            <button key={v} style={btn(online.includes(v) || (v === 'Qualquer' && online.length === 0))} onClick={() => setOnline(prev => toggleVal(prev, v))}>{v}</button>
          ))}
        </div>

        <div style={lbl}>Duração sessão</div>
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          {['Qualquer','Rápido (-30min)','Normal (30-90min)','Longo (+90min)'].map(v => (
            <button key={v} style={btn(duracao.includes(v) || (v === 'Qualquer' && duracao.length === 0))} onClick={() => setDuracao(prev => toggleVal(prev, v))}>{v}</button>
          ))}
        </div>

        <div style={lbl}>Experiência</div>
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          {['Qualquer','Iniciante','Casual','Experiente'].map(v => (
            <button key={v} style={btn(experiencia.includes(v) || (v === 'Qualquer' && experiencia.length === 0))} onClick={() => setExperiencia(prev => toggleVal(prev, v))}>{v}</button>
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
