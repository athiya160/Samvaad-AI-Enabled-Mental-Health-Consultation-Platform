import React, { useEffect } from 'react';
import { X, Printer, Sparkles, Stethoscope, ArrowRight, ShieldCheck, HeartHandshake, CheckCircle2, MessageSquare } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function ClinicalProposalDocModal({ isOpen, onClose, onNavigateTab, onSelectPrompt }) {
  const { language } = useLanguage();
  const scrollContainerRef = React.useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDomainClick = (domainName, promptText) => {
    onClose();
    if (onSelectPrompt) {
      onSelectPrompt(promptText || `I want to talk about my ${domainName.toLowerCase()}`);
    }
    if (onNavigateTab) {
      onNavigateTab('chat');
    }
  };

  const domainPrompts = {
    '01. Primary Concern & Mood': 'I have been feeling down, emotionally exhausted, and low lately.',
    '02. Duration & Progression': 'I have been struggling with these feelings continuously for several weeks now.',
    '03. Sleep Architecture': 'I cannot fall asleep at night; my mind races and I wake up exhausted.',
    '04. Somatic Energy & Appetite': 'My physical energy is completely drained and my appetite has dropped.',
    '05. Cognitive Thought Patterns': 'I am constantly overthinking, replaying mistakes, and predicting the worst.',
    '06. Anxiety & Panic Triggers': 'My heart races and chest gets tight whenever I get stressed.',
    '07. Daily Functional Impact': 'This is making it really hard to focus on work deadlines and study.',
    '08. Social Connectedness': 'I find myself withdrawing and feeling isolated from family and friends.',
    '09. Precipitating Stressors': 'Recent workplace pressure and financial strain have made this much worse.',
    '10. Coping Habits & Defenses': 'I try listening to music and taking walks, but it feels overwhelming.',
    '11. Emotional Regulation': 'My emotions are swinging rapidly and I get tearful or irritated easily.',
    '12. Crisis Screening & Safety': 'I feel completely hopeless and need safe, confidential support.'
  };

  return (
    <div 
      ref={scrollContainerRef}
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex justify-center items-start p-3 sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Sticky Floating Close Button (Always visible on screen) */}
      <button
        onClick={onClose}
        className="fixed top-4 right-4 z-50 p-3 bg-white/90 hover:bg-white text-slate-800 rounded-full shadow-2xl border border-slate-300 hover:scale-110 transition-all cursor-pointer flex items-center gap-1.5 font-bold text-xs"
        title={language === 'kn' ? 'ದಾಖಲೆಯನ್ನು ಮುಚ್ಚಿ' : 'Close Document & Return to Website'}
      >
        <X className="w-5 h-5 text-rose-600" />
        <span className="hidden sm:inline">
          {language === 'kn' ? 'ದಾಖಲೆ ಮುಚ್ಚಿ (Esc)' : 'Close Document (Esc)'}
        </span>
      </button>

      <div className="bg-white rounded-3xl max-w-4xl w-full my-4 sm:my-8 p-6 sm:p-10 shadow-2xl border border-slate-200 text-slate-800 relative animate-fade-in font-sans">
        
        {/* Top Control Bar (Sticky at top of document) */}
        <div className="sticky top-0 z-20 -mx-6 -mt-6 sm:-mx-10 sm:-mt-10 px-6 sm:px-10 py-3.5 bg-white/95 backdrop-blur-md border-b border-slate-200 mb-6 flex items-center justify-between no-print rounded-t-3xl">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              {language === 'kn' ? 'ಅಧಿಕೃತ ವೈದ್ಯಕೀಯ ಪ್ರಸ್ತಾವನೆ ಮತ್ತು ವಿವರಗಳು' : 'Official Medical Proposal & Specs'}
            </span>
            <span className="text-xs text-slate-400 font-mono hidden sm:inline">DOC-REF: SAMVAAD/2026/V1</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">
                {language === 'kn' ? 'ಮುದ್ರಿಸಿ / PDF ಉಳಿಸಿ' : 'Print / Save PDF'}
              </span>
            </button>

            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <X className="w-4 h-4 text-rose-400" />
              <span>{language === 'kn' ? 'ವೆಬ್‌ಸೈಟ್‌ಗೆ ಹಿಂತಿರುಗಿ' : 'Back to Live Website'}</span>
            </button>
          </div>
        </div>

        {/* Action Callout: Return to Live Interactive Features */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div>
            <span className="font-bold text-emerald-950 text-sm block">
              💡 Looking to test the live features?
            </span>
            <span className="text-emerald-800">
              This is the formal specification document. You can jump directly to any live tool:
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onNavigateTab && onNavigateTab('chat');
              }}
              className="px-3 py-1.5 rounded-xl bg-sage-600 hover:bg-sage-700 text-white font-bold flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
              <span>Test AI Chat</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onNavigateTab && onNavigateTab('doctor-portal');
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center gap-1 cursor-pointer"
            >
              <Stethoscope className="w-3.5 h-3.5 text-emerald-400" />
              <span>Consultant Portal</span>
            </button>
          </div>
        </div>

        {/* CLINICAL DOCUMENT BODY */}
        <div className="clinical-document-sheet space-y-8 text-xs sm:text-sm leading-relaxed text-slate-700">
          
          {/* Document Header / Letterhead */}
          <div className="border-b-2 border-slate-900 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-800 text-white flex items-center justify-center font-bold text-sm">
                    S
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
                    Samvaad Tele-Mental Health System
                  </h1>
                </div>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Pan-India Ethical, Subsidized Multi-Consultant Mental Health Infrastructure
                </p>
                <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1 font-mono">
                  <span>Standard: Section 29 Mental Healthcare Act 2017</span>
                  <span>•</span>
                  <span>Independent Pan-India Network (&lt; ₹500)</span>
                </div>
              </div>

              <div className="text-left sm:text-right font-mono text-xs text-slate-500 space-y-0.5">
                <p><span className="font-bold text-slate-700">Clinical Contributor:</span> Dr. Alan Samuel — Consultant Psychiatrist</p>
                <p><span className="font-bold text-slate-700">Technical Lead:</span> Athiya Tabassum</p>
                <p><span className="font-bold text-slate-700">Date of Release:</span> October 2026</p>
                <p><span className="font-bold text-slate-700">Platform Scope:</span> Pan-India Independent Network</p>
              </div>
            </div>
          </div>

          {/* Section 1: Executive Mission */}
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 uppercase tracking-wide border-l-4 border-emerald-600 pl-3 mb-3">
              1. Executive Mission & Problem Statement
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-3">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-rose-800 text-xs block mb-1">Current Market Disconnect:</span>
                <p className="text-xs text-slate-600 leading-normal">
                  Standard private psychiatric tele-consultations across India command <strong>₹1,500 – ₹2,500 per session</strong>. This commercial threshold severely disenfranchises college students, young earners, and small-town citizens, compelling thousands to delay care until acute crisis stages.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="font-bold text-emerald-900 text-xs block mb-1">Dr. Alan's Subsidized Solution:</span>
                <p className="text-xs text-emerald-950 leading-normal">
                  A multi-consultant pan-India aggregator where certified specialists deliver subsidized consultations standardizing at <strong>&lt; ₹500</strong> (Chat: ₹299, Audio: ₹399, Video: ₹499), supported by an automated AI intake engine that reduces consultation overhead.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Conversational AI Intake Engine (INTERACTIVE BUTTONS) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 uppercase tracking-wide border-l-4 border-emerald-600 pl-3">
                2. Conversational AI Companion Protocol ("Aura")
              </h2>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                Click any topic to test in live chat ➔
              </span>
            </div>
            <p className="text-xs text-slate-600 mb-3">
              Unlike rigid MCQ questionnaires or surveys that alienate hesitant users, <strong>Aura</strong> implements a conversational, non-judgmental dialogue model. Click any domain below to test how the AI companion handles it:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
              {Object.entries(domainPrompts).map(([domain, prompt]) => (
                <button
                  key={domain}
                  onClick={() => handleDomainClick(domain, prompt)}
                  className="p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-800 hover:text-emerald-900 text-left transition-all cursor-pointer flex items-center justify-between group shadow-2xs"
                >
                  <span className="font-semibold">{domain}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-transform flex-shrink-0 ml-1" />
                </button>
              ))}
            </div>

            <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-700 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Strict Clinical Guardrail:</strong> Aura does NOT issue psychiatric diagnoses or prescriptions. It generates a free personal reflection for the patient and a structured pre-consultation dossier for the psychiatrist.
              </span>
            </div>
          </div>

          {/* Section 3: Identity & Clinical Funnel (INTERACTIVE TILES) */}
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 uppercase tracking-wide border-l-4 border-emerald-600 pl-3 mb-3">
              3. Privacy-Preserving Onboarding Funnel (Click to Test)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
              
              <div 
                onClick={() => {
                  onClose();
                  onNavigateTab && onNavigateTab('chat');
                }}
                className="p-5 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-emerald-50/60 hover:border-emerald-300 transition-all cursor-pointer group shadow-2xs"
              >
                <span className="w-7 h-7 rounded-full bg-slate-200 group-hover:bg-emerald-200 text-slate-800 group-hover:text-emerald-900 inline-flex items-center justify-center font-bold text-xs mb-2 transition-colors">Phase 1</span>
                <h4 className="font-bold text-xs text-slate-900 group-hover:text-emerald-900">Zero-Barrier Reflection</h4>
                <p className="text-[11px] text-slate-500 mt-1">Zero login, no phone/email. Free conversational chat and instant personal reflection summary.</p>
                <span className="text-[11px] font-bold text-emerald-700 mt-3 inline-flex items-center gap-1">
                  Launch Chat ➔
                </span>
              </div>

              <div 
                onClick={() => {
                  onClose();
                  onNavigateTab && onNavigateTab('chat');
                }}
                className="p-5 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-emerald-50/60 hover:border-emerald-300 transition-all cursor-pointer group shadow-2xs"
              >
                <span className="w-7 h-7 rounded-full bg-emerald-200 text-emerald-800 inline-flex items-center justify-center font-bold text-xs mb-2">Phase 2</span>
                <h4 className="font-bold text-xs text-slate-900 group-hover:text-emerald-900">Private Account & Security</h4>
                <p className="text-[11px] text-slate-500 mt-1">Select calming nickname + strong password. Server-side scrypt hashing with single-use recovery codes.</p>
                <span className="text-[11px] font-bold text-emerald-700 mt-3 inline-flex items-center gap-1">
                  View Flow ➔
                </span>
              </div>

              <div 
                onClick={() => {
                  onClose();
                  onNavigateTab && onNavigateTab('doctors');
                }}
                className="p-5 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-emerald-50/60 hover:border-emerald-300 transition-all cursor-pointer group shadow-2xs"
              >
                <span className="w-7 h-7 rounded-full bg-teal-200 text-teal-800 inline-flex items-center justify-center font-bold text-xs mb-2">Phase 3</span>
                <h4 className="font-bold text-xs text-slate-900 group-hover:text-emerald-900">Subsidized Tele-Consult</h4>
                <p className="text-[11px] text-slate-500 mt-1">Book Dr. Alan Samuel or verified peers (&lt; ₹500) with AI intake summary pre-delivered.</p>
                <span className="text-[11px] font-bold text-emerald-700 mt-3 inline-flex items-center gap-1">
                  Browse Doctors ➔
                </span>
              </div>

            </div>
          </div>

          {/* Section 4: Doctor Ergonomics & Pre-Consultation Context */}
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 uppercase tracking-wide border-l-4 border-emerald-600 pl-3 mb-3">
              4. Clinical Ergonomics & Pre-Consultation Context Preparation
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              Traditional psychiatric intake spends initial minutes clarifying presenting chronology and sleep disruptions. With the patient's explicit consent, Samvaad compiles these patient-reported themes into a structured summary beforehand, giving Dr. Alan and participating clinicians preliminary context so consultation time can focus on deep empathetic dialogue and collaborative care.
            </p>

            {/* Three-Tier Consent Architecture (Section 10 Generation Rule) */}
            <div className="p-4 bg-emerald-50/80 border border-emerald-300 rounded-2xl mb-4 text-xs text-slate-800 shadow-2xs">
              <h3 className="font-black text-emerald-950 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>Section 10 — Three-Tier Consent Architecture</span>
              </h3>
              <p className="text-[11px] text-slate-700 mb-3 leading-relaxed">
                After the user explicitly chooses to save the Personal Reflection and successfully authenticates, save the Personal Reflection. Then separately ask whether the user consents to generation and persistent storage of the clinician-facing initial history summary. Only generate and persist the clinician-facing summary if that separate consent is explicitly granted.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-[10px] text-center font-bold">
                <div className="p-2.5 bg-white border border-emerald-200 rounded-xl text-emerald-950 shadow-2xs">
                  <div className="text-emerald-700 font-black mb-1">CONSENT 1</div>
                  Save Personal Reflection
                </div>
                <div className="p-2.5 bg-white border border-emerald-200 rounded-xl text-emerald-950 shadow-2xs">
                  <div className="text-emerald-700 font-black mb-1">CONSENT 2</div>
                  Generate & Store Clinician Summary
                </div>
                <div className="p-2.5 bg-white border border-emerald-200 rounded-xl text-emerald-950 shadow-2xs">
                  <div className="text-emerald-700 font-black mb-1">CONSENT 3</div>
                  Share with Selected Professional
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                onNavigateTab && onNavigateTab('doctor-portal');
              }}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Stethoscope className="w-4 h-4 text-emerald-400" />
              <span>Inspect Dr. Alan Samuel's Live Intake Dossier & Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Document Sign-off */}
          <div className="pt-6 border-t-2 border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 font-mono text-xs">
            <div>
              <p className="font-bold text-slate-900 uppercase">Platform Architecture Verification</p>
              <p className="text-slate-500">Built for Demonstration to Dr. Alan Samuel — Consultant Psychiatrist</p>
              <p className="text-emerald-700 font-bold mt-1">✓ Concept Prototype Active for Feedback</p>
            </div>

            <div className="border border-slate-300 p-3 rounded-xl bg-slate-50 text-slate-700 min-w-[220px]">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Clinical Initiative Stamp</div>
              <div className="text-xs font-bold text-slate-900 mt-1">SAMVAAD HEALTH BHARAT</div>
              <div className="text-[11px] text-emerald-800 font-semibold">Subsidized Tele-Psychiatry</div>
              <div className="text-[10px] text-slate-400 mt-1">Ref ID: 2026-AS-AT-094</div>
            </div>
          </div>

        </div>

        {/* Sticky Bottom Actions Bar */}
        <div className="sticky bottom-0 z-20 -mx-6 -mb-6 sm:-mx-10 sm:-mb-10 p-4 bg-slate-900 text-white rounded-b-3xl mt-8 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xl no-print">
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="font-bold">Ready to see the live working demo?</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                onClose();
                onNavigateTab && onNavigateTab('chat');
              }}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-emerald-200" />
              <span>Open AI Chat</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onNavigateTab && onNavigateTab('doctor-portal');
              }}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700"
            >
              <Stethoscope className="w-4 h-4 text-emerald-400" />
              <span>Doctor Portal</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer"
            >
              Close ✕
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
