import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AdminLayout } from '../components/layout/AdminLayout';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

// Pages
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { BusesPage } from '../pages/BusesPage';
import { BusDetailPage } from '../pages/BusDetailPage';
import { DriversPage } from '../pages/DriversPage';
import { RoutesPage } from '../pages/RoutesPage';
import { StopsPage } from '../pages/StopsPage';
import { TripsPage } from '../pages/TripsPage';
import { GpsDevicesPage } from '../pages/GpsDevicesPage';
import { LiveMapPage } from '../pages/LiveMapPage';
import { StudentsPage } from '../pages/StudentsPage';
import { AnnouncementsPage } from '../pages/AnnouncementsPage';
import { ReportsPage } from '../pages/ReportsPage';
import { SettingsPage } from '../pages/SettingsPage';
import { NotFoundPage } from '../pages/NotFoundPage';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <LoadingSpinner size="lg" label="Authenticating session..." />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const AppRouter: React.FC = () => {
  const { user, isAdmin, isLoading } = useAuth();

  return (
    <Routes>
      {/* Public Login Route */}
      <Route
        path="/login"
        element={
          !isLoading && user && isAdmin ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <LoginPage />
          )
        }
      />

      {/* Protected Routes inside Admin Layout */}
      <Route
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/buses" element={<BusesPage />} />
        <Route path="/buses/:busId" element={<BusDetailPage />} />
        <Route path="/drivers" element={<DriversPage />} />
        <Route path="/routes" element={<RoutesPage />} />
        <Route path="/stops" element={<StopsPage />} />
        <Route path="/trips" element={<TripsPage />} />
        <Route path="/gps-devices" element={<GpsDevicesPage />} />
        <Route path="/live-map" element={<LiveMapPage />} />
        <Route path="/students" element={<StudentsPage />} />
        <Route path="/announcements" element={<AnnouncementsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* Catch-all 404 Route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
