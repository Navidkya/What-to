import { useState, useRef, useEffect } from 'react';
import type { Profile } from '../../types';
import { ALL_PLATFORMS } from '../../data';

interface OnboardProps {
  profile: Profile;
  onFinish: (profile: Profile) => void;
}

export default function Onboard({ profile, onFinish }: OnboardProps) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState(profile.name || '');
  const [platforms, setPlatforms] = useState<string[]>(profile.platforms || []);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === 0) setTimeout(() => inputRef.current?.focus(), 100);
  }, [step]);

  const next = () => {
    if (step < 2) setStep(s => s + 1);
  };

  const skipAll = () => {
    onFinish({ ...profile, name: '', platforms: [], onboarded: true });
  };

  const finish = () => {
    onFinish({ ...profile, name, platforms, onboarded: true });
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
        {[0, 1, 2].map(i => (
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
              onKeyDown={e => { if (e.key === 'Enter') next(); }}
            />
            <button className="ob-btn" onClick={next}>Continuar →</button>
            <button className="ob-skip" onClick={skipAll}>saltar tudo</button>
          </>
        )}
        {step === 1 && (
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
        {step === 2 && (
          <>
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>✨</div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 700, marginBottom: 8 }}>
                Tudo pronto{name ? `, ${name}` : ''}!
              </div>
              <div style={{ fontSize: 13, color: 'var(--mu2)', lineHeight: 1.7, marginBottom: 24 }}>
                Sugestões personalizadas para ti. Sem decisões difíceis.
              </div>
            </div>
            <button className="ob-btn" onClick={finish}>Entrar na app →</button>
          </>
        )}
      </div>
    </div>
  );
}
