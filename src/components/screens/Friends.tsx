import { useState } from 'react';
import type { Screen } from '../../types';

interface FriendsProps {
  isActive: boolean;
  onNav: (screen: Screen) => void;
  onToast: (msg: string) => void;
}

const IMPORT_BUTTONS = [
  {
    name: 'Instagram',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5"/>
        <circle cx="12" cy="12" r="4"/>
        <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/>
      </svg>
    ),
  },
  {
    name: 'WhatsApp',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
      </svg>
    ),
  },
  {
    name: 'Contactos',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    name: 'Facebook',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
      </svg>
    ),
  },
  {
    name: 'LinkedIn',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
        <rect x="2" y="9" width="4" height="12"/>
        <circle cx="4" cy="4" r="2"/>
      </svg>
    ),
  },
  {
    name: 'TikTok',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/>
      </svg>
    ),
  },
];

export default function Friends({ isActive: _isActive, onNav, onToast }: FriendsProps) {
  const [search, setSearch] = useState('');
  const [importOpen, setImportOpen] = useState(false);

  return (
    <div className="h-screen-content" id="friends" style={{ paddingBottom: 80 }}>
      <div className="friends-inner" style={{ maxWidth: 480, margin: '0 auto', padding: '0 20px' }}>
        <div className="screen-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontStyle: 'italic', fontWeight: 600, color: '#f5f1eb', lineHeight: 1.1 }}>Amigos</div>
              <div style={{ fontSize: 12, color: '#8a94a8', marginTop: 3 }}>0 amigos</div>
            </div>
            <button className="tbi" onClick={() => onNav('home')} style={{ marginTop: 4 }}>←</button>
          </div>
        </div>

        <div className="friends-search">
          <input
            type="text"
            placeholder="Pesquisar amigos..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="friends-section-lbl">Os meus amigos</div>

        {/* Empty state */}
        <div style={{
          textAlign: 'center', padding: '32px 20px',
          color: 'rgba(156,165,185,0.5)', fontSize: 13,
          fontFamily: "'Outfit', sans-serif", lineHeight: 1.6,
        }}>
          <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.4 }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'rgba(200,155,60,0.4)' }}>
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div style={{ color: 'rgba(245,241,235,0.6)', fontSize: 15, fontWeight: 500, marginBottom: 6 }}>
            Ainda não tens amigos na app
          </div>
          <div>Convida alguém para começar a partilhar o que estás a ver, jogar ou ouvir.</div>
        </div>

        <button
          onClick={() => setImportOpen(o => !o)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 12,
            padding: '14px 16px',
            cursor: 'pointer',
            marginTop: 16,
            fontFamily: "'Outfit', sans-serif",
          }}
        >
          <span style={{ fontSize: 13, color: '#8a94a8' }}>Importar contactos</span>
          <span style={{ fontSize: 16, color: '#8a94a8', transition: 'transform 0.2s', transform: importOpen ? 'rotate(90deg)' : 'none' }}>›</span>
        </button>
        {importOpen && (
          <div className="import-grid" style={{ marginTop: 8 }}>
            {IMPORT_BUTTONS.map(btn => (
              <button
                key={btn.name}
                className="import-btn"
                onClick={() => onToast('Brevemente — precisas de conta')}
              >
                <span className="import-btn-icon" style={{ color: 'rgba(255,255,255,0.55)', display: 'flex' }}>{btn.icon}</span>
                <span className="import-btn-name">{btn.name}</span>
              </button>
            ))}
          </div>
        )}

        <div style={{ height: 80 }} />
      </div>
    </div>
  );
}
