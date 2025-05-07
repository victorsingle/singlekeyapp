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
import { FeedbackButton } from "./components/FeedbackButton"
import { useTokenUsage } from './hooks/useTokenUsage';
import { useOrgCheckinStatus } from './hooks/useOrgCheckinStatus';



export function CycleDetailPageWrapper() {
  const { id } = useParams();
  return <CycleDetailPage cycleId={id!} />;
}


function App() {
  const { selectedCycleId, cycles, loadCycles } = useCycleStore();
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [cyclesReady, setCyclesReady] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const company = useCurrentCompany();
  const tokenUsage = useTokenUsage();
  const organizationId = useAuthStore(state => state.organizationId);
  const [dataReady, setDataReady] = useState(false);

  const SomeComponent = () => (
    <div className="flex items-center space-x-2">
      <RadarLoader />
    </div>
  );

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

  useEffect(() => {
    if (!organizationId) return;
  
    loadCycles().then((cycles) => {
      if (cycles?.length) {
        const state = useCycleStore.getState();
        const alreadySelected = state.selectedCycleId;
  
        if (!alreadySelected) {
          const sorted = cycles.sort((a, b) =>
            new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
          );
          const current = sorted.find((c) => c.status === 'active') ?? sorted[0];
  
          if (current) {
            console.log('[✅ Ciclo Selecionado Automaticamente]', current.id);
            state.setSelectedCycleId(current.id);
          }
        }
      }
  
      setCyclesReady(true);
    });
  }, [organizationId]);

  const checkinStatus = useOrgCheckinStatus(
    cyclesReady && selectedCycleId ? selectedCycleId : undefined
  );

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) navigate('/login');
  };

  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log('[🎯 Ciclo Selecionado]', useCycleStore.getState().selectedCycleId);
  }, [useCycleStore.getState().selectedCycleId]);

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

      const loadedCycles = await loadCycles();

      const state = useCycleStore.getState();
      const alreadySelected = state.selectedCycleId;

      if (!alreadySelected && loadedCycles?.length > 0) {
        const sorted = loadedCycles.sort(
          (a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
        );
        const current = sorted.find((c) => c.status === 'active') ?? sorted[0];

        if (current) {
          console.log('[✅ Ciclo Selecionado Automaticamente]', current.id);
          state.setSelectedCycleId(current.id);
        }
      }

      setIsAuthChecked(true);
    };

    init();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[🔄 Auth State Changed]', { event, session });

      if (session) setSession(session);
      if (event === 'PASSWORD_RECOVERY') navigate('/update-password');
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      useAuthStore.getState().fetchUserData();
      fetchNotifications(session.user.id);
    }
  }, [session]);

  useEffect(() => {
    const checkData = () => {
      const { selectedCycleId } = useCycleStore.getState();
      const { organizationId } = useAuthStore.getState();
      if (selectedCycleId && organizationId) {
        setDataReady(true);
      }
    };
  
    const unsubscribeCycle = useCycleStore.subscribe(checkData);
    const unsubscribeAuth = useAuthStore.subscribe(checkData);
  
    // Executa a primeira verificação
    checkData();
  
    return () => {
      unsubscribeCycle();
      unsubscribeAuth();
    };
  }, []);

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
      
    {!isPublicRoute && dataReady && (
        <>
          <Header
              session={session}
              onLogout={handleLogout}
              onMobileMenuOpen={() => setShowMobileMenu(true)}
              checkinStatus={checkinStatus}
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

          {!tokenUsage.isLoading && tokenUsage.limite > 0 && (
              <div className="px-0 pt-2 pb-4 mb-4 text-[11px] text-gray-600 border-t border-b border-gray-200">
                <div className="flex justify-between mb-1">
                  <span className="font-semibold text-gray-400">Uso da IA</span>
                  <span>{new Intl.NumberFormat('pt-BR').format(tokenUsage.usado)} / {new Intl.NumberFormat('pt-BR').format(tokenUsage.limite)}</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-400 transition-all duration-300"
                    style={{ width: `${tokenUsage.percentual}%` }}
                  />
                </div>
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
              
              {useAuthStore.getState().role === 'admin' && (
                <>
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
                  navigate('/admin/teams');
                  setShowMobileMenu(false);
                }}
                className="text-left text-gray-700 hover:text-blue-600"
              >
                Times
              </button>
              </>
              )}
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
          'pt-[60px]': !isPublicRoute && (!checkinNotification || orgHasCheckedInToday),
          'pt-[96px]': !isPublicRoute && checkinNotification && !orgHasCheckedInToday,
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
          element={<ProtectedRoute requireAdmin element={<TeamsPage />} />}
        />
        <Route
          path="/admin/teams/:id"
          element={<ProtectedRoute requireAdmin element={<TeamDetailPage />} />}
        />

        <Route path="*" element={<Navigate to="/" />} />
        <Route path="/guide" element={<GuidePage />} />
      </Routes>
      </main>

      <ModalContainer />
      {!isPublicRoute && <FeedbackButton />}
    </div>
  </>
);

}

export default App;
