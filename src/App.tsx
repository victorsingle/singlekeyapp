import React, { useEffect, useState, useRef } from 'react';
import { Target, Menu, X } from 'lucide-react';
import { Routes, Route, Navigate, useLocation, useNavigate, useParams, Link, NavLink } from 'react-router-dom';
import { CycleDashboard } from './components/CycleDashboard';
import { CycleDetailPage } from './components/CycleDetailPage';
import { Dashboard } from './components/dashboard/Dashboard';
import { ModalContainer } from './components/ModalContainer';
import { useOKRStore } from './stores/okrStore';
import { Toaster } from 'react-hot-toast';
import { AuthTabs } from './components/auth/AuthTabs';
import { Login } from './components/auth/Login';
import { ResetPassword } from './components/auth/ResetPassword';
import { AuthCallback } from './components/auth/AuthCallback';
import { supabase } from './lib/supabase';
import clsx from 'clsx';
import { useNotificationStore } from './stores/notificationStore';
import { Header } from './components/Header';
import { UpdatePassword } from './components/auth/UpdatePassword';
import { UsersPage } from './pages/admin/UsersPage';
import { TeamsPage } from './pages/admin/TeamsPage';
import { TeamDetailPage } from './pages/admin/TeamDetailPage';


export function CycleDetailPageWrapper() {
  const { id } = useParams();
  return <CycleDetailPage cycleId={id!} />;
}

function App() {
  const { fetchCycles } = useOKRStore();
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [recoveryMode, setRecoveryMode] = useState(false);
  
  const publicPaths = [
    '/login',
    '/register',
    '/reset-password',
    '/update-password',
    '/auth/callback',
    '/convite',
  ];
  const isPublicRoute =
    publicPaths.includes(location.pathname) ||
    location.pathname.startsWith('/auth/callback');

  const { notifications, markAsRead, fetchNotifications } = useNotificationStore();
  const checkinNotification = notifications.find(
    (n) => n.type === 'checkin_reminder' && !n.read
  );

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) navigate('/login');
  };

  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

 
useEffect(() => {
  const init = async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (!error) setSession(session);
    setIsAuthChecked(true);
  };

  init();

  const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
    console.log('[🔄 Auth State Changed]', { event, session });

    if (session) {
      setSession(session);
    }

    if (event === 'PASSWORD_RECOVERY') {
      setRecoveryMode(true);
      navigate('/update-password');
    }
  });

  return () => authListener.subscription.unsubscribe();
}, []);

  useEffect(() => {
    if (session) {
      console.log('[🆔 SESSION USER ID]', session.user.id);
      fetchCycles();
      fetchNotifications(session.user.id);
    }
  }, [session]);

  useEffect(() => {
    if (!session) return;

    const fetchOrCreateCheckinNotification = async () => {
      const today = new Date().toLocaleDateString('sv-SE');

      const { data: checkinData } = await supabase
        .from('okr_checkins')
        .select('checkin_date, cycle_id, okr_cycles(id, name)')
        .eq('checkin_date', today)
        .limit(1)
        .maybeSingle();

      if (!checkinData?.okr_cycles) return;

      const cycle = checkinData.okr_cycles;

      const { data: existing } = await supabase
        .from('user_notifications')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('type', 'checkin_reminder')
        .eq('read', false);

      const alreadyExists = existing?.some((n) => n.data?.cycle_id === cycle.id);

      const { data: existingCheckins } = await supabase
        .from('key_result_checkins')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('date', today)
        .limit(1);

      if (existingCheckins?.length) return;

      if (!alreadyExists) {
        await supabase.from('user_notifications').insert({
          user_id: session.user.id,
          type: 'checkin_reminder',
          title: 'Lembrete de Check-in',
          message: `Hoje é dia de Check-in do Ciclo ${cycle.name}. Clique e atualize suas métricas.`,
          data: { cycle_id: cycle.id },
          channel: ['app'],
        });
        fetchNotifications(session.user.id);
      }
    };

    fetchOrCreateCheckinNotification();
  }, [session]);

  if (!isAuthChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  console.log('[🔒 Proteção de rota]', {
    session,
    isPublicRoute,
    pathname: location.pathname,
  });
  
  if (!session && !isPublicRoute && !recoveryMode) {
    return <Navigate to="/login" replace />;
  }


 return (
  <>
    <Toaster position="top-right" reverseOrder={false} />
    <div className="min-h-screen bg-gray-50">
      {checkinNotification && (
        <div className="w-full bg-yellow-100 border-b border-yellow-300 text-yellow-800 px-4 py-2 text-sm font-medium text-center shadow-sm">
          <Link
            to={`/cycle/${checkinNotification.data?.cycle_id}`}
            className="underline hover:text-yellow-600"
          >
            {checkinNotification.message}
          </Link>
        </div>
      )}

      {!isPublicRoute && (
        <>
          <Header
            session={session}
            onLogout={handleLogout}
            onMobileMenuOpen={() => setShowMobileMenu(true)}
          />

          <div
            className={clsx(
              "fixed inset-0 z-40 bg-black bg-opacity-40 transition-opacity duration-300 md:hidden",
              showMobileMenu ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            )}
            onClick={() => setShowMobileMenu(false)}
          />

          <div
            className={clsx(
              "fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-50 p-4 transition-transform duration-300 ease-in-out md:hidden",
              showMobileMenu ? "translate-x-0" : "-translate-x-full"
            )}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-800">Menu</h2>
              <button onClick={() => setShowMobileMenu(false)} aria-label="Fechar menu">
                <X className="w-5 h-5 text-gray-700" />
              </button>
            </div>

            <nav className="flex flex-col space-y-4">
              <NavLink
                to="/cycles"
                onClick={() => setShowMobileMenu(false)}
                className={({ isActive }) =>
                  clsx(
                    'text-left text-base',
                    isActive ? 'text-blue-600 font-medium' : 'text-gray-700 hover:text-blue-600'
                  )
                }
              >
                Ciclos
              </NavLink>

              <NavLink
                to="/dashboard"
                onClick={() => setShowMobileMenu(false)}
                className={({ isActive }) =>
                  clsx(
                    'text-left text-base',
                    isActive ? 'text-blue-600 font-medium' : 'text-gray-700 hover:text-blue-600'
                  )
                }
              >
                Acompanhamento
              </NavLink>

              <hr className="border-t border-gray-200 my-2" />

              <span className="text-sm text-gray-500 mt-2">Conta</span>

              <button
                onClick={() => {
                  navigate('/profile');
                  setShowMobileMenu(false);
                }}
                className="text-left text-gray-700 hover:text-blue-600"
              >
                Meu Perfil
              </button>

              <button
                onClick={() => {
                  navigate('/settings');
                  setShowMobileMenu(false);
                }}
                className="text-left text-gray-700 hover:text-blue-600"
              >
                Configurações
              </button>

              <button
                onClick={() => {
                  handleLogout();
                  setShowMobileMenu(false);
                }}
                className="text-left text-red-600 hover:text-red-400"
              >
                Sair
              </button>
            </nav>
          </div>
        </>
      )}

      <main className={clsx({ 'pt-0': !isPublicRoute })}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<AuthTabs />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/update-password" element={<UpdatePassword />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/" element={<CycleDashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/cycle/:id" element={<CycleDetailPageWrapper />} />
          <Route path="/admin/users" element={<UsersPage />} />
          <Route path="/admin/teams" element={<TeamsPage />} />
          <Route path="/admin/teams/:id" element={<TeamDetailPage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>

      <ModalContainer />
    </div>
  </>
);

}

export default App;
