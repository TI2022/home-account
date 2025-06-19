import { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useAppStore } from '@/store/useAppStore';
import { useThemeStore } from '@/store/useThemeStore';
import { AuthForm } from '@/components/auth/AuthForm';
import { Header } from '@/components/layout/Header';
import { TabNavigation } from '@/components/layout/TabNavigation';
import { HomePage } from '@/components/home/HomePage';
import { CalendarPage } from '@/components/calendar/CalendarPage';
import { AddTransactionForm } from '@/components/add/AddTransactionForm';
import { HistoryPage } from '@/components/history/HistoryPage';
import { SettingsPage } from '@/components/settings/SettingsPage';
import { BackgroundSettingsPage } from '@/components/background/BackgroundSettingsPage';
import { Toaster } from '@/components/ui/sonner';
import './App.css';

function App() {
  const { user, loading, initialize } = useAuthStore();
  const { currentTab } = useAppStore();
  const { currentTheme, getThemeById } = useThemeStore();

  useEffect(() => {
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

  if (!user) {
    return <AuthForm />;
  }

  const renderCurrentPage = () => {
    switch (currentTab) {
      case 'home':
        return <HomePage />;
      case 'calendar':
        return <CalendarPage />;
      case 'add':
        return <AddTransactionForm />;
      case 'history':
        return <HistoryPage />;
      case 'settings':
        return <SettingsPage />;
      case 'background':
        return <BackgroundSettingsPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-0">
        {renderCurrentPage()}
      </main>
      <TabNavigation />
      <Toaster />
    </div>
  );
}

export default App;