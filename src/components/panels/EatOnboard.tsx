import { useState } from 'react';
import type { EatPrefs } from '../../types';

interface Props { isOpen?: boolean; currentPrefs: EatPrefs; onClose: (prefs: EatPrefs) => void; }

function toggleVal(arr: string[], val: string): string[] {
  if (val === 'Qualquer') return arr.includes('Qualquer') ? [] : ['Qualquer'];
  const without = arr.filter(v => v !== 'Qualquer');
  return without.includes(val) ? without.filter(v => v !== val) : [...without, val];
}

export default function EatOnboard({ isOpen, currentPrefs, onClose }: Props) {
  if (!isOpen) return null;
  const [local, setLocal] = useState<string[]>(currentPrefs.local || []);
  const [fome, setFome] = useState<string[]>(currentPrefs.fome ? [currentPrefs.fome] : []);
  const [restrictions, setRestrictions] = useState<string[]>(currentPrefs.restrictions || []);
  const [cozinha, setCozinha] = useState<string[]>(currentPrefs.cozinha || []);
  const [budget, setBudget] = useState<string[]>(currentPrefs.budget ? [currentPrefs.budget] : []);
  const [tempo, setTempo] = useState<string[]>(currentPrefs.tempo ? [currentPrefs.tempo] : []);
  const [nivelCozinheiro, setNivelCozinheiro] = useState<string[]>(currentPrefs.nivelCozinheiro ? [currentPrefs.nivelCozinheiro] : []);
  const [quantas, setQuantas] = useState<string[]>(currentPrefs.quantas ? [currentPrefs.quantas] : []);
  const [ocasiao, setOcasiao] = useState<string[]>(currentPrefs.ocasiao ? [currentPrefs.ocasiao] : []);
  const [abertoAgora, setAbertoAgora] = useState(currentPrefs.abertoAgora || false);
  const [petFriendly, setPetFriendly] = useState(currentPrefs.petFriendly || false);
  const [esplanada, setEsplanada] = useState(currentPrefs.esplanada || false);
  const [advanced, setAdvanced] = useState(false);

  const querCasa = local.includes('casa') || local.includes('takeaway');
  const querRest = local.includes('restaurante');

  const btn = (active: boolean) => ({
    borderRadius: 20, padding: '6px 14px', fontSize: 13, cursor: 'pointer',
    border: `1px solid ${active ? 'rgba(200,155,60,0.4)' : 'rgba(255,255,255,0.1)'}`,
    background: active ? 'rgba(200,155,60,0.9)' : 'rgba(255,255,255,0.06)',
    color: active ? '#0b0d12' : 'rgba(245,241,235,0.7)',
    fontFamily: "'Outfit', sans-serif", fontWeight: active ? 600 : 400, margin: '3px',
  });
  const lbl = { fontSize: 12, color: '#8a94a8', textTransform: 'uppercase' as const, letterSpacing: '0.08em', margin: '16px 0 8px' };

  const save = () => {
    onClose({
      done: true,
      local: local.filter(v => v !== 'Qualquer'),
      fome: fome.filter(v => v !== 'Qualquer')[0] || 'normal',
      restrictions: restrictions.filter(v => v !== 'Qualquer' && v !== 'nenhuma'),
      budget: budget.filter(v => v !== 'Qualquer')[0] || 'medio',
      tempo: tempo.filter(v => v !== 'Qualquer')[0],
      nivelCozinheiro: nivelCozinheiro.filter(v => v !== 'Qualquer')[0],
      quantas: quantas.filter(v => v !== 'Qualquer')[0],
      cozinha: cozinha.filter(v => v !== 'Qualquer'),
      ocasiao: ocasiao.filter(v => v !== 'Qualquer')[0],
      abertoAgora,
      petFriendly,
      esplanada,
    });
  };

  return (
    <div className="ov on" style={{ zIndex: 400 }}>
      <div className="panel eat-ob-panel" style={{ overflowY: 'auto', maxHeight: '85vh' }}>
        <div className="panel-drag" />
    <div style={{ fontFamily: "'Outfit', sans-serif", padding: '0 4px' }}>
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontStyle: 'italic', fontWeight: 600, color: '#f5f1eb', marginBottom: 4 }}>What to Eat</div>
      <div style={{ fontSize: 13, color: '#8a94a8', marginBottom: 20 }}>Personaliza as tuas sugestões</div>

      <div style={lbl}>Onde</div>
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {['Qualquer','Em casa','Restaurante','Takeaway/Delivery','Café/Snack','Brunch'].map(v => {
          const key = v === 'Em casa' ? 'casa' : v === 'Restaurante' ? 'restaurante' : v === 'Takeaway/Delivery' ? 'takeaway' : v.toLowerCase();
          const isQ = v === 'Qualquer';
          const active = isQ ? (local.length === 0) : local.includes(key);
          return <button key={v} style={btn(active)} onClick={() => {
            if (isQ) { setLocal([]); return; }
            setLocal(prev => prev.includes(key) ? prev.filter(x => x !== key) : [...prev, key]);
          }}>{v}</button>;
        })}
      </div>

      <div style={lbl}>Fome</div>
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {['Qualquer','Leve','Normal','Pesado'].map(v => (
          <button key={v} style={btn(fome.includes(v) || (v === 'Qualquer' && fome.length === 0))} onClick={() => setFome(prev => toggleVal(prev, v))}>{v}</button>
        ))}
      </div>

      <div style={lbl}>Restrições</div>
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {['Nenhuma','Vegetariano','Vegan','Sem glúten','Sem lactose','Sem frutos secos','Halal'].map(v => {
          const key = v.toLowerCase().replace(/ /g, '_');
          const active = v === 'Nenhuma' ? (restrictions.length === 0 || restrictions.includes('nenhuma')) : restrictions.includes(key);
          return <button key={v} style={btn(active)} onClick={() => {
            if (v === 'Nenhuma') { setRestrictions([]); return; }
            setRestrictions(prev => prev.includes(key) ? prev.filter(x => x !== key) : [...prev.filter(x => x !== 'nenhuma'), key]);
          }}>{v}</button>;
        })}
      </div>

      {querCasa && (<>
        <div style={lbl}>Tipo de receita</div>
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          {['Qualquer','Sopa','Massa','Arroz','Carne','Peixe','Ovos','Salada','Snack','Sobremesa','Pequeno-almoço'].map(v => (
            <button key={v} style={btn(cozinha.includes(v) || (v === 'Qualquer' && cozinha.length === 0))} onClick={() => setCozinha(prev => toggleVal(prev, v))}>{v}</button>
          ))}
        </div>

        <div style={lbl}>Tempo a cozinhar</div>
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          {['Qualquer','Rápido (-30min)','Normal','Demorado (+60min)'].map(v => (
            <button key={v} style={btn(tempo.includes(v) || (v === 'Qualquer' && tempo.length === 0))} onClick={() => setTempo(prev => toggleVal(prev, v))}>{v}</button>
          ))}
        </div>
      </>)}

      {querRest && (<>
        <div style={lbl}>Tipo de cozinha</div>
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          {['Qualquer','Portuguesa','Italiana','Japonesa','Mexicana','Indiana','Americana','Chinesa','Mediterrânica','Tailandesa','Francesa','Grega','Brasileira','Árabe','Coreana','Peruana','Vietnamita'].map(v => (
            <button key={v} style={btn(cozinha.includes(v) || (v === 'Qualquer' && cozinha.length === 0))} onClick={() => setCozinha(prev => toggleVal(prev, v))}>{v}</button>
          ))}
        </div>

        <div style={lbl}>Orçamento</div>
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          {['Qualquer','Económico','Médio','Especial'].map(v => (
            <button key={v} style={btn(budget.includes(v) || (v === 'Qualquer' && budget.length === 0))} onClick={() => setBudget(prev => toggleVal(prev, v))}>{v}</button>
          ))}
        </div>
      </>)}

      <button onClick={() => setAdvanced(a => !a)} style={{ background: 'none', border: 'none', color: '#8a94a8', fontSize: 13, cursor: 'pointer', padding: '12px 0 4px', width: '100%', textAlign: 'left' }}>
        {advanced ? '▲ Menos opções' : '▼ Mais opções'}
      </button>

      {advanced && (<>
        {querCasa && (<>
          <div style={lbl}>Nível de cozinheiro</div>
          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            {['Qualquer','Iniciante','Intermédio','Experiente'].map(v => (
              <button key={v} style={btn(nivelCozinheiro.includes(v) || (v === 'Qualquer' && nivelCozinheiro.length === 0))} onClick={() => setNivelCozinheiro(prev => toggleVal(prev, v))}>{v}</button>
            ))}
          </div>

          <div style={lbl}>Para quantos</div>
          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            {['Qualquer','1','2','4','6+'].map(v => (
              <button key={v} style={btn(quantas.includes(v) || (v === 'Qualquer' && quantas.length === 0))} onClick={() => setQuantas(prev => toggleVal(prev, v))}>{v}</button>
            ))}
          </div>
        </>)}

        <div style={lbl}>Ocasião</div>
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          {['Qualquer','Dia normal','Impressionar alguém','Comfort food','Dieta'].map(v => (
            <button key={v} style={btn(ocasiao.includes(v) || (v === 'Qualquer' && ocasiao.length === 0))} onClick={() => setOcasiao(prev => toggleVal(prev, v))}>{v}</button>
          ))}
        </div>

        <div style={lbl}>Opções extra</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {[{label: 'Aberto agora', val: abertoAgora, set: () => setAbertoAgora(v => !v)},
            {label: 'Pet friendly', val: petFriendly, set: () => setPetFriendly(v => !v)},
            {label: 'Esplanada', val: esplanada, set: () => setEsplanada(v => !v)},
          ].map(({label, val, set}) => (
            <button key={label} style={btn(val)} onClick={set}>{label}</button>
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
