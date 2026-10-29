import React, { useState, useEffect } from 'react';
import { Stethoscope, Calendar, Clock, Video, Phone, MessageSquare, FileText, CheckCircle2, User, Activity, AlertCircle, ShieldCheck, ChevronRight, Play, Printer, Award, FileCheck, ShieldAlert, Copy, Check, ExternalLink, BarChart3, Brain, Info, HelpCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import confetti from 'canvas-confetti';

export default function DoctorDashboard({ appointments, onLaunchConsultationRoom }) {
  const { language, t } = useLanguage();
  const [selectedAppointment, setSelectedAppointment] = useState(appointments[0] || null);
  const [copiedSoap, setCopiedSoap] = useState(false);

  useEffect(() => {
    if (appointments && appointments.length > 0) {
      setSelectedAppointment(appointments[0]);
    }
  }, [appointments]);

  const rawDossier = selectedAppointment?.summaryData?.clinicalDossier || selectedAppointment?.summaryData;

  const activeDossier = rawDossier ? {
    dossierId: rawDossier.dossierId || `DOS-${selectedAppointment?.id || '819203'}`,
    patientId: selectedAppointment?.patientName || rawDossier.patientId || 'Patient',
    timestamp: rawDossier.timestamp || selectedAppointment?.date || 'Today',
    chiefComplaint: 
      rawDossier.chiefComplaint || 
      rawDossier.section1_PresentingComplaints || 
      (Array.isArray(rawDossier.sectionA_MainConcerns) ? rawDossier.sectionA_MainConcerns.join(', ') : rawDossier.sectionA_MainConcerns) || 
      rawDossier.coreTheme || 
      (rawDossier.exploredTopics ? rawDossier.exploredTopics.join(', ') : 'Reported emotional fatigue and work pressures.'),
    durationAndOnset: 
      rawDossier.durationAndOnset || 
      rawDossier.section2_HistoryOfPresentProblem || 
      rawDossier.sectionC_Timeline || 
      'Reported subacute onset (~several weeks duration).',
    patientReportedThemes: {
      moodAffect: 
        rawDossier.patientReportedThemes?.moodAffect || 
        rawDossier.psychiatricReviewOfSystems?.moodAffect || 
        (rawDossier.sectionB_ExperiencesDiscussed?.emotions 
          ? (Array.isArray(rawDossier.sectionB_ExperiencesDiscussed.emotions) ? rawDossier.sectionB_ExperiencesDiscussed.emotions.join(', ') : rawDossier.sectionB_ExperiencesDiscussed.emotions) 
          : 'Reported feelings of emotional exhaustion and stress.'),
      sleepArchitecture: 
        rawDossier.patientReportedThemes?.sleepArchitecture || 
        rawDossier.psychiatricReviewOfSystems?.sleepArchitecture || 
        (rawDossier.sectionB_ExperiencesDiscussed?.behaviours 
          ? (Array.isArray(rawDossier.sectionB_ExperiencesDiscussed.behaviours) ? rawDossier.sectionB_ExperiencesDiscussed.behaviours.join(', ') : rawDossier.sectionB_ExperiencesDiscussed.behaviours) 
          : 'Reported delayed sleep onset and restless awakenings.'),
      cognitionThoughts: 
        rawDossier.patientReportedThemes?.cognitionThoughts || 
        rawDossier.psychiatricReviewOfSystems?.cognitionThoughts || 
        (rawDossier.sectionB_ExperiencesDiscussed?.thoughts 
          ? (Array.isArray(rawDossier.sectionB_ExperiencesDiscussed.thoughts) ? rawDossier.sectionB_ExperiencesDiscussed.thoughts.join(', ') : rawDossier.sectionB_ExperiencesDiscussed.thoughts) 
          : 'Reported persistent work concerns and looping thoughts.'),
      somaticAutonomic: 
        rawDossier.patientReportedThemes?.somaticAutonomic || 
        rawDossier.psychiatricReviewOfSystems?.somaticAutonomic || 
        'Reported occasional tension headaches under stress.',
      safetyScreen: 
        rawDossier.patientReportedThemes?.safetyScreen || 
        rawDossier.section13_RiskAssessment || 
        'Pre-consultation screen: No crisis keywords identified in pre-consult conversation. Full clinical safety evaluation to be conducted by clinician.'
    },
    unexploredAreas: rawDossier.unexploredAreas || [
      'Detailed medical / psychiatric history',
      'Past/current medication adherence',
      'Substance use or somatic comorbidities',
      'Formal psychometric assessment (to be administered by clinician if indicated)'
    ],
    clinicalContextNote: rawDossier.clinicalContextNote || 'Preliminary context synthesized from patient conversation. Requires independent clinical assessment and treatment planning by Dr. Alan Samuel.',
    patientClarification: rawDossier.patientClarification || ''
  } : {
    dossierId: 'DOS-819203 [Demo]',
    patientId: selectedAppointment?.patientName || 'Sample Patient A [Fictional Demo Record]',
    timestamp: 'Today, 2:15 PM (Demo)',
    chiefComplaint: 'Reported progressive emotional exhaustion, delayed sleep onset, and persistent work-related concerns.',
    durationAndOnset: 'Reported subacute onset (~several weeks duration).',
    patientReportedThemes: {
      moodAffect: 'Reported feelings of emotional exhaustion and occasional irritability.',
      sleepArchitecture: 'Reported delayed sleep onset and restless awakenings.',
      cognitionThoughts: 'Reported persistent work concerns and looping thoughts when unwinding.',
      somaticAutonomic: 'Reported occasional tension headaches under stress.',
      safetyScreen: 'Fictional Demo Record: No crisis keywords identified in pre-consult conversation. (Independent clinical assessment required).'
    },
    unexploredAreas: [
      'Detailed medical / psychiatric history',
      'Past/current medication adherence',
      'Substance use or somatic comorbidities',
      'Formal psychometric assessment (to be administered by clinician if indicated)'
    ],
    clinicalContextNote: 'Demonstration Pre-Consultation Summary: Preliminary context synthesized from sample patient conversation. Requires independent clinical assessment and treatment planning by Dr. Alan Samuel.',
    patientClarification: ''
  };

  const handleCopySoapNote = () => {
    const sleepInfo = activeDossier.patientReportedThemes?.sleepArchitecture || activeDossier.psychiatricReviewOfSystems?.sleepArchitecture || 'Delayed sleep onset';
    const moodInfo = activeDossier.patientReportedThemes?.moodAffect || activeDossier.psychiatricReviewOfSystems?.moodAffect || 'Dysphoria, emotional fatigue';
    const unexplored = (activeDossier.unexploredAreas || []).join('; ');

    const soap = `
TELE-PSYCHIATRY CLINICAL CONSULTATION NOTE TEMPLATE
Patient: ${selectedAppointment?.patientName || 'Rahul K.'} | Dossier ID: ${activeDossier.dossierId}
Consultant: Dr. Alan Samuel — Consultant Psychiatrist
Date: ${new Date().toLocaleDateString('en-IN')}

[S] SUBJECTIVE (Pre-Consultation Patient-Reported Themes via Aura AI):
- Chief Complaint: "${activeDossier.chiefComplaint}"
- Timeline / Progression: ${activeDossier.durationAndOnset}
- Sleep Characteristics: ${sleepInfo}
- Mood & Affective Themes: ${moodInfo}
- Unexplored Clinical Areas (to inquire): ${unexplored || 'Past medical history, medications, organic screen'}

[O] OBJECTIVE (To be evaluated by clinician during consultation):
- Mental Status Examination (MSE): General appearance, rapport, eye contact, speech rate/tone, mood/affect, thought flow, perception, cognition, insight & judgment.
- Standardized rating scales (e.g. GAD-7, PHQ-9, ISI) if administered clinically.

[A] ASSESSMENT (Clinical Impression & Diagnostic Formulation):
- Primary psychiatric formulation / differential diagnosis determined by clinician.

[P] PLAN (Collaborative Treatment & Support Plan):
1. Psychoeducation and lifestyle/sleep hygiene restructuring.
2. Psychotherapeutic modalities (e.g. supportive counseling, CBT techniques).
3. Pharmacotherapy if clinically indicated following comprehensive psychiatric evaluation.
4. Follow-up interval agreed upon with patient.
    `.trim();

    navigator.clipboard.writeText(soap);
    setCopiedSoap(true);
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
    setTimeout(() => setCopiedSoap(false), 2500);
  };

  const handlePrintDossier = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      
      {/* Doctor Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white mb-8 shadow-soft-xl relative overflow-hidden border border-slate-700/60 no-print">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 flex flex-col items-center justify-center flex-shrink-0 shadow-lg text-emerald-400">
              <Stethoscope className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-400" />
              <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-300 mt-1 font-mono">Dr. AS</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black">
                  {language === 'kn' ? 'ಡಾ. ಅಲನ್ ಸ್ಯಾಮ್ಯುಯೆಲ್' : 'Dr. Alan Samuel'}
                </h1>
                <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  {language === 'kn' ? 'ಮಾದರಿ ತಜ್ಞರ ಸೆಷನ್' : 'Sample Consultant Session'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5 font-normal">
                {language === 'kn'
                  ? 'ಭಾರತದಾದ್ಯಂತ ತಜ್ಞರು ಸಂವಾದದಲ್ಲಿ ಸಮಾಲೋಚನೆ ಪೂರ್ವ ಸಾರಾಂಶ ಮತ್ತು ಟೆಲಿ-ಸೆಷನ್‌ಗಳನ್ನು ಹೇಗೆ ನಿರ್ವಹಿಸುತ್ತಾರೆ ಎಂಬುದರ ಪ್ರಾತ್ಯಕ್ಷಿಕೆ.'
                  : 'Illustrating how verified specialists across India manage pre-intake dossiers & tele-sessions on Samvaad.'}
              </p>
              <div className="flex items-center gap-4 text-xs text-slate-400 mt-2 font-medium">
                <span>📍 {language === 'kn' ? 'ಬೆಂಗಳೂರು / ತುಮಕೂರು, ಕರ್ನಾಟಕ' : 'Bengaluru / Tumakuru, Karnataka'}</span>
                <span>•</span>
                <span>🗣 {language === 'kn' ? 'ಇಂಗ್ಲಿಷ್, ಕನ್ನಡ, ಹಿಂದಿ' : 'English, Kannada, Hindi'}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 text-center shadow-inner">
              <span className="text-[10px] uppercase text-emerald-300 font-bold block">
                {language === 'kn' ? 'ಸಮಾಲೋಚನೆ ಪೂರ್ವ ವಿವರ' : 'Pre-Intake Context'}
              </span>
              <span className="text-lg font-black text-white">
                {language === 'kn' ? 'AI ಸಾರಾಂಶ' : 'AI Reflection Summary'}
              </span>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 text-center shadow-inner">
              <span className="text-[10px] uppercase text-slate-300 font-bold block">
                {language === 'kn' ? 'ನಿಗದಿತ ರಿಯಾಯಿತಿ ಶುಲ್ಕ' : 'Standardized Subsidized Fee'}
              </span>
              <span className="text-lg font-black text-emerald-400">&lt; ₹500</span>
            </div>
          </div>
        </div>
      </div>

      {/* Prominent Fictional Demo Notice Banner */}
      <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs flex items-start gap-2.5 no-print shadow-soft-sm">
        <Info className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold uppercase tracking-wider block mb-0.5">
            {language === 'kn' ? 'ಪ್ರಾತ್ಯಕ್ಷಿಕೆ ಮಾದರಿ ಸೂಚನೆ' : 'Demonstration Prototype Notice'}
          </span>
          <p className="text-amber-900 leading-relaxed font-normal">
            {language === 'kn'
              ? 'ಈ ವೈದ್ಯರ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ತೋರಿಸಲಾದ ಎಲ್ಲಾ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್‌ಗಳು, ರೋಗಿಗಳ ಹೆಸರುಗಳು ಮತ್ತು ಸಮಾಲೋಚನೆ ಪೂರ್ವ ದಾಖಲೆಗಳು ಕೇವಲ ಇಂಟರ್ಫೇಸ್ ಕಾರ್ಯವೈಖರಿಯನ್ನು ತೋರಿಸಲು ಸೃಷ್ಟಿಸಲಾದ ಕಾಲ್ಪನಿಕ ಮಾದರಿ ದತ್ತಾಂಶಗಳಾಗಿವೆ. ಯಾವುದೇ ನೈಜ ರೋಗಿಯ ಮಾಹಿತಿಯನ್ನು ಸಂಗ್ರಹಿಸಲಾಗಿಲ್ಲ.'
              : 'All appointments, patient names, and pre-consultation dossiers displayed in this doctor portal are entirely fictional sample data created solely to demonstrate how the clinician interface would function. No real patient data is stored or accessed.'}
          </p>
        </div>
      </div>

      {/* Main Grid: Patient Queue vs Clinical Document Sheet */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Scheduled Patient Roster (4 Cols) */}
        <div className="lg:col-span-4 space-y-4 no-print">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>{language === 'kn' ? 'ಇಂದಿನ ಸಮಾಲೋಚನೆಗಳ ಪಟ್ಟಿ' : "Today's Consultation Queue"}</span>
            </h2>
            <span className="text-xs bg-stone-100 text-slate-700 px-2.5 py-0.5 rounded-full font-bold border border-stone-200">
              {appointments.length} {language === 'kn' ? 'ರೋಗಿಗಳು' : 'Patients'}
            </span>
          </div>

          <div className="space-y-3">
            {appointments.map((apt) => {
              const isSelected = selectedAppointment?.id === apt.id;
              return (
                <div
                  key={apt.id}
                  onClick={() => setSelectedAppointment(apt)}
                  className={`p-4 rounded-2xl border transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-400 shadow-soft-md ring-1 ring-emerald-300'
                      : 'bg-white border-stone-200 hover:border-stone-300 hover:bg-stone-50/50 shadow-soft-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{apt.patientName}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-stone-100 text-slate-700 uppercase">
                          {apt.mode}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 font-mono">{apt.patientPhone}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded-md">
                        ₹{apt.price}
                      </span>
                      <span className="block text-[10px] text-slate-400 font-medium mt-1">{apt.time}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-900">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      {language === 'kn' ? 'ಸಾರಾಂಶ ಸಿದ್ಧವಾಗಿದೆ' : 'Pre-Consultation Summary Ready'}
                    </span>
                    <span className="text-slate-400 text-xs flex items-center gap-0.5 font-semibold">
                      {language === 'kn' ? 'ವಿವರ ನೋಡಿ' : 'View Details'} <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Clinical Protocol Tip */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-slate-600 space-y-1.5 shadow-2xs">
            <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-emerald-600" />
              {language === 'kn' ? 'ಸಮಾಲೋಚನೆ ಪೂರ್ವ ಕಾರ್ಯವಿಧಾನದ ಸೂಚನೆ:' : 'Pre-Consultation Workflow Note:'}
            </span>
            <p className="text-[11px] leading-relaxed font-normal">
              {language === 'kn'
                ? 'ಬಲಗಡೆಯಲ್ಲಿರುವ ಸಾರಾಂಶವು ರೋಗಿಯ ಅನಾಮಧೇಯ ಚಾಟ್‌ನಿಂದ ಸಿದ್ಧಪಡಿಸಲಾದ ಪ್ರಾಥಮಿಕ ವಿವರವನ್ನು ನೀಡುತ್ತದೆ. ಕರೆಯನ್ನು ಪ್ರಾರಂಭಿಸುವ ಮುನ್ನವೇ ರೋಗಿಯ ಆತಂಕ ಮತ್ತು ನಿದ್ರೆಯ ಮಾದರಿಯನ್ನು ವೈದ್ಯರಿಗೆ ತಿಳಿಯಲು ಇದು ಸಹಾಯ ಮಾಡುತ್ತದೆ.'
                : 'The summary on the right provides preliminary patient-reported themes extracted from their anonymous chat. It gives you a clear snapshot of what they shared before the call begins, allowing more time for compassionate doctor-patient dialogue.'}
            </p>
          </div>
        </div>

        {/* Right Column: Professional Pre-Consultation Summary Sheet (8 Cols) */}
        <div className="lg:col-span-8">
          <div className="clinical-document-sheet bg-white rounded-3xl p-6 sm:p-10 border border-stone-300 shadow-soft-xl relative">
            
            {/* Document Header Controls (Screen only) */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b-2 border-slate-900 mb-6 no-print">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-600 bg-stone-100 px-3 py-1 rounded-md border border-stone-200 font-mono">
                  {language === 'kn' ? 'ಸಮಾಲೋಚನೆ ಪೂರ್ವ ವೈದ್ಯಕೀಯ ವಿವರ' : 'PRE-CONSULTATION CLINICAL CONTEXT'}
                </span>
                <span className="text-xs text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {language === 'kn' ? 'ರೋಗಿ-ಹಂಚಿಕೊಂಡ • ಗೌಪ್ಯ' : 'PATIENT-SHARED • CONFIDENTIAL'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopySoapNote}
                  className="px-3 py-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-soft-sm"
                  title="Copy formatted SOAP clinical note template to paste in clinic notes"
                >
                  {copiedSoap ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                  <span>{copiedSoap ? (language === 'kn' ? 'SOAP ನಕಲಿಸಲಾಗಿದೆ!' : 'SOAP Copied!') : (language === 'kn' ? 'SOAP ನೋಟ್ ನಕಲಿಸಿ' : 'Copy SOAP Note')}</span>
                </button>

                <button
                  onClick={handlePrintDossier}
                  className="px-3 py-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-soft-sm"
                  title="Print intake summary sheet"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-500" />
                  <span>{language === 'kn' ? 'ದಾಖಲೆ ಮುದ್ರಿಸಿ' : 'Print Document'}</span>
                </button>

                <button
                  onClick={() => onLaunchConsultationRoom(selectedAppointment)}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-soft-md shadow-emerald-900/20 transition-all cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>
                    {language === 'kn' 
                      ? `${selectedAppointment?.mode?.toUpperCase() || 'VIDEO'} ರೂಮ್ ಪ್ರಾರಂಭಿಸಿ` 
                      : `Launch ${selectedAppointment?.mode?.toUpperCase() || 'VIDEO'} Room`}
                  </span>
                </button>
              </div>
            </div>

            {/* FORMAL CLINICAL DOCUMENT LETTERHEAD (Prints and displays on screen) */}
            {selectedAppointment?.hasSummaryAttached === false ? (
              <div className="py-16 px-6 text-center space-y-4">
                <div className="w-16 h-16 bg-stone-100 text-slate-500 rounded-2xl flex items-center justify-center mx-auto border border-stone-200">
                  <ShieldCheck className="w-8 h-8 text-slate-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  {language === 'kn' ? 'ಯಾವುದೇ ಪೂರ್ವ ಸಾರಾಂಶ ಲಗತ್ತಿಸಲಾಗಿಲ್ಲ' : 'No Pre-Consultation Summary Attached'}
                </h3>
                <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl max-w-md mx-auto text-xs text-slate-600 leading-relaxed text-left space-y-2">
                  <p className="font-semibold text-slate-800">
                    {language === 'kn' ? 'ಗೌಪ್ಯತಾ ನಿಯಮಗಳ ರಕ್ಷಣೆ:' : 'Patient Authorization Protocol Enforced:'}
                  </p>
                  <p>
                    {language === 'kn'
                      ? 'ರೋಗಿಯು ತಮ್ಮ AI ಆತ್ಮಾವಲೋಕನ ಸಾರಾಂಶವನ್ನು ವೈದ್ಯರಿಗೆ ಲಗತ್ತಿಸದಿರಲು ಮುಕ್ತವಾಗಿ ನಿರ್ಧರಿಸಿದ್ದಾರೆ. ಸಮಾಲೋಚನೆಯು ಸಂಪೂರ್ಣವಾಗಿ ಹೊಸದಾಗಿ ಮತ್ತು ನೇರವಾಗಿ ನಡೆಯುತ್ತದೆ.'
                      : 'In strict adherence to patient privacy and voluntary authorization rules, this patient chose NOT to share their pre-consultation summary. No AI dossier was transmitted.'}
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => onLaunchConsultationRoom(selectedAppointment)}
                    className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm cursor-pointer inline-flex items-center gap-2 shadow-soft-sm"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Launch Clean Session Room</span>
                  </button>
                </div>
              </div>
            ) : (
            <div className="space-y-6 text-xs sm:text-sm text-slate-800 font-normal">
              
              {/* Institution / Service Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
                <div>
                  <h3 className="text-lg font-black tracking-tight text-slate-900 uppercase">
                    Tele-Psychiatry Pre-Consultation Summary
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold">
                    Samvaad Pan-India Affordable Mental Health Care Initiative
                  </p>
                </div>
                <div className="text-left sm:text-right font-mono text-[11px] text-slate-500 space-y-0.5">
                  <p><span className="font-bold text-slate-700">Dossier ID:</span> {activeDossier.dossierId}</p>
                  <p><span className="font-bold text-slate-700">Synthesized:</span> {activeDossier.timestamp}</p>
                  <p><span className="font-bold text-slate-700">Consultant:</span> Dr. Alan Samuel — Consultant Psychiatrist</p>
                </div>
              </div>

              {/* Patient Demographics & Intake Classification Table */}
              <div className="border border-stone-200 rounded-xl overflow-hidden text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-4 bg-stone-50 border-b border-stone-200 font-mono text-[11px] text-slate-600">
                  <div className="p-2.5 border-r border-stone-200">
                    <span className="font-bold text-slate-700 block uppercase">Patient Identity</span>
                    <span className="text-slate-900 font-semibold">{selectedAppointment?.patientName || 'Rahul K.'}</span>
                  </div>
                  <div className="p-2.5 border-r border-stone-200">
                    <span className="font-bold text-slate-700 block uppercase">Intake Channel</span>
                    <span className="text-slate-900">Aura AI Reflection</span>
                  </div>
                  <div className="p-2.5 border-r border-stone-200">
                    <span className="font-bold text-slate-700 block uppercase">Consult Mode</span>
                    <span className="text-slate-900 font-semibold">{selectedAppointment?.mode?.toUpperCase() || 'VIDEO'} (₹{selectedAppointment?.price || 499})</span>
                  </div>
                  <div className="p-2.5">
                    <span className="font-bold text-slate-700 block uppercase">Intake Status</span>
                    <span className="text-slate-700 font-bold">Demo Sample Record</span>
                  </div>
                </div>
              </div>

              {/* Section 1: Chief Presenting Complaint */}
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                    § 1.0 Chief Presenting Concern (Patient’s Own Words)
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-stone-50/80 border border-stone-200 text-slate-900 leading-relaxed text-sm italic">
                  "{activeDossier.chiefComplaint}"
                </div>
                {activeDossier.patientClarification && (
                  <div className="mt-2.5 p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-950">
                    <span className="font-bold block text-[11px] uppercase tracking-wider text-emerald-900 mb-0.5 font-mono">
                      Patient Clarification / Correction:
                    </span>
                    <p className="italic">"{activeDossier.patientClarification}"</p>
                  </div>
                )}
              </div>

              {/* Section 2: Chronology & Progression */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono block mb-1.5">
                  § 2.0 Chronology & Reported Duration
                </span>
                <p className="p-3.5 rounded-xl bg-white border border-stone-200 text-slate-800 leading-relaxed font-normal">
                  {activeDossier.durationAndOnset}
                </p>
              </div>

              {/* Section 3: Patient-Reported Themes */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                    § 3.0 Patient-Reported Themes (Aura AI Qualitative Summary)
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Qualitative Exploration</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl border border-stone-200 bg-white shadow-2xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-800 text-xs">Mood & Affective Climate</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                      {activeDossier.patientReportedThemes?.moodAffect || activeDossier.psychiatricReviewOfSystems?.moodAffect}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-stone-200 bg-white shadow-2xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-800 text-xs">Sleep Patterns</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                      {activeDossier.patientReportedThemes?.sleepArchitecture || activeDossier.psychiatricReviewOfSystems?.sleepArchitecture}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-stone-200 bg-white shadow-2xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-800 text-xs">Cognitive & Thought Patterns</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                      {activeDossier.patientReportedThemes?.cognitionThoughts || activeDossier.psychiatricReviewOfSystems?.cognitionThoughts}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-stone-200 bg-white shadow-2xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-800 text-xs">Somatic & Stress Sensations</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                      {activeDossier.patientReportedThemes?.somaticAutonomic || activeDossier.psychiatricReviewOfSystems?.somaticAutonomic}
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 3.5: What Was NOT Explored (Vital Distinction) */}
              <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/70">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 font-mono block mb-2 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                  § 3.5 Clinical Areas Remaining Unexplored (For Clinician Review)
                </span>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600 font-normal">
                  {(activeDossier.unexploredAreas || [
                    'Detailed past medical and psychiatric history',
                    'Medication adherence or recent dosage changes',
                    'Substance use or somatic screening',
                    'Formal psychometric scoring (e.g. GAD-7, PHQ-9)'
                  ]).map((area, idx) => (
                    <li key={idx} className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                      <span>{area}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Section 4: Safety & Crisis Screen */}
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <span className="font-bold text-slate-900 uppercase tracking-wider text-xs font-mono">
                      § 4.0 Pre-Consultation Safety Check [Fictional Demo]
                    </span>
                  </div>
                  <span className="text-[10px] font-bold uppercase bg-stone-200 text-slate-800 px-2 py-0.5 rounded-full font-mono">
                    Demo Record
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {activeDossier.patientReportedThemes?.safetyScreen || 'Demonstration conversational screen: No acute crisis keywords identified in pre-consult conversation. Full clinical safety evaluation to be conducted by clinician.'} Tele-MANAS (14416) helpline referral protocols available on standby.
                </p>
              </div>

              {/* Section 5: Doctor's Clinical Notice */}
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 font-mono block mb-1.5">
                  § 5.0 Clinical Assessment Notice
                </span>
                <p className="text-xs text-slate-700 leading-relaxed font-normal">
                  {activeDossier.clinicalContextNote || 'This summary provides preliminary context synthesized from the patient’s conversational reflection. Formal diagnosis, clinical assessment, and therapeutic recommendations are to be conducted independently by Dr. Alan Samuel during the consultation.'}
                </p>
              </div>

              {/* Section 6: Consultation Record Footer */}
              <div className="pt-6 border-t-2 border-stone-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs font-mono">
                <div>
                  <p className="font-bold text-slate-900">Dr. Alan Samuel — Consultant Psychiatrist</p>
                  <p className="text-slate-500">Pan-India Subsidized Tele-Psychiatry Platform</p>
                  <p className="text-emerald-700 font-semibold text-[11px] mt-0.5">
                    ✓ Pre-Consultation Patient Intake Record
                  </p>
                </div>

                <div className="border border-stone-300 p-2.5 rounded-lg bg-stone-50 text-[11px] text-slate-600">
                  <div className="font-bold text-slate-800">CONSULTATION RECORD</div>
                  <div>Status: Ready for Doctor Review</div>
                  <div className="text-slate-400">Timestamp: {new Date().toLocaleDateString('en-IN')}</div>
                </div>
              </div>

            </div>
            )}

          </div>
        </div>

      </div>

    </div>
  );
}
