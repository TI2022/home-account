import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { useThemeStore } from '@/store/useThemeStore';
import { AuthForm } from '@/components/auth/AuthForm';
import { Header } from '@/components/layout/Header';
import { TabNavigation } from '@/components/layout/TabNavigation';
import { HomePage } from '@/components/home/HomePage';
import { CalendarPage } from '@/components/calendar/CalendarPage';
import { AddTransactionForm } from '@/components/add/AddTransactionForm';
import { SettingsPage } from '@/components/settings/SettingsPage';
import { BackgroundSettingsPage } from '@/components/background/BackgroundSettingsPage';
import { Snackbar } from '@/components/ui/sonner';
import { SavingsPage } from '@/components/savings/SavingsPage';
import { GraphPage } from '@/components/graph/GraphPage';
import { SavingsManagementPage } from '@/components/savings-management/SavingsManagementPage';
import { PersonDetailPage } from '@/components/savings-management/PersonDetailPage';
import { AccountDetailPage } from '@/components/savings-management/AccountDetailPage';
import TermsPage from '@/pages/TermsPage';
import { useAppStore } from '@/store/useAppStore';
import { useSnackbar } from '@/hooks/use-toast';
import { setSecurityHeaders, validateEnvironmentSecurity } from '@/utils/security';
import { logger } from '@/utils/logger';
import './App.css';

function App() {
  const { user, loading, initialize } = useAuthStore();
  const { currentTheme, getThemeById } = useThemeStore();

  useEffect(() => {
    // セキュリティ初期化
    try {
      setSecurityHeaders();
      validateEnvironmentSecurity();
      logger.log('Security initialization completed');
    } catch (error) {
      logger.error('Security initialization failed', error);
    }

    // 認証初期化
    initialize();
  }, [initialize]);

  useEffect(() => {
    // Apply theme on app load and theme change
    const theme = getThemeById(currentTheme);
    if (theme) {
      document.body.style.background = theme.gradient;
      document.body.style.backgroundAttachment = 'fixed';
    }
  }, [currentTheme, getThemeById]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/savings-management" element={user ? <SavingsManagementApp /> : <AuthForm />} />
        <Route path="/savings-management/:personId" element={user ? <PersonDetailApp /> : <AuthForm />} />
        <Route path="/savings-management/:personId/account/:accountId" element={user ? <AccountDetailApp /> : <AuthForm />} />
        <Route path="*" element={user ? <MainApp /> : <AuthForm />} />
      </Routes>
    </BrowserRouter>
  );
}

function MainApp() {
  const { currentTab, setCurrentTab } = useAppStore();
  const { open, message, variant } = useSnackbar();
  const location = useLocation();

  useEffect(() => {
    // Initialize tab based on current path when MainApp loads
    if (location.pathname === '/' && !currentTab) {
      // Default to calendar only if no tab is set
      setCurrentTab('calendar');
    }
  }, [location.pathname, setCurrentTab, currentTab]);
  const renderCurrentPage = () => {
    switch (currentTab) {
      case 'home':
        return <HomePage />;
      case 'calendar':
        return <CalendarPage />;
      case 'add':
        return <AddTransactionForm />;
      case 'settings':
        return <SettingsPage />;
      case 'background':
        return <BackgroundSettingsPage />;
      case 'savings':
        return <SavingsPage />;
      case 'graph':
        return <GraphPage />;
      default:
        return <CalendarPage />;
    }
  };
  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-0">
        {renderCurrentPage()}
      </main>
      <TabNavigation />
      <Snackbar open={open} message={message} variant={variant} />
    </div>
  );
}

function SavingsManagementApp() {
  const { open, message, variant } = useSnackbar();
  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-0">
        <SavingsManagementPage />
      </main>
      <TabNavigation />
      <Snackbar open={open} message={message} variant={variant} />
    </div>
  );
}

function PersonDetailApp() {
  const { open, message, variant } = useSnackbar();
  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-0">
        <PersonDetailPage />
      </main>
      <TabNavigation />
      <Snackbar open={open} message={message} variant={variant} />
    </div>
  );
}

function AccountDetailApp() {
  const { open, message, variant } = useSnackbar();
  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-0">
        <AccountDetailPage />
      </main>
      <TabNavigation />
      <Snackbar open={open} message={message} variant={variant} />
    </div>
  );
}

export default App;