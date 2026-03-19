import { useState } from 'react';
import type { UserList } from '../../types';

interface Props {
  lists: UserList[];
  isActive: boolean;
  onUpdateLists: (lists: UserList[]) => void;
  onToast: (msg: string) => void;
}

function genId() {
  return Math.random().toString(36).slice(2, 9);
}

const LIST_EMOJIS = ['📋', '🎬', '📚', '🎮', '🍽️', '🎵', '📍', '✨', '❤️', '⭐'];

export default function ListsScreen({ lists, isActive, onUpdateLists, onToast }: Props) {
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('📋');

  const activeList = lists.find(l => l.id === activeListId) ?? null;

  const createList = () => {
    if (!newName.trim()) { onToast('Dá um nome à lista'); return; }
    const newList: UserList = {
      id: genId(),
      name: newName.trim(),
      emoji: newEmoji,
      createdAt: new Date().toISOString(),
      items: [],
    };
    onUpdateLists([...lists, newList]);
    setNewName('');
    setNewEmoji('📋');
    setCreating(false);
    onToast(`✓ Lista "${newList.name}" criada`);
  };

  const deleteList = (id: string) => {
    if (!confirm('Apagar esta lista?')) return;
    onUpdateLists(lists.filter(l => l.id !== id));
    if (activeListId === id) setActiveListId(null);
    onToast('Lista apagada');
  };

  const removeItem = (listId: string, itemId: string) => {
    onUpdateLists(lists.map(l => l.id === listId
      ? { ...l, items: l.items.filter(i => i.id !== itemId) }
      : l
    ));
    onToast('Removido');
  };

  const saveEdit = (id: string) => {
    if (!newName.trim()) return;
    onUpdateLists(lists.map(l => l.id === id ? { ...l, name: newName.trim(), emoji: newEmoji } : l));
    setEditingId(null);
    onToast('Lista actualizada');
  };

  if (!isActive) return null;

  return (
    <div className="screen active" id="lists-screen">
      <div style={{ width: '100%', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', height: '100%' }}>

        {/* Header */}
        <div style={{ padding: '56px 20px 0', flexShrink: 0 }}>
          {activeList ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <button onClick={() => setActiveListId(null)} style={{ background: 'none', border: 'none', color: 'var(--mu)', fontSize: 20, cursor: 'pointer', padding: 4 }}>←</button>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 700, fontStyle: 'italic' }}>
                  {activeList.emoji} {activeList.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--mu)', marginTop: 2 }}>{activeList.items.length} itens</div>
              </div>
              <button
                onClick={() => { setEditingId(activeList.id); setNewName(activeList.name); setNewEmoji(activeList.emoji); }}
                style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 10px', color: 'var(--mu)', fontSize: 11, cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}
              >
                Editar
              </button>
              <button
                onClick={() => deleteList(activeList.id)}
                style={{ background: 'none', border: '1px solid rgba(224,112,112,0.3)', borderRadius: 8, padding: '6px 10px', color: 'var(--rd)', fontSize: 11, cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}
              >
                Apagar
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 700, fontStyle: 'italic' }}>As minhas listas</div>
                <div style={{ fontSize: 12, color: 'var(--mu)', marginTop: 2 }}>{lists.length} {lists.length === 1 ? 'lista' : 'listas'}</div>
              </div>
              <button
                onClick={() => setCreating(true)}
                style={{ background: 'rgba(200,155,60,0.1)', border: '1px solid rgba(200,155,60,0.3)', borderRadius: 10, padding: '8px 14px', color: 'var(--ac)', fontSize: 12, fontFamily: "'Outfit', sans-serif", cursor: 'pointer', fontWeight: 600 }}
              >
                + Nova lista
              </button>
            </div>
          )}
        </div>

        {/* Criar lista */}
        {creating && (
          <div style={{ margin: '0 20px 16px', padding: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(200,155,60,0.2)', borderRadius: 16 }}>
            <div style={{ fontSize: 12, color: 'var(--mu)', marginBottom: 10, letterSpacing: 1, textTransform: 'uppercase' }}>Nova lista</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
              {LIST_EMOJIS.map(e => (
                <button key={e} onClick={() => setNewEmoji(e)} style={{ width: 36, height: 36, borderRadius: 8, fontSize: 18, background: newEmoji === e ? 'rgba(200,155,60,0.15)' : 'rgba(255,255,255,0.04)', border: newEmoji === e ? '1px solid rgba(200,155,60,0.5)' : '1px solid rgba(255,255,255,0.08)', cursor: 'pointer' }}>{e}</button>
              ))}
            </div>
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') createList(); }}
              placeholder="Nome da lista..."
              autoFocus
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px', color: 'var(--tx)', fontFamily: "'Outfit', sans-serif", fontSize: 14, marginBottom: 10, outline: 'none', boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={createList} style={{ flex: 1, padding: '10px', background: 'linear-gradient(135deg, #C89B3C, #a87535)', border: 'none', borderRadius: 10, color: '#0B0D12', fontWeight: 700, fontSize: 13, fontFamily: "'Outfit', sans-serif", cursor: 'pointer' }}>Criar</button>
              <button onClick={() => { setCreating(false); setNewName(''); }} style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: 'var(--mu)', fontSize: 13, fontFamily: "'Outfit', sans-serif", cursor: 'pointer' }}>Cancelar</button>
            </div>
          </div>
        )}

        {/* Editar lista */}
        {editingId && (
          <div style={{ margin: '0 20px 16px', padding: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(200,155,60,0.2)', borderRadius: 16 }}>
            <div style={{ fontSize: 12, color: 'var(--mu)', marginBottom: 10, letterSpacing: 1, textTransform: 'uppercase' }}>Editar lista</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
              {LIST_EMOJIS.map(e => (
                <button key={e} onClick={() => setNewEmoji(e)} style={{ width: 36, height: 36, borderRadius: 8, fontSize: 18, background: newEmoji === e ? 'rgba(200,155,60,0.15)' : 'rgba(255,255,255,0.04)', border: newEmoji === e ? '1px solid rgba(200,155,60,0.5)' : '1px solid rgba(255,255,255,0.08)', cursor: 'pointer' }}>{e}</button>
              ))}
            </div>
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px', color: 'var(--tx)', fontFamily: "'Outfit', sans-serif", fontSize: 14, marginBottom: 10, outline: 'none', boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => saveEdit(editingId)} style={{ flex: 1, padding: '10px', background: 'linear-gradient(135deg, #C89B3C, #a87535)', border: 'none', borderRadius: 10, color: '#0B0D12', fontWeight: 700, fontSize: 13, fontFamily: "'Outfit', sans-serif", cursor: 'pointer' }}>Guardar</button>
              <button onClick={() => setEditingId(null)} style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: 'var(--mu)', fontSize: 13, fontFamily: "'Outfit', sans-serif", cursor: 'pointer' }}>Cancelar</button>
            </div>
          </div>
        )}

        {/* Conteúdo */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px', paddingBottom: 100 }}>
          {!activeList ? (
            lists.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 250, gap: 12 }}>
                <div style={{ fontSize: 40, opacity: 0.2 }}>📋</div>
                <div style={{ fontSize: 14, color: 'var(--mu)', textAlign: 'center' }}>Ainda sem listas</div>
                <div style={{ fontSize: 12, color: 'rgba(156,165,185,0.5)', textAlign: 'center' }}>Cria uma lista para guardar sugestões</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 4 }}>
                {lists.map(list => (
                  <div
                    key={list.id}
                    onClick={() => setActiveListId(list.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, cursor: 'pointer', transition: 'background 0.15s' }}
                  >
                    <span style={{ fontSize: 24, flexShrink: 0 }}>{list.emoji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--tx)' }}>{list.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--mu)', marginTop: 2 }}>{list.items.length} {list.items.length === 1 ? 'item' : 'itens'}</div>
                    </div>
                    <span style={{ color: 'var(--mu)', fontSize: 18 }}>›</span>
                  </div>
                ))}
              </div>
            )
          ) : (
            activeList.items.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, gap: 12 }}>
                <div style={{ fontSize: 32, opacity: 0.2 }}>{activeList.emoji}</div>
                <div style={{ fontSize: 14, color: 'var(--mu)', textAlign: 'center' }}>Lista vazia</div>
                <div style={{ fontSize: 12, color: 'rgba(156,165,185,0.5)', textAlign: 'center' }}>Adiciona sugestões usando o botão ♡ nas sugestões</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 4 }}>
                {activeList.items.map(item => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14 }}>
                    <span style={{ fontSize: 22, flexShrink: 0 }}>{item.emoji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--tx)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--mu)', marginTop: 2 }}>{item.cat} · {item.type}</div>
                    </div>
                    <button
                      onClick={() => removeItem(activeList.id, item.id)}
                      style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(224,112,112,0.06)', border: '1px solid rgba(224,112,112,0.2)', color: 'var(--rd)', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
