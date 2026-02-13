import { useEffect } from 'react';
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
import { SavingsManagementPage } from '@/components/savings-management/SavingsManagementPage';
import { PersonDetailPage } from '@/components/savings-management/PersonDetailPage';
import { AccountDetailPage } from '@/components/savings-management/AccountDetailPage';
import { BudgetsPage } from '@/components/budgets/BudgetsPage';
import BudgetHeader from '@/components/layout/BudgetHeader';
import CategoriesPage from '@/components/settings/CategoriesPage';
import TermsPage from '@/pages/TermsPage';
import { useAppStore } from '@/store/useAppStore';
import { useSnackbar } from '@/hooks/use-toast';
import { setSecurityHeaders, validateEnvironmentSecurity } from '@/utils/security';
import { logger } from '@/utils/logger';
import './App.css';

function App() {
  const { user, loading, initialize } = useAuthStore();
  const { currentTheme, getThemeById } = useThemeStore();
  const { currentScreen } = useAppStore();

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

  // ローディング中
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  // 未認証
  if (!user) {
    return <AuthForm />;
  }

  // 利用規約画面（直接URLアクセスの場合のみ表示）
  if (typeof window !== 'undefined' && window.location.pathname === '/terms') {
    return <TermsPage />;
  }

  // 認証済み - 状態ベースで画面を切り替え
  switch (currentScreen) {
    case 'main':
      return <MainApp />;
    case 'savings-management':
      return <SavingsManagementApp />;
    case 'budget-management':
      return <BudgetManagementApp />;
    case 'categories-management':
      return <CategoriesManagementApp />;
    case 'person-detail':
      return <PersonDetailApp />;
    case 'account-detail':
      return <AccountDetailApp />;
    default:
      return <MainApp />;
  }
}

function BudgetManagementApp() {
  const { open, message, variant } = useSnackbar();
  return (
    <div className="min-h-screen">
      <BudgetHeader />
      <main className="pt-0">
        <BudgetsPage />
      </main>
      <TabNavigation />
      <Snackbar open={open} message={message} variant={variant} />
    </div>
  );
}

function MainApp() {
  const { currentTab, setCurrentTab } = useAppStore();
  const { open, message, variant } = useSnackbar();

  useEffect(() => {
    // デフォルトタブの設定
    if (!currentTab) {
      setCurrentTab('calendar');
    }
  }, [currentTab, setCurrentTab]);
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

function CategoriesManagementApp() {
  const { open, message, variant } = useSnackbar();
  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-0">
        <CategoriesPage />
      </main>
      <TabNavigation />
      <Snackbar open={open} message={message} variant={variant} />
    </div>
  );
}