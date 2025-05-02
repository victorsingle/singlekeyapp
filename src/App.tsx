import React, { useEffect, useState, useRef } from 'react';
import { Target, Menu, X } from 'lucide-react';
import RadarLoader from './components/RadarLoader';
import { Routes, Route, Navigate, useLocation, useNavigate, useParams, Link, NavLink } from 'react-router-dom';
import { CycleDashboard } from './components/CycleDashboard';
import { CycleDetailPage } from './components/CycleDetailPage';
import { Dashboard } from './components/dashboard/Dashboard';
import { ModalContainer } from './components/ModalContainer';
import { useAuthStore } from './stores/authStore';
import { Toaster } from 'react-hot-toast';
import { AuthTabs } from './components/auth/AuthTabs';
import { Login } from './components/auth/Login';
import { ResetPassword } from './components/auth/ResetPassword';
import { AuthCallback } from './components/auth/AuthCallback';
import { supabase } from './lib/supabase';
import clsx from 'clsx';
import { useNotificationStore } from './stores/notificationStore';
import { createNotificationIfNecessary } from './lib/notifications';
import { Header } from './components/Header';
import { UpdatePassword } from './components/auth/UpdatePassword';
import { UsersPage } from './pages/admin/UsersPage';
import { TeamsPage } from './pages/admin/TeamsPage';
import { TeamDetailPage } from './pages/admin/TeamDetailPage';
import { AcceptInvitePage } from './components/auth/AcceptInvitePage';
import { useCycleStore } from './stores/okrCycleStore';
import { GuidePage } from './pages/GuidePage';
import { LandingPage } from './pages/site'; 
import { useCurrentCompany } from './hooks/useCurrentCompany';
import { ProtectedRoute } from './components/ProtectedRoute';

export function CycleDetailPageWrapper() {
  const { id } = useParams();
  return <CycleDetailPage cycleId={id!} />;
}


function App() {
  //const { fetchCycles } = useOKRStore();
  const { loadCycles } = useCycleStore();
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const company = useCurrentCompany();

  const SomeComponent = () => {
    return (
      <div className="flex items-center space-x-2">
        <RadarLoader />
      </div>
    );
  };

  const publicPaths = [
    '/login',
    '/register',
    '/reset-password',
    '/update-password',
    '/auth/callback',
    '/convite',
    '/site',
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
        navigate('/update-password');
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      useAuthStore.getState().fetchUserData(); // 🚨 Aqui chama para carregar o usuário!
      fetchNotifications(session.user.id);
    }
  }, [session]);

// Checkin Lembrete
useEffect(() => {
  if (!session) return;

  const today = new Date().toLocaleDateString('sv-SE');

  const checkReminder = async () => {
    // 🔍 1. Buscar check-ins programados para hoje
    const { data: checkins, error } = await supabase
      .from('okr_checkins')
      .select('checkin_date, cycle_id')
      .eq('checkin_date', today)
      .limit(10);

    if (error || !checkins?.length) {
      console.log('[ℹ️ Nenhum check-in programado ou erro]');
      return;
    }

    // 🔍 2. Buscar organization_id e role do usuário logado
    const userData = useAuthStore.getState();
    const orgId = userData.organizationId;
    const role = userData.role;

    if (!orgId) {
      console.warn('[⚠️] Organização não encontrada para usuário logado.');
      return;
    }

    // 🔍 3. Buscar todos os champions da organização
    const { data: champions, error: championError } = await supabase
      .from('invited_users')
      .select('user_id')
      .eq('organization_id', orgId)
      .eq('role', 'champion');

    if (championError) {
      console.error('[❌ Erro ao buscar champions da organização]', championError);
      return;
    }

    // ✅ 4. Inclui o próprio usuário somente se for admin ou champion
    const includeSelf = role === 'admin' || role === 'champion';
    const allUserIds = [
      ...(champions?.map(c => c.user_id) ?? []),
      ...(includeSelf ? [session.user.id] : [])
    ];

    for (const checkin of checkins) {
      const { data: cycle, error: cycleError } = await supabase
        .from('okr_cycles')
        .select('id, name')
        .eq('id', checkin.cycle_id)
        .maybeSingle();

      if (cycleError || !cycle) continue;

      // 🔁 5. Criar notificação para cada user relevante
      for (const userId of allUserIds) {
        await createNotificationIfNecessary({
          userId,
          cycleId: cycle.id,
          title: 'Lembrete de Check-in',
          buildMessage: () =>
            `Hoje é dia de Check-in do Ciclo ${cycle.name}. Clique e atualize suas métricas.`,
          checkIfActionDone: async () => {
            const { data } = await supabase
              .from('key_result_checkins')
              .select('id')
              .eq('user_id', userId)
              .eq('date', today)
              .limit(1);
            return !!data?.length;
          },
        });
      }
    }

    // ✅ 6. Atualiza a store com as notificações novas (apenas para o logado)
    useNotificationStore.getState().fetchNotifications(session.user.id);
  };

  checkReminder();
}, [session]);



if (!isAuthChecked) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <RadarLoader />
    </div>
  );
}

  console.log('[🔒 Proteção de rota]', {
    session,
    isPublicRoute,
    pathname: location.pathname,
  });

  if (!session && !isPublicRoute) {
    return <Navigate to="/login" replace />;
  }


 return (
  <>

  <Toaster
    position="top-right"
    reverseOrder={false}
  />
    <div className="min-h-screen bg-gray-50">
      
      {!isPublicRoute && (
        <>
          <Header
            session={session}
            onLogout={handleLogout}
            onMobileMenuOpen={() => setShowMobileMenu(true)}
            checkinNotification={checkinNotification}
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

            {company?.company_name && (
              <div className='py-2 mb-2'>
                <span className="font-medium text-gray-400 p-0">{company.company_name}</span>
              </div>
            )}

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
              <span className="text-gray-400 font-bold mt-2">Conta</span>

              <button
                onClick={() => {
                  navigate('/admin/users');
                  setShowMobileMenu(false);
                }}
                className="text-left text-gray-700 hover:text-blue-600"
              >
                Usuários
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

      <main  
        className={clsx({
            'pt-[60px]': !isPublicRoute && !checkinNotification,
            'pt-[96px]': !isPublicRoute && checkinNotification,
          })}>
      <Routes>
        <Route path="/site" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<AuthTabs />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/update-password" element={<UpdatePassword />} />
        <Route path="/convite" element={<AcceptInvitePage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/" element={<CycleDashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/cycle/:id" element={<CycleDetailPageWrapper />} />

        {/* 🔐 Protegidas por papel */}
        <Route
          path="/admin/users"
          element={<ProtectedRoute requireAdmin element={<UsersPage />} />}
        />
        <Route
          path="/admin/teams"
          element={<ProtectedRoute requireChampion element={<TeamsPage />} />}
        />
        <Route
          path="/admin/teams/:id"
          element={<ProtectedRoute requireChampion element={<TeamDetailPage />} />}
        />

        <Route path="*" element={<Navigate to="/" />} />
        <Route path="/guide" element={<GuidePage />} />
      </Routes>
      </main>

      <ModalContainer />
    </div>
  </>
);

}

export default App;
