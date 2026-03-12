import type { Screen } from '../../types';

interface BottomNavProps {
  activeScreen: Screen;
  onNav: (screen: Screen) => void;
}

const NAV_ICONS: Record<string, React.ReactNode> = {
  home: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
      <path d="M9 21V12h6v9"/>
    </svg>
  ),
  checklist: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4"/>
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
    </svg>
  ),
  friends: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  'match-screen': (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  profile: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
};

const NAV_ITEMS = [
  { id: 'home' as Screen, label: 'Início' },
  { id: 'checklist' as Screen, label: 'Histórico' },
  { id: 'friends' as Screen, label: 'Amigos' },
  { id: 'match-screen' as Screen, label: 'Match' },
  { id: 'profile' as Screen, label: 'Perfil' },
];

export default function BottomNav({ activeScreen, onNav }: BottomNavProps) {
  return (
    <nav className="bnav">
      {NAV_ITEMS.map(item => (
        <button
          key={item.id}
          className={`bnav-item${activeScreen === item.id ? ' active' : ''}`}
          onClick={() => onNav(item.id)}
        >
          {NAV_ICONS[item.id]}
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
