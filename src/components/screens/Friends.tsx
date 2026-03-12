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
  { icon: '📸', name: 'Instagram' },
  { icon: '💬', name: 'WhatsApp' },
  { icon: '📞', name: 'Contactos' },
  { icon: '👥', name: 'Facebook' },
  { icon: '💼', name: 'LinkedIn' },
  { icon: '🎵', name: 'TikTok' },
];

const MOCK_FEED = [
  { initials: 'P', name: 'Pedro', action: 'acabou The Bear', detail: '⭐ Recomenda', color: '#6ab4e0' },
  { initials: 'M', name: 'Maria', action: 'marcou Balatro para hoje', detail: '📅 Hoje à noite', color: '#e87ac4' },
  { initials: 'J', name: 'João', action: 'começou Severance', detail: '▶ A ver', color: '#5ec97a' },
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
            <div key={i} className="friend-item">
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
              <span className="import-btn-icon">{btn.icon}</span>
              <span className="import-btn-name">{btn.name}</span>
            </button>
          ))}
        </div>

        <div className="friends-section-lbl" style={{ marginTop: 20 }}>Feed dos Amigos</div>
        <div className="friends-feed">
          {MOCK_FEED.map((post, i) => (
            <div key={i} className="friend-feed-item">
              <div className="feed-av-small" style={{ background: post.color + '22', borderColor: post.color, color: post.color }}>
                {post.initials}
              </div>
              <div className="friend-feed-info">
                <div className="friend-feed-main">
                  <strong>{post.name}</strong> {post.action}
                </div>
                <div className="friend-feed-detail">{post.detail}</div>
              </div>
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
