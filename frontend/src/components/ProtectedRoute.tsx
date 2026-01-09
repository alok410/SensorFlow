import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/20" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on role
    console.log(user.role);
    
    const dashboardPath = getDashboardPath(user.role);
    return <Navigate to={dashboardPath} replace />;
    console.log(user.role);
  }

  return <>{children}</>;
};

export const getDashboardPath = (role: UserRole): string => {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'secretary':
      return '/secretary';
    case 'consumer':
      return '/dashboard';      
    default:
      return '/login';
  }
};