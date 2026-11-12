import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { Menu, X, LayoutDashboard, LogOut, Shield } from 'lucide-react';

type NavbarProps = {
  route: string;
  onNavigate: (route: string) => void;
};

export default function Navbar({ route, onNavigate }: NavbarProps) {
  const { user, profile, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navItems = [
    { label: 'Home', route: 'home' },
    { label: 'Plans', route: 'plans' },
    { label: 'About', route: 'about' },
    { label: 'Contact', route: 'contact' },
  ];

  const navigate = (r: string) => {
    onNavigate(r);
    setMobileOpen(false);
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-bg/90 backdrop-blur-lg border-b border-border' : 'bg-transparent'
    }`}>
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <button onClick={() => navigate('home')} className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 to-cyan-500 flex items-center justify-center font-bold text-white text-lg shadow-lg shadow-sky-500/20 group-hover:scale-105 transition-transform">
            C
          </div>
          <span className="font-bold text-xl text-white">Crypto<span className="gradient-text">Vault</span></span>
        </button>

        <div className="hidden md:flex items-center gap-1">
          {navItems.map(item => (
            <button
              key={item.route}
              onClick={() => navigate(item.route)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                route === item.route ? 'text-sky-400' : 'text-slate-300 hover:text-white hover:bg-surface'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              {profile?.role === 'admin' ? (
                <button onClick={() => navigate('admin')} className="btn-secondary flex items-center gap-2 text-sm">
                  <Shield size={16} /> Admin Panel
                </button>
              ) : (
                <button onClick={() => navigate('dashboard')} className="btn-primary flex items-center gap-2 text-sm">
                  <LayoutDashboard size={16} /> Dashboard
                </button>
              )}
              <button onClick={signOut} className="btn-secondary flex items-center gap-2 text-sm">
                <LogOut size={16} /> Sign Out
              </button>
            </>
          ) : (
            <>
              <button onClick={() => navigate('login')} className="btn-secondary text-sm">Sign In</button>
              <button onClick={() => navigate('signup')} className="btn-primary text-sm">Get Started</button>
            </>
          )}
        </div>

        <button className="md:hidden text-slate-200" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {mobileOpen && (
        <div className="md:hidden bg-bg/95 backdrop-blur-lg border-b border-border">
          <div className="px-4 py-4 space-y-2">
            {navItems.map(item => (
              <button
                key={item.route}
                onClick={() => navigate(item.route)}
                className={`block w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium ${
                  route === item.route ? 'text-sky-400 bg-surface' : 'text-slate-300 hover:bg-surface'
                }`}
              >
                {item.label}
              </button>
            ))}
            <div className="pt-2 border-t border-border space-y-2">
              {user ? (
                <>
                  {profile?.role === 'admin' ? (
                    <button onClick={() => navigate('admin')} className="btn-secondary w-full text-sm flex items-center justify-center gap-2">
                      <Shield size={16} /> Admin Panel
                    </button>
                  ) : (
                    <button onClick={() => navigate('dashboard')} className="btn-primary w-full text-sm flex items-center justify-center gap-2">
                      <LayoutDashboard size={16} /> Dashboard
                    </button>
                  )}
                  <button onClick={() => { signOut(); setMobileOpen(false); }} className="btn-secondary w-full text-sm flex items-center justify-center gap-2">
                    <LogOut size={16} /> Sign Out
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => navigate('login')} className="btn-secondary w-full text-sm">Sign In</button>
                  <button onClick={() => navigate('signup')} className="btn-primary w-full text-sm">Get Started</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
