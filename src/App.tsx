import React, { useEffect, useState, useRef } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate, useParams, NavLink } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Target, Menu, X } from 'lucide-react';
import clsx from 'clsx';
import { shallow } from 'zustand/shallow';
import { logKaiPrompt } from './lib/ai/logKaiPrompt';

// Componentes visuais e containers principais
import RadarLoader from './components/RadarLoader';
import { Header } from './components/Header';
import { ModalContainer } from './components/ModalContainer';
import { FeedbackButton } from './components/FeedbackButton';

// Páginas principais
import { CycleDashboard } from './components/CycleDashboard';
import { CycleDetailPage } from './components/CycleDetailPage';
import { Dashboard } from './components/dashboard/Dashboard';
import { UsersPage } from './pages/admin/UsersPage';
import { TeamsPage } from './pages/admin/TeamsPage';
import { TeamDetailPage } from './pages/admin/TeamDetailPage';
import { GuidePage } from './pages/GuidePage';
import { LandingPage } from './pages/site';

// Autenticação
import { AuthTabs } from './components/auth/AuthTabs';
import { Login } from './components/auth/Login';
import { ResetPassword } from './components/auth/ResetPassword';
import { UpdatePassword } from './components/auth/UpdatePassword';
import { AcceptInvitePage } from './components/auth/AcceptInvitePage';
import { AuthCallback } from './components/auth/AuthCallback';
import { ConfirmarConta } from './pages/ConfirmarConta';

// Onboarging
import { OnboardingPage } from './pages/OnboardingPage';
import { useOnboardingGuide } from './stores/useOnboardingGuide';

// Libs, stores e hooks
import { supabase } from './lib/supabase';
import { useAuthStore } from './stores/authStore';
import { useCycleStore } from './stores/okrCycleStore';
import { useNotificationStore } from './stores/notificationStore';
import { useCurrentCompany } from './hooks/useCurrentCompany';
import { useTokenUsage } from './hooks/useTokenUsage';
import { useOrgCheckinStatus } from './hooks/useOrgCheckinStatus';
import { ProtectedRoute } from './components/ProtectedRoute';

// Componente auxiliar para rotas dinâmicas de ciclo
export function CycleDetailPageWrapper() {
  const { id } = useParams();
  return <CycleDetailPage cycleId={id!} />;
}

function App() {
  // --- Estados principais de controle ---
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [cyclesReady, setCyclesReady] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // --- Stores e hooks derivados ---
  const company = useCurrentCompany();
  const tokenUsage = useTokenUsage();
  
  //const selectedCycleId = useCycleStore(state => state.selectedCycleId);
  
  const { selectedCycleId, cycles } = useCycleStore(
    state => ({
      selectedCycleId: state.selectedCycleId,
      cycles: state.cycles,
    }),
    shallow
  );

  const loadCycles = useCycleStore(state => state.loadCycles);

  const organizationId = useAuthStore((state) => state.organizationId);
  const { notifications, fetchNotifications } = useNotificationStore();

  const [checkinRefreshVersion, setCheckinRefreshVersion] = useState(0);

  // --- Caminhos públicos ---
  const publicPaths = ['/login','/register','/reset-password','/update-password','/auth/callback','/convite','/site','/onboarding','/confirmar-conta'];
  const isPublicRoute = publicPaths.includes(location.pathname) || location.pathname.startsWith('/auth/callback');

  // --- Notificação de check-in ---

  console.log('[🛠️ Debug CheckinStatus]', {
    cyclesReady,
    selectedCycleId,
    organizationId,
  });

  const checkinNotification = notifications.find(n => n.type === 'checkin_reminder' && !n.read);

  const shouldCheck = cyclesReady && selectedCycleId && organizationId;
  const checkinStatus = useOrgCheckinStatus(shouldCheck ? selectedCycleId : undefined, checkinRefreshVersion);
 

  // --- 1. Bootstrap inicial: autenticação, sessão, ciclos, organização ---
  useEffect(() => {
    const init = async () => {
      // 1. Sessão
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session || !session.user) {
        console.warn('[🔒] Sem sessão ativa - redirecionando para login');
        setIsAuthChecked(true);
        setOnboardingChecked(true); // <-- 🔧 importante
        return;
      }
  
      setSession(session);
  
      // 2. Dados do usuário
      await useAuthStore.getState().fetchUserData();

      // Aguarda até que organizationId esteja disponível
      let organizationId = useAuthStore.getState().organizationId;
      let attempts = 0;

      while (!organizationId && attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        organizationId = useAuthStore.getState().organizationId;
        attempts++;
      }

      if (!organizationId) {
        console.warn('[⛔] Falha ao obter organizationId após múltiplas tentativas.');
        setIsAuthChecked(true);
        return;
      }
  
      // 3. Ciclos da organização
      const cycles = await loadCycles(organizationId);
      if (cycles?.length) {
        const sorted = cycles.sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
        const current = sorted.find((c) => c.status === 'active') ?? sorted[0];
        if (current) {
          useCycleStore.getState().setSelectedCycleId(current.id);
          setDataReady(true);
        }
      }
  
      setCyclesReady(true);
      setIsAuthChecked(true);
    };
  
    init();
  
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) setSession(session);
      if (event === 'PASSWORD_RECOVERY') navigate('/update-password');
    });
  
    return () => listener.subscription.unsubscribe();
  }, []);
  

// Ativa Onboarding

useEffect(() => {
  const checkOnboarding = async () => {
    const { data: sessionData, error } = await supabase.auth.getSession();
    const session = sessionData?.session;

    if (!session?.user?.id) {
      console.warn('[🔒] Sem sessão ativa para verificar onboarding');
      return;
    }

    const { data, error: fetchError } = await supabase
      .from('users')
      .select('onboarding_completed')
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (fetchError) {
      console.error('[❌ Erro ao verificar onboarding]', fetchError);
      setOnboardingChecked(true);
      return;
    }

    if (data?.onboarding_completed === false && location.pathname !== '/onboarding') {
      console.log('[🚀 Redirecionando para onboarding]');
      navigate('/onboarding');
    } else {
      setOnboardingChecked(true);
    }
  };

  if (
    isAuthChecked &&
    !onboardingChecked &&
    useAuthStore.getState().organizationId // garante que já carregou a org
  ) {
    checkOnboarding();
  }
}, [isAuthChecked, onboardingChecked, location.pathname]);


// ⚠️ Libera o Header se um ciclo for criado manualmente após o carregamento
useEffect(() => {
  if (!dataReady && cyclesReady && cycles.length > 0 && selectedCycleId) {
    console.log('[🟢 Header renderizado após ciclo criado manualmente]');
    setDataReady(true);
  }
}, [dataReady, cyclesReady, cycles.length, selectedCycleId]);

  // ⚠️ Detecta ciclo recém-selecionado (ex: após gerar via KAI)
useEffect(() => {
  if (!dataReady && cyclesReady && selectedCycleId) {
    console.log('[🟢 Header liberado após geração automática via KAI]');
    setDataReady(true);
  }
}, [selectedCycleId, cyclesReady, dataReady]);

// --- Atualiza Consumo e Uso da IA ---

useEffect(() => {
  const handler = () => {
    tokenUsage.refetch();
  };

  window.addEventListener('kai:tokens:updated', handler);
  return () => window.removeEventListener('kai:tokens:updated', handler);
}, []);

// --- Atualiza estado do Checkin ---

useEffect(() => {
  const handler = () => {
    console.log('[♻️ REFETCH disparado]');
    setCheckinRefreshVersion(v => v + 1);
  };

  window.addEventListener('kai:checkin:updated', handler);
  return () => window.removeEventListener('kai:checkin:updated', handler);
}, []);

  // --- 2. Carregar dados do usuário e notificações ---
  useEffect(() => {
    if (session) {
      useAuthStore.getState().fetchUserData();
      fetchNotifications(session.user.id);

      //Onboading Tooltip
      const hasSeen = localStorage.getItem('has_seen_feature_guide');
      if (!hasSeen) {
        useOnboardingGuide.getState().startGuide();
        localStorage.setItem('has_seen_feature_guide', 'true');
      }

    }
  }, [session]);

  // --- 5. Dropdown fora do menu ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowMobileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- Redirecionamento para login se necessário ---
if (!isAuthChecked || !onboardingChecked) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <RadarLoader />
    </div>
  );
}
  if (!session && !isPublicRoute) return <Navigate to="/login" replace />;



  // --- Render principal ---
  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      <div className="min-h-screen bg-gray-50">

        {/* Header e Menu lateral */}
        {!isPublicRoute && session && (
          <Header
            session={session}
            onLogout={async () => {
              const { error } = await supabase.auth.signOut();
              if (!error) navigate('/login');
            }}
            onMobileMenuOpen={() => setShowMobileMenu(true)}
            checkinStatus={checkinStatus}
            selectedCycleId={selectedCycleId}
            checkinRefreshVersion={checkinRefreshVersion}

          />
          
        )}

        {/* Overlay escurecido */}
          <div
            className={clsx(
              "fixed inset-0 z-40 bg-black bg-opacity-40 transition-opacity duration-300 md:hidden",
              showMobileMenu ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            )}
            onClick={() => setShowMobileMenu(false)}
          />

          {/* Menu lateral */}
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
                  <div className="h-full bg-blue-400 transition-all duration-300" style={{ width: `${tokenUsage.percentual}%` }} />
                </div>
              </div>
            )}

            <nav className="flex flex-col space-y-4">
              <NavLink to="/cycles" onClick={() => setShowMobileMenu(false)} className={({ isActive }) =>
                clsx('text-left text-base', isActive ? 'text-blue-600 font-medium' : 'text-gray-700 hover:text-blue-600')}>Ciclos</NavLink>

              <NavLink to="/dashboard" onClick={() => setShowMobileMenu(false)} className={({ isActive }) =>
                clsx('text-left text-base', isActive ? 'text-blue-600 font-medium' : 'text-gray-700 hover:text-blue-600')}>Acompanhamento</NavLink>

              <hr className="border-t border-gray-200 my-2" />
              <span className="text-gray-400 font-bold mt-2">Conta</span>

              {useAuthStore.getState().role === 'admin' && (
                <>
                  <button onClick={() => { navigate('/admin/users'); setShowMobileMenu(false); }} className="text-left text-gray-700 hover:text-blue-600">Usuários</button>
                  <button onClick={() => { navigate('/admin/teams'); setShowMobileMenu(false); }} className="text-left text-gray-700 hover:text-blue-600">Times</button>
                </>
              )}

              <button onClick={async () => {
                await supabase.auth.signOut();
                setShowMobileMenu(false);
                navigate('/login');
              }} className="text-left text-red-600 hover:text-red-400">Sair</button>
            </nav>
          </div>

        {/* Espaço para rotas protegidas */}
        <main className={clsx({
          'pt-[60px]': !isPublicRoute && !checkinStatus.reminderMessage?.trim(),
          'pt-[96px]': !isPublicRoute && !!checkinStatus.reminderMessage?.trim(),
        })}>
          <Routes>
            <Route path="/site" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<AuthTabs />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/update-password" element={<UpdatePassword />} />
            <Route path="/convite" element={<AcceptInvitePage />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/confirmar-conta" element={<ConfirmarConta />} />
            <Route path="/onboarding" element={<OnboardingPage />} />

            <Route path="/" element={<CycleDashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/cycle/:id" element={<CycleDetailPageWrapper />} />
            <Route path="/admin/users" element={<ProtectedRoute requireAdmin element={<UsersPage />} />} />
            <Route path="/admin/teams" element={<ProtectedRoute requireAdmin element={<TeamsPage />} />} />
            <Route path="/admin/teams/:id" element={<ProtectedRoute requireAdmin element={<TeamDetailPage />} />} />
            <Route path="/guide" element={<GuidePage />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>

        <ModalContainer />
        {!isPublicRoute && <FeedbackButton />}
      </div>
    </>
  );
}

export default App;
