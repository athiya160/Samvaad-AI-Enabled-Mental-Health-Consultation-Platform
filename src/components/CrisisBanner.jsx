import React, { useState } from 'react';
import { PhoneCall, ShieldAlert, X, HeartHandshake } from 'lucide-react';
import { CRISIS_RESOURCES } from '../data/psychiatricDomains';
import { useLanguage } from '../context/LanguageContext';

export default function CrisisBanner() {
  const [showModal, setShowModal] = useState(false);
  const { t, language } = useLanguage();

  return (
    <>
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 text-emerald-100 text-xs py-2 px-4 border-b border-emerald-900/60 shadow-inner">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="font-semibold text-emerald-300">
              {language === 'kn' ? 'ತುರ್ತು ಸಹಾಯವಾಣಿ:' : '24x7 Free Crisis Support:'}
            </span>
            <span className="text-emerald-100 font-mono text-[11px]">
              {language === 'kn'
                ? 'ಕಿರಣ್ (KIRAN) 1800-599-0019 | ಟೆಲಿ-ಮಾನಸ್ (Tele-MANAS) 14416'
                : 'KIRAN 1800-599-0019 | Tele-MANAS 14416 (24x7 Helplines)'}
            </span>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 text-emerald-300 hover:text-white transition-colors font-bold text-xs underline cursor-pointer"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>{language === 'kn' ? 'ಎಲ್ಲಾ ಸಹಾಯವಾಣಿಗಳನ್ನು ವೀಕ್ಷಿಸಿ' : 'View All Emergency Helplines'}</span>
          </button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {language === 'kn' ? 'ಉಚಿತ ಮತ್ತು ಗೌಪ್ಯ ತುರ್ತು ಸಹಾಯವಾಣಿಗಳು' : 'Free & Confidential Helplines'}
                </h3>
                <p className="text-xs text-slate-500">
                  {language === 'kn' ? 'ಯಾವುದೇ ಸಮಯದಲ್ಲಿ ಉಚಿತವಾಗಿ ಕರೆ ಮಾಡಿ' : 'Available 24x7 across all Indian languages'}
                </p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              {CRISIS_RESOURCES.map((item, idx) => (
                <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-emerald-50/50 hover:border-emerald-200 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm text-slate-900">{item.name}</span>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                      {item.type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mb-2">{item.description}</p>
                  <a
                    href={`tel:${item.tollFree.replace(/[^0-9]/g, '')}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    Call {item.tollFree}
                  </a>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                {language === 'kn'
                  ? 'AI ಸಹಾಯಕವು ವೈದ್ಯಕೀಯ ಚಿಕಿತ್ಸೆಗೆ ಪರ್ಯಾಯವಲ್ಲ. ತೀವ್ರ ತುರ್ತು ಸಂದರ್ಭದಲ್ಲಿ ದಯವಿಟ್ಟು ಮೇಲಿನ ಸಂಖ್ಯೆಗೆ ಕರೆ ಮಾಡಿ ಅಥವಾ ಹತ್ತಿರದ ಆಸ್ಪತ್ರೆಗೆ ಭೇಟಿ ನೀಡಿ.'
                  : 'Aura AI companion is designed for empathetic reflection and cannot substitute professional psychiatric emergency care. In critical moments, please call a helpline or visit your nearest emergency room.'}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
