import { useState } from 'react';
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

const EMOJIS = ['📋', '🎬', '📚', '🎮', '🍽️', '🎵', '📍', '✨', '❤️', '⭐'];

function genId() {
  return Math.random().toString(36).slice(2, 9);
}

export default function AddToListPanel({ isOpen, title, emoji, lists, onClose, onAddToList }: Props) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('📋');

  if (!isOpen) return null;

  const handleCreate = () => {
    if (!newName.trim()) return;
    const id = '__new__' + genId() + '__' + newEmoji + '__' + newName.trim();
    onAddToList(id);
    setCreating(false);
    setNewName('');
    setNewEmoji('📋');
  };

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

        {lists.length === 0 && !creating ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.3 }}>📋</div>
            <div style={{ fontSize: 14, color: 'var(--tx)', marginBottom: 6, fontWeight: 500 }}>Ainda não tens listas</div>
            <div style={{ fontSize: 12, color: 'var(--mu)', marginBottom: 16, lineHeight: 1.5 }}>
              Cria uma lista para guardar esta sugestão
            </div>
            <button
              onClick={() => setCreating(true)}
              style={{ padding: '10px 20px', borderRadius: 50, background: 'rgba(200,155,60,0.1)', border: '1px solid rgba(200,155,60,0.3)', color: 'var(--ac)', fontSize: 13, fontFamily: "'Outfit', sans-serif", cursor: 'pointer' }}
            >
              + Criar lista
            </button>
          </div>
        ) : !creating ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {lists.map(list => (
              <button
                key={list.id}
                onClick={() => { onAddToList(list.id); }}
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
            <button
              onClick={() => setCreating(true)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 14px', background: 'transparent', border: '1px dashed rgba(200,155,60,0.4)', borderRadius: 12, cursor: 'pointer', color: 'var(--ac)', fontSize: 13, fontFamily: "'Outfit', sans-serif", fontWeight: 600 }}
            >
              + Nova lista
            </button>
          </div>
        ) : null}

        {creating && (
          <div style={{ marginBottom: 16, padding: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(200,155,60,0.2)', borderRadius: 14 }}>
            <div style={{ fontSize: 11, color: 'var(--mu)', marginBottom: 10, letterSpacing: 1, textTransform: 'uppercase' }}>Nova lista</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
              {EMOJIS.map(e => (
                <button
                  key={e}
                  onClick={() => setNewEmoji(e)}
                  style={{ width: 34, height: 34, borderRadius: 8, fontSize: 18, background: newEmoji === e ? 'rgba(200,155,60,0.15)' : 'rgba(255,255,255,0.04)', border: newEmoji === e ? '1px solid rgba(200,155,60,0.5)' : '1px solid rgba(255,255,255,0.08)', cursor: 'pointer' }}
                >
                  {e}
                </button>
              ))}
            </div>
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }}
              placeholder="Nome da lista..."
              autoFocus
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px', color: 'var(--tx)', fontFamily: "'Outfit', sans-serif", fontSize: 14, marginBottom: 10, outline: 'none', boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleCreate}
                style={{ flex: 1, padding: '10px', background: 'linear-gradient(135deg, #C89B3C, #a87535)', border: 'none', borderRadius: 10, color: '#0B0D12', fontWeight: 700, fontSize: 13, fontFamily: "'Outfit', sans-serif", cursor: 'pointer' }}
              >
                Criar e guardar
              </button>
              <button
                onClick={() => { setCreating(false); setNewName(''); setNewEmoji('📋'); }}
                style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: 'var(--mu)', fontSize: 13, fontFamily: "'Outfit', sans-serif", cursor: 'pointer' }}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        <button className="why-back-btn" onClick={onClose}>← voltar</button>
      </div>
    </div>
  );
}
