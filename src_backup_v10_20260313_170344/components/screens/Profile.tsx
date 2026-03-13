import { useState } from 'react';
import type { Profile as ProfileType, HistoryEntry, TrackingMap, PrefsMap, WishlistEntry } from '../../types';
import { ALL_PLATFORMS, PLATFORM_SECTIONS, CATS } from '../../data';

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
  onToast: (msg: string) => void;
}

export default function Profile({
  profile, history, tracking, prefs, wishlist, isActive: _isActive,
  onBack, onUpdateProfile, onUpdatePrefs, onClearAll, onResetEatPrefs, onResetWatchPrefs, onToast
}: ProfileProps) {
  const [nameVal, setNameVal] = useState(profile.name || '');
  const [selectedPlats, setSelectedPlats] = useState<string[]>(profile.platforms || []);

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
      <div className="screen-header" style={{ paddingBottom: 12, maxWidth: 480, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div className="screen-title">{name}</div>
            <div className="screen-sub">{done.length} actividades · {wishlist.length} guardadas</div>
          </div>
          <button className="tbi" onClick={onBack} style={{ marginTop: 4 }}>←</button>
        </div>
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
          <button className="prof-save" onClick={saveName}>Guardar nome</button>
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

        <button
          className="prof-save"
          style={{ background: 'none', border: '1px solid var(--rd2)', color: 'var(--rd)', borderRadius: 12 }}
          onClick={handleClearAll}
        >
          🗑 Limpar todos os dados
        </button>

        <div className="prof-section fade-in" style={{ marginTop: 16 }}>
          <div className="prof-sec-lbl">Preferências de categorias</div>
          <div style={{ fontSize: 11, color: 'var(--mu)', marginBottom: 12, lineHeight: 1.6 }}>
            Repõe o assistente de configuração inicial.
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="prof-save" style={{ flex: 1 }} onClick={() => { onResetEatPrefs(); onToast('🍽️ Preferências de comer repostas'); }}>
              🍽️ Reconfigurar comer
            </button>
            <button className="prof-save" style={{ flex: 1 }} onClick={() => { onResetWatchPrefs(); onToast('🎬 Preferências de ver repostas'); }}>
              🎬 Reconfigurar ver
            </button>
          </div>
        </div>

        {/* BLOCO 9 — Localização */}
        <div className="prof-section fade-in">
          <div className="prof-sec-lbl">A Minha Localização</div>
          <div className="location-card">
            <div className="location-soon-badge">Em breve</div>
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
              📍 Lisboa, Portugal
            </div>
            <div style={{ fontSize: 12, color: 'var(--mu)', marginBottom: 4 }}>Raio: 5 km</div>
            <div className="location-slider">
              <div className="location-slider-fill" />
              <div className="location-slider-thumb" />
            </div>
            <button style={{ marginTop: 12, width: '100%', padding: '10px 0', background: 'none', border: '1px solid rgba(200,151,74,0.4)', borderRadius: 10, color: 'var(--ac)', fontSize: 13, fontFamily: "'Outfit', sans-serif", cursor: 'pointer' }}>
              Actualizar localização
            </button>
          </div>
        </div>

        {/* BLOCO 8 — Influencers */}
        <div className="prof-section fade-in">
          <div className="prof-sec-lbl">
            Criadores em Destaque
            <span className="pro-badge">PRO</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--mu)', marginBottom: 12, lineHeight: 1.6 }}>
            Sugestões curadas pelos teus criadores favoritos
          </div>
          <div className="influencer-section">
            {[
              { nome: 'Miguel Rodrigues', handle: '@miguelr', av: 'M', cor: '#c8974a', sugestao: 'Elden Ring', cat: 'Jogar' },
              { nome: 'Sofia Andrade', handle: '@sofiaа', av: 'S', cor: '#4a8c5c', sugestao: 'Pasta Carbonara', cat: 'Comer' },
              { nome: 'Tiago Lopes', handle: '@tiagol', av: 'T', cor: '#4a6a9a', sugestao: 'Dune: Part Two', cat: 'Ver' },
            ].map(inf => (
              <div key={inf.nome} className="influencer-card">
                <div className="influencer-av" style={{ background: inf.cor + '22', color: inf.cor, border: `1.5px solid ${inf.cor}55` }}>{inf.av}</div>
                <div className="influencer-info">
                  <div className="influencer-name">{inf.nome}</div>
                  <div className="influencer-handle">{inf.handle}</div>
                  <div style={{ marginTop: 4, fontSize: 12, color: 'var(--mu2)' }}>
                    Sugere: <strong style={{ color: 'var(--tx)' }}>{inf.sugestao}</strong>
                    {' '}<span className="influencer-badge">{inf.cat}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button style={{ width: '100%', padding: '12px 0', background: 'none', border: '1px solid rgba(200,151,74,0.35)', borderRadius: 12, color: 'var(--ac)', fontSize: 13, fontFamily: "'Outfit', sans-serif", cursor: 'pointer' }}>
            Em breve
          </button>
        </div>

        <div style={{ height: 8 }} />
      </div>
    </div>
  );
}
