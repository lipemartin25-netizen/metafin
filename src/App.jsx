import { useEffect, useState } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { trackPageView } from './hooks/useAnalytics';
import Home from './pages/Home';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import NpsSurvey from './components/NpsSurvey';

import AIAssistant from './pages/AIAssistant';
import BankAccounts from './pages/BankAccounts';
import Investments from './pages/Investments';
import Upgrade from './pages/Upgrade';
import AiChat from './components/AiChat';

export default function App() {
  const location = useLocation();
  const [showNps, setShowNps] = useState(false);

  useEffect(() => {
    trackPageView(location.pathname, document.title);
  }, [location]);

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
          <Route path="investments" element={<Investments />} />
          <Route path="advisor" element={<AIAssistant />} />
          <Route path="upgrade" element={<Upgrade />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* AI Chat FAB — só no app */}
      {isAppRoute && <AiChat />}

      {showNps && <NpsSurvey onClose={handleNpsClose} />}
    </>
  );
}
