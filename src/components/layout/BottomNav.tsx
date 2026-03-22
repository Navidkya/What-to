import type { Screen } from '../../types';
interface BottomNavProps {
  activeScreen: Screen;
  onNav: (screen: Screen) => void;
}
const NAV_ITEMS: { id: Screen; icon: React.ReactNode }[] = [
  {
    id: 'home',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg>,
  },
  {
    id: 'feed',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"><path d="M4 11a9 9 0 0 1 9 9"/><path d="M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1" fill="currentColor" stroke="none"/></svg>,
  },
  {
    id: 'friends',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  },
  {
    id: 'match-screen',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  },
  {
    id: 'lista',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>,
  },
  {
    id: 'checklist',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
  },
  {
    id: 'profile',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  },
];
export default function BottomNav({ activeScreen, onNav }: BottomNavProps) {
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'space-around',
      padding: '10px 4px 14px',
      background: 'rgba(6,8,16,0.92)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(255,255,255,0.06)',
    }}>
      {NAV_ITEMS.map(item => {
        const isActive = activeScreen === item.id ||
          (item.id === 'home' && activeScreen === 'para-ti') ||
          (item.id === 'match-screen' && activeScreen === 'plan');
        return (
          <button
            key={item.id}
            onClick={() => onNav(item.id)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '6px 8px', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: isActive ? '#C89B3C' : 'rgba(156,165,185,0.45)',
              filter: isActive ? 'drop-shadow(0 0 8px rgba(200,155,60,0.5))' : 'none',
              transition: 'all 0.2s',
              flexShrink: 0,
            }}
          >
            {item.icon}
          </button>
        );
      })}
    </nav>
  );
}
