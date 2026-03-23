import { useState } from 'react';
import type { DoPrefs } from '../../types';

interface Props { isOpen?: boolean; currentPrefs: DoPrefs; onClose: (prefs: DoPrefs) => void; }

function toggleVal(arr: string[], val: string): string[] {
  if (val === 'Qualquer') return arr.includes('Qualquer') ? [] : ['Qualquer'];
  const without = arr.filter(v => v !== 'Qualquer');
  return without.includes(val) ? without.filter(v => v !== val) : [...without, val];
}

export default function DoOnboard({ isOpen, currentPrefs, onClose }: Props) {
  if (!isOpen) return null;
  const [tipo, setTipo] = useState<string[]>([]);
  const [conQuem, setConQuem] = useState<string[]>(currentPrefs.contexto && currentPrefs.contexto !== 'qualquer' ? [currentPrefs.contexto] : []);
  const [onde, setOnde] = useState<string[]>(currentPrefs.local && currentPrefs.local !== 'qualquer' ? [currentPrefs.local] : []);
  const [advanced, setAdvanced] = useState(false);
  const [custo, setCusto] = useState<string[]>(currentPrefs.custo && currentPrefs.custo !== 'qualquer' ? [currentPrefs.custo] : []);
  const [duracao, setDuracao] = useState<string[]>(currentPrefs.duracao ? [currentPrefs.duracao] : []);
  const [energia, setEnergia] = useState<string[]>(currentPrefs.energia ? [currentPrefs.energia] : []);
  const [objetivo, setObjetivo] = useState<string[]>(currentPrefs.objetivo ? [currentPrefs.objetivo] : []);
  const [meteorologia, setMeteorologia] = useState<string[]>(currentPrefs.meteorologia ? [currentPrefs.meteorologia] : []);
  const [animais, setAnimais] = useState(currentPrefs.animais || false);

  const btn = (active: boolean) => ({
    borderRadius: 20, padding: '6px 14px', fontSize: 13, cursor: 'pointer',
    border: `1px solid ${active ? 'rgba(200,155,60,0.4)' : 'rgba(255,255,255,0.1)'}`,
    background: active ? 'rgba(200,155,60,0.9)' : 'rgba(255,255,255,0.06)',
    color: active ? '#0b0d12' : 'rgba(245,241,235,0.7)',
    fontFamily: "'Outfit', sans-serif", fontWeight: active ? 600 : 400, margin: '3px',
  });
  const lbl = { fontSize: 12, color: '#8a94a8', textTransform: 'uppercase' as const, letterSpacing: '0.08em', margin: '16px 0 8px' };

  const save = () => {
    const cq = conQuem.filter(v => v !== 'Qualquer');
    const on = onde.filter(v => v !== 'Qualquer');
    const cu = custo.filter(v => v !== 'Qualquer');
    onClose({
      done: true,
      contexto: (cq[0] as DoPrefs['contexto']) || 'qualquer',
      local: (on[0] as DoPrefs['local']) || 'qualquer',
      custo: (cu[0] as DoPrefs['custo']) || 'qualquer',
      duracao: duracao.filter(v => v !== 'Qualquer')[0],
      energia: energia.filter(v => v !== 'Qualquer')[0],
      objetivo: objetivo.filter(v => v !== 'Qualquer')[0],
      meteorologia: meteorologia.filter(v => v !== 'Qualquer')[0],
      animais,
    });
  };

  return (
    <div className="ov on" style={{ zIndex: 400 }}>
      <div className="panel eat-ob-panel" style={{ overflowY: 'auto', maxHeight: '85vh' }}>
        <div className="panel-drag" />
    <div style={{ fontFamily: "'Outfit', sans-serif", padding: '0 4px' }}>
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontStyle: 'italic', fontWeight: 600, color: '#f5f1eb', marginBottom: 4 }}>What to Do</div>
      <div style={{ fontSize: 13, color: '#8a94a8', marginBottom: 20 }}>Personaliza as tuas sugestões</div>

      <div style={lbl}>Tipo de actividade</div>
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {['Qualquer','Desporto/Fitness','Criativo/DIY','Social/Festas','Bem-estar','Natureza','Aprender','Jogos','Culinária'].map(v => (
          <button key={v} style={btn(tipo.includes(v) || (v === 'Qualquer' && tipo.length === 0))} onClick={() => setTipo(prev => toggleVal(prev, v))}>{v}</button>
        ))}
      </div>

      <div style={lbl}>Com quem</div>
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {['Qualquer','Sozinho','A dois','Em grupo'].map(v => (
          <button key={v} style={btn(conQuem.includes(v) || (v === 'Qualquer' && conQuem.length === 0))} onClick={() => setConQuem(prev => toggleVal(prev, v))}>{v}</button>
        ))}
      </div>

      <div style={lbl}>Onde</div>
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {['Qualquer','Em casa','Lá fora'].map(v => (
          <button key={v} style={btn(onde.includes(v) || (v === 'Qualquer' && onde.length === 0))} onClick={() => setOnde(prev => toggleVal(prev, v))}>{v}</button>
        ))}
      </div>

      <button onClick={() => setAdvanced(a => !a)} style={{ background: 'none', border: 'none', color: '#8a94a8', fontSize: 13, cursor: 'pointer', padding: '12px 0 4px', width: '100%', textAlign: 'left' }}>
        {advanced ? '▲ Menos opções' : '▼ Mais opções'}
      </button>

      {advanced && (<>
        <div style={lbl}>Custo</div>
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          {['Qualquer','Gratuito','Até 20€'].map(v => (
            <button key={v} style={btn(custo.includes(v) || (v === 'Qualquer' && custo.length === 0))} onClick={() => setCusto(prev => toggleVal(prev, v))}>{v}</button>
          ))}
        </div>

        <div style={lbl}>Duração</div>
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          {['Qualquer','Rápido (-1h)','Meio-dia','Dia inteiro'].map(v => (
            <button key={v} style={btn(duracao.includes(v) || (v === 'Qualquer' && duracao.length === 0))} onClick={() => setDuracao(prev => toggleVal(prev, v))}>{v}</button>
          ))}
        </div>

        <div style={lbl}>Energia necessária</div>
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          {['Qualquer','Baixa','Média','Alta'].map(v => (
            <button key={v} style={btn(energia.includes(v) || (v === 'Qualquer' && energia.length === 0))} onClick={() => setEnergia(prev => toggleVal(prev, v))}>{v}</button>
          ))}
        </div>

        <div style={lbl}>Objectivo</div>
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          {['Qualquer','Descansar','Ser produtivo','Socializar','Aventura','Criatividade'].map(v => (
            <button key={v} style={btn(objetivo.includes(v) || (v === 'Qualquer' && objetivo.length === 0))} onClick={() => setObjetivo(prev => toggleVal(prev, v))}>{v}</button>
          ))}
        </div>

        <div style={lbl}>Meteorologia</div>
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          {['Qualquer','Para dias de chuva','Para dias de sol'].map(v => (
            <button key={v} style={btn(meteorologia.includes(v) || (v === 'Qualquer' && meteorologia.length === 0))} onClick={() => setMeteorologia(prev => toggleVal(prev, v))}>{v}</button>
          ))}
        </div>

        <div style={lbl}>Pet friendly</div>
        <button style={btn(animais)} onClick={() => setAnimais(v => !v)}>Aceita animais</button>
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
