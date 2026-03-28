import { useState } from 'react';
import type { ReactElement } from 'react';
import PageHeader from '../ui/PageHeader';
import EmptyState from '../ui/EmptyState';
import { Film, Utensils, BookOpen, Headphones, Gamepad2, GraduationCap, MapPin, Zap, Bookmark, List } from 'lucide-react';
import type { UserList, UserListItem } from '../../types';

function getCategoryIcon(emoji: string, size = 18) {
  const map: Record<string, ReactElement> = {
    '🎬': <Film size={size} />, '🎥': <Film size={size} />, '📺': <Film size={size} />,
    '🍽️': <Utensils size={size} />, '🍴': <Utensils size={size} />, '🍕': <Utensils size={size} />,
    '📚': <BookOpen size={size} />, '📖': <BookOpen size={size} />, '📗': <BookOpen size={size} />,
    '🎵': <Headphones size={size} />, '🎶': <Headphones size={size} />, '🎧': <Headphones size={size} />,
    '🎮': <Gamepad2 size={size} />, '🕹️': <Gamepad2 size={size} />,
    '🎓': <GraduationCap size={size} />, '📝': <GraduationCap size={size} />,
    '📍': <MapPin size={size} />, '🗺️': <MapPin size={size} />,
    '⚡': <Zap size={size} />, '✨': <Zap size={size} />,
  };
  return map[emoji] ?? <List size={size} />;
}

interface Props {
  lists: UserList[];
  isActive: boolean;
  onUpdateLists: (lists: UserList[]) => void;
  onToast: (msg: string) => void;
  onBack: () => void;
}

function genId() {
  return Math.random().toString(36).slice(2, 9);
}

const LIST_EMOJIS = ['📋', '🎬', '📚', '🎮', '🍽️', '🎵', '📍', '✨', '❤️', '⭐'];

export default function ListsScreen({ lists, isActive, onUpdateLists, onToast, onBack }: Props) {
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<UserListItem | null>(null);
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
        <div style={{ padding: '44px 20px 0', flexShrink: 0 }}>
          {activeList ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <button onClick={() => setActiveListId(null)} style={{ background: 'none', border: 'none', color: 'var(--mu)', fontSize: 20, cursor: 'pointer', padding: 4 }}>←</button>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 700, fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: 'var(--ac)', display: 'flex' }}>{getCategoryIcon(activeList.emoji, 20)}</span>{activeList.name}
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
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <div style={{ flex: 1 }}>
                <PageHeader
                  label="Coleccao"
                  title="As minhas listas"
                  subtitle={`${lists.length} ${lists.length === 1 ? 'lista' : 'listas'}`}
                  onBack={onBack}
                />
              </div>
              <button
                onClick={() => setCreating(true)}
                style={{ background: 'rgba(200,155,60,0.1)', border: '1px solid rgba(200,155,60,0.3)', borderRadius: 10, padding: '8px 14px', color: 'var(--ac)', fontSize: 12, fontFamily: "'Outfit', sans-serif", cursor: 'pointer', fontWeight: 600, flexShrink: 0, marginBottom: 20 }}
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
              <EmptyState
                icon={<Bookmark size={32} />}
                title="Nenhuma lista ainda"
                description="Guarda sugestões em listas para encontrares mais tarde."
                ctaLabel="Criar lista"
                ctaAction={() => setCreating(true)}
              />
            ) : (
              <div style={{ paddingTop: 4 }}>
                {lists.map(list => (
                  <div key={list.id} className="list-card" onClick={() => setActiveListId(list.id)}>
                    <div className="list-card-cover">
                      {list.items.length > 0 ? (
                        <div className="list-cover-mosaic">
                          {list.items.slice(0, 4).map((item, i) => (
                            (item as UserListItem & { img?: string }).img
                              ? <img key={i} className="list-cover-img" src={(item as UserListItem & { img?: string }).img} alt="" />
                              : <div key={i} className="list-cover-placeholder">{getCategoryIcon(list.emoji, 16)}</div>
                          ))}
                          {Array.from({ length: Math.max(0, 4 - list.items.length) }).map((_, i) => (
                            <div key={`fill-${i}`} className="list-cover-placeholder" />
                          ))}
                        </div>
                      ) : (
                        <div className="list-cover-empty">
                          {getCategoryIcon(list.emoji, 28)}
                        </div>
                      )}
                      <div className="list-cover-fade" />
                    </div>
                    <div className="list-card-info">
                      <span className="list-card-icon">{getCategoryIcon(list.emoji, 16)}</span>
                      <div className="list-card-text">
                        <p className="list-card-name">{list.name}</p>
                        <p className="list-card-count">{list.items.length} {list.items.length === 1 ? 'item' : 'items'}</p>
                      </div>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--mu)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                    </div>
                  </div>
                ))}
                <div className="lists-inspiration">
                  <p className="lists-inspiration-label">Criar nova lista por categoria</p>
                  <div className="lists-inspiration-row">
                    {[
                      { emoji: '🎬', label: 'Ver', key: 'watch' },
                      { emoji: '📚', label: 'Ler', key: 'read' },
                      { emoji: '🎮', label: 'Jogar', key: 'play' },
                      { emoji: '🍽️', label: 'Comer', key: 'eat' },
                    ].map(cat => (
                      <button key={cat.key} className="lists-inspiration-chip" onClick={() => { setNewEmoji(cat.emoji); setCreating(true); }}>
                        {getCategoryIcon(cat.emoji, 14)}{cat.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )
          ) : (
            activeList.items.length === 0 ? (
              <EmptyState
                icon={getCategoryIcon(activeList.emoji, 32)}
                title="Lista vazia"
                description="Adiciona sugestões usando o botão de guardar nas sugestões."
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 4 }}>
                {activeList.items.map(item => (
                  <div key={item.id} onClick={() => setSelectedItem(item)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, cursor: 'pointer' }}>
                    <span style={{ flexShrink: 0, color: 'var(--ac)', display: 'flex', alignItems: 'center' }}>{getCategoryIcon(item.emoji)}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--tx)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--mu)', marginTop: 2 }}>{item.cat} · {item.type}</div>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); removeItem(activeList.id, item.id); }}
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

      {selectedItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0 16px 24px', zIndex: 400 }} onClick={() => setSelectedItem(null)}>
          <div style={{ width: '100%', maxWidth: 480, background: 'rgba(10,12,20,0.92)', backdropFilter: 'blur(40px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24, padding: '20px 20px 24px' }} onClick={e => e.stopPropagation()}>
            <div style={{ width: 36, height: 3, background: 'rgba(255,255,255,0.15)', borderRadius: 10, margin: '0 auto 20px' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(200,155,60,0.08)', border: '1px solid rgba(200,155,60,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>{selectedItem.emoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, fontStyle: 'italic', color: 'var(--tx)', lineHeight: 1.15, marginBottom: 4 }}>{selectedItem.title}</div>
                <div style={{ fontSize: 11, color: 'var(--mu)' }}>{selectedItem.cat} · {selectedItem.type}</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button onClick={() => { onToast(`▶ A abrir ${selectedItem.title}…`); setSelectedItem(null); }} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'rgba(200,155,60,0.1)', border: '1px solid rgba(200,155,60,0.3)', borderRadius: 16, cursor: 'pointer', textAlign: 'left', width: '100%' }}>
                <span style={{ fontSize: 22 }}>▶</span>
                <div><div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ac)', fontFamily: "'Outfit',sans-serif" }}>Ver agora</div><div style={{ fontSize: 11, color: 'var(--mu)', marginTop: 1 }}>Abre e acompanha em tempo real</div></div>
              </button>
              <button onClick={() => { const now = new Date(); const s = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'; const e2 = new Date(now.getTime() + 7200000).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'; window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(selectedItem.title)}&dates=${s}/${e2}`, '_blank'); setSelectedItem(null); }} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'rgba(106,180,224,0.07)', border: '1px solid rgba(106,180,224,0.2)', borderRadius: 16, cursor: 'pointer', textAlign: 'left', width: '100%' }}>
                <span style={{ fontSize: 22 }}>🗓</span>
                <div><div style={{ fontSize: 14, fontWeight: 700, color: 'var(--bl)', fontFamily: "'Outfit',sans-serif" }}>Agendar</div><div style={{ fontSize: 11, color: 'var(--mu)', marginTop: 1 }}>Adicionar ao Google Calendar</div></div>
              </button>
              <button onClick={() => { if (activeList) removeItem(activeList.id, selectedItem.id); setSelectedItem(null); }} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'rgba(224,112,112,0.05)', border: '1px solid rgba(224,112,112,0.15)', borderRadius: 16, cursor: 'pointer', textAlign: 'left', width: '100%' }}>
                <span style={{ fontSize: 22 }}>🗑</span>
                <div><div style={{ fontSize: 14, fontWeight: 700, color: 'var(--rd)', fontFamily: "'Outfit',sans-serif" }}>Remover da lista</div><div style={{ fontSize: 11, color: 'var(--mu)', marginTop: 1 }}>Remove este item</div></div>
              </button>
            </div>
            <button onClick={() => setSelectedItem(null)} style={{ width: '100%', marginTop: 14, padding: '12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, color: 'var(--mu)', fontSize: 13, fontFamily: "'Outfit',sans-serif", cursor: 'pointer' }}>← voltar</button>
          </div>
        </div>
      )}
    </div>
  );
}
