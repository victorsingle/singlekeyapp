// components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';

interface ProtectedRouteProps {
  element: JSX.Element;
  requireAdmin?: boolean;
  requireChampion?: boolean;
}

export function ProtectedRoute({ element, requireAdmin, requireChampion }: ProtectedRouteProps) {
  const { isAdmin, isChampion } = usePermissions();

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" />;
  }

  if (requireChampion && !(isAdmin || isChampion)) {
    return <Navigate to="/" />;
  }

  return element;
}
