import React from 'react';
import { Heart, ShieldAlert, PhoneCall, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function Footer({ onOpenCrisisModal }) {
  const { language, t } = useLanguage();

  return (
    <footer className="bg-slate-950 text-slate-400 text-xs border-t border-slate-800/80 pt-14 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          
          {/* Brand */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5 text-white font-bold text-lg">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-sage-600 via-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-soft-sm shadow-sage-500/30">
                <Heart className="w-4 h-4 fill-white/20" />
              </div>
              <span className="tracking-tight">{t('brandName')}</span>
              <span className="text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                Affordable &lt; ₹500
              </span>
            </div>

            <p className="text-slate-400 max-w-md leading-relaxed text-xs">
              {language === 'kn'
                ? 'ಭಾರತದ ಪ್ರತಿಯೊಬ್ಬ ನಾಗರಿಕರಿಗೂ ನೈತಿಕ ಮತ್ತು ಕೈಗೆಟುಕುವ ಮಾನಸಿಕ ಆರೋಗ್ಯ ಸೇವೆಯನ್ನು ಒದಗಿಸುವ ಅಖಿಲ ಭಾರತ ಟೆಲಿ-ಮಾನಸಿಕ ಆರೋಗ್ಯ ಉಪಕ್ರಮ. ಸಮಾಲೋಚನೆ ಶುಲ್ಕವನ್ನು ₹500 ಕ್ಕಿಂತ ಕಡಿಮೆ ನಿಗದಿಪಡಿಸುವ ಮೂಲಕ ಮಾನಸಿಕ ಚಿಕಿತ್ಸೆಯ ಕಳಂಕವನ್ನು ನಿವಾರಿಸುವುದು ನಮ್ಮ ಗುರಿ.'
                : 'A pan-India tele-mental health initiative dedicated to making ethical psychiatric care and psychological counseling accessible to every citizen across urban and rural Bharat. Standardizing compassionate specialist consultations under ₹500 while destigmatizing help-seeking behavior.'}
            </p>

            <div className="pt-1 text-slate-400 text-[11px] flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-sage-400"></span>
              <span>
                {language === 'kn' 
                  ? 'ಅಖಿಲ ಭಾರತ ಬಹು-ತಜ್ಞರ ಜಾಲ • ಡಾ. ಅಲನ್ ಸ್ಯಾಮ್ಯುಯೆಲ್ (ಸಲಹಾ ಮನೋವೈದ್ಯರು) ಅವರ ಕಲ್ಪನೆ.' 
                  : 'Multi-Consultant Healthcare Network • Conceptualized for Dr. Alan Samuel (Consultant Psychiatrist).'}
              </span>
            </div>
          </div>

          {/* Core Services */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3.5">
              {language === 'kn' ? 'ವೇದಿಕೆಯ ವೈಶಿಷ್ಟ್ಯಗಳು' : 'Platform Features'}
            </h4>
            <ul className="space-y-2.5 text-slate-400 text-xs">
              <li className="flex items-center gap-1.5">
                <span className="text-sage-400">•</span>
                <span>{language === 'kn' ? 'ಉಚಿತ AI ಆತ್ಮಾವಲೋಕನ ಸಹಾಯಕ (Aura)' : 'Free Conversational AI Companion (Aura)'}</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-sage-400">•</span>
                <span>{language === 'kn' ? 'ವೈಯಕ್ತಿಕ ಆತ್ಮಾವಲೋಕನ ಸಾರಾಂಶ' : 'Structured Personal Reflection Summary'}</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-sage-400">•</span>
                <span>{language === 'kn' ? 'ಅನಾಮಧೇಯ ರೋಗಿ ಸೆಷನ್‌ಗಳು' : 'Pseudo-Anonymous Patient Sessions'}</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-sage-400">•</span>
                <span>{language === 'kn' ? 'ಚಾಟ್ ಸಮಾಲೋಚನೆಗಳು (₹299)' : 'Chat Consultations (₹299)'}</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-sage-400">•</span>
                <span>{language === 'kn' ? 'ಆಡಿಯೋ ಸಮಾಲೋಚನೆಗಳು (₹399)' : 'Audio Consultations (₹399)'}</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-sage-400">•</span>
                <span>{language === 'kn' ? 'ವಿಡಿಯೋ ಸಮಾಲೋಚನೆಗಳು (₹499)' : 'Video Consultations (₹499)'}</span>
              </li>
            </ul>
          </div>

          {/* Emergency & Privacy */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3.5">
              {language === 'kn' ? 'ತುರ್ತು ಸಹಾಯವಾಣಿಗಳು' : 'Emergency & Helplines'}
            </h4>
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-emerald-300 space-y-1">
                <span className="font-bold block text-white text-[11px] tracking-wide">
                  {language === 'kn' ? '24x7 ರಾಷ್ಟ್ರೀಯ ಉಚಿತ ಸಹಾಯವಾಣಿಗಳು' : '24x7 National Crisis Helplines'}
                </span>
                <div className="text-[11px] text-emerald-400 font-mono">Tele-MANAS: 14416</div>
                <div className="text-[11px] text-emerald-400 font-mono">KIRAN: 1800-599-0019</div>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                {language === 'kn'
                  ? 'ಯಾವುದೇ ವೈದ್ಯಕೀಯ ದಾಖಲೆಗಳನ್ನು ಜಾಹೀರಾತುಗಳಿಗೆ ಮಾರಾಟ ಮಾಡಲಾಗುವುದಿಲ್ಲ. ಕಟ್ಟುನಿಟ್ಟಾದ ವೈದ್ಯ-ರೋಗಿ ಗೌಪ್ಯತೆ.'
                  : 'Zero clinical records are sold or used for ad targeting. Strict patient-doctor confidentiality.'}
              </p>
            </div>
          </div>

        </div>

        {/* Disclaimer Bar */}
        <div className="pt-8 border-t border-slate-800/80 text-[11px] text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>
            {language === 'kn'
              ? `© ${new Date().getFullYear()} ಸಂವಾದ ಹೆಲ್ತ್ • ಡಾ. ಅಲನ್ ಸ್ಯಾಮ್ಯುಯೆಲ್ ಅವರ ಅಖಿಲ ಭಾರತ ಮಾನಸಿಕ ಆರೋಗ್ಯ ಜಾಲದ ಪ್ರಾತ್ಯಕ್ಷಿಕೆ ಮಾದರಿ.`
              : `© ${new Date().getFullYear()} Samvaad Health • Interactive Prototype for Dr. Alan Samuel's Pan-India Mental Health Network.`}
          </p>
          <div className="flex items-center gap-2 text-amber-300/90 bg-amber-400/10 px-3.5 py-1.5 rounded-full border border-amber-400/20 text-[11px]">
            <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0 text-amber-400" />
            <span>
              {language === 'kn'
                ? 'AI ಆತ್ಮಾವಲೋಕನಕ್ಕೆ ಸಹಕರಿಸುತ್ತದೆ; ಅರ್ಹ ಮನೋವೈದ್ಯರು ವೈದ್ಯಕೀಯ ರೋಗನಿರ್ಣಯ ಮತ್ತು ಚಿಕಿತ್ಸೆ ನೀಡುತ್ತಾರೆ.'
                : 'AI assists self-reflection; licensed psychiatrists provide clinical diagnosis and treatment.'}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
