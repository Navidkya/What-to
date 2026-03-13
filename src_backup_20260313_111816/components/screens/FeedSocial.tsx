import type { Screen } from '../../types';

interface FeedSocialProps {
  isActive: boolean;
  onNav: (screen: Screen) => void;
}

const MOCK_POSTS = [
  {
    initials: 'P',
    name: 'Pedro',
    action: 'viu The Bear',
    time: 'há 2 horas',
    color: '#6ab4e0',
    content: 'The Bear',
    contentEmoji: '🍳',
    rating: 5,
    comment: 'Absolutamente brilhante. Uma das melhores séries dos últimos anos.',
  },
  {
    initials: 'M',
    name: 'Maria',
    action: 'marcou Balatro para hoje à noite',
    time: 'há 4 horas',
    color: '#e87ac4',
    content: 'Balatro',
    contentEmoji: '🃏',
    rating: 0,
    comment: '',
  },
  {
    initials: 'J',
    name: 'João',
    action: 'e Ana fizeram Match em Severance',
    time: 'ontem',
    color: '#5ec97a',
    content: 'Severance',
    contentEmoji: '🧠',
    rating: 4,
    comment: 'Incrível worldbuilding.',
  },
];

export default function FeedSocial({ isActive, onNav }: FeedSocialProps) {
  return (
    <div className={`screen${isActive ? ' active' : ''}`} id="feed">
      <div className="feed-inner sc">
        <div className="tb">
          <button className="tbi" onClick={() => onNav('home')}>←</button>
          <span className="tb-lbl">Feed Social</span>
          <div style={{ width: 36 }} />
        </div>

        <div className="feed-coming-top">
          <span>✦ Em breve</span>
          <span className="feed-coming-top-sub">O feed social está a chegar</span>
        </div>

        <div className="feed-posts">
          {MOCK_POSTS.map((post, i) => (
            <div key={i} className="feed-post">
              <div className="feed-post-header">
                <div className="feed-avatar" style={{ background: post.color + '22', borderColor: post.color, color: post.color }}>
                  {post.initials}
                </div>
                <div className="feed-post-meta">
                  <div className="feed-post-who">
                    <strong>{post.name}</strong> {post.action}
                  </div>
                  <div className="feed-post-time">{post.time}</div>
                </div>
              </div>

              <div className="feed-post-card">
                <span className="feed-post-card-em">{post.contentEmoji}</span>
                <div className="feed-post-card-info">
                  <div className="feed-post-card-title">{post.content}</div>
                  {post.rating > 0 && (
                    <div className="feed-post-stars">
                      {'⭐'.repeat(post.rating)}
                    </div>
                  )}
                  {post.comment && (
                    <div className="feed-post-comment">"{post.comment}"</div>
                  )}
                </div>
              </div>

              <div className="feed-post-actions">
                <button className="feed-like-btn">♡ Gosto</button>
              </div>
            </div>
          ))}
        </div>

        <div className="feed-account-banner">
          <div className="feed-account-banner-icon">👥</div>
          <div className="feed-account-banner-text">
            Cria conta para ver o feed dos teus amigos
          </div>
          <button className="feed-account-banner-btn" onClick={() => onNav('profile')}>
            Criar conta
          </button>
        </div>

        <div style={{ height: 80 }} />
      </div>
    </div>
  );
}
