import { useState } from 'react';

interface LinkPanelProps {
  title: string;
  name: string;
  url: string;
  color: string;
  isOpen: boolean;
  onClose: () => void;
  onToast: (msg: string) => void;
}

export default function LinkPanel({ title, name, url, color, isOpen, onClose, onToast }: LinkPanelProps) {
  const [copied, setCopied] = useState(false);

  const copyUrl = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        onToast('✓ Copiado!');
      });
    } else {
      const t = document.createElement('textarea');
      t.value = url;
      document.body.appendChild(t);
      t.select();
      try { document.execCommand('copy'); onToast('✓ Copiado!'); } catch { /* fallback failed */ }
      document.body.removeChild(t);
    }
  };

  return (
    <div className={`ov${isOpen ? ' on' : ''}`} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="panel">
        <div className="panel-drag" />
        <div className="panel-title">
          <b>{title}</b>onde ver
        </div>
        <div className="link-note">Copia o link e abre no browser 👆</div>
        {url && (
          <div className="link-item">
            <span className="link-dot" style={{ background: color }} />
            <div className="link-info">
              <div className="link-name">{name}</div>
              <div className="link-url">{url}</div>
            </div>
            <button className="link-copy" onClick={copyUrl}>
              {copied ? '✓ Copiado!' : 'Copiar'}
            </button>
          </div>
        )}
        <button className="btn-x" onClick={onClose}>fechar</button>
      </div>
    </div>
  );
}
