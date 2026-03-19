import type { UserList } from '../../types';

interface Props {
  isOpen: boolean;
  title: string;
  emoji: string;
  catId: string;
  cat: string;
  type: string;
  lists: UserList[];
  onClose: () => void;
  onAddToList: (listId: string) => void;
  onCreateAndAdd: (name: string) => void;
  onToast: (msg: string) => void;
}

export default function AddToListPanel({ isOpen, title, emoji, lists, onClose, onAddToList }: Props) {
  if (!isOpen) return null;

  return (
    <div className="ov on" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="panel" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        <div className="panel-drag" />

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, paddingBottom: 14, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontSize: 24 }}>{emoji}</span>
          <div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 700, fontStyle: 'italic', color: 'var(--tx)' }}>{title}</div>
            <div style={{ fontSize: 11, color: 'var(--mu)', marginTop: 1 }}>Guardar em lista</div>
          </div>
        </div>

        {lists.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--mu)', fontSize: 13 }}>
            Ainda não tens listas.<br/>Cria uma primeiro na tab Lista.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {lists.map(list => (
              <button
                key={list.id}
                onClick={() => { onAddToList(list.id); onClose(); }}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s', fontFamily: "'Outfit', sans-serif" }}
              >
                <span style={{ fontSize: 20 }}>{list.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--tx)' }}>{list.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--mu)' }}>{list.items.length} itens</div>
                </div>
                <span style={{ color: 'var(--mu)', fontSize: 16 }}>+</span>
              </button>
            ))}
          </div>
        )}

        <button className="why-back-btn" onClick={onClose}>← voltar</button>
      </div>
    </div>
  );
}
