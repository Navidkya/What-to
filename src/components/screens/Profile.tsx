import { useState, useEffect } from 'react';
import PageHeader from '../ui/PageHeader';
import type { Profile as ProfileType, HistoryEntry, TrackingMap, PrefsMap, WishlistEntry, PermanentPrefs } from '../../types';
import { ALL_PLATFORMS, PLATFORM_SECTIONS, CATS } from '../../data';
import { setFeedPrivacy } from '../../services/feedEvents';
import { QRCodeSVG } from 'qrcode.react';
import { suggestUsername, validateUsername, checkUsernameAvailable, saveUsername } from '../../services/username';

interface ProfileProps {
  profile: ProfileType;
  history: HistoryEntry[];
  tracking: TrackingMap;
  prefs: PrefsMap;
  wishlist: WishlistEntry[];
  isActive: boolean;
  onBack: () => void;
  onUpdateProfile: (p: ProfileType) => void;
  onUpdatePrefs: (p: PrefsMap) => void;
  onClearAll: () => void;
  onResetEatPrefs: () => void;
  onResetWatchPrefs: () => void;
  onResetListenPrefs: () => void;
  onResetReadPrefs: () => void;
  onResetPlayPrefs: () => void;
  onResetLearnPrefs: () => void;
  onResetVisitPrefs: () => void;
  onResetDoPrefs: () => void;
  permanentPrefs: PermanentPrefs;
  onUpdatePermanentPrefs: (p: PermanentPrefs) => void;
  onLogout?: () => void;
  onToast: (msg: string) => void;
  userId?: string;
}

export default function Profile({
  profile, history, tracking, prefs, wishlist, isActive: _isActive,
  onBack, onUpdateProfile, onUpdatePrefs, onClearAll, onResetEatPrefs, onResetWatchPrefs,
  onResetListenPrefs, onResetReadPrefs, onResetPlayPrefs, onResetLearnPrefs, onResetVisitPrefs, onResetDoPrefs,
  permanentPrefs, onUpdatePermanentPrefs, onLogout, onToast, userId,
}: ProfileProps) {
  const [nameVal, setNameVal] = useState(profile.name || '');
  const [selectedPlats, setSelectedPlats] = useState<string[]>(profile.platforms || []);
  const [locationRadius, setLocationRadius] = useState(profile.location?.radius || 5);
  const [locLoading, setLocLoading] = useState(false);
  const [feedPublic, setFeedPublicState] = useState(() => {
    try { return localStorage.getItem('wt_feed_public') !== 'false'; } catch { return true; }
  });

  // Username / perfil público
  const [usernameEdit, setUsernameEdit] = useState('');
  const [usernameEditing, setUsernameEditing] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    if (!usernameEditing) return;
    const err = validateUsername(usernameEdit);
    if (err) { setUsernameError(err); setUsernameAvailable(null); return; }
    setUsernameError('');
    setUsernameChecking(true);
    const timer = setTimeout(async () => {
      const available = await checkUsernameAvailable(usernameEdit, userId);
      setUsernameAvailable(available);
      setUsernameChecking(false);
      if (!available) setUsernameError('Username já está a ser usado');
    }, 500);
    return () => clearTimeout(timer);
  }, [usernameEdit, usernameEditing, userId]);

  const handleFeedPrivacyToggle = async () => {
    const newVal = !feedPublic;
    setFeedPublicState(newVal);
    try { localStorage.setItem('wt_feed_public', String(newVal)); } catch { /* */ }
    if (userId) await setFeedPrivacy(userId, newVal);
    onToast(newVal ? '✦ Feed público activado' : '○ Feed privado — as tuas acções não aparecem a outros');
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) { onToast('GPS não disponível'); return; }
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
          const data = await res.json() as { address?: { city?: string; town?: string; village?: string; country?: string } };
          const city = data.address?.city || data.address?.town || data.address?.village || 'Localização';
          const country = data.address?.country || '';
          const label = `${city}, ${country}`;
          onUpdateProfile({ ...profile, location: { lat, lng, label, radius: locationRadius } });
          onToast(`📍 ${label}`);
        } catch {
          onUpdateProfile({ ...profile, location: { lat, lng, label: `${lat.toFixed(2)}, ${lng.toFixed(2)}`, radius: locationRadius } });
          onToast('📍 Localização guardada');
        }
        setLocLoading(false);
      },
      () => { onToast('Não foi possível obter localização'); setLocLoading(false); }
    );
  };

  const name = profile.name || 'Anónimo';
  const done = history.filter(h => h.action === 'agora' || h.action === 'hoje');
  const gc: Record<string, number> = {};
  done.forEach(h => { if (h.genre) gc[h.genre] = (gc[h.genre] || 0) + 1; });
  const topG = Object.entries(gc).sort((a, b) => b[1] - a[1])[0];
  const blocked = profile.blockedPlatforms || [];

  const saveName = () => {
    if (!nameVal.trim()) { onToast('Escreve um nome'); return; }
    onUpdateProfile({ ...profile, name: nameVal.trim() });
    onToast('✓ Nome guardado!');
  };

  const savePlatforms = () => {
    onUpdateProfile({ ...profile, platforms: selectedPlats });
    onToast('✓ Plataformas guardadas!');
  };

  const unblockPlat = (id: string) => {
    onUpdateProfile({ ...profile, blockedPlatforms: blocked.filter(x => x !== id) });
    onToast('Desbloqueado!');
  };

  const clearPref = (catId: string, key: string) => {
    const newPrefs = { ...prefs };
    if (newPrefs[catId]) {
      const updated = { ...newPrefs[catId] };
      delete updated[key];
      newPrefs[catId] = updated;
    }
    onUpdatePrefs(newPrefs);
    onToast('Preferência removida');
  };

  const handleClearAll = () => {
    if (!confirm('Apagar todo o histórico, tracking e guardados?')) return;
    onClearAll();
    onToast('Dados limpos');
  };

  const togglePlat = (id: string) => {
    setSelectedPlats(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const activePrefs = Object.entries(prefs).filter(([, v]) => Object.keys(v).length > 0);

  return (
    <div className="h-screen-content" id="profile" style={{ paddingBottom: 80 }}>
      <div style={{ padding: '36px 20px 0', maxWidth: 480, margin: '0 auto' }}>
        <PageHeader
          label="Perfil"
          title={name}
          subtitle={`${done.length} actividades · ${wishlist.length} guardadas`}
          onBack={onBack}
        />
      </div>

      <div className="prof-inner" style={{ maxWidth: 480, margin: '0 auto' }}>
        <div className="prof-card fade-in">
          <div className="prof-av">{name[0]?.toUpperCase() || '?'}</div>
          <div className="prof-name">{name}</div>
          <div className="prof-sub">{topG ? 'Fã de ' + topG[0] : 'Explorando gostos...'}</div>
          <div className="prof-stats">
            <div className="prof-stat">
              <div className="prof-stat-n">{done.length}</div>
              <div className="prof-stat-l">Feitas</div>
            </div>
            <div className="prof-stat">
              <div className="prof-stat-n">{wishlist.length}</div>
              <div className="prof-stat-l">Guardadas</div>
            </div>
            <div className="prof-stat">
              <div className="prof-stat-n">{Object.keys(tracking).length}</div>
              <div className="prof-stat-l">Tracking</div>
            </div>
          </div>
        </div>

        <div className="prof-section fade-in">
          <div className="prof-sec-lbl">Nome</div>
          <input
            className="prof-input"
            value={nameVal}
            onChange={e => setNameVal(e.target.value)}
            placeholder="O teu nome"
            maxLength={20}
          />
          <button className="prof-save btn-ghost-gold" onClick={saveName}>Guardar nome</button>
        </div>

        {/* Perfil público */}
        <div className="prof-section fade-in">
          <div className="prof-sec-lbl">Perfil público</div>

          {/* Username */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: 'var(--mu)', marginBottom: 8 }}>@username</div>
            {!usernameEditing ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  flex: 1, background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 10, padding: '10px 14px',
                  fontSize: 15, color: profile.username ? '#f5f1eb' : 'var(--mu)',
                }}>
                  {profile.username ? `@${profile.username}` : 'Sem username — adiciona um'}
                </div>
                <button
                  onClick={() => {
                    setUsernameEdit(profile.username || suggestUsername(profile.name || ''));
                    setUsernameEditing(true);
                  }}
                  style={{
                    background: 'rgba(200,155,60,0.15)', border: '1px solid rgba(200,155,60,0.3)',
                    borderRadius: 10, padding: '10px 14px', color: 'var(--ac)',
                    fontSize: 13, cursor: 'pointer',
                  }}
                >
                  Editar
                </button>
              </div>
            ) : (
              <div>
                <div style={{ position: 'relative', marginBottom: 8 }}>
                  <div style={{
                    position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                    color: 'var(--mu)', fontSize: 15, pointerEvents: 'none',
                  }}>@</div>
                  <input
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(200,155,60,0.4)',
                      borderRadius: 10, padding: '10px 14px 10px 30px',
                      color: '#f5f1eb', fontSize: 15, outline: 'none',
                      fontFamily: 'Outfit, sans-serif',
                    }}
                    value={usernameEdit}
                    autoFocus
                    maxLength={20}
                    onChange={e => setUsernameEdit(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  />
                </div>
                {usernameChecking && (
                  <div style={{ fontSize: 12, color: 'var(--mu)', marginBottom: 6 }}>A verificar…</div>
                )}
                {!usernameChecking && usernameAvailable === true && !usernameError && (
                  <div style={{ fontSize: 12, color: '#5ec97a', marginBottom: 6 }}>✓ Disponível</div>
                )}
                {usernameError && (
                  <div style={{ fontSize: 12, color: '#e07b7b', marginBottom: 6 }}>{usernameError}</div>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={async () => {
                      if (!usernameAvailable || usernameError) return;
                      if (userId) await saveUsername(userId, usernameEdit);
                      onUpdateProfile({ ...profile, username: usernameEdit });
                      setUsernameEditing(false);
                      onToast('✦ Username guardado');
                    }}
                    style={{
                      flex: 1, background: '#C89B3C', color: '#0B0D12',
                      border: 'none', borderRadius: 10, padding: '10px',
                      fontSize: 14, fontWeight: 600, cursor: 'pointer',
                      opacity: usernameAvailable ? 1 : 0.5,
                    }}
                  >
                    Guardar
                  </button>
                  <button
                    onClick={() => setUsernameEditing(false)}
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 10, padding: '10px 16px',
                      color: 'var(--mu)', fontSize: 14, cursor: 'pointer',
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Link de convite + QR */}
          {profile.username && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => {
                  const link = `https://what-to-zdka.vercel.app/?add=${profile.username}`;
                  if (navigator.share) {
                    navigator.share({ title: 'Adiciona-me no What to', url: link });
                  } else {
                    navigator.clipboard.writeText(link);
                    onToast('✦ Link copiado!');
                  }
                }}
                style={{
                  flex: 1, background: 'rgba(200,155,60,0.12)',
                  border: '1px solid rgba(200,155,60,0.25)',
                  borderRadius: 12, padding: '12px',
                  color: 'var(--ac)', fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: 6,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                  <polyline points="16 6 12 2 8 6"/>
                  <line x1="12" y1="2" x2="12" y2="15"/>
                </svg>
                Partilhar link
              </button>
              <button
                onClick={() => setShowQR(o => !o)}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 12, padding: '12px 16px',
                  color: 'var(--mu)', fontSize: 13, cursor: 'pointer',
                }}
              >
                QR
              </button>
            </div>
          )}

          {/* QR Code expandido */}
          {showQR && profile.username && (
            <div style={{
              marginTop: 16, padding: 20, background: '#fff',
              borderRadius: 16, display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 12,
            }}>
              <QRCodeSVG
                value={`https://what-to-zdka.vercel.app/?add=${profile.username}`}
                size={180}
                bgColor="#ffffff"
                fgColor="#0B0D12"
                level="M"
              />
              <div style={{ fontSize: 13, color: '#0B0D12', fontWeight: 600 }}>
                @{profile.username}
              </div>
            </div>
          )}
        </div>

        <div className="prof-section fade-in">
          <div className="prof-sec-lbl">As minhas plataformas</div>
          <div style={{ fontSize: 11, color: 'var(--mu)', marginBottom: 12, lineHeight: 1.6 }}>
            Sugestões filtradas ao que podes aceder. Deixa vazio para ver tudo.
          </div>
          {PLATFORM_SECTIONS.map(sec => (
            <div key={sec.label}>
              <div className="plat-section-lbl">{sec.label}</div>
              {sec.ids.map(id => {
                const p = ALL_PLATFORMS.find(x => x.id === id);
                if (!p) return null;
                return (
                  <button
                    key={p.id}
                    className={`plat-logo-btn${selectedPlats.includes(p.id) ? ' on' : ''}`}
                    onClick={() => togglePlat(p.id)}
                  >
                    <img src={p.icon} alt={p.n} className="plat-logo-img" onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                    <span className="plat-logo-name">{p.n}</span>
                    <span className="plat-logo-check">✓</span>
                  </button>
                );
              })}
            </div>
          ))}
          {blocked.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--mu)', marginBottom: 8 }}>Plataformas bloqueadas</div>
              {blocked.map(id => {
                const p = ALL_PLATFORMS.find(x => x.id === id);
                return p ? (
                  <span key={id} className="pref-chip">
                    {p.n}
                    <button onClick={() => unblockPlat(id)}>✕</button>
                  </span>
                ) : null;
              })}
            </div>
          )}
          <button className="prof-save" style={{ marginTop: 10 }} onClick={savePlatforms}>Guardar plataformas</button>
        </div>

        {activePrefs.length > 0 && (
          <div className="prof-section fade-in">
            <div className="prof-sec-lbl">Preferências activas</div>
            {activePrefs.map(([catId, p]) => {
              const cat = CATS.find(c => c.id === catId);
              return (
                <div key={catId} className="prof-row">
                  <span className="prof-row-l">{cat?.icon || ''} {cat?.name || catId}</span>
                  <div>
                    {Object.entries(p).map(([k, v]) => (
                      <span key={k} className="pref-chip">
                        {k}: {String(v)}
                        <button onClick={() => clearPref(catId, k)}>✕</button>
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="prof-section fade-in">
          <div className="prof-sec-lbl">Dados</div>
          <div className="prof-row">
            <span className="prof-row-l">Histórico</span>
            <span className="prof-row-r">{history.length} entradas</span>
          </div>
          <div className="prof-row">
            <span className="prof-row-l">Tracking</span>
            <span className="prof-row-r">{Object.keys(tracking).length} títulos</span>
          </div>
          <div className="prof-row">
            <span className="prof-row-l">Guardados</span>
            <span className="prof-row-r">{wishlist.length} itens</span>
          </div>
        </div>

        <div className="prof-section fade-in">
          <div className="prof-sec-lbl">Feed Social</div>
          <div style={{ fontSize: 11, color: 'var(--mu)', marginBottom: 14, lineHeight: 1.6 }}>
            Quando activo, as tuas acções (começar a ver, marcar para hoje) aparecem no feed de outros utilizadores.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--tx)', fontFamily: "'Outfit', sans-serif" }}>
                {feedPublic ? 'Feed público' : 'Feed privado'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--mu)', marginTop: 2 }}>
                {feedPublic ? 'As tuas acções são visíveis a outros' : 'As tuas acções são privadas'}
              </div>
            </div>
            <button
              onClick={handleFeedPrivacyToggle}
              style={{
                width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer',
                background: feedPublic ? 'rgba(200,155,60,0.6)' : 'rgba(156,165,185,0.2)',
                position: 'relative', transition: 'background 0.2s', flexShrink: 0,
              }}
            >
              <div style={{
                position: 'absolute', top: 3, left: feedPublic ? 25 : 3, width: 20, height: 20,
                borderRadius: '50%', background: feedPublic ? '#C89B3C' : 'rgba(156,165,185,0.5)',
                transition: 'left 0.2s, background 0.2s',
              }} />
            </button>
          </div>
        </div>

        {onLogout && (
          <button
            className="prof-save"
            style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(245,241,235,0.5)', borderRadius: 12, marginBottom: 8 }}
            onClick={onLogout}
          >
            Terminar sessão
          </button>
        )}

        <button
          className="prof-save"
          style={{ background: 'none', border: '1px solid var(--rd2)', color: 'var(--rd)', borderRadius: 12 }}
          onClick={handleClearAll}
        >
          🗑 Limpar todos os dados
        </button>

        <div className="prof-section fade-in">
          <div className="prof-sec-lbl">Preferências permanentes</div>
          <div style={{ fontSize: 11, color: 'var(--mu)', marginBottom: 14, lineHeight: 1.6 }}>
            Ficam sempre activas, independentemente do questionário de cada sessão.
          </div>

          {/* Alergias alimentares */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase' as const, color: 'var(--mu)', marginBottom: 8 }}>Alergias / restrições alimentares</div>
            <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6, marginBottom: 8 }}>
              {(['gluten', 'lactose', 'frutos secos', 'marisco', 'ovos', 'soja'] as const).map(a => {
                const active = permanentPrefs.foodAllergies.includes(a);
                return (
                  <button
                    key={a}
                    onClick={() => {
                      const updated = active
                        ? permanentPrefs.foodAllergies.filter(x => x !== a)
                        : [...permanentPrefs.foodAllergies, a];
                      onUpdatePermanentPrefs({ ...permanentPrefs, foodAllergies: updated });
                    }}
                    style={{ padding: '7px 14px', borderRadius: 50, fontSize: 12, fontFamily: "'Outfit', sans-serif", cursor: 'pointer', background: active ? 'rgba(224,112,112,0.12)' : 'rgba(255,255,255,0.04)', border: active ? '1px solid rgba(224,112,112,0.5)' : '1px solid rgba(255,255,255,0.1)', color: active ? 'var(--rd)' : 'var(--mu)', fontWeight: active ? 600 : 400 }}
                  >
                    {active ? '✕ ' : ''}{a}
                  </button>
                );
              })}
            </div>
            {permanentPrefs.foodAllergies.length > 0 && (
              <div style={{ fontSize: 11, color: 'var(--rd)', opacity: 0.8 }}>
                Sugestões com {permanentPrefs.foodAllergies.join(', ')} serão sempre filtradas
              </div>
            )}
          </div>

          {/* Língua preferida */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase' as const, color: 'var(--mu)', marginBottom: 8 }}>Língua do conteúdo</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {([['any', 'Qualquer'], ['pt', 'Português'], ['en', 'Inglês']] as [string, string][]).map(([v, l]) => (
                <button
                  key={v}
                  onClick={() => onUpdatePermanentPrefs({ ...permanentPrefs, preferredLanguage: v as 'pt' | 'en' | 'any' })}
                  style={{ flex: 1, padding: '9px', borderRadius: 10, fontSize: 12, fontFamily: "'Outfit', sans-serif", cursor: 'pointer', background: permanentPrefs.preferredLanguage === v ? 'rgba(200,155,60,0.12)' : 'rgba(255,255,255,0.04)', border: permanentPrefs.preferredLanguage === v ? '1px solid rgba(200,155,60,0.5)' : '1px solid rgba(255,255,255,0.1)', color: permanentPrefs.preferredLanguage === v ? 'var(--ac)' : 'var(--mu)', fontWeight: permanentPrefs.preferredLanguage === v ? 600 : 400 }}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="prof-section fade-in" style={{ marginTop: 16 }}>
          <div className="prof-sec-lbl">Preferências de categorias</div>
          <div style={{ fontSize: 11, color: 'var(--mu)', marginBottom: 12, lineHeight: 1.6 }}>
            Ao reconfigurar, o questionário de preferências volta a aparecer da próxima vez que abres a categoria.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {([
              { id: 'watch', label: 'Ver', fn: onResetWatchPrefs },
              { id: 'eat',   label: 'Comer', fn: onResetEatPrefs },
              { id: 'listen',label: 'Ouvir', fn: onResetListenPrefs },
              { id: 'read',  label: 'Ler', fn: onResetReadPrefs },
              { id: 'play',  label: 'Jogar', fn: onResetPlayPrefs },
              { id: 'learn', label: 'Aprender', fn: onResetLearnPrefs },
              { id: 'visit', label: 'Visitar', fn: onResetVisitPrefs },
              { id: 'do',    label: 'Fazer', fn: onResetDoPrefs },
            ] as { id: string; label: string; fn: () => void }[]).map(({ id, label, fn }) => (
              <button
                key={id}
                className="prof-save"
                style={{ fontSize: 12, padding: '10px 8px' }}
                onClick={() => { fn(); onToast(`Preferências de ${label} repostas`); }}
              >
                ↺ {label}
              </button>
            ))}
          </div>
        </div>

        {/* LOCALIZAÇÃO REAL */}
        <div className="prof-section fade-in">
          <div className="prof-sec-lbl">A Minha Localização</div>
          <div className="location-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ac)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--tx)' }}>Localização</div>
                <div style={{ fontSize: 12, color: '#8a94a8' }}>Sugestões perto de ti</div>
              </div>
            </div>

            <div style={{ fontSize: 13, color: 'var(--mu2)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 14px', marginBottom: 12 }}>
              📍 {profile.location?.label || 'Localização não definida'}
            </div>

            <div style={{ fontSize: 12, color: 'var(--mu)', marginBottom: 8 }}>
              Raio: {locationRadius} km
            </div>
            <input
              type="range"
              min={1}
              max={50}
              value={locationRadius}
              onChange={e => setLocationRadius(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--ac)', marginBottom: 12 }}
            />

            <button
              style={{ width: '100%', padding: '10px 0', background: 'none', border: '1px solid rgba(200,151,74,0.4)', borderRadius: 10, color: 'var(--ac)', fontSize: 13, fontFamily: "'Outfit', sans-serif", cursor: 'pointer' }}
              onClick={handleGetLocation}
            >
              {locLoading ? '⏳ A obter localização...' : '📍 Usar a minha localização'}
            </button>
          </div>
        </div>



        <div style={{ height: 8 }} />
      </div>
    </div>
  );
}
