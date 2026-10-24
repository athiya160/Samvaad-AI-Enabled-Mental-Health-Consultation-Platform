import React, { useState } from 'react';
import { Sparkles, Stethoscope, Users, Brain, Home, FileText, ChevronDown, ChevronUp, ShieldAlert, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function DemoPresenterBar({ activeTab, onSelectTab, onOpenProposal, onTriggerScenario }) {
  const { language } = useLanguage();
  // Minimized by default so it NEVER covers content or chat input!
  const [isOpen, setIsOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const demoSteps = [
    { 
      id: 'home', 
      label: language === 'kn' ? '1. ಮಿಷನ್ ಮತ್ತು ದರಗಳು' : '1. Mission & Rates', 
      icon: Home, 
      desc: language === 'kn' ? 'ಅಖಿಲ ಭಾರತ < ₹500 ಮಾದರಿ' : 'Pan-India < ₹500 model' 
    },
    { 
      id: 'chat', 
      label: language === 'kn' ? '2. ಉಚಿತ AI ಸಹಾಯಕ' : '2. Free AI Companion', 
      icon: Sparkles, 
      desc: language === 'kn' ? 'ಆತ್ಮಾವಲೋಕನ ಸಾರಾಂಶ' : 'Empathetic Reflection' 
    },
    { 
      id: 'doctors', 
      label: language === 'kn' ? '3. ವೈದ್ಯರನ್ನು ಹುಡುಕಿ' : '3. Find Doctors', 
      icon: Users, 
      desc: language === 'kn' ? 'ಚಾಟ್ / ಆಡಿಯೋ / ವಿಡಿಯೋ' : 'Chat / Audio / Video' 
    },
    { 
      id: 'doctor-portal', 
      label: language === 'kn' ? '4. ವೈದ್ಯರ ಪೋರ್ಟಲ್' : '4. Doctor Portal', 
      icon: Stethoscope, 
      desc: language === 'kn' ? 'ಸಮಾಲೋಚನೆ ಪೂರ್ವ ಸಾರಾಂಶ' : 'Pre-Consultation Summary' 
    },
    { 
      id: 'therapy-tools', 
      label: language === 'kn' ? '5. ಸ್ವಯಂ ಆರೈಕೆ ಪರಿಕರಗಳು' : '5. Self-Care Tools', 
      icon: Brain, 
      desc: language === 'kn' ? 'ಹಂತ 2 ಮುನ್ನೋಟ' : 'Roadmap Preview' 
    }
  ];

  return (
    <aside aria-label="Demo Presentation Navigator" className="fixed bottom-4 right-4 z-50 no-print flex flex-col items-end">
      
      {/* Expanded Demo Control Box */}
      {isOpen && (
        <div className="mb-2 bg-slate-900/95 backdrop-blur-md text-white rounded-3xl p-4 shadow-2xl border border-slate-700 w-[92vw] max-w-lg animate-fade-in">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="font-bold uppercase tracking-wider text-emerald-400">
                {language === 'kn' ? 'ಡಾ. ಅಲನ್ ಸ್ಯಾಮ್ಯುಯೆಲ್ ಡೆಮೊ ಹಂತಗಳು' : 'Dr. Alan Samuel Demo Flow'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onOpenProposal}
                className="text-[11px] font-bold bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 px-2.5 py-1 rounded-lg border border-emerald-500/40 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{language === 'kn' ? 'ಯೋಜನಾ ವಿವರಗಳು' : 'Proposal Specs'}</span>
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                title="Collapse"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Steps Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-3">
            {demoSteps.map((step) => {
              const Icon = step.icon;
              const isActive = activeTab === step.id;
              return (
                <button
                  key={step.id}
                  onClick={() => {
                    onSelectTab(step.id);
                  }}
                  className={`p-2.5 rounded-xl text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                    isActive
                      ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/30 ring-1 ring-emerald-300'
                      : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-emerald-400'}`} />
                  <div className="min-w-0">
                    <div className="text-xs font-bold truncate">{step.label}</div>
                    <div className="text-[10px] text-slate-400 truncate">{step.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quick Scenario Triggers */}
          <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-[10px] text-slate-400 font-bold uppercase">
              {language === 'kn' ? '1-ಕ್ಲಿಕ್ ಪರೀಕ್ಷೆಗಳು:' : '1-Click Live Tests:'}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onTriggerScenario('insomnia');
                  setIsOpen(false);
                }}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 transition-colors cursor-pointer"
              >
                {language === 'kn' ? 'ನಿದ್ರಾಹೀನತೆ ಪರೀಕ್ಷೆ' : 'Test Insomnia'}
              </button>
              <button
                onClick={() => {
                  onTriggerScenario('crisis');
                  setIsOpen(false);
                }}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-800 transition-colors cursor-pointer flex items-center gap-1"
              >
                <ShieldAlert className="w-3 h-3 text-rose-400" />
                <span>{language === 'kn' ? 'ತುರ್ತು ಸುರಕ್ಷತೆ' : 'Test Guardrail'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Pill Toggle Button (Clean & Non-Obtrusive) */}
      <div className="flex items-center gap-1.5 shadow-2xl">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="px-4 py-2.5 rounded-full bg-slate-900/95 hover:bg-slate-800 text-white text-xs font-bold border border-slate-700/90 shadow-xl flex items-center gap-2 transition-all hover:scale-105 cursor-pointer backdrop-blur-md"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>{language === 'kn' ? '🎯 ಡೆಮೊ ನ್ಯಾವಿಗೇಟರ್' : '🎯 Demo Navigator'}</span>
          {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronUp className="w-3.5 h-3.5 text-slate-400" />}
        </button>

        <button
          onClick={() => setDismissed(true)}
          className="p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition-colors cursor-pointer text-xs"
          title="Dismiss Navigator"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

    </aside>
  );
}
