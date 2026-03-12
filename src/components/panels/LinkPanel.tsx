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
      <div className="panel" style={{ minHeight: 280 }}>
        <div className="panel-drag" />

        <div style={{ textAlign: 'center', padding: '4px 0 18px' }}>
          <div style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 24,
            fontStyle: 'italic',
            fontWeight: 600,
            color: '#f5f1eb',
            lineHeight: 1.2,
            marginBottom: 6,
          }}>
            {title}
          </div>
          <div style={{
            fontSize: 10,
            letterSpacing: '2px',
            textTransform: 'uppercase',
            color: 'var(--mu)',
            fontFamily: "'Outfit', sans-serif",
          }}>
            Disponível em
          </div>
        </div>

        {url && (
          <div className="link-item" style={{ minHeight: 56, alignItems: 'center' }}>
            <span className="link-dot" style={{ background: color }} />
            <div className="link-info">
              <div className="link-name">{name}</div>
              <div className="link-url">{url}</div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              <button className="link-open" onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}>
                Abrir →
              </button>
              <button className="link-copy" onClick={copyUrl}>
                {copied ? '✓' : 'Copiar'}
              </button>
            </div>
          </div>
        )}

        <div style={{ borderTop: '1px solid var(--bd)', margin: '14px 0 10px' }} />
        <button className="btn-x" onClick={onClose}>fechar</button>
      </div>
    </div>
  );
}
