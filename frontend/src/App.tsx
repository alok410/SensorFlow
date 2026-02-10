import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute, getDashboardPath } from "@/components/ProtectedRoute";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminSecretaries from "./pages/admin/AdminSecretaries";
import AdminRates from "./pages/admin/AdminRates";
import AdminInvoices from "./pages/admin/AdminInvoices";
import SecretaryDashboard from "./pages/secretary/SecretaryDashboard";
import ConsumerDashboard from "./pages/consumer/ConsumerDashboard";
import NotFound from "./pages/NotFound";
import AdminLocations from "./pages/admin/AdminLocation";

const queryClient = new QueryClient();

const HomeRedirect = () => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background">Loading...</div>;
  }
  
  if (user) {
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }
  
  return <Navigate to="/login" replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><AdminUsers /></ProtectedRoute>} />
            <Route path="/admin/secretaries" element={<ProtectedRoute allowedRoles={['admin']}><AdminSecretaries /></ProtectedRoute>} />
            <Route path="/admin/rates" element={<ProtectedRoute allowedRoles={['admin']}><AdminRates /></ProtectedRoute>} />
            <Route path="/admin/invoices" element={<ProtectedRoute allowedRoles={['admin']}><AdminInvoices /></ProtectedRoute>} />
            <Route path="/admin/Locations" element={<ProtectedRoute allowedRoles={['admin']}><AdminLocations /></ProtectedRoute>} />

            
            {/* Secretary Routes */}
            <Route path="/secretary" element={<ProtectedRoute allowedRoles={['secretary']}><SecretaryDashboard /></ProtectedRoute>} />
            
            {/* Consumer Routes */}
            <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['consumer']}><ConsumerDashboard /></ProtectedRoute>} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;