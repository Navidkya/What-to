import { useState, useEffect } from 'react';

interface Props {
  isActive: boolean;
  onBack: () => void;
  onToast: (msg: string) => void;
}

interface CreatorSuggestion {
  id: string;
  title: string;
  emoji: string;
  catId: string;
  cat: string;
  type: string;
  desc: string;
  createdAt: string;
}

const CATS_LIST = [
  { id: 'watch', name: 'Ver' },
  { id: 'eat',   name: 'Comer' },
  { id: 'read',  name: 'Ler' },
  { id: 'listen',name: 'Ouvir' },
  { id: 'play',  name: 'Jogar' },
  { id: 'learn', name: 'Aprender' },
  { id: 'visit', name: 'Visitar' },
  { id: 'do',    name: 'Fazer' },
];

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', borderRadius: 10,
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  color: 'var(--tx)', fontFamily: "'Outfit', sans-serif", fontSize: 14,
  outline: 'none', boxSizing: 'border-box',
};

export default function CreatorDashboard({ isActive, onBack, onToast }: Props) {
  const [suggestions, setSuggestions] = useState<CreatorSuggestion[]>(() => {
    try { return JSON.parse(localStorage.getItem('wt_creator_suggestions') || '[]'); } catch { return []; }
  });
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newEmoji, setNewEmoji] = useState('✦');
  const [newCatId, setNewCatId] = useState('watch');
  const [newDesc, setNewDesc] = useState('');

  useEffect(() => {
    localStorage.setItem('wt_creator_suggestions', JSON.stringify(suggestions));
  }, [suggestions]);

  if (!isActive) return null;

  const newCat = CATS_LIST.find(c => c.id === newCatId);

  const handlePublish = () => {
    if (!newTitle.trim()) { onToast('Escreve um título'); return; }
    const s: CreatorSuggestion = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      emoji: newEmoji || '✦',
      catId: newCatId,
      cat: newCat?.name || newCatId,
      type: newCat?.name || newCatId,
      desc: newDesc.trim(),
      createdAt: new Date().toISOString(),
    };
    setSuggestions(prev => [s, ...prev]);
    setNewTitle('');
    setNewEmoji('✦');
    setNewCatId('watch');
    setNewDesc('');
    setAdding(false);
    onToast('✦ Sugestão publicada!');
  };

  const deleteSuggestion = (id: string) => {
    setSuggestions(prev => prev.filter(s => s.id !== id));
    onToast('Sugestão removida');
  };

  return (
    <div className="screen active" id="creator-dashboard" style={{ overflowY: 'auto', paddingBottom: 40 }}>
      <div style={{ width: '100%', maxWidth: 480, margin: '0 auto', padding: '0 20px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 52, paddingBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 20 }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--mu)', fontSize: 20, cursor: 'pointer', padding: 4, flexShrink: 0 }}>←</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 700, fontStyle: 'italic', color: 'var(--tx)' }}>Painel do Criador</div>
          </div>
        </div>

        {/* Creator profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'rgba(200,155,60,0.07)', border: '1px solid rgba(200,155,60,0.2)', borderRadius: 16, marginBottom: 20 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#C89B3C,#a87535)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: '#0B0D12', flexShrink: 0 }}>✦</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--tx)', fontFamily: "'Outfit',sans-serif" }}>O teu perfil de criador</div>
            <div style={{ fontSize: 11, color: 'var(--mu)', marginTop: 2 }}>O teu conteúdo aparece para utilizadores da app</div>
          </div>
          <div style={{ padding: '4px 10px', background: 'rgba(200,155,60,0.15)', border: '1px solid rgba(200,155,60,0.3)', borderRadius: 20, fontSize: 11, color: 'var(--ac)', fontWeight: 600, fontFamily: "'Outfit',sans-serif", flexShrink: 0 }}>Base</div>
        </div>

        {/* Suggestions section */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: 'var(--mu)', letterSpacing: 1, textTransform: 'uppercase', fontFamily: "'Outfit',sans-serif" }}>
            As tuas sugestões · {suggestions.length}
          </div>
          {!adding && (
            <button
              onClick={() => setAdding(true)}
              style={{ padding: '7px 14px', background: 'rgba(200,155,60,0.1)', border: '1px solid rgba(200,155,60,0.3)', borderRadius: 20, color: 'var(--ac)', fontSize: 12, fontWeight: 600, fontFamily: "'Outfit',sans-serif", cursor: 'pointer' }}
            >
              + Adicionar
            </button>
          )}
        </div>

        {/* Add form */}
        {adding && (
          <div style={{ padding: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(200,155,60,0.2)', borderRadius: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: 'var(--mu)', marginBottom: 12, letterSpacing: 1, textTransform: 'uppercase' }}>Nova sugestão</div>

            <div style={{ marginBottom: 10 }}>
              <select
                value={newCatId}
                onChange={e => setNewCatId(e.target.value)}
                style={{ ...inputStyle, marginBottom: 0 }}
              >
                {CATS_LIST.map(c => (
                  <option key={c.id} value={c.id} style={{ background: '#0B0D12' }}>{c.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <input
                value={newEmoji}
                onChange={e => setNewEmoji(e.target.value)}
                placeholder="✦"
                style={{ ...inputStyle, width: 56, flexShrink: 0, textAlign: 'center', fontSize: 20 }}
              />
              <input
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="Título da sugestão"
                style={{ ...inputStyle, flex: 1 }}
              />
            </div>

            <textarea
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              placeholder="Descrição (opcional)"
              rows={2}
              style={{ ...inputStyle, resize: 'none', lineHeight: 1.5, marginBottom: 10 }}
            />

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handlePublish} style={{ flex: 1, padding: '11px', background: 'linear-gradient(135deg,#C89B3C,#a87535)', border: 'none', borderRadius: 10, color: '#0B0D12', fontWeight: 700, fontSize: 13, fontFamily: "'Outfit',sans-serif", cursor: 'pointer' }}>
                Publicar sugestão
              </button>
              <button onClick={() => { setAdding(false); setNewTitle(''); setNewEmoji('✦'); setNewDesc(''); }} style={{ flex: 1, padding: '11px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: 'var(--mu)', fontSize: 13, fontFamily: "'Outfit',sans-serif", cursor: 'pointer' }}>
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Suggestions list */}
        {suggestions.length === 0 && !adding ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 0', gap: 10 }}>
            <div style={{ fontSize: 36, opacity: 0.2 }}>✦</div>
            <div style={{ fontSize: 13, color: 'var(--mu)', textAlign: 'center' }}>Ainda não publicaste nenhuma sugestão</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            {suggestions.map(s => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14 }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>{s.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--tx)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--mu)', marginTop: 2 }}>{s.cat}</div>
                </div>
                <button
                  onClick={() => deleteSuggestion(s.id)}
                  style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(224,112,112,0.06)', border: '1px solid rgba(224,112,112,0.2)', color: 'var(--rd)', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Metrics */}
        <div style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, marginBottom: 24 }}>
          <div style={{ fontSize: 12, color: 'var(--mu)', marginBottom: 12, letterSpacing: 1, textTransform: 'uppercase', fontFamily: "'Outfit',sans-serif" }}>Métricas</div>
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--tx)', fontFamily: "'Cormorant Garamond',serif" }}>0</div>
              <div style={{ fontSize: 10, color: 'var(--mu)' }}>Views</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--tx)', fontFamily: "'Cormorant Garamond',serif" }}>0</div>
              <div style={{ fontSize: 10, color: 'var(--mu)' }}>Accepts</div>
            </div>
          </div>
          <div style={{ fontSize: 11, color: 'rgba(156,165,185,0.4)', marginTop: 10 }}>As métricas aparecem após aprovação</div>
        </div>

        {/* Exit */}
        <button
          onClick={onBack}
          style={{ width: '100%', padding: '13px', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, color: 'var(--mu)', fontSize: 13, fontFamily: "'Outfit',sans-serif", cursor: 'pointer' }}
        >
          Sair do painel
        </button>

      </div>
    </div>
  );
}
