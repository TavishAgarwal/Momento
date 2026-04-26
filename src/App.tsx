import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { OfferProvider } from './context/OfferContext';
import Login from './pages/Login';
import Home from './pages/Home';
import MerchantDashboard from './pages/MerchantDashboard';
import MomentsPage from './pages/MomentsPage';
import Demo from './pages/Demo';
import MyData from './pages/MyData';
import Profile from './pages/Profile';
import MerchantScanner from './pages/MerchantScanner';
import MerchantOrders from './pages/MerchantOrders';
import MerchantSettings from './pages/MerchantSettings';
import Onboarding from './pages/Onboarding';
import MerchantSetup from './pages/MerchantSetup';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import DemoCommandPanel from './components/DemoCommandPanel';
import PushNotificationManager from './components/PushNotificationManager';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

/** Redirect merchant users to /merchant, consumers stay on Home */
function HomeOrMerchant() {
  const { user } = useAuth();
  if (user?.role === 'merchant') return <Navigate to="/merchant" replace />;
  return <Home />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/demo" element={<Demo />} />
      <Route element={<Layout />}>
        {/* Shared root — redirects merchant to dashboard */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomeOrMerchant />
            </ProtectedRoute>
          }
        />

        {/* ── Consumer Routes ── */}
        <Route
          path="/moments"
          element={
            <ProtectedRoute>
              <MomentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-data"
          element={
            <ProtectedRoute>
              <MyData />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* ── Merchant Routes ── */}
        <Route
          path="/merchant"
          element={
            <ProtectedRoute>
              <MerchantDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/scanner"
          element={
            <ProtectedRoute>
              <MerchantScanner />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <MerchantOrders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <MerchantSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/merchant-setup"
          element={
            <ProtectedRoute>
              <MerchantSetup />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <OfferProvider>
            <AppRoutes />
            <DemoCommandPanel />
            <PushNotificationManager />
          </OfferProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
