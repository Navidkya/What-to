import type { Screen } from '../../types';

interface BottomNavProps {
  activeScreen: Screen;
  onNav: (screen: Screen) => void;
}

const NAV_ICONS: Record<string, React.ReactNode> = {
  home: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
      <path d="M9 21V12h6v9"/>
    </svg>
  ),
  checklist: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 6v6l4 2"/>
    </svg>
  ),
  lista: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  friends: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  'match-screen': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  profile: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
};

const NAV_ITEMS = [
  { id: 'home' as Screen, label: 'Início' },
  { id: 'checklist' as Screen, label: 'Histórico' },
  { id: 'lista' as Screen, label: 'Lista' },
  { id: 'friends' as Screen, label: 'Amigos' },
  { id: 'match-screen' as Screen, label: 'Match' },
  { id: 'profile' as Screen, label: 'Perfil' },
];

export default function BottomNav({ activeScreen, onNav }: BottomNavProps) {
  return (
    <nav className="bnav">
      {NAV_ITEMS.map(item => {
        const isActive = activeScreen === item.id;
        return (
          <button
            key={item.id}
            className={`bnav-item${isActive ? ' active bnav-btn on' : ' bnav-btn'}`}
            onClick={() => onNav(item.id)}
            style={{ padding: '8px 2px 6px', minWidth: 0 }}
          >
            <span className={isActive ? 'bn-l' : ''}>
              {NAV_ICONS[item.id]}
            </span>
            <span style={{ fontSize: 9, letterSpacing: 0.2 }}>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
