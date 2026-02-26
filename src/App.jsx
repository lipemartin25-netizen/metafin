import { useEffect, useState, useRef, useCallback, lazy, Suspense } from 'react';
import { Routes, Route, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { trackPageView } from './hooks/useAnalytics';
import { useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
const Layout = lazy(() => import('./components/Layout'));
const ScreenGuardProvider = lazy(() => import('./components/ScreenGuardProvider'));
const NpsSurvey = lazy(() => import('./components/NpsSurvey'));
const OnboardingTour = lazy(() => import('./components/OnboardingTour'));
import { ErrorBoundary } from './components/ErrorBoundary';
import { NetworkBanner } from './components/NetworkBanner';

const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const SignUp = lazy(() => import('./pages/SignUp'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Transactions = lazy(() => import('./pages/Transactions'));
const AIAssistant = lazy(() => import('./pages/AIAssistant'));
const BankAccounts = lazy(() => import('./pages/BankAccounts'));
const Investments = lazy(() => import('./pages/Investments'));
const CreditCards = lazy(() => import('./pages/CreditCards'));
const Bills = lazy(() => import('./pages/Bills'));
const Goals = lazy(() => import('./pages/Goals'));
const FinancialHealth = lazy(() => import('./pages/FinancialHealth'));
const Budget = lazy(() => import('./pages/Budget'));
const NetWorth = lazy(() => import('./pages/NetWorth'));
const Simulators = lazy(() => import('./pages/Simulators'));
const Reports = lazy(() => import('./pages/Reports'));
const DeveloperAPI = lazy(() => import('./pages/DeveloperAPI'));
const Upgrade = lazy(() => import('./pages/Upgrade'));
const Settings = lazy(() => import('./pages/Settings'));
const Institutional = lazy(() => import('./pages/Institutional'));
const AiChat = lazy(() => import('./components/AiChat'));

const LoadingFallback = () => (
  <div className="flex h-screen items-center justify-center bg-[#020617]">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500"></div>
  </div>
);

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, signOut } = useAuth();

  const [showNps, setShowNps] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const inactivityTimer = useRef(null);

  const handleInactivityLogout = useCallback(async () => {
    if (isAuthenticated) {
      console.warn('Logging out due to inactivity.');
      await signOut();
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, signOut, navigate]);

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    if (isAuthenticated) {
      inactivityTimer.current = setTimeout(handleInactivityLogout, 900000);
    }
  }, [handleInactivityLogout, isAuthenticated]);

  useEffect(() => {
    trackPageView(location.pathname, document.title);
  }, [location]);

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'scroll', 'click'];
    if (isAuthenticated) {
      resetInactivityTimer();
      events.forEach(evt => window.addEventListener(evt, resetInactivityTimer));
    }
    return () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      events.forEach(evt => window.removeEventListener(evt, resetInactivityTimer));
    };
  }, [isAuthenticated, resetInactivityTimer]);

  useEffect(() => {
    const visitCount = parseInt(localStorage.getItem('sf_visits') || '0') + 1;
    localStorage.setItem('sf_visits', visitCount.toString());
    const alreadyAnswered = localStorage.getItem('sf_nps_done');
    const isAppRoute = location.pathname.startsWith('/app');
    if (visitCount >= 3 && !alreadyAnswered && isAppRoute) {
      const timer = setTimeout(() => setShowNps(true), 10000);
      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

  useEffect(() => {
    const done = localStorage.getItem('sf_onboarding_done');
    const isAppRoute = location.pathname.startsWith('/app');
    if (!done && isAppRoute) setShowOnboarding(true);
  }, [location.pathname]);

  const handleNpsClose = () => {
    setShowNps(false);
    localStorage.setItem('sf_nps_done', new Date().toISOString());
  };

  useEffect(() => {
    const handleAuthExpired = () => {
      if (isAuthenticated) {
        signOut();
        navigate('/login', { replace: true, state: { from: location.pathname, expired: true } });
      }
    };
    window.addEventListener('auth:expired', handleAuthExpired);
    window.addEventListener('metafin:session-expired', handleAuthExpired);
    return () => {
      window.removeEventListener('auth:expired', handleAuthExpired);
      window.removeEventListener('metafin:session-expired', handleAuthExpired);
    };
  }, [isAuthenticated, signOut, navigate, location.pathname]);

  const isAppRoute = location.pathname.startsWith('/app');

  useEffect(() => {
    // 🛠️ Remove permanentemente a 'Marca D'água' do Vercel e outros widgets de feedback
    const removeWatermarks = () => {
      const selectors = [
        'vercel-live-feedback',
        '#__vercel-toolbar',
        '.vercel-toolbar',
        '#vercel-live-feedback-container'
      ];
      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          el.style.display = 'none';
          el.remove();
        });
      });
    };

    const observer = new MutationObserver(removeWatermarks);
    observer.observe(document.body, { childList: true, subtree: true });
    removeWatermarks();

    return () => observer.disconnect();
  }, []);

  return (
    <Suspense fallback={<LoadingFallback />}>
      <ErrorBoundary fallbackMessage="Ocorreu um erro ao carregar a aplicação.">
        <NetworkBanner />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/hub/:slug" element={<Institutional />} />

          <Route path="/app" element={
            <ProtectedRoute>
              <ScreenGuardProvider>
                <Layout />
              </ScreenGuardProvider>
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="accounts" element={<BankAccounts />} />
            <Route path="cards" element={<CreditCards />} />
            <Route path="bills" element={<Bills />} />
            <Route path="investments" element={<Investments />} />
            <Route path="goals" element={<Goals />} />
            <Route path="budget" element={<Budget />} />
            <Route path="patrimony" element={<NetWorth />} />
            <Route path="lab" element={<Simulators />} />
            <Route path="reports" element={<Reports />} />
            <Route path="health" element={<FinancialHealth />} />
            <Route path="advisor" element={<AIAssistant />} />
            <Route path="webhooks" element={<DeveloperAPI />} />
            <Route path="upgrade" element={<Upgrade />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {isAppRoute && <AiChat />}
        {showNps && <NpsSurvey onClose={handleNpsClose} />}
        {showOnboarding && <OnboardingTour onComplete={() => setShowOnboarding(false)} />}
      </ErrorBoundary>
    </Suspense>
  );
}
