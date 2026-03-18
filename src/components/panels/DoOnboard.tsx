import { useState } from 'react';
import type { DoPrefs } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: (prefs: DoPrefs) => void;
}

export default function DoOnboard({ isOpen, onClose }: Props) {
  const [contexto, setContexto] = useState<'solo' | 'a_dois' | 'grupo' | 'qualquer'>('qualquer');
  const [local, setLocal] = useState<'interior' | 'exterior' | 'qualquer'>('qualquer');
  const [custo, setCusto] = useState<'gratuito' | 'qualquer'>('qualquer');

  const handleSave = (skip = false) => onClose(skip
    ? { done: true, contexto: 'qualquer', local: 'qualquer', custo: 'qualquer' }
    : { done: true, contexto, local, custo }
  );

  if (!isOpen) return null;
  return (
    <div className="ov on" style={{ zIndex: 400 }}>
      <div className="panel eat-ob-panel">
        <div className="panel-drag" />
        <button className="btn-x" style={{ marginBottom: 14 }} onClick={() => handleSave(true)}>Saltar tudo →</button>
        <div className="eat-ob-title">
          <span>🎯</span>
          <div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 700 }}>O que fazer?</div>
            <div style={{ fontSize: 11, color: 'var(--mu)', marginTop: 2 }}>Personaliza as sugestões de Fazer</div>
          </div>
        </div>
        <div className="eat-ob-section">
          <div className="eat-ob-lbl">Com quem?</div>
          <div className="eat-ob-row">
            {([['solo', '👤 Sozinho'], ['a_dois', '👫 A dois'], ['grupo', '👥 Em grupo'], ['qualquer', '✦ Qualquer']] as [string, string][]).map(([v, l]) => (
              <button key={v} className={`eat-ob-toggle${contexto === v ? ' on' : ''}`} onClick={() => setContexto(v as 'solo' | 'a_dois' | 'grupo' | 'qualquer')}>{l}</button>
            ))}
          </div>
        </div>
        <div className="eat-ob-section">
          <div className="eat-ob-lbl">Onde?</div>
          <div className="eat-ob-row">
            {([['interior', '🏠 Em casa'], ['exterior', '☀️ Lá fora'], ['qualquer', '✦ Qualquer']] as [string, string][]).map(([v, l]) => (
              <button key={v} className={`eat-ob-toggle${local === v ? ' on' : ''}`} onClick={() => setLocal(v as 'interior' | 'exterior' | 'qualquer')}>{l}</button>
            ))}
          </div>
        </div>
        <div className="eat-ob-section">
          <div className="eat-ob-lbl">Custo?</div>
          <div className="eat-ob-row">
            {([['gratuito', '🆓 Gratuito'], ['qualquer', '✦ Qualquer']] as [string, string][]).map(([v, l]) => (
              <button key={v} className={`eat-ob-toggle${custo === v ? ' on' : ''}`} onClick={() => setCusto(v as 'gratuito' | 'qualquer')}>{l}</button>
            ))}
          </div>
        </div>
        <button className="eat-ob-save" onClick={() => handleSave(false)}>Aplicar preferências</button>
      </div>
    </div>
  );
}
