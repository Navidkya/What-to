import type { DataItem, Category, WhyReason } from '../../types';
import { WHY_EXTRA } from '../../data';

interface WhyPanelProps {
  item: DataItem | null;
  cat: Category | null;
  isOpen: boolean;
  onClose: () => void;
  onPick: (reason: WhyReason) => void;
}

export default function WhyPanel({ item, cat, isOpen, onClose, onPick }: WhyPanelProps) {
  if (!item || !cat) return null;
  const reasons = WHY_EXTRA[cat.id] || [];

  return (
    <div className={`ov${isOpen ? ' on' : ''}`} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="panel">
        <div className="panel-drag" />
        <div className="panel-title">
          <b>{item.title}</b>porquê não?
        </div>
        <div className="why-list">
          {reasons.map((r, i) => (
            <button key={i} className="why-btn" onClick={() => onPick(r)}>
              <span className="why-em">{r.icon}</span>
              <div>
                <div className="why-lbl">{r.l}</div>
                <div className="why-sub">{r.s}</div>
              </div>
            </button>
          ))}
        </div>
        <button className="btn-x" onClick={onClose}>← voltar</button>
      </div>
    </div>
  );
}
