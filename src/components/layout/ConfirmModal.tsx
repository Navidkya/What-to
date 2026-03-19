interface Props {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen, title, message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  danger = false,
  onConfirm, onCancel,
}: Props) {
  if (!isOpen) return null;
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(8,8,12,0.75)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 32px' }}
      onClick={onCancel}
    >
      <div
        style={{ width: '100%', maxWidth: 340, background: '#141820', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 8 }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, fontStyle: 'italic', color: '#f5f1eb', marginBottom: 4 }}>
          {title}
        </div>
        <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, color: 'rgba(245,241,235,0.6)', lineHeight: 1.6, marginBottom: 16 }}>
          {message}
        </div>
        <button
          onClick={onConfirm}
          style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: danger ? 'rgba(224,112,112,0.15)' : 'linear-gradient(135deg, #C89B3C, #a87535)', color: danger ? '#e07070' : '#0B0D12', fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 700, cursor: 'pointer', marginBottom: 8, transition: 'opacity 0.2s' }}
        >
          {confirmLabel}
        </button>
        <button
          onClick={onCancel}
          style={{ width: '100%', padding: '12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(245,241,235,0.5)', fontFamily: "'Outfit', sans-serif", fontSize: 13, cursor: 'pointer' }}
        >
          {cancelLabel}
        </button>
      </div>
    </div>
  );
}
