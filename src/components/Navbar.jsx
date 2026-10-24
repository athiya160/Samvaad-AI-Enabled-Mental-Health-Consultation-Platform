import React from 'react';
import { Heart, Globe, Stethoscope, User, Sparkles, FileText } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function Navbar({ activeTab, setActiveTab, currentUser, pseudoUser, onOpenVault, onOpenLogin, onOpenPseudoModal, onOpenSpecsDoc }) {
  const { language, toggleLanguage, t } = useLanguage();

  const user = currentUser || pseudoUser;

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-stone-200/70 transition-all no-print shadow-soft-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Brand Logo */}
          <div 
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-sage-700 via-sage-600 to-emerald-600 text-white flex items-center justify-center shadow-soft-md shadow-sage-900/15 group-hover:scale-105 group-hover:shadow-glow-sage transition-all duration-300">
              <Heart className="w-5 h-5 sm:w-5.5 sm:h-5.5 fill-white/20 animate-pulse-gentle" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 group-hover:text-sage-700 transition-colors">
                  {t('brandName')}
                </span>
                <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200/80 shadow-2xs uppercase tracking-wider">
                  Pan-India
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-500 hidden sm:block">
                {language === 'kn' ? 'ಕೈಗೆಟುಕುವ ಮಾನಸಿಕ ಆರೋಗ್ಯ ಸೇವೆ (< ₹500)' : 'Subsidized Mental Health Platform (< ₹500)'}
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 bg-stone-100/80 p-1.5 rounded-2xl border border-stone-200/70 shadow-inner">
            <button
              onClick={() => setActiveTab('home')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
                activeTab === 'home'
                  ? 'bg-white text-slate-900 shadow-soft-sm scale-[1.02]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              {language === 'kn' ? 'ಮುಖಪುಟ' : 'Home'}
            </button>

            <button
              onClick={() => setActiveTab('chat')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'chat'
                  ? 'bg-gradient-to-r from-sage-600 to-emerald-600 text-white shadow-soft-md shadow-sage-900/20 scale-[1.02]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
              <span>{t('navAiCompanion')}</span>
            </button>

            <button
              onClick={() => setActiveTab('doctors')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'doctors'
                  ? 'bg-white text-slate-900 shadow-soft-sm scale-[1.02]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <span>{t('navConsultants')}</span>
            </button>

            <button
              onClick={() => setActiveTab('therapy-tools')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
                activeTab === 'therapy-tools'
                  ? 'bg-white text-slate-900 shadow-soft-sm scale-[1.02]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <span>{t('navTherapyTools')}</span>
            </button>
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
            {/* Clinical Proposal & Specs Doc Button */}
            <button
              onClick={onOpenSpecsDoc}
              className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-200/90 bg-white hover:bg-stone-50 text-slate-700 text-xs font-bold transition-all duration-150 shadow-soft-sm hover:border-stone-300 cursor-pointer"
              title="Open Official Project Proposal & Specifications Document"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-700" />
              <span>{t('proposalSpecs')}</span>
            </button>

            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl border border-stone-200/90 bg-white hover:bg-stone-50 text-slate-700 text-xs font-bold shadow-soft-sm hover:border-stone-300 transition-all duration-150 cursor-pointer"
              title="Switch Language (English / ಕನ್ನಡ)"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-600" />
              <span>{language === 'en' ? 'ಕನ್ನಡ' : 'English'}</span>
            </button>

            {/* Authenticated Vault / My Account or Returning User Sign In */}
            {user ? (
              <button
                onClick={onOpenVault || onOpenPseudoModal}
                className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-sage-50 border border-sage-200 text-sage-900 text-xs font-bold hover:bg-sage-100 transition-colors cursor-pointer shadow-soft-sm"
                title="Open My Account"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{user.nickname || user.displayName || user.alias || 'User'}</span>
                <span className="text-[10px] text-slate-400 font-normal">| My Account</span>
              </button>
            ) : (
              <button
                onClick={onOpenLogin || onOpenPseudoModal}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer shadow-soft-sm"
                title="Returning users can sign in to view saved reflections"
              >
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>{language === 'kn' ? 'ಲಾಗಿನ್' : 'Sign In'}</span>
              </button>
            )}

            {/* Consultant Portal Switcher */}
            <button
              onClick={() => setActiveTab('doctor-portal')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-soft-sm ${
                activeTab === 'doctor-portal'
                  ? 'bg-slate-900 text-white shadow-soft-md scale-[1.02]'
                  : 'bg-emerald-50 border border-emerald-300/80 text-emerald-900 hover:bg-emerald-100'
              }`}
            >
              <Stethoscope className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">{t('consultantPortal')}</span>
              <span className="sm:hidden">{language === 'kn' ? 'ತಜ್ಞರು' : 'Consultant'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sub-Bar */}
      <div className="md:hidden flex items-center justify-around border-t border-stone-200/80 bg-white/95 px-2 py-2.5 text-xs shadow-soft-sm">
        <button
          onClick={() => setActiveTab('home')}
          className={`px-2.5 py-1.5 rounded-lg font-bold transition-colors ${activeTab === 'home' ? 'text-sage-700 bg-sage-50' : 'text-slate-600'}`}
        >
          {t('home')}
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1 font-bold transition-colors ${activeTab === 'chat' ? 'text-emerald-700 bg-emerald-50' : 'text-slate-600'}`}
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>{t('auraChat')}</span>
        </button>
        <button
          onClick={() => setActiveTab('doctors')}
          className={`px-2.5 py-1.5 rounded-lg font-bold transition-colors ${activeTab === 'doctors' ? 'text-sage-700 bg-sage-50' : 'text-slate-600'}`}
        >
          {t('doctors')}
        </button>
        <button
          onClick={() => setActiveTab('therapy-tools')}
          className={`px-2.5 py-1.5 rounded-lg font-bold transition-colors ${activeTab === 'therapy-tools' ? 'text-sage-700 bg-sage-50' : 'text-slate-600'}`}
        >
          {t('tools')}
        </button>
        <button
          onClick={onOpenSpecsDoc}
          className="px-2.5 py-1.5 rounded-lg text-emerald-800 font-bold flex items-center gap-1 hover:bg-emerald-50"
        >
          <FileText className="w-3.5 h-3.5 text-emerald-600" />
          <span>{t('doc')}</span>
        </button>
      </div>
    </header>
  );
}
