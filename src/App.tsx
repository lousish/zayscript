import { AuthProvider, useAuth } from '@/lib/auth';
import { useState, useEffect } from 'react';
import LandingPage from '@/pages/LandingPage';
import AuthPage from '@/pages/AuthPage';
import UserDashboard from '@/pages/UserDashboard';
import AdminDashboard from '@/pages/AdminDashboard';
import { supabase } from '@/lib/supabase';

type Route = 'home' | 'login' | 'signup' | 'dashboard' | 'admin' | 'plans' | 'about' | 'contact';

function parseHash(): Route {
  const hash = window.location.hash.replace('#/', '').replace('#', '');
  const valid: Route[] = ['home', 'login', 'signup', 'dashboard', 'admin', 'plans', 'about', 'contact'];
  return (valid.includes(hash as Route) ? hash : 'home') as Route;
}

function AppRoutes() {
  const { user, profile, loading } = useAuth();
  const [route, setRoute] = useState<Route>(parseHash());

  useEffect(() => {
    const onHashChange = () => setRoute(parseHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [route]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-sky-600/30 border-t-sky-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400 font-medium">Loading CryptoVault...</p>
        </div>
      </div>
    );
  }

  // Admin routes
  if (route === 'admin') {
    if (!user || profile?.role !== 'admin') {
      return <AuthPage mode="admin" />;
    }
    return <AdminDashboard />;
  }

  // Protected user routes
  if (route === 'dashboard') {
    if (!user) return <AuthPage mode="login" />;
    if (profile?.role === 'admin') return <AdminDashboard />;
    return <UserDashboard />;
  }

  // Auth routes - redirect if already logged in
  if (route === 'login' || route === 'signup') {
    if (user && profile) {
      if (profile.role === 'admin') {
        window.location.hash = '#/admin';
        return null;
      }
      window.location.hash = '#/dashboard';
      return null;
    }
    return <AuthPage mode={route} />;
  }

  return <LandingPage route={route} />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export { supabase };
