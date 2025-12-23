import { useState, useEffect, lazy, Suspense } from 'react';
import { ChatView } from './components/chat/ChatView';
import { ChatInput } from './components/chat/ChatInput';
import { Settings, Users, Book, Menu, X, Loader2, LogOut, Shield, Wallet } from 'lucide-react';
import { useSettingsStore } from './store/settings';
import { useAuthStore, setupAutoSync } from './store/auth';
import { LoginScreen } from './components/auth/LoginScreen';
import { translations } from './lib/i18n';
import clsx from 'clsx';

// Lazy Load heavy components
const CharacterManager = lazy(() => import('./components/ui/CharacterManager').then(m => ({ default: m.CharacterManager })));
const SettingsPanel = lazy(() => import('./components/ui/SettingsPanel').then(m => ({ default: m.SettingsPanel })));
const LoreManager = lazy(() => import('./components/ui/LoreManager').then(m => ({ default: m.LoreManager })));
const AdminDashboard = lazy(() => import('./components/auth/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const WalletModal = lazy(() => import('./components/ui/WalletModal').then(m => ({ default: m.WalletModal })));

function App() {
  const [showManager, setShowManager] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showLore, setShowLore] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showWallet, setShowWallet] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const { language, fontFamily, model, availableModels } = useSettingsStore();
  const { user, isAuthenticated, logout, error, setError } = useAuthStore();
  const t = translations[language];

  // Get current model name for header
  const currentModelName = availableModels.find((m: any) => m.id === model)?.name || "Unknown Model";

  // Init Auto Sync
  useEffect(() => {
    setupAutoSync();
  }, []);

  // Apply Font
  useEffect(() => {
    document.documentElement.style.setProperty('--font-family', fontFamily);
    document.body.style.fontFamily = fontFamily;
  }, [fontFamily]);

  if (!isAuthenticated) {
    return <LoginScreen />;
  }
  
  // Global Error Toast
  const ErrorToast = () => {
      if (!error) return null;
      return (
          <div className="fixed bottom-4 right-4 z-[100] animate-in slide-in-from-bottom-2 fade-in">
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-3">
                  <Shield className="text-red-500" size={20} />
                  <div>
                      <h4 className="font-bold text-sm">System Alert</h4>
                      <p className="text-xs opacity-90">{error}</p>
                  </div>
                  <button onClick={() => setError(null)} className="p-1 hover:bg-red-500/20 rounded-full ml-2">
                      <X size={16} />
                  </button>
              </div>
          </div>
      );
  };

  if (showAdmin && user?.is_admin) {
      return (
          <Suspense fallback={<div className="bg-slate-950 h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" /></div>}>
              <AdminDashboard onClose={() => setShowAdmin(false)} />
              <ErrorToast />
          </Suspense>
      );
  }

  const SidebarButton = ({ icon: Icon, label, onClick, active }: any) => (
    <button 
      onClick={onClick}
      className={clsx(
        "p-3 rounded-xl transition-all group relative border border-transparent",
        active 
          ? "bg-blue-600/20 text-blue-400 border-blue-500/30 shadow-lg shadow-blue-900/20" 
          : "hover:bg-slate-800/50 text-slate-400 hover:text-slate-100 hover:border-slate-700/50 hover:scale-105 active:scale-95"
      )}
      title={label}
    >
      <Icon size={24} />
      {/* Desktop Tooltip */}
      <span className="hidden md:group-hover:block absolute left-14 top-1/2 -translate-y-1/2 bg-slate-900 px-2 py-1 rounded text-xs text-slate-200 z-50 whitespace-nowrap border border-slate-700 shadow-xl">
        {label}
      </span>
      {/* Mobile Label */}
      <span className="md:hidden absolute left-14 bg-slate-800 px-2 py-1 rounded text-sm text-slate-200 z-50 whitespace-nowrap border border-slate-700 shadow-xl">
        {label}
      </span>
    </button>
  );

  const Sidebar = () => (
    <div className={clsx(
      "fixed inset-y-0 left-0 z-30 w-64 bg-slate-950/80 backdrop-blur-xl border-r border-slate-800/50 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:w-20 md:bg-slate-900/50 md:backdrop-blur-none",
      isSidebarOpen ? "translate-x-0" : "-translate-x-full"
    )}>
      <div className="flex flex-col h-full items-center py-6 gap-4">
        {/* Mobile Close Button */}
        <div className="md:hidden w-full flex justify-end px-4 mb-2">
          <button onClick={() => setIsSidebarOpen(false)} className="text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-blue-900/20 mb-4 ring-1 ring-white/10 hover:scale-110 transition-transform cursor-default select-none">
          LT
        </div>
        
        <SidebarButton 
          icon={Users} 
          label={t.chat.import} 
          onClick={() => { setShowManager(true); setIsSidebarOpen(false); }}
          active={showManager} 
        />
        
        <SidebarButton 
          icon={Book} 
          label={t.chat.lore} 
          onClick={() => { setShowLore(true); setIsSidebarOpen(false); }}
          active={showLore}
        />
        
        <SidebarButton 
          icon={Wallet} 
          label={t.wallet?.title || "Wallet"} 
          onClick={() => { setShowWallet(true); setIsSidebarOpen(false); }}
          active={showWallet}
        />

        <div className="flex-1" />
        
        <SidebarButton 
          icon={Settings} 
          label="Settings"
          onClick={() => { setShowSettings(true); setIsSidebarOpen(false); }}
          active={showSettings}
        />

        {user?.is_admin && (
          <SidebarButton 
            icon={Shield} 
            label="Admin Panel"
            onClick={() => { setShowAdmin(true); setIsSidebarOpen(false); }}
            active={showAdmin}
          />
        )}

        <button 
          onClick={logout}
          className="p-3 rounded-xl hover:bg-red-900/20 text-slate-500 hover:text-red-400 transition-all border border-transparent"
          title="Logout"
        >
          <LogOut size={24} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans selection:bg-blue-500/30 relative">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 -z-10" />
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent pointer-events-none" />

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-20 backdrop-blur-sm md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative z-0">
        {/* Header */}
        <div className="h-14 border-b border-slate-800/50 flex items-center px-4 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10 justify-between md:justify-start">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden p-2 -ml-2 text-slate-400 hover:text-white"
          >
            <Menu size={24} />
          </button>
          
          <div className="flex items-center gap-3">
            <h1 className="font-semibold text-lg tracking-tight text-slate-200">{t.chat.newChat}</h1>
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {currentModelName}
            </span>
          </div>
          
          <div className="md:hidden w-8" /> {/* Spacer for centering */}
        </div>
        
        {/* Chat Area */}
        <div className="flex-1 min-h-0 flex flex-col relative">
          <ChatView />
          <ChatInput />
        </div>
      </div>

      {/* Modals with Suspense */}
      <Suspense fallback={
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <Loader2 className="animate-spin text-blue-500" size={32} />
        </div>
      }>
        {showManager && <CharacterManager onClose={() => setShowManager(false)} />}
        {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
        {showLore && <LoreManager onClose={() => setShowLore(false)} />}
        {showWallet && <WalletModal onClose={() => setShowWallet(false)} />}
      </Suspense>
      <ErrorToast />
    </div>
  )
}

export default App
