'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/member-logout', { method: 'POST' });
    router.push('/member/login');
    router.refresh();
  };

  const navItems = [
    { name: 'Accueil', path: '/member', icon: '🏠' },
    { name: 'Cotisations', path: '/member/contributions', icon: '💰' },
    { name: 'Carte', path: '/member/card', icon: '💳' },
    { name: 'Messages', path: '/member/messages', icon: '✉️' },
    { name: 'Événements', path: '/member/events', icon: '📅' },
  ];

  return (
    <>
      <style>{`
        .member-shell {
          display: flex;
          flex-direction: column;
          min-height: 100dvh;
          background-color: #f9fafb;
        }
        .member-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.5rem;
          background-color: #ffffff;
          border-bottom: 1px solid #e5e7eb;
          position: sticky;
          top: 0;
          z-index: 40;
        }
        .member-brand {
          font-weight: 700;
          font-size: 1.25rem;
          color: #111827;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .member-brand span {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 2rem;
          height: 2rem;
          background-color: #111827;
          color: white;
          border-radius: 0.5rem;
          font-size: 1rem;
        }
        .logout-btn {
          background: none;
          border: none;
          color: #ef4444;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }
        .logout-btn:hover {
          text-decoration: underline;
        }
        .member-content-area {
          flex: 1;
          padding: 1.5rem 1rem 6rem 1rem;
          width: 100%;
          max-width: 800px;
          margin: 0 auto;
        }
        .member-bottom-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background-color: #ffffff;
          border-top: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-around;
          padding: 0.5rem 0;
          z-index: 40;
          padding-bottom: calc(0.5rem + env(safe-area-inset-bottom));
        }
        .nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
          text-decoration: none;
          color: #6b7280;
          font-size: 0.75rem;
          font-weight: 500;
          padding: 0.5rem;
          min-width: 4rem;
        }
        .nav-item.active {
          color: #111827;
        }
        .nav-item.active .nav-icon {
          transform: scale(1.1);
        }
        .nav-icon {
          font-size: 1.25rem;
          transition: transform 0.2s ease;
        }
        @media (min-width: 768px) {
          .member-shell {
            flex-direction: row;
          }
          .member-topbar {
            display: none;
          }
          .member-bottom-nav {
            display: none;
          }
          .member-sidebar {
            width: 250px;
            background-color: #ffffff;
            border-right: 1px solid #e5e7eb;
            display: flex;
            flex-direction: column;
            position: sticky;
            top: 0;
            height: 100vh;
            padding: 1.5rem 0;
          }
          .member-sidebar .member-brand {
            padding: 0 1.5rem;
            margin-bottom: 2rem;
          }
          .sidebar-nav {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            padding: 0 1rem;
          }
          .sidebar-item {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.75rem 1rem;
            border-radius: 0.5rem;
            text-decoration: none;
            color: #4b5563;
            font-weight: 500;
            transition: all 0.2s ease;
          }
          .sidebar-item:hover {
            background-color: #f3f4f6;
            color: #111827;
          }
          .sidebar-item.active {
            background-color: #f3f4f6;
            color: #111827;
            font-weight: 600;
          }
          .sidebar-logout {
            padding: 0 1.5rem;
            margin-top: auto;
          }
          .member-content-area {
            padding: 2.5rem;
            max-width: 1000px;
          }
        }
      `}</style>
      <div className="member-shell">
        {/* Mobile Topbar */}
        <header className="member-topbar">
          <Link href="/member" className="member-brand">
            <span>O</span> Espace Membre
          </Link>
          <button onClick={handleLogout} className="logout-btn">
            Quitter
          </button>
        </header>

        {/* Desktop Sidebar */}
        <aside className="member-sidebar" style={{ display: 'none' }}>
          <Link href="/member" className="member-brand">
            <span>O</span> NAYOORA
          </Link>
          <nav className="sidebar-nav">
            {navItems.map((item) => (
              <Link 
                key={item.path} 
                href={item.path}
                className={`sidebar-item ${pathname === item.path ? 'active' : ''}`}
              >
                <span>{item.icon}</span>
                {item.name}
              </Link>
            ))}
          </nav>
          <div className="sidebar-logout">
            <button onClick={handleLogout} className="logout-btn" style={{ padding: '0.75rem 0' }}>
              🚪 Se déconnecter
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="member-content-area">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="member-bottom-nav">
          {navItems.map((item) => (
            <Link 
              key={item.path} 
              href={item.path}
              className={`nav-item ${pathname === item.path ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.name}
            </Link>
          ))}
        </nav>
      </div>
      
      {/* Script to override inline styles for desktop via JS if needed, but CSS media queries handle it */}
      <style>{`
        @media (min-width: 768px) {
          .member-sidebar {
            display: flex !important;
          }
        }
      `}</style>
    </>
  );
}
