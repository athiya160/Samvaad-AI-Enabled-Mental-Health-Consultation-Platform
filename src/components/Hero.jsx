import React from 'react';
import { Sparkles, ShieldCheck, HeartHandshake, ArrowRight, CheckCircle2, IndianRupee, Users, Shield, MessageSquare, Heart, Lock } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function Hero({ onStartChat, onBrowseDoctors }) {
  const { t, language } = useLanguage();

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-[#f5f8f6] via-[#faf8f5] to-[#fbfaf8] pt-10 pb-16 sm:pt-16 sm:pb-24 border-b border-stone-200/60">
      
      {/* Ambient background glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-96 bg-gradient-to-tr from-sage-200/25 via-emerald-100/20 to-lavender-100/20 blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-40 right-10 w-72 h-72 bg-emerald-200/15 rounded-full blur-2xl pointer-events-none -z-10" />
      <div className="absolute top-20 left-10 w-64 h-64 bg-amber-100/20 rounded-full blur-2xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 border border-emerald-200/80 text-emerald-900 text-xs sm:text-sm font-bold mb-6 shadow-soft-sm backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse-gentle" />
            <span>{t('heroBadge')}</span>
            <span className="text-stone-300">•</span>
            <span className="text-emerald-700 font-semibold">
              {language === 'kn' ? 'ಅನಾಮಧೇಯ ಮತ್ತು ಗೌಪ್ಯ' : 'Anonymous & Confidential'}
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.12] mb-6">
            {t('heroTitle')}
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-8 max-w-2xl mx-auto font-normal">
            {t('heroSubtitle')}
          </p>

          {/* Call-To-Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 mb-10">
            <button
              onClick={onStartChat}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-sage-700 via-sage-600 to-emerald-600 hover:from-sage-800 hover:to-emerald-700 text-white font-black text-sm sm:text-base shadow-soft-lg shadow-sage-900/20 hover:shadow-glow-sage hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2.5 group cursor-pointer"
            >
              <Sparkles className="w-5 h-5 text-emerald-200 group-hover:rotate-12 transition-transform" />
              <span>{t('heroCtaTalk')}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={onBrowseDoctors}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white hover:bg-stone-50 text-slate-800 font-bold text-sm sm:text-base border border-stone-200 shadow-soft-sm hover:border-stone-300 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Users className="w-5 h-5 text-emerald-700" />
              <span>{t('heroCtaDoctors')}</span>
            </button>
          </div>

          {/* Affordability & Trust Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t border-stone-200/70 max-w-2xl mx-auto">
            <div className="flex items-center justify-center sm:justify-start gap-2 text-xs sm:text-sm text-slate-700 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{t('heroPill1')}</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-slate-700 font-semibold">
              <IndianRupee className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{t('heroPill2')}</span>
            </div>
            <div className="flex items-center justify-center sm:justify-end gap-2 text-xs sm:text-sm text-slate-700 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{t('heroPill3')}</span>
            </div>
          </div>
        </div>

        {/* Comparison Callout Card */}
        <div className="mt-14 max-w-4xl mx-auto bg-white/95 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-soft-xl border border-stone-200/80">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            
            <div className="md:col-span-1 text-center md:text-left border-b md:border-b-0 md:border-r border-stone-200 pb-4 md:pb-0 md:pr-6">
              <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/80">
                {language === 'kn' ? 'ನಮ್ಮ ದೃಷ್ಟಿಕೋನ' : 'The Mission'}
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-2.5 leading-snug">
                {language === 'kn' ? 'ಪ್ರತಿಯೊಬ್ಬರಿಗೂ ಮಾನಸಿಕ ಆರೋಗ್ಯ' : 'Mental Health for Every Indian'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                {language === 'kn' ? 'ಅಖಿಲ ಭಾರತ ಬಹು-ತಜ್ಞರ ಜಾಲ (< ₹500)' : 'Pan-India Multi-Consultant Network (< ₹500)'}
              </p>
            </div>

            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Market comparison */}
              <div className="p-4 sm:p-5 rounded-2xl bg-rose-50/60 border border-rose-200/70 shadow-soft-sm">
                <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider block">
                  {language === 'kn' ? 'ಸಾಮಾನ್ಯ ಮಾರುಕಟ್ಟೆ ದರ' : 'Typical Private Rates'}
                </span>
                <p className="text-2xl sm:text-3xl font-black text-rose-900 mt-1 line-through opacity-70">
                  ₹1,500 – ₹2,500+
                </p>
                <p className="text-xs text-rose-700 mt-1 font-medium leading-relaxed">
                  {language === 'kn' ? 'ಸಾಮಾನ್ಯ ಜನರಿಗೆ ಭರಿಸಲು ಕಷ್ಟ' : 'Cost barrier forces thousands to delay care until crisis.'}
                </p>
              </div>

              {/* Samvaad Standard */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-300/80 shadow-soft-sm">
                <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider block">
                  {language === 'kn' ? 'ಸಂವಾದ ವೇದಿಕೆಯ ದರ' : 'Samvaad Pan-India Rate'}
                </span>
                <p className="text-2xl sm:text-3xl font-black text-emerald-800 mt-1">
                  &lt; ₹500
                </p>
                <p className="text-xs text-emerald-800 mt-1 font-semibold leading-relaxed">
                  {language === 'kn' ? 'ಚಾಟ್ ₹299 • ಆಡಿಯೋ ₹399 • ವಿಡಿಯೋ ₹499' : 'Chat ₹299 • Audio ₹399 • Video ₹499'}
                </p>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
