import { useState } from 'react';
import { signInWithGoogle, signInWithEmail, signUpWithEmail } from '../../services/auth';
import { verifyInviteCode, activateInviteCode } from '../../services/influencers';
import { supabase } from '../../lib/supabase';

interface Props {
  onSuccess: () => void;
  onToast: (msg: string) => void;
  onCreatorLogin?: () => void;
}

type Submode = null | 'creator-login' | 'creator-apply';

export default function AuthScreen({ onSuccess: _onSuccess, onToast, onCreatorLogin }: Props) {
  const [portal, setPortal] = useState<'user' | 'creator'>('user');
  const [submode, setSubmode] = useState<Submode>(null);

  // User login state
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  // Creator login state
  const [creatorEmail, setCreatorEmail] = useState('');
  const [creatorPassword, setCreatorPassword] = useState('');
  const [creatorPasswordConfirm, setCreatorPasswordConfirm] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [creatorStep, setCreatorStep] = useState<'code' | 'register' | 'login'>('code');
  const [verifiedCode, setVerifiedCode] = useState<{ tier: string; name: string; handle: string; platform: string } | null>(null);

  // Creator apply state
  const [applyName, setApplyName] = useState('');
  const [applyHandle, setApplyHandle] = useState('');
  const [applyMessage, setApplyMessage] = useState('');

  const handleEmail = async () => {
    if (!email.trim() || !password.trim()) { onToast('Preenche email e password'); return; }
    if (mode === 'register' && !name.trim()) { onToast('Escreve o teu nome'); return; }
    setLoading(true);
    try {
      if (mode === 'login') {
        await signInWithEmail(email, password);
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
    } catch {
      onToast('Erro ao entrar com Google');
      setLoading(false);
    }
  };

  const resetCreatorFlow = () => {
    setCreatorStep('code');
    setVerifiedCode(null);
    setInviteCode('');
    setCreatorEmail('');
    setCreatorPassword('');
    setCreatorPasswordConfirm('');
  };

  const handleVerifyCode = async () => {
    if (!inviteCode.trim()) { onToast('Insere o código de convite'); return; }
    setLoading(true);
    try {
      const check = await verifyInviteCode(inviteCode);
      if (!check.ok) { onToast(check.error || 'Código inválido'); return; }
      setVerifiedCode({ tier: check.tier!, name: check.name!, handle: check.handle!, platform: check.platform || 'instagram' });
      setCreatorStep('register');
    } catch {
      onToast('Erro ao verificar código');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatorRegister = async () => {
    if (!creatorEmail.trim()) { onToast('Preenche o email'); return; }
    if (creatorPassword.length < 6) { onToast('Password com mínimo 6 caracteres'); return; }
    if (creatorPassword !== creatorPasswordConfirm) { onToast('As passwords não coincidem'); return; }
    setLoading(true);
    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: creatorEmail,
        password: creatorPassword,
        options: { data: { full_name: verifiedCode!.name } },
      });
      if (signUpError) {
        onToast('Este email já tem conta. Usa a opção Entrar.');
        return;
      }
      const userId = signUpData.user?.id;
      if (userId) {
        await activateInviteCode(inviteCode, userId, verifiedCode!.tier as 'base' | 'silver' | 'gold', verifiedCode!.name, verifiedCode!.handle, verifiedCode!.platform);
      }
      onToast('✦ Conta criada! Bem-vindo ao programa de criadores.');
      onCreatorLogin?.();
    } catch {
      onToast('Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatorLoginStep = async () => {
    if (!creatorEmail.trim() || !creatorPassword.trim()) { onToast('Preenche email e password'); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: creatorEmail, password: creatorPassword });
      if (error) { onToast('Email ou password incorrectos'); return; }
      onCreatorLogin?.();
    } catch {
      onToast('Erro ao autenticar');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatorApply = () => {
    if (!applyName.trim() || !applyHandle.trim()) { onToast('Preenche o nome e o link/handle'); return; }
    try {
      const existing = JSON.parse(localStorage.getItem('wt_creator_applications') || '[]') as unknown[];
      existing.push({ name: applyName, handle: applyHandle, message: applyMessage, submittedAt: new Date().toISOString() });
      localStorage.setItem('wt_creator_applications', JSON.stringify(existing));
    } catch {}
    onToast('✓ Candidatura enviada! Entraremos em contacto.');
    setApplyName('');
    setApplyHandle('');
    setApplyMessage('');
    setSubmode(null);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '13px 16px', borderRadius: 12,
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    color: '#f5f1eb', fontFamily: "'Outfit', sans-serif", fontSize: 14,
    outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'radial-gradient(ellipse at 5% 0%, rgba(70,40,10,0.5) 0%, transparent 35%), radial-gradient(ellipse at 95% 0%, rgba(45,15,75,0.45) 0%, transparent 35%), #0B0D12',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '0 28px', zIndex: 1000, overflowY: 'auto',
    }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 64, fontWeight: 700, letterSpacing: -2, lineHeight: 1, color: '#f5f1eb' }}>
          what<em style={{ color: '#C89B3C' }}>to</em>
        </div>
        <div style={{ fontSize: 11, letterSpacing: 4, textTransform: 'uppercase', color: 'rgba(156,165,185,0.7)', marginTop: 8 }}>
          decide less. live more.
        </div>
      </div>

      <div style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* Toggle */}
        <div className="creator-toggle">
          <button
            className={`creator-toggle-btn ${portal === 'user' ? 'active' : 'inactive'}`}
            onClick={() => { setPortal('user'); setSubmode(null); }}
          >
            Entrar na app
          </button>
          <button
            className={`creator-toggle-btn ${portal === 'creator' ? 'active' : 'inactive'}`}
            onClick={() => { setPortal('creator'); setSubmode(null); }}
          >
            Criadores ✦
          </button>
        </div>

        {/* ── User portal ── */}
        {portal === 'user' && (
          <>
            <button
              onClick={handleGoogle}
              disabled={loading}
              style={{ width: '100%', padding: '14px', borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#f5f1eb', fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
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
              <input value={name} onChange={e => setName(e.target.value)} placeholder="O teu nome" style={inputStyle} />
            )}
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" style={inputStyle} />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" onKeyDown={e => { if (e.key === 'Enter') handleEmail(); }} style={inputStyle} />

            <button onClick={handleEmail} disabled={loading} style={{ width: '100%', padding: '14px', borderRadius: 14, background: 'linear-gradient(135deg, #C89B3C, #a87535)', border: 'none', color: '#0B0D12', fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 700, cursor: 'pointer', marginTop: 4, opacity: loading ? 0.7 : 1 }}>
              {loading ? '...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
            </button>

            <button onClick={() => setMode(m => m === 'login' ? 'register' : 'login')} style={{ background: 'none', border: 'none', color: 'rgba(156,165,185,0.7)', fontFamily: "'Outfit', sans-serif", fontSize: 12, cursor: 'pointer', padding: '8px 0', textAlign: 'center' }}>
              {mode === 'login' ? 'Ainda não tens conta? Criar conta' : 'Já tens conta? Entrar'}
            </button>
          </>
        )}

        {/* ── Creator portal ── */}
        {portal === 'creator' && submode === null && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
            <div style={{ textAlign: 'center', marginBottom: 4 }}>
              <div style={{ fontSize: 13, color: 'rgba(156,165,185,0.6)', lineHeight: 1.5 }}>
                Área exclusiva para criadores de conteúdo e parceiros.
              </div>
            </div>
            <button
              onClick={() => { resetCreatorFlow(); setSubmode('creator-login'); }}
              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px', background: 'rgba(200,155,60,0.08)', border: '1px solid rgba(200,155,60,0.25)', borderRadius: 16, cursor: 'pointer', textAlign: 'left' }}
            >
              <span style={{ fontSize: 24 }}>🔑</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ac)', fontFamily: "'Outfit',sans-serif" }}>Já tenho acesso</div>
                <div style={{ fontSize: 11, color: 'var(--mu)', marginTop: 2 }}>Entrar no painel de criador</div>
              </div>
            </button>
            <button
              onClick={() => setSubmode('creator-apply')}
              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 16, cursor: 'pointer', textAlign: 'left' }}
            >
              <span style={{ fontSize: 24 }}>✨</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#f5f1eb', fontFamily: "'Outfit',sans-serif" }}>Candidatar-me</div>
                <div style={{ fontSize: 11, color: 'var(--mu)', marginTop: 2 }}>Pedir acesso ao programa de criadores</div>
              </div>
            </button>
          </div>
        )}

        {/* ── Creator login ── */}
        {portal === 'creator' && submode === 'creator-login' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

            {/* PASSO 1 — código */}
            {creatorStep === 'code' && (
              <>
                <div style={{ fontSize: 13, color: 'var(--mu)', marginBottom: 4 }}>Acesso de criador · Código de convite</div>
                <input
                  value={inviteCode}
                  onChange={e => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="Código de convite (ex: MARIA-GOLD-WT24)"
                  onKeyDown={e => { if (e.key === 'Enter') handleVerifyCode(); }}
                  style={{ ...inputStyle, fontFamily: 'monospace', letterSpacing: 1 }}
                />
                <button onClick={handleVerifyCode} disabled={loading} style={{ width: '100%', padding: '14px', borderRadius: 14, background: 'linear-gradient(135deg,#C89B3C,#a87535)', border: 'none', color: '#0B0D12', fontFamily: "'Outfit',sans-serif", fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
                  {loading ? '...' : 'Verificar código'}
                </button>
                <button onClick={() => setCreatorStep('login')} style={{ background: 'none', border: 'none', color: 'var(--mu)', fontFamily: "'Outfit',sans-serif", fontSize: 12, cursor: 'pointer', padding: '6px 0', textAlign: 'center' }}>
                  Já tenho conta? Entrar →
                </button>
                <button onClick={() => setSubmode(null)} style={{ background: 'none', border: 'none', color: 'rgba(156,165,185,0.4)', fontFamily: "'Outfit',sans-serif", fontSize: 12, cursor: 'pointer', padding: '2px 0', textAlign: 'center' }}>
                  ← voltar
                </button>
              </>
            )}

            {/* PASSO 2 — registo */}
            {creatorStep === 'register' && verifiedCode && (
              <>
                <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
                  <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, fontWeight: 700, fontStyle: 'italic', color: '#C89B3C' }}>
                    Bem-vindo, {verifiedCode.name}!
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--mu)', marginTop: 4, letterSpacing: 1, textTransform: 'uppercase' }}>
                    Tier {verifiedCode.tier} · {verifiedCode.platform}
                  </div>
                </div>
                <input type="email" value={creatorEmail} onChange={e => setCreatorEmail(e.target.value)} placeholder="Email" style={inputStyle} />
                <input type="password" value={creatorPassword} onChange={e => setCreatorPassword(e.target.value)} placeholder="Password (mín. 6 caracteres)" style={inputStyle} />
                <input type="password" value={creatorPasswordConfirm} onChange={e => setCreatorPasswordConfirm(e.target.value)} placeholder="Confirmar password" onKeyDown={e => { if (e.key === 'Enter') handleCreatorRegister(); }} style={inputStyle} />
                <button onClick={handleCreatorRegister} disabled={loading} style={{ width: '100%', padding: '14px', borderRadius: 14, background: 'linear-gradient(135deg,#C89B3C,#a87535)', border: 'none', color: '#0B0D12', fontFamily: "'Outfit',sans-serif", fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
                  {loading ? '...' : 'Criar conta e entrar'}
                </button>
                <button onClick={() => setCreatorStep('code')} style={{ background: 'none', border: 'none', color: 'var(--mu)', fontFamily: "'Outfit',sans-serif", fontSize: 12, cursor: 'pointer', padding: '6px 0', textAlign: 'center' }}>
                  ← voltar
                </button>
              </>
            )}

            {/* PASSO 3 — login */}
            {creatorStep === 'login' && (
              <>
                <div style={{ fontSize: 13, color: 'var(--mu)', marginBottom: 4 }}>Acesso de criador · Entrar</div>
                <input type="email" value={creatorEmail} onChange={e => setCreatorEmail(e.target.value)} placeholder="Email" style={inputStyle} />
                <input type="password" value={creatorPassword} onChange={e => setCreatorPassword(e.target.value)} placeholder="Password" onKeyDown={e => { if (e.key === 'Enter') handleCreatorLoginStep(); }} style={inputStyle} />
                <button onClick={handleCreatorLoginStep} disabled={loading} style={{ width: '100%', padding: '14px', borderRadius: 14, background: 'linear-gradient(135deg,#C89B3C,#a87535)', border: 'none', color: '#0B0D12', fontFamily: "'Outfit',sans-serif", fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
                  {loading ? '...' : 'Entrar no painel'}
                </button>
                <button onClick={() => setCreatorStep('code')} style={{ background: 'none', border: 'none', color: 'var(--mu)', fontFamily: "'Outfit',sans-serif", fontSize: 12, cursor: 'pointer', padding: '6px 0', textAlign: 'center' }}>
                  ← voltar
                </button>
              </>
            )}

          </div>
        )}

        {/* ── Creator apply ── */}
        {portal === 'creator' && submode === 'creator-apply' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 13, color: 'var(--mu)', marginBottom: 4 }}>Candidatura de criador</div>
            <input value={applyName} onChange={e => setApplyName(e.target.value)} placeholder="O teu nome" style={inputStyle} />
            <input value={applyHandle} onChange={e => setApplyHandle(e.target.value)} placeholder="Link ou handle (Instagram, TikTok, YouTube...)" style={inputStyle} />
            <textarea
              value={applyMessage}
              onChange={e => setApplyMessage(e.target.value)}
              placeholder="Mensagem opcional — apresenta-te!"
              rows={3}
              style={{ ...inputStyle, resize: 'none', lineHeight: 1.5 }}
            />
            <button onClick={handleCreatorApply} style={{ width: '100%', padding: '14px', borderRadius: 14, background: 'linear-gradient(135deg,#C89B3C,#a87535)', border: 'none', color: '#0B0D12', fontFamily: "'Outfit',sans-serif", fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              Enviar candidatura
            </button>
            <button onClick={() => setSubmode(null)} style={{ background: 'none', border: 'none', color: 'var(--mu)', fontFamily: "'Outfit',sans-serif", fontSize: 12, cursor: 'pointer', padding: '6px 0', textAlign: 'center' }}>
              ← voltar
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
