import { useState } from 'react';
import type { VisitPrefs } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: (prefs: VisitPrefs) => void;
}

const VISIT_TIPOS = ['Restaurante', 'Bar', 'Museu', 'Miradouro', 'Natureza', 'Mercado', 'Galeria', 'Experiência', 'Histórico', 'Cultural'];

export default function VisitOnboard({ isOpen, onClose }: Props) {
  const [tipo, setTipo] = useState<string[]>([]);
  const [custo, setCusto] = useState<'gratuito' | 'baixo' | 'qualquer'>('qualquer');
  const [distancia, setDistancia] = useState<'perto' | 'qualquer'>('qualquer');

  const toggle = (t: string) => setTipo(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  const handleSave = (skip = false) => onClose(skip
    ? { done: true, tipo: [], custo: 'qualquer', distancia: 'qualquer' }
    : { done: true, tipo, custo, distancia }
  );

  if (!isOpen) return null;
  return (
    <div className="ov on" style={{ zIndex: 400 }}>
      <div className="panel eat-ob-panel">
        <div className="panel-drag" />
        <button className="btn-x" style={{ marginBottom: 14 }} onClick={() => handleSave(true)}>Saltar tudo →</button>
        <div className="eat-ob-title">
          <span>📍</span>
          <div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 700 }}>O que visitar?</div>
            <div style={{ fontSize: 11, color: 'var(--mu)', marginTop: 2 }}>Personaliza as sugestões de Visitar</div>
          </div>
        </div>
        <div className="eat-ob-section">
          <div className="eat-ob-lbl">Tipo de local</div>
          <div className="eat-ob-row" style={{ flexWrap: 'wrap' }}>
            {VISIT_TIPOS.map(t => (
              <button key={t} className={`eat-ob-toggle${tipo.includes(t) ? ' on' : ''}`} onClick={() => toggle(t)}>{t}</button>
            ))}
          </div>
        </div>
        <div className="eat-ob-section">
          <div className="eat-ob-lbl">Orçamento?</div>
          <div className="eat-ob-row">
            {([['gratuito', '🆓 Gratuito'], ['baixo', '💶 Acessível'], ['qualquer', '✦ Qualquer']] as [string, string][]).map(([v, l]) => (
              <button key={v} className={`eat-ob-toggle${custo === v ? ' on' : ''}`} onClick={() => setCusto(v as 'gratuito' | 'baixo' | 'qualquer')}>{l}</button>
            ))}
          </div>
        </div>
        <div className="eat-ob-section">
          <div className="eat-ob-lbl">Distância?</div>
          <div className="eat-ob-row">
            {([['perto', '🚶 Perto de mim'], ['qualquer', '🗺 Qualquer']] as [string, string][]).map(([v, l]) => (
              <button key={v} className={`eat-ob-toggle${distancia === v ? ' on' : ''}`} onClick={() => setDistancia(v as 'perto' | 'qualquer')}>{l}</button>
            ))}
          </div>
        </div>
        <button className="eat-ob-save" onClick={() => handleSave(false)}>Aplicar preferências</button>
      </div>
    </div>
  );
}
