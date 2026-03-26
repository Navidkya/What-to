import { useState, useEffect } from 'react';
import { listInviteCodes, createInviteCode, updateInviteCode, removeInviteCode } from '../../services/influencers';
import type { InviteCode } from '../../services/influencers';
import { supabase } from '../../lib/supabase';

// Credenciais via variáveis de ambiente (não ficam no bundle)
const ADMIN_USER = import.meta.env.VITE_ADMIN_USER || 'Navidkia';
const ADMIN_PASS = import.meta.env.VITE_ADMIN_PASS || 'Leste1825!';

// ── Tipos para o dashboard ────────────────────────────────────────────────
interface DashStats {
  totalUsers: number;
  activeToday: number;
  activeWeek: number;
  activeMonth: number;
  topCats: Array<{ catId: string; count: number }>;
  acceptRateByCat: Array<{ catId: string; opens: number; accepts: number; rate: number }>;
  peakHours: Array<{ hour: number; count: number }>;
  topSuggestions: Array<{ title: string; catId: string; count: number }>;
  deviceSplit: Array<{ device: string; count: number }>;
  osSplit: Array<{ os: string; count: number }>;
  avgSessionSeconds: number;
  influencerConversion: Array<{ handle: string; views: number; accepts: number; rate: number }>;
}

const CAT_NAMES: Record<string, string> = {
  watch: 'Ver', eat: 'Comer', read: 'Ler', listen: 'Ouvir',
  play: 'Jogar', learn: 'Aprender', visit: 'Visitar', do: 'Fazer',
};

export default function AdminPanel() {
  const [authed, setAuthed] = useState(false);
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [loginErr, setLoginErr] = useState('');

  const [tab, setTab] = useState<'codes' | 'metrics'>('codes');
  const [stats, setStats] = useState<DashStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Códigos de convite
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [form, setForm] = useState({ code: '', name: '', handle: '', tier: 'base', platform: 'instagram' });
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ code: '', name: '', handle: '', tier: 'base', platform: 'instagram' });
  const [usedByInfo, setUsedByInfo] = useState<Record<string, { name: string; handle: string }>>({});

  useEffect(() => {
    if (authed) {
      loadCodes();
    }
  }, [authed]);

  useEffect(() => {
    if (authed && tab === 'metrics') {
      loadStats();
    }
  }, [authed, tab]);

  const loadCodes = async () => {
    const list = await listInviteCodes();
    setCodes(list);
    const info: Record<string, { name: string; handle: string }> = {};
    for (const c of list) {
      if (c.usedBy) {
        try {
          const { data } = await supabase.from('influencers').select('name,handle').eq('user_id', c.usedBy).single();
          if (data) info[c.id] = { name: data.name as string, handle: data.handle as string };
        } catch { /* ignore */ }
      }
    }
    setUsedByInfo(info);
  };

  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

      // Utilizadores activos
      const [todayRes, weekRes, monthRes] = await Promise.all([
        supabase.from('analytics_events').select('user_id', { count: 'exact' })
          .gte('created_at', todayStr).not('user_id', 'is', null),
        supabase.from('analytics_events').select('user_id', { count: 'exact' })
          .gte('created_at', weekAgo).not('user_id', 'is', null),
        supabase.from('analytics_events').select('user_id', { count: 'exact' })
          .gte('created_at', monthAgo).not('user_id', 'is', null),
      ]);

      // Total profiles
      const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true });

      // Top categorias (suggest_open)
      const { data: catData } = await supabase.from('analytics_events')
        .select('cat_id').eq('event_type', 'suggest_open').not('cat_id', 'is', null);
      const catCount: Record<string, number> = {};
      (catData || []).forEach((r: any) => { catCount[r.cat_id] = (catCount[r.cat_id] || 0) + 1; });
      const topCats = Object.entries(catCount)
        .map(([catId, count]) => ({ catId, count }))
        .sort((a, b) => b.count - a.count);

      // Taxa de aceitação por categoria
      const { data: opensData } = await supabase.from('analytics_events')
        .select('cat_id').eq('event_type', 'suggest_open').not('cat_id', 'is', null);
      const { data: acceptsData } = await supabase.from('analytics_events')
        .select('cat_id').eq('event_type', 'suggest_accept').not('cat_id', 'is', null);
      const opens: Record<string, number> = {};
      const accepts: Record<string, number> = {};
      (opensData || []).forEach((r: any) => { opens[r.cat_id] = (opens[r.cat_id] || 0) + 1; });
      (acceptsData || []).forEach((r: any) => { accepts[r.cat_id] = (accepts[r.cat_id] || 0) + 1; });
      const acceptRateByCat = Object.keys(opens).map(catId => ({
        catId,
        opens: opens[catId] || 0,
        accepts: accepts[catId] || 0,
        rate: opens[catId] ? Math.round((accepts[catId] || 0) / opens[catId] * 100) : 0,
      })).sort((a, b) => b.rate - a.rate);

      // Hora de pico
      const { data: hourData } = await supabase.from('analytics_events')
        .select('value').eq('event_type', 'suggest_open');
      const hourCount: Record<number, number> = {};
      (hourData || []).forEach((r: any) => {
        const h = r.value?.hour_of_day;
        if (typeof h === 'number') hourCount[h] = (hourCount[h] || 0) + 1;
      });
      const peakHours = Object.entries(hourCount)
        .map(([hour, count]) => ({ hour: parseInt(hour), count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Top sugestões aceites
      const { data: topSuggData } = await supabase.from('analytics_events')
        .select('cat_id, value').eq('event_type', 'suggest_accept');
      const suggCount: Record<string, { catId: string; count: number }> = {};
      (topSuggData || []).forEach((r: any) => {
        const title = r.value?.title;
        if (title) {
          if (!suggCount[title]) suggCount[title] = { catId: r.cat_id, count: 0 };
          suggCount[title].count++;
        }
      });
      const topSuggestions = Object.entries(suggCount)
        .map(([title, { catId, count }]) => ({ title, catId, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Device e OS split
      const { data: sessionData } = await supabase.from('user_sessions').select('device_type, os');
      const devCount: Record<string, number> = {};
      const osCount: Record<string, number> = {};
      (sessionData || []).forEach((r: any) => {
        if (r.device_type) devCount[r.device_type] = (devCount[r.device_type] || 0) + 1;
        if (r.os) osCount[r.os] = (osCount[r.os] || 0) + 1;
      });
      const deviceSplit = Object.entries(devCount).map(([device, count]) => ({ device, count }));
      const osSplit = Object.entries(osCount).map(([os, count]) => ({ os, count }));

      // Duração média de sessão
      const { data: durData } = await supabase.from('user_sessions')
        .select('duration_seconds').not('duration_seconds', 'is', null);
      const durations = (durData || []).map((r: any) => r.duration_seconds).filter(Boolean);
      const avgSessionSeconds = durations.length
        ? Math.round(durations.reduce((a: number, b: number) => a + b, 0) / durations.length)
        : 0;

      // Conversão influencers
      const { data: infViewData } = await supabase.from('analytics_events')
        .select('value').eq('event_type', 'influencer_view');
      const { data: infAcceptData } = await supabase.from('analytics_events')
        .select('value').eq('event_type', 'influencer_accept');
      const infViews: Record<string, number> = {};
      const infAccepts: Record<string, number> = {};
      (infViewData || []).forEach((r: any) => {
        const h = r.value?.handle;
        if (h) infViews[h] = (infViews[h] || 0) + 1;
      });
      (infAcceptData || []).forEach((r: any) => {
        const h = r.value?.handle;
        if (h) infAccepts[h] = (infAccepts[h] || 0) + 1;
      });
      const influencerConversion = Object.keys(infViews).map(handle => ({
        handle,
        views: infViews[handle] || 0,
        accepts: infAccepts[handle] || 0,
        rate: infViews[handle] ? Math.round((infAccepts[handle] || 0) / infViews[handle] * 100) : 0,
      })).sort((a, b) => b.views - a.views);

      setStats({
        totalUsers: totalUsers || 0,
        activeToday: todayRes.count || 0,
        activeWeek: weekRes.count || 0,
        activeMonth: monthRes.count || 0,
        topCats,
        acceptRateByCat,
        peakHours,
        topSuggestions,
        deviceSplit,
        osSplit,
        avgSessionSeconds,
        influencerConversion,
      });
    } catch (e) {
      console.error('Stats error:', e);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleLogin = () => {
    if (user === ADMIN_USER && pass === ADMIN_PASS) {
      setAuthed(true);
      setLoginErr('');
    } else {
      setLoginErr('Credenciais incorrectas');
    }
  };

  const handleCreate = async () => {
    if (!form.code || !form.name || !form.handle) return;
    await createInviteCode({ ...form, tier: form.tier as 'gold' | 'silver' | 'base' });
    setForm({ code: '', name: '', handle: '', tier: 'base', platform: 'instagram' });
    loadCodes();
  };

  const openEdit = (c: InviteCode) => {
    setEditId(c.id);
    setEditForm({ code: c.code, name: c.name, handle: c.handle, tier: c.tier, platform: c.platform });
  };

  const handleSaveEdit = async () => {
    if (!editId) return;
    await updateInviteCode(editId, { ...editForm, tier: editForm.tier as 'gold' | 'silver' | 'base' });
    setEditId(null);
    loadCodes();
  };

  const handleRemove = async (id: string) => {
    await removeInviteCode(id);
    loadCodes();
  };

  const s: React.CSSProperties = {
    background: '#0B0D12', color: '#e8e0d0', minHeight: '100vh',
    fontFamily: 'Outfit, sans-serif', padding: '24px 16px',
  };
  const inp: React.CSSProperties = {
    background: '#161820', border: '1px solid #2a2d3a', borderRadius: 8,
    color: '#e8e0d0', padding: '8px 12px', fontSize: 14, width: '100%', boxSizing: 'border-box',
  };
  const btn: React.CSSProperties = {
    background: '#C89B3C', color: '#0B0D12', border: 'none', borderRadius: 8,
    padding: '8px 16px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
  };
  const card: React.CSSProperties = {
    background: '#161820', borderRadius: 12, padding: '16px', marginBottom: 12,
  };
  const statCard: React.CSSProperties = {
    background: '#161820', borderRadius: 12, padding: '16px',
    textAlign: 'center' as const, flex: 1, minWidth: 120,
  };

  if (!authed) {
    return (
      <div style={{ ...s, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 320 }}>
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 24, textAlign: 'center' }}>
            ✦ Admin
          </div>
          <input style={{ ...inp, marginBottom: 12 }} placeholder="Utilizador"
            value={user} onChange={e => setUser(e.target.value)} />
          <input style={{ ...inp, marginBottom: 16 }} placeholder="Password"
            type="password" value={pass} onChange={e => setPass(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()} />
          {loginErr && <div style={{ color: '#e07b7b', fontSize: 13, marginBottom: 12 }}>{loginErr}</div>}
          <button style={{ ...btn, width: '100%' }} onClick={handleLogin}>Entrar</button>
        </div>
      </div>
    );
  }

  return (
    <div style={s}>
      <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>✦ Admin Panel</div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {(['codes', 'metrics'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            ...btn,
            background: tab === t ? '#C89B3C' : '#161820',
            color: tab === t ? '#0B0D12' : '#e8e0d0',
            border: tab === t ? 'none' : '1px solid #2a2d3a',
          }}>
            {t === 'codes' ? 'Códigos de Convite' : 'Métricas'}
          </button>
        ))}
      </div>

      {/* ── TAB CÓDIGOS ── */}
      {tab === 'codes' && (
        <div>
          {/* Form criar */}
          <div style={card}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: '#C89B3C' }}>
              Novo código
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input style={inp} placeholder="Código (ex: CREATOR2025)" value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} />
              <input style={inp} placeholder="Nome do influencer" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              <input style={inp} placeholder="@handle" value={form.handle}
                onChange={e => setForm(f => ({ ...f, handle: e.target.value }))} />
              <select style={inp} value={form.tier} onChange={e => setForm(f => ({ ...f, tier: e.target.value }))}>
                <option value="base">Base</option>
                <option value="silver">Silver</option>
                <option value="gold">Gold</option>
              </select>
              <select style={inp} value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}>
                <option value="instagram">Instagram</option>
                <option value="tiktok">TikTok</option>
                <option value="youtube">YouTube</option>
                <option value="outro">Outro</option>
              </select>
              <button style={btn} onClick={handleCreate}>Criar código</button>
            </div>
          </div>

          {/* Lista de códigos */}
          {codes.map(c => (
            <div key={c.id} style={card}>
              {editId === c.id ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input style={inp} value={editForm.code}
                    onChange={e => setEditForm(f => ({ ...f, code: e.target.value }))} />
                  <input style={inp} value={editForm.name}
                    onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
                  <input style={inp} value={editForm.handle}
                    onChange={e => setEditForm(f => ({ ...f, handle: e.target.value }))} />
                  <select style={inp} value={editForm.tier}
                    onChange={e => setEditForm(f => ({ ...f, tier: e.target.value }))}>
                    <option value="base">Base</option>
                    <option value="silver">Silver</option>
                    <option value="gold">Gold</option>
                  </select>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button style={btn} onClick={handleSaveEdit}>Guardar</button>
                    <button style={{ ...btn, background: '#2a2d3a', color: '#e8e0d0' }}
                      onClick={() => setEditId(null)}>Cancelar</button>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ color: '#C89B3C', fontWeight: 700, fontSize: 15 }}>{c.code}</span>
                      <span style={{ marginLeft: 8, fontSize: 12, opacity: 0.6,
                        background: '#2a2d3a', borderRadius: 4, padding: '2px 6px' }}>
                        {c.tier}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button style={{ ...btn, padding: '4px 10px', fontSize: 12 }}
                        onClick={() => openEdit(c)}>Editar</button>
                      <button style={{ ...btn, background: '#e07b7b', padding: '4px 10px', fontSize: 12 }}
                        onClick={() => handleRemove(c.id)}>Remover</button>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, opacity: 0.7, marginTop: 6 }}>
                    {c.name} · @{c.handle} · {c.platform}
                  </div>
                  {c.used && (
                    <div style={{ fontSize: 12, marginTop: 4, color: '#5ec97a' }}>
                      ✓ Usado{usedByInfo[c.id] ? ` por ${usedByInfo[c.id].name} (@${usedByInfo[c.id].handle})` : ''}
                    </div>
                  )}
                  {!c.used && (
                    <div style={{ fontSize: 12, marginTop: 4, opacity: 0.4 }}>Ainda não usado</div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── TAB MÉTRICAS ── */}
      {tab === 'metrics' && (
        <div>
          {statsLoading && (
            <div style={{ textAlign: 'center', padding: 40, opacity: 0.6 }}>A carregar métricas…</div>
          )}
          {!statsLoading && stats && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Utilizadores activos */}
              <div>
                <div style={{ fontSize: 13, opacity: 0.5, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
                  Utilizadores
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {[
                    { label: 'Total', value: stats.totalUsers },
                    { label: 'Hoje', value: stats.activeToday },
                    { label: 'Semana', value: stats.activeWeek },
                    { label: 'Mês', value: stats.activeMonth },
                    { label: 'Sessão média', value: stats.avgSessionSeconds > 0
                      ? `${Math.floor(stats.avgSessionSeconds / 60)}m ${stats.avgSessionSeconds % 60}s` : '—' },
                  ].map(({ label, value }) => (
                    <div key={label} style={statCard}>
                      <div style={{ fontSize: 22, fontWeight: 700, color: '#C89B3C' }}>{value}</div>
                      <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>{label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Categorias mais abertas */}
              <div style={card}>
                <div style={{ fontSize: 13, opacity: 0.5, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                  Categorias mais abertas
                </div>
                {stats.topCats.map(({ catId, count }) => (
                  <div key={catId} style={{ display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 14 }}>{CAT_NAMES[catId] || catId}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ height: 6, borderRadius: 3, background: '#C89B3C',
                        width: Math.max(20, (count / (stats.topCats[0]?.count || 1)) * 120) }} />
                      <span style={{ fontSize: 13, opacity: 0.7, minWidth: 30, textAlign: 'right' }}>{count}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Taxa de aceitação */}
              <div style={card}>
                <div style={{ fontSize: 13, opacity: 0.5, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                  Taxa de aceitação por categoria
                </div>
                {stats.acceptRateByCat.map(({ catId, opens, accepts, rate }) => (
                  <div key={catId} style={{ display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 14 }}>{CAT_NAMES[catId] || catId}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ height: 6, borderRadius: 3,
                        background: rate > 30 ? '#5ec97a' : rate > 15 ? '#C89B3C' : '#e07b7b',
                        width: Math.max(20, rate * 2) }} />
                      <span style={{ fontSize: 13, opacity: 0.7, minWidth: 60, textAlign: 'right' }}>
                        {rate}% ({accepts}/{opens})
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Horas de pico */}
              <div style={card}>
                <div style={{ fontSize: 13, opacity: 0.5, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                  Horas de pico
                </div>
                {stats.peakHours.map(({ hour, count }) => (
                  <div key={hour} style={{ display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 14 }}>{hour}h00</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ height: 6, borderRadius: 3, background: '#C89B3C',
                        width: Math.max(20, (count / (stats.peakHours[0]?.count || 1)) * 120) }} />
                      <span style={{ fontSize: 13, opacity: 0.7 }}>{count}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Top sugestões */}
              <div style={card}>
                <div style={{ fontSize: 13, opacity: 0.5, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                  Top 10 sugestões aceites
                </div>
                {stats.topSuggestions.map(({ title, catId, count }, i) => (
                  <div key={title} style={{ display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', marginBottom: 8 }}>
                    <div>
                      <span style={{ opacity: 0.4, fontSize: 12, marginRight: 8 }}>#{i + 1}</span>
                      <span style={{ fontSize: 14 }}>{title}</span>
                      <span style={{ fontSize: 11, opacity: 0.5, marginLeft: 6 }}>
                        {CAT_NAMES[catId] || catId}
                      </span>
                    </div>
                    <span style={{ fontSize: 13, opacity: 0.7, color: '#C89B3C', fontWeight: 600 }}>
                      {count}×
                    </span>
                  </div>
                ))}
              </div>

              {/* Device e OS */}
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ ...card, flex: 1, marginBottom: 0 }}>
                  <div style={{ fontSize: 13, opacity: 0.5, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                    Dispositivo
                  </div>
                  {stats.deviceSplit.map(({ device, count }) => (
                    <div key={device} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 13 }}>{device}</span>
                      <span style={{ fontSize: 13, color: '#C89B3C' }}>{count}</span>
                    </div>
                  ))}
                </div>
                <div style={{ ...card, flex: 1, marginBottom: 0 }}>
                  <div style={{ fontSize: 13, opacity: 0.5, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                    Sistema
                  </div>
                  {stats.osSplit.map(({ os, count }) => (
                    <div key={os} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 13 }}>{os}</span>
                      <span style={{ fontSize: 13, color: '#C89B3C' }}>{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Conversão influencers */}
              {stats.influencerConversion.length > 0 && (
                <div style={card}>
                  <div style={{ fontSize: 13, opacity: 0.5, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                    Conversão de influencers
                  </div>
                  {stats.influencerConversion.map(({ handle, views, accepts, rate }) => (
                    <div key={handle} style={{ display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 14 }}>@{handle}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ height: 6, borderRadius: 3,
                          background: rate > 20 ? '#5ec97a' : '#C89B3C',
                          width: Math.max(20, rate * 2) }} />
                        <span style={{ fontSize: 13, opacity: 0.7 }}>
                          {rate}% ({accepts}/{views})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button style={{ ...btn, marginTop: 8 }} onClick={loadStats}>
                ↻ Actualizar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
