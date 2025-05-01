import React, { useEffect, useRef, useState } from 'react';
import { Target, Menu, User, Settings, LogOut, Users, LayoutGrid } from 'lucide-react';
import { useLocation, useNavigate, NavLink, Link } from 'react-router-dom';
import { useCurrentCompany } from '../hooks/useCurrentCompany';
import clsx from 'clsx';
import { useCycleStore } from '../stores/okrCycleStore'; 

interface HeaderProps {
  session: any;
  onLogout: () => void;
  onMobileMenuOpen: () => void;
  checkinNotification?: {
    message: string;
    data?: {
      cycle_id: string;
    };
  } | null;
}

export function Header({ session, onLogout, onMobileMenuOpen, checkinNotification  }: HeaderProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const company = useCurrentCompany();
  const { cycles } = useCycleStore();
  const hasCycles = cycles && cycles.length > 0;

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
    console.log('[Updated Company]', company); // Verifique quando o estado é atualizado
  }
}, [company]);


  
  return (
    
    <header className="w-full fixed z-[20] backdrop-blur-md bg-white/30bg-white shadow-sm">
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
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-10 py-4">
        
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <Link to="/" className="flex items-center space-x-2">
            <Target className="w-8 h-8 text-blue-600" />
            <h1 className="text-lg font-bold text-gray-800">SingleKey</h1>
          </Link>
        </div>

        {/* Navegação e Avatar */}
        <div className="hidden md:flex items-center space-x-6">
          <nav className="flex items-center space-x-6">
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

          {/* Avatar */}
          <div className="relative flex items-center space-x-2" ref={dropdownRef}>
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
              {company && company.company_name && (
                <div className="px-4 pt-3 pt-2 pb-2 text-xs bg-gray-100 rounded-tr-lg rounded-tl-lg border-b border-gray-100">
                  <span className="block font-semibold text-gray-400 truncate">
                    {company.company_name}
                  </span>
                </div>
              )}
              <ul className="py-1">
          
                {/* BLOCO: PERFIL 
                <li>
                  <button
                    onClick={() => {
                      navigate('/profile');
                      setShowDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <User className="w-4 h-4 text-gray-500" />
                    Meu Perfil
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      navigate('/settings');
                      setShowDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4 text-gray-500" />
                    Configurações
                  </button>
                </li>
          
                <li><hr className="my-1 border-t border-gray-200" /></li>
                */}

                {/* BLOCO: ADMINISTRAÇÃO */}
                <li>
                  <button
                    onClick={() => {
                      navigate('/admin/users');
                      setShowDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <Users className="w-4 h-4 text-gray-500" />
                    Usuários
                  </button>
                </li>
                 {/* BLOCO: ADMINISTRAÇÃO 
                <li>
                  <button
                    onClick={() => {
                      navigate('/admin/teams');
                      setShowDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <LayoutGrid className="w-4 h-4 text-gray-500" />
                    Times
                  </button>
                </li>
          
                <li><hr className="my-1 border-t border-gray-200" /></li>

                */}
          
                {/* BLOCO: SAIR */}
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

        {/* Mobile: menu toggle */}
        <div className="md:hidden">
          <button onClick={onMobileMenuOpen} aria-label="Abrir menu">
            <Menu className="w-6 h-6 text-gray-700" />
          </button>
        </div>
      </div>
    </header>
  );
}
