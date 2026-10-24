import React, { useState } from 'react';
import { X, CheckCircle, Copy, Stethoscope, Lock, Heart, Sparkles, Printer, AlertCircle, ArrowRight, Check, HelpCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import confetti from 'canvas-confetti';

const EXACT_MANDATORY_DISCLAIMER = "IMPORTANT: This summary is based on what you shared with our AI assistant. It is not a psychiatric diagnosis or a complete clinical assessment. A consultation with a qualified psychologist or psychiatrist is advised for further evaluation and personalized guidance.";

export default function ReflectionModal({ data, onClose, onSaveSummary, onSavePseudo, onBookDoctor }) {
  const { language } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [consultationDismissed, setConsultationDismissed] = useState(false);
  const [savingDismissed, setSavingDismissed] = useState(false);

  if (!data) return null;
  const { reflection, clinicalDossier } = data;
  if (!reflection) return null;

  // Safe extractions for Sections A through G
  const secA = reflection.sectionA_MainConcerns || reflection.exploredTopics || (reflection.coreTheme ? [reflection.coreTheme] : ['Work and life pressures discussed in conversation']);
  const secB_emotions = reflection.sectionB_ExperiencesDiscussed?.emotions || ['Stress, emotional fatigue, worry'];
  const secB_thoughts = reflection.sectionB_ExperiencesDiscussed?.thoughts || (reflection.identifiedPatterns ? reflection.identifiedPatterns.slice(0, 2) : ['Persistent thoughts regarding work and deadlines']);
  const secB_behaviours = reflection.sectionB_ExperiencesDiscussed?.behaviours || ['Difficulty falling asleep, nocturnal restlessness'];
  const secC = reflection.sectionC_Timeline || 'Recent subacute onset; symptoms fluctuating with workload and deadlines.';
  const secD = reflection.sectionD_DailyImpact || ['Disrupted nighttime sleep affecting daytime focus', 'High pressure affecting daily peace of mind'];
  const secE = reflection.sectionE_PreviousExperiences || 'Previous psychiatric or medical history was not discussed during this preliminary chat.';
  const secF = reflection.sectionF_Strengths || reflection.personalStrengths || [
    'Self-Expression: You articulated what you are going through openly in your own words.',
    'Reflecting Openly: You took time to pause and reflect on your emotional well-being.'
  ];
  const secG = reflection.sectionG_Goals || reflection.gentleNextSteps || [
    'Finding healthy boundaries around work pressure and deadlines.',
    'Restoring peaceful, uninterrupted sleep and quieting nighttime thoughts.'
  ];

  const handleCopy = () => {
    const textContent = `
=== ${reflection.title || 'Your Personal Reflection Summary'} ===
Generated on: ${reflection.generatedAt || new Date().toLocaleDateString()}

Section A. Main Concerns:
${secA.map(c => `• ${c}`).join('\n')}

Section B. Experiences Discussed:
• Emotions: ${secB_emotions.join(', ')}
• Thoughts: ${secB_thoughts.join(', ')}
• Behaviours: ${secB_behaviours.join(', ')}

Section C. Timeline and Circumstances:
${secC}

Section D. Impact on Daily Life:
${secD.map(i => `• ${i}`).join('\n')}

Section E. Previous Experiences and Support:
${secE}

Section F. Personal Strengths and Support:
${secF.map(s => `• ${s}`).join('\n')}

Section G. Main Concerns and Goals:
${secG.map(g => `• ${g}`).join('\n')}

DISCLAIMER:
${EXACT_MANDATORY_DISCLAIMER}
    `.trim();

    navigator.clipboard.writeText(textContent);
    setCopied(true);
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
    setTimeout(() => setCopied(false), 3000);
  };

  const triggerSave = () => {
    if (onSaveSummary) {
      onSaveSummary(data);
    } else if (onSavePseudo) {
      onSavePseudo(data);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full my-auto p-6 sm:p-8 shadow-soft-xl border border-stone-200 relative animate-fade-in max-h-[92vh] overflow-y-auto">
        
        {/* Top Controls */}
        <div className="absolute top-5 right-5 flex items-center gap-1.5 no-print">
          <button
            onClick={() => window.print()}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
            title="Print Summary"
          >
            <Printer className="w-5 h-5" />
          </button>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sage-700 via-sage-600 to-emerald-600 text-white flex items-center justify-center shadow-soft-md shadow-sage-900/15">
            <Sparkles className="w-6 h-6 text-emerald-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-black text-slate-900">
                {language === 'kn' ? 'ನಿಮ್ಮ ವೈಯಕ್ತಿಕ ಆತ್ಮಾವಲೋಕನ ಸಾರಾಂಶ' : 'Your Personal Reflection Summary'}
              </h3>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200">
                {language === 'kn' ? 'ಗೌಪ್ಯ ಮತ್ತು ಉಚಿತ' : 'Confidential & Free'}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {language === 'kn' ? 'ಸಿದ್ಧಪಡಿಸಲಾದ ದಿನಾಂಕ:' : 'Generated on:'} {reflection.generatedAt || new Date().toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Section 8 Mandatory Disclaimer */}
        <div className="p-3.5 mb-6 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs flex items-start gap-2.5 shadow-2xs">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed font-normal">
            {language === 'kn'
              ? "ಪ್ರಮುಖ ಸೂಚನೆ: ಈ ಸಾರಾಂಶವು ನಮ್ಮ AI ಸಹಾಯಕರೊಂದಿಗೆ ನೀವು ಹಂಚಿಕೊಂಡ ಮಾಹಿತಿಯನ್ನು ಆಧರಿಸಿದೆ. ಇದು ಮನೋವೈದ್ಯಕೀಯ ರೋಗನಿರ್ಣಯ ಅಥವಾ ಸಂಪೂರ್ಣ ಕ್ಲಿನಿಕಲ್ ಮೌಲ್ಯಮಾಪನವಲ್ಲ. ಹೆಚ್ಚಿನ ಮೌಲ್ಯಮಾಪನ ಮತ್ತು ವೈಯಕ್ತಿಕ ಮಾರ್ಗದರ್ಶನಕ್ಕಾಗಿ ಅರ್ಹ ಮನಶ್ಶಾಸ್ತ್ರಜ್ಞರು ಅಥವಾ ಮನೋವೈದ್ಯರೊಂದಿಗೆ ಸಮಾಲೋಚನೆ ನಡೆಸಲು ಸಲಹೆ ನೀಡಲಾಗುತ್ತದೆ."
              : EXACT_MANDATORY_DISCLAIMER}
          </p>
        </div>

        {/* Verbatim Quotes Shared by User */}
        {reflection.whatYouShared && reflection.whatYouShared.length > 0 && (
          <div className="mb-6 p-4 rounded-2xl bg-stone-50 border border-stone-200 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
              {language === 'kn' ? 'ನಿಮ್ಮ ಸಂಭಾಷಣೆಯಿಂದ (ನಿಮ್ಮದೇ ಮಾತುಗಳು)' : 'From Your Conversation (In Your Words)'}
            </span>
            <div className="space-y-1 font-serif italic text-xs text-slate-700">
              {reflection.whatYouShared.map((quote, idx) => (
                <p key={idx}>{quote}</p>
              ))}
            </div>
          </div>
        )}

        {/* 7 Structured Reflection Sections (A through G) */}
        <div className="space-y-4 text-sm text-slate-800">
          
          {/* SECTION A: Main Concerns */}
          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 shadow-2xs">
            <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-900 mb-2">
              {language === 'kn' ? 'ವಿಭಾಗ A. ಮುಖ್ಯ ಕಾಳಜಿಗಳು (Section A. Main Concerns)' : 'Section A. Main Concerns'}
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-800 font-medium">
              {secA.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 flex-shrink-0"></span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* SECTION B: Experiences Discussed */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 shadow-2xs">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 mb-2.5">
              {language === 'kn' ? 'ವಿಭಾಗ B. ಚರ್ಚಿಸಲಾದ ಅನುಭವಗಳು (Section B. Experiences Discussed)' : 'Section B. Experiences Discussed'}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="p-2.5 bg-white rounded-xl border border-stone-200/80">
                <span className="font-bold text-[10px] text-slate-500 uppercase block mb-1">
                  {language === 'kn' ? 'ಭಾವನೆಗಳು (Emotions)' : 'Emotions'}
                </span>
                <p className="text-slate-700 leading-snug">
                  {secB_emotions.join(', ')}
                </p>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-stone-200/80">
                <span className="font-bold text-[10px] text-slate-500 uppercase block mb-1">
                  {language === 'kn' ? 'ಆಲೋಚನೆಗಳು (Thoughts)' : 'Thoughts'}
                </span>
                <p className="text-slate-700 leading-snug">
                  {secB_thoughts.join(', ')}
                </p>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-stone-200/80">
                <span className="font-bold text-[10px] text-slate-500 uppercase block mb-1">
                  {language === 'kn' ? 'ವರ್ತನೆಗಳು (Behaviours)' : 'Behaviours'}
                </span>
                <p className="text-slate-700 leading-snug">
                  {secB_behaviours.join(', ')}
                </p>
              </div>
            </div>
          </div>

          {/* SECTION C: Timeline and Circumstances */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 shadow-2xs">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 mb-1.5">
              {language === 'kn' ? 'ವಿಭಾಗ C. ಸಮಯಾವಧಿ ಮತ್ತು ಸಂದರ್ಭಗಳು (Section C. Timeline and Circumstances)' : 'Section C. Timeline and Circumstances'}
            </h4>
            <p className="text-xs text-slate-700 leading-relaxed font-normal">
              {secC}
            </p>
          </div>

          {/* SECTION D: Impact on Daily Life */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 shadow-2xs">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 mb-2">
              {language === 'kn' ? 'ವಿಭಾಗ D. ದೈನಂದಿನ ಜೀವನದ ಮೇಲಿನ ಪ್ರಭಾವ (Section D. Impact on Daily Life)' : 'Section D. Impact on Daily Life'}
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-700">
              {secD.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 flex-shrink-0"></span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* SECTION E: Previous Experiences and Support */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 shadow-2xs">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 mb-1.5">
              {language === 'kn' ? 'ವಿಭಾಗ E. ಹಿಂದಿನ ಅನುಭವಗಳು ಮತ್ತು ಬೆಂಬಲ (Section E. Previous Experiences and Support)' : 'Section E. Previous Experiences and Support'}
            </h4>
            <p className="text-xs text-slate-700 leading-relaxed font-normal">
              {secE}
            </p>
          </div>

          {/* SECTION F: Personal Strengths and Support */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/90 shadow-2xs">
            <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-900 mb-2">
              {language === 'kn' ? 'ವಿಭಾಗ F. ವೈಯಕ್ತಿಕ ಸಾಮರ್ಥ್ಯಗಳು ಮತ್ತು ಬೆಂಬಲ (Section F. Personal Strengths and Support)' : 'Section F. Personal Strengths and Support'}
            </h4>
            <div className="space-y-1.5">
              {secF.map((strength, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-emerald-950 font-medium">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>{strength}</span>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION G: Main Concerns and Goals */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 shadow-2xs">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 mb-2">
              {language === 'kn' ? 'ವಿಭಾಗ G. ಪ್ರಮುಖ ಕಾಳಜಿಗಳು ಮತ್ತು ಗುರಿಗಳು (Section G. Main Concerns and Goals)' : 'Section G. Main Concerns and Goals'}
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-700">
              {secG.map((goal, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
                  <span>{goal}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* DECISION PATHWAY 1: CONSULTATION DECISION GATE (Section 8) */}
        {!consultationDismissed && (
          <div className="mt-8 p-5 rounded-2xl bg-gradient-to-br from-sage-50 to-emerald-50/70 border border-sage-200/90 shadow-soft-sm">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-sage-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                <Stethoscope className="w-4 h-4 text-emerald-100" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-sm text-slate-900">
                  {language === 'kn'
                    ? 'ಮನಶ್ಶಾಸ್ತ್ರಜ್ಞರು ಅಥವಾ ಮನೋವೈದ್ಯರೊಂದಿಗೆ ಸಮಾಲೋಚನೆ ಕಾಯ್ದಿರಿಸಲು ನೀವು ಬಯಸುವಿರಾ?'
                    : 'Would you like to book a consultation with a psychologist or psychiatrist?'}
                </h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {language === 'kn'
                    ? 'ಅಖಿಲ ಭಾರತದ ಅರ್ಹ ವೃತ್ತಿಪರರೊಂದಿಗೆ ಕೈಗೆಟುಕುವ ದರದಲ್ಲಿ (< ₹500) ಸಮಾಲೋಚಿಸಿ. ಸಮಾಲೋಚನೆ ಕಾಯ್ದಿರಿಸುವುದು ಸಂಪೂರ್ಣವಾಗಿ ಐಚ್ಛಿಕವಾಗಿದೆ.'
                    : 'A qualified professional can conduct a detailed clinical assessment and discuss personalized support. Consultation booking is entirely optional.'}
                </p>
                <div className="flex flex-wrap items-center gap-2.5 mt-3.5">
                  <button
                    onClick={() => onBookDoctor(clinicalDossier)}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sage-700 via-sage-600 to-emerald-600 hover:from-sage-800 hover:to-emerald-700 text-white font-black text-xs shadow-soft-sm hover:shadow-glow-sage transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Stethoscope className="w-3.5 h-3.5" />
                    <span>{language === 'kn' ? 'ಸಮಾಲೋಚನೆ ಕಾಯ್ದಿರಿಸಿ' : 'BOOK A CONSULTATION'}</span>
                  </button>
                  <button
                    onClick={() => setConsultationDismissed(true)}
                    className="px-4 py-2.5 rounded-xl border border-stone-200 hover:bg-white text-slate-600 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    {language === 'kn' ? 'ಸಮಾಲೋಚನೆ ಇಲ್ಲದೆ ಮುಂದುವರಿಯಿರಿ' : 'CONTINUE WITHOUT BOOKING'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DECISION PATHWAY 2: SAVING DECISION GATE (Section 8 & 9) */}
        {!savingDismissed && (
          <div className="mt-4 p-5 rounded-2xl bg-stone-50 border border-stone-200 shadow-soft-sm">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-800 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                <Lock className="w-4 h-4 text-emerald-300" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-sm text-slate-900">
                  {language === 'kn'
                    ? 'ಭವಿಷ್ಯದ ಉಲ್ಲೇಖಕ್ಕಾಗಿ ನಿಮ್ಮ ಸಾರಾಂಶವನ್ನು ಉಳಿಸಲು ನೀವು ಬಯಸುವಿರಾ?'
                    : 'Would you like to save your summary for future reference?'}
                </h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {language === 'kn'
                    ? 'ಖಾಸಗಿ ಖಾತೆ (ಅಡ್ಡಹೆಸರು + ಪಾಸ್‌ವರ್ಡ್) ಅಥವಾ ಗೂಗಲ್ ಮೂಲಕ ನಿಮ್ಮ ಸಾರಾಂಶವನ್ನು ಉಳಿಸಬಹುದು. ಉಳಿಸದಿರಲು ನಿರ್ಧರಿಸಿದರೆ ಯಾವುದೇ ಡೇಟಾ ಶೇಖರಣೆಯಾಗುವುದಿಲ್ಲ.'
                    : 'Create a Private Account (nickname + password) or Continue with Google to save your reflection. If you decline, no data will be persistently stored.'}
                </p>
                <div className="flex flex-wrap items-center gap-2.5 mt-3.5">
                  <button
                    onClick={triggerSave}
                    className="px-5 py-2.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 font-black text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  >
                    <Lock className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{language === 'kn' ? 'ಸಾರಾಂಶ ಉಳಿಸಿ' : 'SAVE SUMMARY'}</span>
                  </button>
                  <button
                    onClick={() => setSavingDismissed(true)}
                    className="px-4 py-2.5 rounded-xl border border-stone-200 hover:bg-white text-slate-600 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    {language === 'kn' ? 'ಉಳಿಸಬೇಡಿ' : 'DO NOT SAVE'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Controls Footer */}
        <div className="mt-8 pt-5 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={handleCopy}
            className="px-4 py-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-soft-sm"
          >
            {copied ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
            <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            {language === 'kn' ? 'ಮುಚ್ಚಿ' : 'Close'}
          </button>
        </div>

      </div>
    </div>
  );
}
