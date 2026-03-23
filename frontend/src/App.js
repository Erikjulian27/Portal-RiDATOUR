import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LanguageProvider } from "./context/LanguageContext";
import { Toaster } from "./components/ui/sonner";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import LeadsPage from "./pages/LeadsPage";
import CustomersPage from "./pages/CustomersPage";
import TripsPage from "./pages/TripsPage";
import BookingsPage from "./pages/BookingsPage";
import PaymentsPage from "./pages/PaymentsPage";
import DocumentsPage from "./pages/DocumentsPage";
import UsersPage from "./pages/UsersPage";
import "./App.css";

const PrivateRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, loading, hasRole } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-700"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !hasRole(allowedRoles)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const AppRoutes = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-700"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={
        isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
      } />
      
      <Route path="/" element={
        <PrivateRoute>
          <Layout />
        </PrivateRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="leads" element={
          <PrivateRoute allowedRoles={['super_admin', 'branch_manager', 'sales', 'marketing']}>
            <LeadsPage />
          </PrivateRoute>
        } />
        <Route path="customers" element={
          <PrivateRoute allowedRoles={['super_admin', 'branch_manager', 'sales', 'marketing', 'operations']}>
            <CustomersPage />
          </PrivateRoute>
        } />
        <Route path="trips" element={
          <PrivateRoute allowedRoles={['super_admin', 'branch_manager', 'sales', 'operations']}>
            <TripsPage />
          </PrivateRoute>
        } />
        <Route path="bookings" element={
          <PrivateRoute allowedRoles={['super_admin', 'branch_manager', 'sales', 'operations']}>
            <BookingsPage />
          </PrivateRoute>
        } />
        <Route path="payments" element={
          <PrivateRoute allowedRoles={['super_admin', 'branch_manager', 'sales', 'finance']}>
            <PaymentsPage />
          </PrivateRoute>
        } />
        <Route path="documents" element={
          <PrivateRoute allowedRoles={['super_admin', 'branch_manager', 'operations']}>
            <DocumentsPage />
          </PrivateRoute>
        } />
        <Route path="users" element={
          <PrivateRoute allowedRoles={['super_admin', 'branch_manager']}>
            <UsersPage />
          </PrivateRoute>
        } />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <AppRoutes />
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}

export default App;
