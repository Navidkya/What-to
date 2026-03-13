import { useRef } from 'react';

interface B2BProps {
  isActive: boolean;
  onBack: () => void;
  onToast: (msg: string) => void;
}

export default function B2B({ isActive, onBack, onToast }: B2BProps) {
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const typeRef = useRef<HTMLInputElement>(null);

  const submit = () => {
    const n = nameRef.current?.value;
    const e = emailRef.current?.value;
    if (!n || !e) { onToast('Preenche nome e email'); return; }
    onToast('✅ Recebido! Entramos em contacto.');
    if (nameRef.current) nameRef.current.value = '';
    if (emailRef.current) emailRef.current.value = '';
    if (typeRef.current) typeRef.current.value = '';
  };

  return (
    <div className={`screen${isActive ? ' active' : ''}`} id="b2b">
      <div className="tb mw">
        <button className="tbi" onClick={onBack}>←</button>
        <span className="tb-lbl">Para Empresas</span>
        <div style={{ width: 36 }} />
      </div>

      <div className="b2b-inner sc">
        <div className="b2b-hero fade-in">
          <div style={{ fontSize: 40, marginBottom: 10 }}>🏢</div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 700, marginBottom: 6 }}>
            Aparece no What to
          </div>
          <div style={{ fontSize: 12, color: 'var(--mu2)', lineHeight: 1.65 }}>
            O teu restaurante, bar, museu ou espaço pode aparecer nas sugestões de milhares de utilizadores que não sabem o que fazer hoje.
          </div>
        </div>

        <div className="b2b-plan fade-in">
          <div className="b2b-plan-info">
            <div className="b2b-plan-name">Listagem Básica</div>
            <div className="b2b-plan-desc">Perfil, morada, horário e link nas sugestões orgânicas.</div>
          </div>
          <div className="b2b-plan-price">Grátis</div>
        </div>

        <div className="b2b-plan ft fade-in">
          <div className="b2b-plan-info">
            <div className="b2b-plan-name">⭐ Destaque</div>
            <div className="b2b-plan-desc">Apareces mais vezes. Badge 'Recomendado'. Posição prioritária.</div>
          </div>
          <div className="b2b-plan-price">€50–200/mês</div>
        </div>

        <div className="b2b-plan fade-in">
          <div className="b2b-plan-info">
            <div className="b2b-plan-name">Patrocínio de Categoria</div>
            <div className="b2b-plan-desc">'What to Visit — powered by [marca]'. Integração premium.</div>
          </div>
          <div className="b2b-plan-price">€500+/mês</div>
        </div>

        <div className="b2b-form fade-in">
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 13 }}>Quero aparecer na app 👋</div>
          <input ref={nameRef} className="b2b-input" placeholder="Nome do negócio" type="text" />
          <input ref={emailRef} className="b2b-input" placeholder="Email de contacto" type="email" />
          <input ref={typeRef} className="b2b-input" placeholder="Tipo (restaurante, bar, museu...)" type="text" />
          <button className="b2b-submit" onClick={submit}>Enviar interesse</button>
        </div>
      </div>
    </div>
  );
}
