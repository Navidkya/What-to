import { useState } from 'react';
import type { VisitPrefs } from '../../types';

interface Props { isOpen?: boolean; currentPrefs: VisitPrefs; onClose: (prefs: VisitPrefs) => void; }

function toggleVal(arr: string[], val: string): string[] {
  if (val === 'Qualquer') return arr.includes('Qualquer') ? [] : ['Qualquer'];
  const without = arr.filter(v => v !== 'Qualquer');
  return without.includes(val) ? without.filter(v => v !== val) : [...without, val];
}

export default function VisitOnboard({ isOpen, currentPrefs, onClose }: Props) {
  if (!isOpen) return null;
  const [tipo, setTipo] = useState<string[]>(currentPrefs.tipo || []);
  const [distancia, setDistancia] = useState<string[]>(currentPrefs.distancia && currentPrefs.distancia !== 'qualquer' ? [currentPrefs.distancia] : []);
  const [advanced, setAdvanced] = useState(false);
  const [custo, setCusto] = useState<string[]>(currentPrefs.custo && currentPrefs.custo !== 'qualquer' ? [currentPrefs.custo] : []);
  const [altura, setAltura] = useState<string[]>(currentPrefs.altura ? [currentPrefs.altura] : []);
  const [acessivel, setAcessivel] = useState(currentPrefs.acessivel || false);

  const btn = (active: boolean) => ({
    borderRadius: 20, padding: '6px 14px', fontSize: 13, cursor: 'pointer',
    border: `1px solid ${active ? 'rgba(200,155,60,0.4)' : 'rgba(255,255,255,0.1)'}`,
    background: active ? 'rgba(200,155,60,0.9)' : 'rgba(255,255,255,0.06)',
    color: active ? '#0b0d12' : 'rgba(245,241,235,0.7)',
    fontFamily: "'Outfit', sans-serif", fontWeight: active ? 600 : 400, margin: '3px',
  });
  const lbl = { fontSize: 12, color: '#8a94a8', textTransform: 'uppercase' as const, letterSpacing: '0.08em', margin: '16px 0 8px' };

  const save = () => {
    const d = distancia.filter(v => v !== 'Qualquer');
    const c = custo.filter(v => v !== 'Qualquer');
    onClose({
      done: true,
      tipo: tipo.filter(v => v !== 'Qualquer'),
      distancia: (d[0] as VisitPrefs['distancia']) || 'qualquer',
      custo: (c[0] as VisitPrefs['custo']) || 'qualquer',
      altura: altura.filter(v => v !== 'Qualquer')[0],
      acessivel,
    });
  };

  return (
    <div className="ov on" style={{ zIndex: 400 }}>
      <div className="panel eat-ob-panel" style={{ overflowY: 'auto', maxHeight: '85vh' }}>
        <div className="panel-drag" />
    <div style={{ fontFamily: "'Outfit', sans-serif", padding: '0 4px' }}>
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontStyle: 'italic', fontWeight: 600, color: '#f5f1eb', marginBottom: 4 }}>What to Visit</div>
      <div style={{ fontSize: 13, color: '#8a94a8', marginBottom: 20 }}>Personaliza as tuas sugestões</div>

      <div style={lbl}>Tipo de local</div>
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {['Qualquer','Museu/Galeria','Bar','Restaurante','Natureza','Miradouro','Mercado','Experiência','Histórico','Cultural','Parque','Praia','Spa','Concerto/Evento','Cinema','Teatro'].map(v => (
          <button key={v} style={btn(tipo.includes(v) || (v === 'Qualquer' && tipo.length === 0))} onClick={() => setTipo(prev => toggleVal(prev, v))}>{v}</button>
        ))}
      </div>

      <div style={lbl}>Distância</div>
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {['Qualquer','Perto (-2km)','Próximo (-10km)'].map(v => (
          <button key={v} style={btn(distancia.includes(v) || (v === 'Qualquer' && distancia.length === 0))} onClick={() => setDistancia(prev => toggleVal(prev, v))}>{v}</button>
        ))}
      </div>

      <button onClick={() => setAdvanced(a => !a)} style={{ background: 'none', border: 'none', color: '#8a94a8', fontSize: 13, cursor: 'pointer', padding: '12px 0 4px', width: '100%', textAlign: 'left' }}>
        {advanced ? '▲ Menos opções' : '▼ Mais opções'}
      </button>

      {advanced && (<>
        <div style={lbl}>Custo</div>
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          {['Qualquer','Gratuito','Acessível'].map(v => (
            <button key={v} style={btn(custo.includes(v) || (v === 'Qualquer' && custo.length === 0))} onClick={() => setCusto(prev => toggleVal(prev, v))}>{v}</button>
          ))}
        </div>

        <div style={lbl}>Altura do dia</div>
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          {['Qualquer','Manhã','Tarde','Noite'].map(v => (
            <button key={v} style={btn(altura.includes(v) || (v === 'Qualquer' && altura.length === 0))} onClick={() => setAltura(prev => toggleVal(prev, v))}>{v}</button>
          ))}
        </div>

        <div style={lbl}>Acessibilidade</div>
        <button style={btn(acessivel)} onClick={() => setAcessivel(v => !v)}>Acessível (cadeira/carrinho)</button>
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
