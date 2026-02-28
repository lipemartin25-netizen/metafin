import { useEffect, useState, lazy, Suspense } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { trackPageView } from './hooks/useAnalytics';
import { useSessionVisit } from './hooks/useSessionVisit';

// Componentes carregados imediatamente (críticos)
import Home from './pages/Home';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import NpsSurvey from './components/NpsSurvey';
import PageLoader from './components/PageLoader';

// Lazy load das páginas do app (não críticas)
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Transactions = lazy(() => import('./pages/Transactions'));
const AIAssistant = lazy(() => import('./pages/AIAssistant'));
const BankAccounts = lazy(() => import('./pages/BankAccounts'));
const CreditCards = lazy(() => import('./pages/CreditCards'));
const Bills = lazy(() => import('./pages/Bills'));
const Investments = lazy(() => import('./pages/Investments'));
const NetWorth = lazy(() => import('./pages/NetWorth'));
const FinancialHealth = lazy(() => import('./pages/FinancialHealth'));
const Budget = lazy(() => import('./pages/Budget'));
const Goals = lazy(() => import('./pages/Goals'));
const Reports = lazy(() => import('./pages/Reports'));
const Simulators = lazy(() => import('./pages/Simulators'));
const Upgrade = lazy(() => import('./pages/Upgrade'));
const Settings = lazy(() => import('./pages/Settings'));
const Webhooks = lazy(() => import('./pages/Webhooks'));

// Lazy load do chat (componente pesado)
const AiChat = lazy(() => import('./components/AiChat'));

export default function App() {
 const location = useLocation();
 const [showNps, setShowNps] = useState(false);
 const { shouldShowNps, markNpsComplete } = useSessionVisit();

 // Track page views
 useEffect(() => {
 trackPageView(location.pathname, document.title);
 }, [location]);

 // NPS Survey logic
 useEffect(() => {
 const isAppRoute = location.pathname.startsWith('/app');

 if (shouldShowNps(3) && isAppRoute) {
 const timer = setTimeout(() => setShowNps(true), 15000); // 15s delay
 return () => clearTimeout(timer);
 }
 }, [location.pathname, shouldShowNps]);

 const handleNpsClose = () => {
 setShowNps(false);
 markNpsComplete();
 };

 const isAppRoute = location.pathname.startsWith('/app');

 return (
 <div className="min-h-screen bg-[#06060a] text-content-primary">
 <Suspense fallback={<PageLoader message="Carregando..." />}>
 <Routes>
 {/* Rotas públicas */}
 <Route path="/" element={<Home />} />
 <Route path="/login" element={<Login />} />
 <Route path="/signup" element={<SignUp />} />

 {/* Rotas protegidas do app */}
 <Route
 path="/app"
 element={
 <ProtectedRoute>
 <Layout />
 </ProtectedRoute>
 }
 >
 <Route
 index
 element={
 <Suspense fallback={<PageLoader message="Carregando dashboard..." />}>
 <Dashboard />
 </Suspense>
 }
 />
 <Route
 path="transactions"
 element={
 <Suspense fallback={<PageLoader message="Carregando transações..." />}>
 <Transactions />
 </Suspense>
 }
 />
 <Route
 path="accounts"
 element={
 <Suspense fallback={<PageLoader message="Carregando contas..." />}>
 <BankAccounts />
 </Suspense>
 }
 />
 <Route
 path="cards"
 element={
 <Suspense fallback={<PageLoader message="Carregando cartões..." />}>
 <CreditCards />
 </Suspense>
 }
 />
 <Route
 path="bills"
 element={
 <Suspense fallback={<PageLoader message="Carregando faturas..." />}>
 <Bills />
 </Suspense>
 }
 />
 <Route
 path="investments"
 element={
 <Suspense fallback={<PageLoader message="Carregando investimentos..." />}>
 <Investments />
 </Suspense>
 }
 />
 <Route
 path="patrimony"
 element={
 <Suspense fallback={<PageLoader message="Carregando patrimônio..." />}>
 <NetWorth />
 </Suspense>
 }
 />
 <Route
 path="health"
 element={
 <Suspense fallback={<PageLoader message="Analisando saúde financeira..." />}>
 <FinancialHealth />
 </Suspense>
 }
 />
 <Route
 path="budget"
 element={
 <Suspense fallback={<PageLoader message="Carregando orçamento..." />}>
 <Budget />
 </Suspense>
 }
 />
 <Route
 path="goals"
 element={
 <Suspense fallback={<PageLoader message="Carregando metas..." />}>
 <Goals />
 </Suspense>
 }
 />
 <Route
 path="reports"
 element={
 <Suspense fallback={<PageLoader message="Gerando relatórios..." />}>
 <Reports />
 </Suspense>
 }
 />
 <Route
 path="advisor"
 element={
 <Suspense fallback={<PageLoader message="Despertando IA..." />}>
 <AIAssistant />
 </Suspense>
 }
 />
 <Route
 path="lab"
 element={
 <Suspense fallback={<PageLoader message="Abrindo laboratório wealth..." />}>
 <Simulators />
 </Suspense>
 }
 />
 <Route
 path="upgrade"
 element={
 <Suspense fallback={<PageLoader message="Carregando planos..." />}>
 <Upgrade />
 </Suspense>
 }
 />
 <Route
 path="settings"
 element={
 <Suspense fallback={<PageLoader message="Carregando configurações..." />}>
 <Settings />
 </Suspense>
 }
 />
 <Route
 path="webhooks"
 element={
 <Suspense fallback={<PageLoader message="Carregando webhooks..." />}>
 <Webhooks />
 </Suspense>
 }
 />
 </Route>

 {/* Fallback para rotas não encontradas */}
 <Route path="*" element={<Navigate to="/" replace />} />
 </Routes>

 {/* AI Chat FAB - apenas no app */}
 {isAppRoute && (
 <Suspense fallback={null}>
 <AiChat />
 </Suspense>
 )}

 {/* NPS Survey */}
 {showNps && <NpsSurvey onClose={handleNpsClose} />}
 </Suspense>
 </div>
 );
}
