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

const COZINHAS_MAIN = ['Italiana', 'Portuguesa', 'Japonesa', 'Mexicana', 'Indiana', 'Americana', 'Chinesa', 'Mediterrânica'];
const COZINHAS_EXTRA = ['Tailandesa', 'Francesa', 'Grega', 'Brasileira', 'Árabe', 'Coreana', 'Peruana', 'Vietnamita'];

export default function EatOnboard({ isOpen, currentPrefs, onClose }: EatOnboardProps) {
  const [local, setLocal] = useState<string[]>(currentPrefs.local || []);
  const [fome, setFome] = useState(currentPrefs.fome || 'normal');
  const [budget, setBudget] = useState(currentPrefs.budget || 'medio');
  const [restrictions, setRestrictions] = useState<string[]>(currentPrefs.restrictions?.length ? currentPrefs.restrictions : ['nenhuma']);
  const [tempo, setTempo] = useState(currentPrefs.tempo || 'normal');
  const [cozinhas, setCozinhas] = useState<string[]>([]);
  const [showExtraCozinhas, setShowExtraCozinhas] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLocal(currentPrefs.local || []);
      setFome(currentPrefs.fome || 'normal');
      setBudget(currentPrefs.budget || 'medio');
      setRestrictions(currentPrefs.restrictions?.length ? currentPrefs.restrictions : ['nenhuma']);
      setTempo(currentPrefs.tempo || 'normal');
      setCozinhas([]);
      setShowExtraCozinhas(false);
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleArr = (arr: string[], val: string, set: (v: string[]) => void) => {
    if (arr.includes(val)) set(arr.filter(x => x !== val));
    else set([...arr.filter(x => x !== 'nenhuma'), val]);
  };

  const toggleLocal = (val: string) => {
    if (local.includes(val)) setLocal(local.filter(x => x !== val));
    else setLocal([...local, val]);
  };

  const toggleCozinha = (c: string) => {
    if (cozinhas.includes(c)) setCozinhas(cozinhas.filter(x => x !== c));
    else setCozinhas([...cozinhas, c]);
  };

  const isCasa = local.includes('casa') || local.includes('takeaway') || local.length === 0;
  const isFora = local.includes('sair');

  const handleSave = (skip = false) => {
    onClose({
      done: !skip,
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
            <Toggle label="🏠 Casa" active={local.includes('casa')} onClick={() => toggleLocal('casa')} />
            <Toggle label="🍴 Sair" active={local.includes('sair')} onClick={() => toggleLocal('sair')} />
            <Toggle label="📦 Takeaway" active={local.includes('takeaway')} onClick={() => toggleLocal('takeaway')} />
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

        {isCasa && (
          <div className="eat-ob-section">
            <div className="eat-ob-lbl">Tempo a cozinhar?</div>
            <div className="eat-ob-row">
              {([['rapido', '⚡ Rápido -30min'], ['normal', '🕐 Normal'], ['demorado', '🍲 Demorado +60min']] as [string, string][]).map(([v, l]) => (
                <Toggle key={v} label={l} active={tempo === v} onClick={() => setTempo(v)} />
              ))}
            </div>
          </div>
        )}

        {isCasa && (
          <div className="eat-ob-section">
            <div className="eat-ob-lbl">Tipo de receita?</div>
            <div className="eat-ob-row" style={{ flexWrap: 'wrap' }}>
              {(['Sopa', 'Massa', 'Arroz', 'Carne', 'Peixe', 'Ovos', 'Salada', 'Snack'] as string[]).map(r => (
                <Toggle key={r} label={r} active={false} onClick={() => {}} />
              ))}
            </div>
          </div>
        )}

        {isFora && (
          <div className="eat-ob-section">
            <div className="eat-ob-lbl">Cozinha preferida?</div>
            <div className="eat-ob-row" style={{ flexWrap: 'wrap' }}>
              {COZINHAS_MAIN.map(c => (
                <Toggle key={c} label={c} active={cozinhas.includes(c)} onClick={() => toggleCozinha(c)} />
              ))}
              {showExtraCozinhas && COZINHAS_EXTRA.map(c => (
                <Toggle key={c} label={c} active={cozinhas.includes(c)} onClick={() => toggleCozinha(c)} />
              ))}
            </div>
            <button
              onClick={() => setShowExtraCozinhas(v => !v)}
              style={{ background: 'none', border: 'none', color: 'var(--ac)', fontSize: 12, cursor: 'pointer', marginTop: 6, padding: 0 }}
            >
              {showExtraCozinhas ? '▲ menos opções' : '▼ mais opções'}
            </button>
          </div>
        )}

        {isFora && (
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
        )}

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

        <button className="eat-ob-save" onClick={() => handleSave(false)}>Aplicar preferências</button>
      </div>
    </div>
  );
}
