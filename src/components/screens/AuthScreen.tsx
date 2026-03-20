import { useState } from 'react';
import { signInWithGoogle, signInWithEmail, signUpWithEmail } from '../../services/auth';

interface Props {
  onSuccess: () => void;
  onToast: (msg: string) => void;
}

export default function AuthScreen({ onSuccess: _onSuccess, onToast }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmail = async () => {
    if (!email.trim() || !password.trim()) { onToast('Preenche email e password'); return; }
    if (mode === 'register' && !name.trim()) { onToast('Escreve o teu nome'); return; }
    setLoading(true);
    try {
      if (mode === 'login') {
        await signInWithEmail(email, password);
        // onSuccess chamado pelo listener de auth no App
      } else {
        await signUpWithEmail(email, password, name);
        onToast('✓ Conta criada! Verifica o teu email.');
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao autenticar';
      onToast(msg.includes('Invalid') ? 'Email ou password incorrectos' : msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      // redirect automático — o onSuccess é chamado pelo listener de auth no App
    } catch {
      onToast('Erro ao entrar com Google');
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'radial-gradient(ellipse at 5% 0%, rgba(70,40,10,0.5) 0%, transparent 35%), radial-gradient(ellipse at 95% 0%, rgba(45,15,75,0.45) 0%, transparent 35%), #0B0D12',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '0 28px', zIndex: 1000,
    }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 64, fontWeight: 700, letterSpacing: -2, lineHeight: 1, color: '#f5f1eb' }}>
          what<em style={{ color: '#C89B3C' }}>to</em>
        </div>
        <div style={{ fontSize: 11, letterSpacing: 4, textTransform: 'uppercase', color: 'rgba(156,165,185,0.7)', marginTop: 8 }}>
          decide less. live more.
        </div>
      </div>

      {/* Form */}
      <div style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* Google */}
        <button
          onClick={handleGoogle}
          disabled={loading}
          style={{ width: '100%', padding: '14px', borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#f5f1eb', fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'background 0.2s' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Entrar com Google
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
          <span style={{ fontSize: 11, color: 'rgba(156,165,185,0.5)', letterSpacing: 1 }}>ou</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
        </div>

        {mode === 'register' && (
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="O teu nome"
            style={{ width: '100%', padding: '13px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#f5f1eb', fontFamily: "'Outfit', sans-serif", fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
          />
        )}

        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Email"
          style={{ width: '100%', padding: '13px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#f5f1eb', fontFamily: "'Outfit', sans-serif", fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
        />

        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Password"
          onKeyDown={e => { if (e.key === 'Enter') handleEmail(); }}
          style={{ width: '100%', padding: '13px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#f5f1eb', fontFamily: "'Outfit', sans-serif", fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
        />

        <button
          onClick={handleEmail}
          disabled={loading}
          style={{ width: '100%', padding: '14px', borderRadius: 14, background: 'linear-gradient(135deg, #C89B3C, #a87535)', border: 'none', color: '#0B0D12', fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 700, cursor: 'pointer', marginTop: 4, opacity: loading ? 0.7 : 1 }}
        >
          {loading ? '...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
        </button>

        <button
          onClick={() => setMode(m => m === 'login' ? 'register' : 'login')}
          style={{ background: 'none', border: 'none', color: 'rgba(156,165,185,0.7)', fontFamily: "'Outfit', sans-serif", fontSize: 12, cursor: 'pointer', padding: '8px 0', textAlign: 'center' }}
        >
          {mode === 'login' ? 'Ainda não tens conta? Criar conta' : 'Já tens conta? Entrar'}
        </button>
      </div>
    </div>
  );
}
