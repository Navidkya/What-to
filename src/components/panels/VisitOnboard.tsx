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
  const [conQuem, setConQuem] = useState<string[]>(currentPrefs.conQuem ? [currentPrefs.conQuem] : []);
  const [advanced, setAdvanced] = useState(false);
  const [custo, setCusto] = useState<string[]>(currentPrefs.custo && currentPrefs.custo !== 'qualquer' ? [currentPrefs.custo] : []);
  const [altura, setAltura] = useState<string[]>(currentPrefs.altura ? [currentPrefs.altura] : []);
  const [interior, setInterior] = useState<string[]>(currentPrefs.interior ? [currentPrefs.interior] : []);
  const [tempoVisita, setTempoVisita] = useState<string[]>(currentPrefs.tempoVisita ? [currentPrefs.tempoVisita] : []);
  const [mobilidade, setMobilidade] = useState<string[]>(currentPrefs.mobilidade ? [currentPrefs.mobilidade] : []);
  const [reserva, setReserva] = useState<string[]>(currentPrefs.reserva ? [currentPrefs.reserva] : []);
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
      conQuem: conQuem.filter(v => v !== 'Qualquer')[0],
      altura: altura.filter(v => v !== 'Qualquer')[0],
      interior: interior.filter(v => v !== 'Qualquer')[0],
      tempoVisita: tempoVisita.filter(v => v !== 'Qualquer')[0],
      mobilidade: mobilidade.filter(v => v !== 'Qualquer')[0],
      reserva: reserva.filter(v => v !== 'Qualquer')[0],
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

      <div style={lbl}>Com quem</div>
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {['Qualquer','Sozinho','A dois','Família','Grupo'].map(v => (
          <button key={v} style={btn(conQuem.includes(v) || (v === 'Qualquer' && conQuem.length === 0))} onClick={() => setConQuem(prev => toggleVal(prev, v))}>{v}</button>
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

        <div style={lbl}>Interior/Exterior</div>
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          {['Qualquer','Interior','Exterior'].map(v => (
            <button key={v} style={btn(interior.includes(v) || (v === 'Qualquer' && interior.length === 0))} onClick={() => setInterior(prev => toggleVal(prev, v))}>{v}</button>
          ))}
        </div>

        <div style={lbl}>Tempo de visita</div>
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          {['Qualquer','-1 hora','1-3 horas','Dia inteiro'].map(v => (
            <button key={v} style={btn(tempoVisita.includes(v) || (v === 'Qualquer' && tempoVisita.length === 0))} onClick={() => setTempoVisita(prev => toggleVal(prev, v))}>{v}</button>
          ))}
        </div>

        <div style={lbl}>Mobilidade</div>
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          {['Qualquer','A pé','De carro','Transporte público'].map(v => (
            <button key={v} style={btn(mobilidade.includes(v) || (v === 'Qualquer' && mobilidade.length === 0))} onClick={() => setMobilidade(prev => toggleVal(prev, v))}>{v}</button>
          ))}
        </div>

        <div style={lbl}>Reserva</div>
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          {['Qualquer','Não necessária','Aceita reservas'].map(v => (
            <button key={v} style={btn(reserva.includes(v) || (v === 'Qualquer' && reserva.length === 0))} onClick={() => setReserva(prev => toggleVal(prev, v))}>{v}</button>
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
