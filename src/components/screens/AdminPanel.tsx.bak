import { useState, useEffect } from 'react';
import { createInviteCode, listInviteCodes, updateInviteCode, removeInviteCode } from '../../services/influencers';
import { supabase } from '../../lib/supabase';

const ADMIN_USER = 'Navidkia';
const ADMIN_PASS = 'Leste1825!';

const TIER_COLORS = {
  gold:   { bg: 'rgba(200,155,60,0.15)',  border: 'rgba(200,155,60,0.4)',   color: '#C89B3C' },
  silver: { bg: 'rgba(156,165,185,0.1)',  border: 'rgba(156,165,185,0.3)', color: '#9ca5b9' },
  base:   { bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)', color: '#f5f1eb' },
};

interface InviteCode {
  id: string; code: string; name: string; handle: string;
  tier: string; platform: string; used: boolean; usedAt: string | null;
  usedBy?: string; createdAt: string;
}

interface UsedByInfo { name: string; handle: string; }

export default function AdminPanel() {
  const [authed, setAuthed]       = useState(false);
  const [user, setUser]           = useState('');
  const [pass, setPass]           = useState('');
  const [codes, setCodes]         = useState<InviteCode[]>([]);
  const [loading, setLoading]     = useState(false);

  // Create form
  const [newCode, setNewCode]     = useState('');
  const [newName, setNewName]     = useState('');
  const [newHandle, setNewHandle] = useState('');
  const [newTier, setNewTier]     = useState<'base' | 'silver' | 'gold'>('gold');
  const [newPlatform, setNewPlatform] = useState('instagram');
  const [creating, setCreating]   = useState(false);
  const [msg, setMsg]             = useState('');

  // Edit state
  const [editingId, setEditingId]     = useState<string | null>(null);
  const [editCode, setEditCode]       = useState('');
  const [editName, setEditName]       = useState('');
  const [editHandle, setEditHandle]   = useState('');
  const [editTier, setEditTier]       = useState<'base' | 'silver' | 'gold'>('gold');
  const [editPlatform, setEditPlatform] = useState('instagram');
  const [saving, setSaving]           = useState(false);
  const [usedByInfo, setUsedByInfo]   = useState<Record<string, UsedByInfo>>({});

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', borderRadius: 10,
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    color: '#f5f1eb', fontFamily: "'Outfit', sans-serif", fontSize: 13,
    outline: 'none', boxSizing: 'border-box',
  };

  const loadCodes = async () => {
    setLoading(true);
    const data = await listInviteCodes();
    setCodes(data);
    setLoading(false);
  };

  useEffect(() => {
    if (authed) loadCodes();
  }, [authed]);

  // Busca info do influencer para códigos usados
  useEffect(() => {
    const usedCodes = codes.filter(c => c.used && c.usedBy);
    if (usedCodes.length === 0) return;
    Promise.all(
      usedCodes.map(async c => {
        const { data } = await supabase
          .from('influencers')
          .select('name, handle')
          .eq('user_id', c.usedBy)
          .single();
        return { id: c.usedBy!, name: (data?.name as string) || '', handle: (data?.handle as string) || '' };
      })
    ).then(results => {
      const map: Record<string, UsedByInfo> = {};
      results.forEach(r => { if (r.id) map[r.id] = { name: r.name, handle: r.handle }; });
      setUsedByInfo(map);
    }).catch(() => {});
  }, [codes]);

  const handleLogin = () => {
    if (user === ADMIN_USER && pass === ADMIN_PASS) {
      setAuthed(true);
    } else {
      setMsg('Credenciais incorrectas');
    }
  };

  const handleCreate = async () => {
    if (!newCode.trim() || !newName.trim() || !newHandle.trim()) {
      setMsg('Preenche todos os campos'); return;
    }
    setCreating(true);
    const result = await createInviteCode({
      code: newCode, name: newName, handle: newHandle,
      tier: newTier, platform: newPlatform,
    });
    if (result.ok) {
      setMsg('✓ Código criado!');
      setNewCode(''); setNewName(''); setNewHandle('');
      await loadCodes();
    } else {
      setMsg(result.error || 'Erro ao criar código');
    }
    setCreating(false);
  };

  const openEdit = (c: InviteCode) => {
    setEditingId(c.id);
    setEditCode(c.code);
    setEditName(c.name);
    setEditHandle(c.handle);
    setEditTier(c.tier as 'base' | 'silver' | 'gold');
    setEditPlatform(c.platform);
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    const result = await updateInviteCode(editingId, {
      code: editCode, name: editName, handle: editHandle,
      tier: editTier, platform: editPlatform,
    });
    if (result.ok) {
      setEditingId(null);
      await loadCodes();
    } else {
      setMsg(result.error || 'Erro ao guardar');
    }
    setSaving(false);
  };

  const handleRemove = async (id: string) => {
    const result = await removeInviteCode(id);
    if (result.ok) {
      await loadCodes();
    } else {
      setMsg(result.error || 'Erro ao remover');
    }
  };

  if (!authed) return (
    <div style={{ position: 'fixed', inset: 0, background: '#0B0D12', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 28px' }}>
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 700, color: '#C89B3C', marginBottom: 8 }}>Admin</div>
      <div style={{ fontSize: 11, color: 'rgba(156,165,185,0.5)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 32 }}>What to</div>
      <div style={{ width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input value={user} onChange={e => setUser(e.target.value)} placeholder="Utilizador" style={inputStyle} />
        <input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="Password"
          onKeyDown={e => { if (e.key === 'Enter') handleLogin(); }} style={inputStyle} />
        {msg && <div style={{ fontSize: 12, color: '#e07070', textAlign: 'center' }}>{msg}</div>}
        <button onClick={handleLogin} style={{ padding: '13px', background: 'linear-gradient(135deg,#C89B3C,#a87535)', border: 'none', borderRadius: 12, color: '#0B0D12', fontWeight: 700, fontSize: 14, fontFamily: "'Outfit', sans-serif", cursor: 'pointer' }}>
          Entrar
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0B0D12', overflowY: 'auto', padding: '0 0 40px' }}>
      <div style={{ width: '100%', maxWidth: 560, margin: '0 auto', padding: '0 20px' }}>

        {/* Header */}
        <div style={{ padding: '48px 0 24px', borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: 24 }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 700, fontStyle: 'italic', color: '#f5f1eb' }}>
            Painel de Admin
          </div>
          <div style={{ fontSize: 12, color: 'rgba(156,165,185,0.5)', marginTop: 4 }}>Gestão de códigos de convite</div>
        </div>

        {/* Criar código */}
        <div style={{ background: 'rgba(200,155,60,0.06)', border: '1px solid rgba(200,155,60,0.2)', borderRadius: 16, padding: 20, marginBottom: 24 }}>
          <div style={{ fontSize: 12, color: 'rgba(156,165,185,0.5)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16 }}>Novo código de convite</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input
              value={newCode}
              onChange={e => setNewCode(e.target.value.toUpperCase())}
              placeholder="CÓDIGO (ex: MARIA-GOLD-WT24)"
              style={{ ...inputStyle, fontFamily: 'monospace', letterSpacing: 1 }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nome do influencer" style={{ ...inputStyle, flex: 1 }} />
              <input value={newHandle} onChange={e => setNewHandle(e.target.value)} placeholder="@handle" style={{ ...inputStyle, flex: 1 }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <select value={newTier} onChange={e => setNewTier(e.target.value as 'base' | 'silver' | 'gold')} style={{ ...inputStyle, flex: 1 }}>
                <option value="gold">Gold</option>
                <option value="silver">Silver</option>
                <option value="base">Base</option>
              </select>
              <select value={newPlatform} onChange={e => setNewPlatform(e.target.value)} style={{ ...inputStyle, flex: 1 }}>
                <option value="instagram">Instagram</option>
                <option value="tiktok">TikTok</option>
                <option value="youtube">YouTube</option>
                <option value="other">Outro</option>
              </select>
            </div>
            {msg && <div style={{ fontSize: 12, color: msg.startsWith('✓') ? '#5ec97a' : '#e07070' }}>{msg}</div>}
            <button
              onClick={handleCreate}
              disabled={creating}
              style={{ padding: '12px', background: 'linear-gradient(135deg,#C89B3C,#a87535)', border: 'none', borderRadius: 10, color: '#0B0D12', fontWeight: 700, fontSize: 13, fontFamily: "'Outfit', sans-serif", cursor: 'pointer', opacity: creating ? 0.7 : 1 }}
            >
              {creating ? '...' : '✦ Activar código'}
            </button>
          </div>
        </div>

        {/* Lista de códigos */}
        <div style={{ fontSize: 12, color: 'rgba(156,165,185,0.5)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>
          Códigos criados · {codes.length}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'rgba(156,165,185,0.4)', fontSize: 13 }}>A carregar...</div>
        ) : codes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'rgba(156,165,185,0.3)', fontSize: 13 }}>Ainda sem códigos criados</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {codes.map(c => {
              const tc = TIER_COLORS[c.tier as keyof typeof TIER_COLORS] || TIER_COLORS.base;
              const isEditing = editingId === c.id;

              return (
                <div
                  key={c.id}
                  style={{
                    background: c.used ? 'rgba(255,255,255,0.02)' : tc.bg,
                    border: `1px solid ${c.used ? 'rgba(255,255,255,0.06)' : tc.border}`,
                    borderRadius: 14,
                    overflow: 'hidden',
                  }}
                >
                  {/* Row principal */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', opacity: c.used && !isEditing ? 0.5 : 1 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                        <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: c.used ? 'rgba(156,165,185,0.5)' : tc.color, letterSpacing: 1 }}>
                          {c.code}
                        </span>
                        <span style={{ fontSize: 9, fontWeight: 600, padding: '2px 6px', borderRadius: 20, background: tc.bg, border: `1px solid ${tc.border}`, color: tc.color, textTransform: 'uppercase', letterSpacing: 1 }}>
                          {c.tier}
                        </span>
                        {c.used && <span style={{ fontSize: 9, color: 'rgba(156,165,185,0.4)', textTransform: 'uppercase', letterSpacing: 1 }}>usado</span>}
                      </div>
                      <div style={{ fontSize: 11, color: 'rgba(156,165,185,0.6)' }}>
                        {c.name} · {c.handle} · {c.platform}
                      </div>
                      {c.used && usedByInfo[c.usedBy || ''] && (
                        <div style={{ fontSize: 11, color: 'rgba(156,165,185,0.5)', marginTop: 3 }}>
                          👤 {usedByInfo[c.usedBy || ''].name} · @{usedByInfo[c.usedBy || ''].handle}
                        </div>
                      )}
                    </div>
                    {/* Botões ação */}
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      {!c.used && (
                        <button
                          onClick={() => isEditing ? setEditingId(null) : openEdit(c)}
                          style={{ padding: '5px 10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'rgba(156,165,185,0.7)', fontSize: 11, fontFamily: "'Outfit',sans-serif", cursor: 'pointer' }}
                        >
                          {isEditing ? 'Cancelar' : 'Editar'}
                        </button>
                      )}
                      <button
                        onClick={() => handleRemove(c.id)}
                        style={{ padding: '5px 10px', background: 'rgba(224,112,112,0.08)', border: '1px solid rgba(224,112,112,0.2)', borderRadius: 8, color: '#e07070', fontSize: 11, fontFamily: "'Outfit',sans-serif", cursor: 'pointer' }}
                      >
                        Remover
                      </button>
                    </div>
                  </div>

                  {/* Form de edição inline */}
                  {isEditing && (
                    <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ paddingTop: 12, fontSize: 11, color: 'rgba(156,165,185,0.5)', letterSpacing: 1, textTransform: 'uppercase' }}>Editar código</div>
                      <input value={editCode} onChange={e => setEditCode(e.target.value.toUpperCase())} placeholder="Código" style={{ ...inputStyle, fontFamily: 'monospace', letterSpacing: 1 }} />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Nome" style={{ ...inputStyle, flex: 1 }} />
                        <input value={editHandle} onChange={e => setEditHandle(e.target.value)} placeholder="@handle" style={{ ...inputStyle, flex: 1 }} />
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <select value={editTier} onChange={e => setEditTier(e.target.value as 'base' | 'silver' | 'gold')} style={{ ...inputStyle, flex: 1 }}>
                          <option value="gold">Gold</option>
                          <option value="silver">Silver</option>
                          <option value="base">Base</option>
                        </select>
                        <select value={editPlatform} onChange={e => setEditPlatform(e.target.value)} style={{ ...inputStyle, flex: 1 }}>
                          <option value="instagram">Instagram</option>
                          <option value="tiktok">TikTok</option>
                          <option value="youtube">YouTube</option>
                          <option value="other">Outro</option>
                        </select>
                      </div>
                      <button
                        onClick={handleSaveEdit}
                        disabled={saving}
                        style={{ padding: '10px', background: 'linear-gradient(135deg,#C89B3C,#a87535)', border: 'none', borderRadius: 10, color: '#0B0D12', fontWeight: 700, fontSize: 13, fontFamily: "'Outfit',sans-serif", cursor: 'pointer', opacity: saving ? 0.7 : 1 }}
                      >
                        {saving ? '...' : '✓ Guardar'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
