
import React, { useState, useRef, useEffect } from 'react';
import { Hexagon, User, Menu, FileText, X, LayoutGrid, LogOut, ShieldAlert, ChevronDown, Sparkles, PlusCircle, Download, Key, LogIn } from 'lucide-react';
import { UserProfile } from '../types';
import { PurchaseModal } from './PurchaseModal';
import { getBalance } from '../services/paymentService';
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from './LanguageSelector';

interface NavigationProps {
  onNavigateToArchive?: () => void;
  onNavigateToStudio?: () => void;
  onUploadProject?: () => void;
  onLogin?: () => void;
  onSignOut?: () => void;
  onAdminDashboard?: () => void;
  onNavigateToEngine1?: () => void;
  onNavigateToEngine2?: () => void;
  onNavigateToEngine3?: () => void;
  onNavigateToEngine4?: () => void;
  onNavigateToPricing?: () => void;
  currentView?: string;
  userProfile: UserProfile | null;
  showInstallBtn?: boolean;
  onInstallApp?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  onNavigateToArchive,
  onNavigateToStudio,
  onUploadProject,
  onLogin,
  onSignOut,
  onAdminDashboard,
  onNavigateToEngine1,
  onNavigateToEngine2,
  onNavigateToEngine3,
  onNavigateToEngine4,
  onNavigateToPricing,
  currentView,
  userProfile,
  showInstallBtn,
  onInstallApp
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [balance, setBalance] = useState(0);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Hook de traducción
  const { t, i18n } = useTranslation();

  useEffect(() => {
    if (userProfile) {
      getBalance().then(setBalance);
      const interval = setInterval(() => getBalance().then(setBalance), 5000);
      return () => clearInterval(interval);
    }
  }, [userProfile]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNav = (action: string) => {
    if (action === 'STUDIO' && onNavigateToStudio) onNavigateToStudio();
    if (action === 'ARCHIVE' && onNavigateToArchive) onNavigateToArchive();
    if (action === 'LOGIN' && onLogin) onLogin();

    // Handle engines/motors
    if (action === 'ENGINE_1' && onNavigateToEngine1) onNavigateToEngine1();
    if (action === 'ENGINE_2' && onNavigateToEngine2) onNavigateToEngine2();
    if (action === 'ENGINE_3' && onNavigateToEngine3) onNavigateToEngine3();
    if (action === 'ENGINE_4' && onNavigateToEngine4) onNavigateToEngine4();
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/5 h-16 flex items-center justify-between px-6 md:px-12 pointer-events-none">

        {/* LOGO */}
        <div className="pointer-events-auto cursor-pointer" onClick={() => handleNav('STUDIO')}>
          <div className="text-[1.4rem] font-[900] tracking-tighter text-white leading-none">
            LUX<span className="text-lumen-gold">SCALER</span>
          </div>
        </div>

        {/* ACTIONS CONTAINER */}
        <div className="flex items-center gap-4 md:gap-6 pointer-events-auto">

          {/* 4 MOTORES (Desktop only - Hidden on mobile) */}
          <div className="hidden md:flex items-center gap-1">
            {[
              { id: 'ENGINE_1', name: t('nav.engines.photo') },
              { id: 'ENGINE_2', name: t('nav.engines.style') },
              { id: 'ENGINE_3', name: t('nav.engines.light') },
              { id: 'ENGINE_4', name: t('nav.engines.up') },
            ].map((motor) => (
              <button
                key={motor.id}
                onClick={() => handleNav(motor.id)}
                className={`px-3 py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${currentView === motor.id
                  ? 'text-black bg-lumen-gold'
                  : 'text-gray-500 hover:text-white hover:bg-white/5'
                  }`}
              >
                {motor.name}
              </button>
            ))}
          </div>

          {/* USER CONTEXT */}
          <div className="flex items-center gap-1">

            {/* LANGUAGE SELECTOR - Dropdown con banderas */}
            <LanguageSelector variant="desktop" className="hidden md:block mr-2" />

            {userProfile && (
              <>
                <div className="hidden md:block w-px h-4 bg-white/10 mx-2" />
                <button
                  onClick={() => handleNav('ARCHIVE')}
                  className="hidden md:block px-3 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors text-gray-500 hover:text-white hover:bg-white/5"
                >
                  {t('nav.archive')}
                </button>

                <div className="md:w-px md:h-4 md:bg-white/10 md:mx-4 hidden md:block" />

                <button
                  onClick={() => onUploadProject?.()}
                  className="hidden md:flex items-center gap-2 bg-lumen-gold text-black px-4 py-2 rounded-full font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_15px_rgba(212,175,55,0.3)]"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>{t('nav.upload_project')}</span>
                </button>

                <div
                  onClick={() => setShowPurchaseModal(true)}
                  className="flex items-center gap-1.5 md:gap-2 bg-white/5 border border-white/10 px-2 md:px-3 py-1 md:py-1.5 rounded-full cursor-pointer hover:bg-white/10 hover:border-lumen-gold/50 transition-all group"
                >
                  <span className="text-xs md:text-sm font-bold text-white group-hover:text-lumen-gold">{balance}</span>
                  <span className="text-[8px] md:text-[10px] font-bold text-gray-400 group-hover:text-lumen-gold uppercase tracking-tighter font-mono">TKN</span>
                  <PlusCircle className="w-2.5 h-2.5 md:w-3 h-3 text-gray-500 group-hover:text-lumen-gold" />
                </div>
              </>
            )}

            {/* PROFILE / LOGIN / DROPDOWN */}
            <div className="relative ml-2" ref={userMenuRef}>
              {userProfile ? (
                <>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white p-2 md:px-4 md:py-2 rounded-full transition-all border border-transparent hover:border-lumen-gold/30 shadow-lg"
                  >
                    <User className="w-4 h-4" />
                    <span className="text-xs font-bold hidden md:block">{(userProfile.full_name || 'User').split(' ')[0]}</span>
                    <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform hidden md:block ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* DESKTOP DROPDOWN */}
                  {isUserMenuOpen && (
                    <div className="hidden md:block absolute top-full right-0 mt-3 w-64 bg-[#0a0a0a]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden z-[110] animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="px-5 py-4 border-b border-white/5 bg-white/[0.02]">
                        <p className="text-sm text-white font-bold truncate">{userProfile.full_name}</p>
                        <p className="text-[10px] text-lumen-gold truncate font-mono uppercase tracking-widest mt-1">
                          {userProfile.subscription_tier === 'free' ? 'Operador Estándar' : 'Operador PRO'}
                        </p>
                      </div>

                      <button
                        onClick={() => { setIsUserMenuOpen(false); setShowPurchaseModal(true); }}
                        className="w-full text-left px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.2em] text-lumen-gold hover:bg-white/5 flex items-center justify-between border-b border-white/5"
                      >
                        <span>{t('nav.recharge_tokens')}</span>
                        <PlusCircle className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => { setIsUserMenuOpen(false); handleNav('ARCHIVE'); }}
                        className="w-full text-left px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white hover:bg-white/5 flex items-center justify-between border-b border-white/5"
                      >
                        <span>{t('nav.archive')}</span>
                        <FileText className="w-4 h-4" />
                      </button>

                      {userProfile.is_admin && (
                        <button
                          onClick={() => { setIsUserMenuOpen(false); onAdminDashboard?.(); }}
                          className="w-full text-left px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#ff3b3b] hover:bg-white/5 flex items-center justify-between border-b border-white/5"
                        >
                          <span>{t('common.admin_dashboard')}</span>
                          <ShieldAlert className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() => { setIsUserMenuOpen(false); onSignOut?.(); }}
                        className="w-full text-left px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 hover:text-white hover:bg-white/5 flex items-center justify-between"
                      >
                        <span>{t('common.logout')}</span>
                        <LogOut className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <button
                  className="bg-lumen-gold text-black px-4 py-2 md:px-6 md:py-3 rounded-full font-black text-[10px] md:text-xs hover:scale-105 transition-all uppercase tracking-widest flex items-center gap-2 shadow-[0_0_20px_rgba(212,175,55,0.2)]"
                  onClick={() => handleNav('LOGIN')}
                  data-testid="login-button"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{t('nav.login')}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* MOBILE DOCK - MODERN FLOATING NAVIGATION */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-[400px] pointer-events-auto">
        <div className="bg-[#121212]/90 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-2 h-20 shadow-[0_20px_50px_rgba(0,0,0,1)] flex items-center justify-around relative ring-1 ring-white/10">

          <button
            onClick={() => handleNav('STUDIO')}
            className={`flex flex-col items-center gap-1.5 transition-all px-4 ${currentView === 'HOME' ? 'text-lumen-gold' : 'text-gray-500'}`}
          >
            <LayoutGrid className={`w-6 h-6 ${currentView === 'HOME' ? 'animate-pulse' : ''}`} />
            <span className="text-[9px] font-black uppercase tracking-tighter">Studio</span>
          </button>

          {/* CENTRAL MOTOR ENGINE (PhotoScaler focus) */}
          <div className="relative -mt-10 group">
            <div className="absolute -inset-4 bg-lumen-gold/20 rounded-full blur-2xl group-active:blur-3xl transition-all" />
            <button
              onClick={() => handleNav('ENGINE_1')}
              className="w-16 h-16 rounded-full bg-gradient-to-br from-lumen-gold via-[#b3912e] to-black flex items-center justify-center text-black shadow-[0_10px_30px_rgba(212,175,55,0.4)] relative z-10 active:scale-90 transition-transform"
            >
              <PlusCircle className="w-8 h-8" />
            </button>
          </div>

          <button
            onClick={() => handleNav('ARCHIVE')}
            className={`flex flex-col items-center gap-1.5 transition-all px-4 ${currentView === 'ARCHIVES' ? 'text-lumen-gold' : 'text-gray-500'}`}
          >
            <Sparkles className="w-6 h-6" />
            <span className="text-[9px] font-black uppercase tracking-tighter">Lab</span>
          </button>

          {/* MOBILE DROPDOWN TRIGGER (Profile) */}
          {userProfile && isUserMenuOpen && (
            <div className="absolute bottom-24 left-0 right-0 p-2 animate-in slide-in-from-bottom-4 duration-300">
              <div className="bg-black/90 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                <div className="px-5 py-4 border-b border-white/5 bg-white/[0.02]">
                  <p className="text-sm text-white font-bold">{userProfile.full_name}</p>
                  <p className="text-[10px] text-lumen-gold font-mono uppercase tracking-widest mt-1">
                    {userProfile.subscription_tier === 'free' ? 'Operador Estándar' : 'Operador PRO'}
                  </p>
                </div>

                {/* MOBILE LANGUAGE SELECTOR */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{t('common.language')}</span>
                  <div className="flex items-center gap-3 bg-white/5 rounded-full px-3 py-1">
                    <button
                      onClick={() => i18n.changeLanguage('es')}
                      className={`text-[10px] font-bold transition-colors ${i18n.language.startsWith('es') ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                      ES
                    </button>
                    <div className="w-px h-3 bg-white/20"></div>
                    <button
                      onClick={() => i18n.changeLanguage('en')}
                      className={`text-[10px] font-bold transition-colors ${i18n.language.startsWith('en') ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                      EN
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => { setIsUserMenuOpen(false); setShowPurchaseModal(true); }}
                  className="w-full text-left px-5 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-lumen-gold hover:bg-white/5 flex items-center justify-between"
                >
                  <span>{t('nav.recharge_tokens')}</span>
                  <PlusCircle className="w-4 h-4" />
                </button>

                {userProfile.is_admin && (
                  <button
                    onClick={() => { setIsUserMenuOpen(false); onAdminDashboard?.(); }}
                    className="w-full text-left px-5 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[#ff3b3b] hover:bg-white/5 flex items-center justify-between border-t border-white/5"
                  >
                    <span>{t('common.admin_dashboard')}</span>
                    <ShieldAlert className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => { setIsUserMenuOpen(false); onSignOut?.(); }}
                  className="w-full text-left px-5 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 hover:text-white hover:bg-white/5 flex items-center justify-between"
                >
                  <span>{t('common.logout')}</span>
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <PurchaseModal isOpen={showPurchaseModal} onClose={() => setShowPurchaseModal(false)} onSuccess={() => {
        getBalance().then(setBalance);
      }} />
    </>
  );
};
