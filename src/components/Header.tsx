import React, { useEffect, useRef, useState } from 'react';
import { Target, Menu, User, LogOut, Users } from 'lucide-react';
import { useLocation, useNavigate, NavLink, Link } from 'react-router-dom';
import { useCurrentCompany } from '../hooks/useCurrentCompany';
import clsx from 'clsx';
import { useCycleStore } from '../stores/okrCycleStore';
import { useAuthStore } from '../stores/authStore';
import { usePermissions } from '../hooks/usePermissions';
import { useTokenUsage } from "../hooks/useTokenUsage";
import { useOrgCheckinStatus } from '../hooks/useOrgCheckinStatus';

interface HeaderProps {
  session: any;
  onLogout: () => void;
  onMobileMenuOpen: () => void;
  checkinStatus?: {
    orgHasCheckedInToday: boolean;
    hasValidCheckinReminderToday: boolean;
    reminderMessage: string | null;
  } | null;
  selectedCycleId?: string | null;
  breadcrumb?: {
    label: string;
    href?: string;
  }[];
  checkinRefreshVersion?: number;
}

interface MobileSidebarProps {
  tokenUsage: {
    usado: number;
    limite: number;
    percentual: number;
    isLoading: boolean;
  };
}

export function Header({ session, onLogout, onMobileMenuOpen, checkinNotification, selectedCycleId, breadcrumb, checkinRefreshVersion }: HeaderProps) {
  
  const cycleIdToCheck = selectedCycleId;

  const {
    orgHasCheckedInToday,
    hasValidCheckinReminderToday,
    reminderMessage,
  } = useOrgCheckinStatus(cycleIdToCheck, checkinRefreshVersion);

  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const company = useCurrentCompany();
  const companyName = useAuthStore(state => state.companyName);
  const { cycles } = useCycleStore();
  const hasCycles = cycles && cycles.length > 0;
  const { isAdmin, isChampion } = usePermissions();
  const { usado, limite, percentual, isLoading, refetch } = useTokenUsage();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (company) {
      console.log('[Updated Company]', company);
    }
  }, [company]);

  useEffect(() => {
  const handleKaiTokenUpdate = () => {
    refetch();
  };

  window.addEventListener('kai:tokens:updated', handleKaiTokenUpdate);
  return () => window.removeEventListener('kai:tokens:updated', handleKaiTokenUpdate);
}, []);

  console.log('[🔔 HEADER CHECKIN]', {
    cycleIdToCheck,
    orgHasCheckedInToday,
    hasValidCheckinReminderToday,
    reminderMessage
  });

  return (
    <header className="w-full fixed z-[10] backdrop-blur-md bg-white/30bg-white shadow-sm">
      {breadcrumb && (
        <div className="w-full bg-gray-100 border-b border-gray-200 text-gray-600 text-sm px-4 py-2">
          <nav className="max-w-7xl mx-auto flex items-center space-x-1 text-xs" aria-label="Breadcrumb">
            {breadcrumb.map((item, index) => (
              <div key={index} className="flex items-center">
                {index > 0 && <span className="mx-1 text-gray-400">/</span>}
                {item.href ? (
                  <Link to={item.href} className="hover:underline text-gray-700">
                    {item.label}
                  </Link>
                ) : (
                  <span className="text-gray-500">{item.label}</span>
                )}
              </div>
            ))}
          </nav>
        </div>
      )}
      {cycleIdToCheck && hasValidCheckinReminderToday && reminderMessage && (
        <div className="w-full bg-yellow-100 border-b border-yellow-300 text-yellow-800 px-4 py-2 text-xs font-medium text-center shadow-sm">
          <Link
            to={`/cycle/${cycleIdToCheck}`}
            className="underline hover:text-yellow-600"
          >
            {reminderMessage}
          </Link>
        </div>
      )}
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-10 py-4">
        <div className="flex items-center space-x-2">
          <Link to="/" className="flex items-center space-x-2">
            <Target className="w-8 h-8 text-blue-600" />
            <h1 className="text-lg font-bold text-gray-800">SingleKey <sup className="text-xs text-gray-400">(Beta)</sup></h1>
          </Link>
        </div>

        <div className="hidden md:flex items-center space-x-6">
          <nav  data-guide="menu-modulos" className="flex items-center space-x-6">
            <NavLink
              to="/cycles"
              className={clsx(
                'text-sm',
                location.pathname === '/' ||
                location.pathname.startsWith('/cycles') ||
                location.pathname.startsWith('/cycle')
                  ? 'text-blue-600 font-medium'
                  : 'text-gray-600 hover:text-blue-600'
              )}
            >
              Ciclos
            </NavLink>
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                clsx(
                  'text-sm',
                  isActive ? 'text-blue-600 font-medium' : 'text-gray-600 hover:text-blue-600'
                )
              }
            >
              Acompanhamento
            </NavLink>
          </nav>

          <div data-guide="menu-perfil" className="relative flex items-center space-x-2" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown((prev) => !prev)}
              className="flex items-center space-x-2 w-auto h-9 rounded-full px-3 text-blue-700 font-semibold focus:outline-none"
            >
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold">
                {session?.user?.email?.charAt(0)?.toUpperCase() ?? 'U'}
              </div>
              {company?.first_name && (
                <span className="text-sm font-medium text-gray-700">{company.first_name}</span>
              )}
            </button>

            {showDropdown && (
              <div className="absolute right-0 top-12 w-52 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                {(company?.company_name || companyName) && (
                  <div className="px-4 pt-3 pt-2 pb-2 text-xs bg-gray-100 rounded-tr-lg rounded-tl-lg border-b border-gray-100">
                    <span className="block font-semibold text-gray-400 truncate">
                      {company?.company_name || companyName}
                    </span>
                  </div>
                )}

                {!isLoading && limite > 0 && (
                  <div className="px-4 py-4 text-[11px] text-gray-600 border-b border-gray-200">
                    <div className="flex justify-between mb-1">
                      <span className="font-semibold text-gray-400">Uso da IA</span>
                      <span>{new Intl.NumberFormat('pt-BR').format(usado)} / {new Intl.NumberFormat('pt-BR').format(limite)}</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-400 transition-all duration-300"
                        style={{ width: `${percentual}%` }}
                      />
                    </div>
                  </div>
                )}

                <ul className="py-1">
                  {isAdmin && (
                    <>
                      <li>
                        <button
                          onClick={() => {
                            navigate('/admin/users');
                            setShowDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        >
                          <User className="w-4 h-4 text-gray-500" />
                          Usuários
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() => {
                            navigate('/admin/teams');
                            setShowDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        >
                          <Users className="w-4 h-4 text-gray-500" />
                          Times
                        </button>
                      </li>
                    </>
                  )}
                  <li>
                    <button
                      onClick={() => {
                        onLogout();
                        setShowDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4 text-red-500" />
                      Sair
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="md:hidden">
          <button data-guide="menu-modulos" onClick={() => onMobileMenuOpen({ usado, limite, percentual, isLoading })} aria-label="Abrir menu">
            <Menu className="w-6 h-6 text-gray-700" />
          </button>
        </div>
      </div>
    </header>
  );
}
