import { useState } from 'react';
import type { Screen } from '../../types';

interface FriendsProps {
  isActive: boolean;
  onNav: (screen: Screen) => void;
  onToast: (msg: string) => void;
}

const MOCK_FRIENDS = [
  { initials: 'P', name: 'Pedro Santos', last: 'Ontem: The Bear', online: true, color: '#6ab4e0' },
  { initials: 'M', name: 'Maria Costa', last: 'Anteontem: Balatro', online: false, color: '#e87ac4' },
  { initials: 'J', name: 'João Ferreira', last: 'Há 3 dias: Severance', online: false, color: '#5ec97a' },
];

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

const MOCK_FEED = [
  { initials: 'P', name: 'Pedro', action: 'acabou The Bear', detail: '⭐ Recomenda', color: '#6ab4e0', time: '14m' },
  { initials: 'M', name: 'Maria', action: 'marcou Balatro para hoje', detail: '📅 Hoje à noite', color: '#e87ac4', time: '2h' },
  { initials: 'J', name: 'João', action: 'começou Severance', detail: '▶ A ver', color: '#5ec97a', time: '3h' },
];

export default function Friends({ isActive: _isActive, onNav, onToast }: FriendsProps) {
  const [search, setSearch] = useState('');

  const filteredFriends = MOCK_FRIENDS.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-screen-content" id="friends" style={{ paddingBottom: 80 }}>
      <div className="friends-inner">
        <div className="screen-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="screen-title">Amigos</div>
              <div className="screen-sub">{MOCK_FRIENDS.length} amigos · Feed ao vivo</div>
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
        <div className="friend-list">
          {filteredFriends.map((f, i) => (
            <div key={i} className="friend-item card-base">
              <div className="friend-avatar" style={{ background: f.color + '22', borderColor: f.color, color: f.color }}>
                {f.initials}
              </div>
              <div className="friend-info">
                <div className="friend-name">{f.name}</div>
                <div className="friend-last">{f.last}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {f.online && <span className="friend-online" />}
                <span className="friend-chevron">›</span>
              </div>
            </div>
          ))}
        </div>

        <div className="friends-section-lbl" style={{ marginTop: 20 }}>Importar contactos</div>
        <div className="import-grid">
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

        <div className="friends-section-lbl" style={{ marginTop: 20 }}>Feed dos Amigos</div>
        <div className="friends-feed">
          {MOCK_FEED.map((post, i) => (
            <div key={i} className="friend-feed-item card-base">
              <div className="feed-av-small" style={{ background: post.color + '22', borderColor: post.color, color: post.color }}>
                {post.initials}
              </div>
              <div className="friend-feed-info" style={{ flex: 1, minWidth: 0 }}>
                <div className="friend-feed-main">
                  <strong style={{ color: '#f5f1eb' }}>{post.name}</strong>{' '}
                  <span style={{ color: 'var(--mu)' }}>{post.action}</span>
                </div>
                <div className="friend-feed-detail">{post.detail}</div>
              </div>
              <span style={{ fontSize: 10, color: 'var(--mu)', flexShrink: 0, alignSelf: 'flex-start', paddingTop: 2 }}>{post.time}</span>
            </div>
          ))}
        </div>

        <div className="feed-coming-banner">
          <span>Em breve</span>
          <span className="feed-coming-sub">Cria conta para ver tudo</span>
        </div>

        <div style={{ height: 80 }} />
      </div>
    </div>
  );
}
