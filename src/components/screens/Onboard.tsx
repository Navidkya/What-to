import { useState, useRef, useEffect } from 'react';
import type { Profile } from '../../types';
import { ALL_PLATFORMS } from '../../data';
import { suggestUsername, validateUsername, checkUsernameAvailable, saveUsername } from '../../services/username';

interface OnboardProps {
  profile: Profile;
  onFinish: (profile: Profile) => void;
  userId?: string;
}

export default function Onboard({ profile, onFinish, userId: _userId }: OnboardProps) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState(profile.name || '');
  const [platforms, setPlatforms] = useState<string[]>(profile.platforms || []);
  const inputRef = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [userId, setUserId] = useState<string | undefined>(undefined);

  useEffect(() => {
    setUserId(_userId);
  }, [_userId]);

  useEffect(() => {
    if (step === 0) setTimeout(() => inputRef.current?.focus(), 100);
  }, [step]);

  // Verifica username com debounce
  useEffect(() => {
    const err = validateUsername(username);
    if (err) { setUsernameError(err); setUsernameAvailable(null); return; }
    setUsernameError('');
    setUsernameChecking(true);
    const timer = setTimeout(async () => {
      const available = await checkUsernameAvailable(username, userId);
      setUsernameAvailable(available);
      setUsernameChecking(false);
      if (!available) setUsernameError('Username já está a ser usado');
    }, 500);
    return () => clearTimeout(timer);
  }, [username, userId]);

  const next = () => {
    if (step < 3) setStep(s => s + 1);
  };

  const skipAll = () => {
    onFinish({ ...profile, name: '', platforms: [], onboarded: true });
  };

  const handleNameNext = () => {
    if (name.trim()) {
      setUsername(suggestUsername(name.trim()));
    }
    next();
  };

  const togglePlatform = (id: string) => {
    setPlatforms(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  return (
    <div className="screen active" id="onboard">
      <div className="ob-logo">What <em>to</em></div>
      <div className="ob-sub">decide less · live more</div>
      <div className="ob-steps">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`ob-step${i <= step ? ' on' : ''}`} />
        ))}
      </div>
      <div style={{ width: '100%', maxWidth: 380, padding: '0 28px' }}>

        {step === 0 && (
          <>
            <div className="ob-label">Como te chamas?</div>
            <input
              ref={inputRef}
              className="ob-input"
              placeholder="O teu nome"
              type="text"
              maxLength={20}
              autoComplete="off"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleNameNext(); }}
            />
            <button className="ob-btn" onClick={handleNameNext}>Continuar →</button>
            <button className="ob-skip" onClick={skipAll}>saltar tudo</button>
          </>
        )}

        {step === 1 && (
          <>
            <div className="ob-label">Escolhe o teu @username</div>
            <div style={{ fontSize: 11, color: 'var(--mu)', textAlign: 'center', marginBottom: 14, lineHeight: 1.6 }}>
              Os teus amigos vão usar isto para te encontrar na app.
            </div>
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
                color: 'var(--mu)', fontSize: 16, pointerEvents: 'none',
              }}>@</div>
              <input
                className="ob-input"
                style={{ paddingLeft: 32 }}
                placeholder="username"
                type="text"
                maxLength={20}
                autoComplete="off"
                value={username}
                onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                onKeyDown={e => { if (e.key === 'Enter' && usernameAvailable) next(); }}
              />
            </div>
            {usernameChecking && (
              <div style={{ fontSize: 12, color: 'var(--mu)', textAlign: 'center', marginTop: 6 }}>
                A verificar…
              </div>
            )}
            {!usernameChecking && usernameAvailable === true && !usernameError && (
              <div style={{ fontSize: 12, color: '#5ec97a', textAlign: 'center', marginTop: 6 }}>
                ✓ @{username} está disponível
              </div>
            )}
            {usernameError && (
              <div style={{ fontSize: 12, color: '#e07b7b', textAlign: 'center', marginTop: 6 }}>
                {usernameError}
              </div>
            )}
            <button
              className="ob-btn"
              style={{ opacity: usernameAvailable ? 1 : 0.5 }}
              onClick={() => { if (usernameAvailable) next(); }}
            >
              Continuar →
            </button>
            <button className="ob-skip" onClick={next}>saltar por agora</button>
          </>
        )}

        {step === 2 && (
          <>
            <div className="ob-label">Que plataformas tens?</div>
            <div style={{ fontSize: 11, color: 'var(--mu)', textAlign: 'center', marginBottom: 14, lineHeight: 1.6 }}>
              Assim só te sugerimos o que podes ver/jogar. Podes alterar depois no perfil.
            </div>
            <div className="plat-grid">
              {ALL_PLATFORMS.map(p => (
                <button
                  key={p.id}
                  className={`plat-btn${platforms.includes(p.id) ? ' on' : ''}`}
                  onClick={() => togglePlatform(p.id)}
                >
                  <div className="pb-dot" style={{ background: p.c }} />
                  <div className="pb-name">{p.n}</div>
                  <div className="pb-check">✓</div>
                </button>
              ))}
            </div>
            <button className="ob-btn" onClick={next}>Continuar →</button>
            <button className="ob-skip" onClick={next}>saltar — mostrar tudo</button>
          </>
        )}

        {step === 3 && (
          <>
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>✨</div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26,
                fontWeight: 700, marginBottom: 8 }}>
                Tudo pronto{name ? `, ${name}` : ''}!
              </div>
              <div style={{ fontSize: 13, color: 'var(--mu2)', lineHeight: 1.7, marginBottom: 24 }}>
                Sugestões personalizadas para ti. Sem decisões difíceis.
              </div>
            </div>
            <button className="ob-btn" onClick={async () => {
              // Guarda username no Supabase se foi escolhido
              if (username && usernameAvailable && userId) {
                await saveUsername(userId, username);
              }
              onFinish({ ...profile, name, platforms, onboarded: true, username: username || undefined });
            }}>
              Entrar na app →
            </button>
          </>
        )}

      </div>
    </div>
  );
}
