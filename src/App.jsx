import { useEffect, useState, useRef, useCallback } from 'react';
import { Routes, Route, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { trackPageView } from './hooks/useAnalytics';
import { useAuth } from './contexts/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import NpsSurvey from './components/NpsSurvey';
import OnboardingTour from './components/OnboardingTour';

import AIAssistant from './pages/AIAssistant';
import BankAccounts from './pages/BankAccounts';
import Investments from './pages/Investments';
import CreditCards from './pages/CreditCards';
import Bills from './pages/Bills';
import Goals from './pages/Goals';
import FinancialHealth from './pages/FinancialHealth';
import Budget from './pages/Budget';
import NetWorth from './pages/NetWorth';
import Simulators from './pages/Simulators';
import Reports from './pages/Reports';
import DeveloperAPI from './pages/DeveloperAPI';
import Upgrade from './pages/Upgrade';
import AiChat from './components/AiChat';
import Settings from './pages/Settings';

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, signOut } = useAuth();

  const [showNps, setShowNps] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Fintech Compliance: Inactivity Logout (15 minutes = 900,000 ms)
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
      inactivityTimer.current = setTimeout(handleInactivityLogout, 900000); // 15 mins
    }
  }, [handleInactivityLogout, isAuthenticated]);

  useEffect(() => {
    trackPageView(location.pathname, document.title);
  }, [location]);

  // Attach global inactivity listeners when authenticated
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

  // NPS survey trigger
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

  // Onboarding trigger — only on first visit to /app
  useEffect(() => {
    const done = localStorage.getItem('sf_onboarding_done');
    const isAppRoute = location.pathname.startsWith('/app');
    if (!done && isAppRoute) {
      setShowOnboarding(true);
    }
  }, [location.pathname]);

  const handleNpsClose = () => {
    setShowNps(false);
    localStorage.setItem('sf_nps_done', new Date().toISOString());
  };

  const isAppRoute = location.pathname.startsWith('/app');

  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/app" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="accounts" element={<BankAccounts />} />
          <Route path="cards" element={<CreditCards />} />
          <Route path="bills" element={<Bills />} />
          <Route path="investments" element={<Investments />} />
          <Route path="goals" element={<Goals />} />
          <Route path="budget" element={<Budget />} />
          <Route path="networth" element={<NetWorth />} />
          <Route path="wealth" element={<Simulators />} />
          <Route path="reports" element={<Reports />} />
          <Route path="health" element={<FinancialHealth />} />
          <Route path="advisor" element={<AIAssistant />} />
          <Route path="api" element={<DeveloperAPI />} />
          <Route path="upgrade" element={<Upgrade />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* AI Chat FAB — só no app */}
      {isAppRoute && <AiChat />}

      {showNps && <NpsSurvey onClose={handleNpsClose} />}

      {showOnboarding && <OnboardingTour onComplete={() => setShowOnboarding(false)} />}
    </>
  );
}
