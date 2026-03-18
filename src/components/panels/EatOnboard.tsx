import { useState, useEffect } from 'react';
import type { EatPrefs } from '../../types';

interface EatOnboardProps {
  isOpen: boolean;
  currentPrefs: EatPrefs;
  onClose: (prefs: EatPrefs) => void;
}

function Toggle({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button className={`eat-ob-toggle${active ? ' on' : ''}`} onClick={onClick}>
      {label}
    </button>
  );
}

export default function EatOnboard({ isOpen, currentPrefs, onClose }: EatOnboardProps) {
  const [local, setLocal] = useState<string[]>(currentPrefs.local || []);
  const [fome, setFome] = useState(currentPrefs.fome || 'normal');
  const [budget, setBudget] = useState(currentPrefs.budget || 'medio');
  const [restrictions, setRestrictions] = useState<string[]>(currentPrefs.restrictions?.length ? currentPrefs.restrictions : ['nenhuma']);
  const [tempo, setTempo] = useState(currentPrefs.tempo || 'normal');

  useEffect(() => {
    if (isOpen) {
      setLocal(currentPrefs.local || []);
      setFome(currentPrefs.fome || 'normal');
      setBudget(currentPrefs.budget || 'medio');
      setRestrictions(currentPrefs.restrictions?.length ? currentPrefs.restrictions : ['nenhuma']);
      setTempo(currentPrefs.tempo || 'normal');
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleArr = (arr: string[], val: string, set: (v: string[]) => void) => {
    if (arr.includes(val)) set(arr.filter(x => x !== val));
    else set([...arr.filter(x => x !== 'nenhuma'), val]);
  };

  const handleSave = (skip = false) => {
    onClose({
      done: true,
      local: skip ? [] : local,
      fome: skip ? 'normal' : fome,
      budget: skip ? 'medio' : budget,
      restrictions: skip ? [] : restrictions,
      tempo: skip ? 'normal' : tempo,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="ov on" style={{ zIndex: 400 }}>
      <div className="panel eat-ob-panel">
        <div className="panel-drag" />

        <button className="btn-x" style={{ marginBottom: 14 }} onClick={() => handleSave(true)}>
          Saltar tudo →
        </button>

        <div className="eat-ob-title">
          <span>🍽️</span>
          <div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, fontStyle: 'italic' }}>O que comer?</div>
            <div style={{ fontSize: 11, color: 'var(--mu)', marginTop: 2 }}>Para esta refeição</div>
          </div>
        </div>

        <div className="eat-ob-section">
          <div className="eat-ob-lbl">Onde?</div>
          <div className="eat-ob-row">
            <Toggle label="🏠 Casa" active={local.includes('casa')} onClick={() => toggleArr(local, 'casa', setLocal)} />
            <Toggle label="🍴 Sair" active={local.includes('sair')} onClick={() => toggleArr(local, 'sair', setLocal)} />
            <Toggle label="📦 Takeaway" active={local.includes('takeaway')} onClick={() => toggleArr(local, 'takeaway', setLocal)} />
          </div>
        </div>

        <div className="eat-ob-section">
          <div className="eat-ob-lbl">Fome?</div>
          <div className="eat-ob-row">
            {(['leve', 'normal', 'pesado'] as const).map(f => (
              <Toggle key={f}
                label={f === 'leve' ? '🥗 Leve' : f === 'normal' ? '🍽️ Normal' : '🍖 Pesado'}
                active={fome === f} onClick={() => setFome(f)} />
            ))}
          </div>
        </div>

        <div className="eat-ob-section">
          <div className="eat-ob-lbl">Orçamento?</div>
          <div className="eat-ob-row">
            {(['economico', 'medio', 'especial'] as const).map(b => (
              <Toggle key={b}
                label={b === 'economico' ? '💚 Económico' : b === 'medio' ? '💛 Médio' : '💎 Especial'}
                active={budget === b} onClick={() => setBudget(b)} />
            ))}
          </div>
        </div>

        <div className="eat-ob-section">
          <div className="eat-ob-lbl">Restrições?</div>
          <div className="eat-ob-row" style={{ flexWrap: 'wrap' }}>
            {(['nenhuma', 'vegetariano', 'vegan', 'sem-gluten', 'sem-lactose'] as const).map(r => (
              <Toggle key={r}
                label={r === 'nenhuma' ? '✓ Nenhuma' : r === 'vegetariano' ? '🌱 Vegetariano' : r === 'vegan' ? '🌿 Vegan' : r === 'sem-gluten' ? '🌾 Sem glúten' : '🥛 Sem lactose'}
                active={restrictions.includes(r)}
                onClick={() => {
                  if (r === 'nenhuma') setRestrictions(['nenhuma']);
                  else toggleArr(restrictions, r, setRestrictions);
                }}
              />
            ))}
          </div>
        </div>

        <div className="eat-ob-section">
          <div className="eat-ob-lbl">Tempo?</div>
          <div className="eat-ob-row">
            {([['rapido', '⚡ Rápido -30min'], ['normal', '🕐 Normal'], ['demorado', '🍲 Demorado +60min']] as [string, string][]).map(([v, l]) => (
              <Toggle key={v} label={l} active={tempo === v} onClick={() => setTempo(v)} />
            ))}
          </div>
        </div>

        <button className="eat-ob-save" onClick={() => handleSave(false)}>Aplicar preferências</button>
      </div>
    </div>
  );
}
