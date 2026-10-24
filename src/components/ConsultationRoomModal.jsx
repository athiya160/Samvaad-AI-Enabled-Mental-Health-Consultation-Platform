import React, { useState, useEffect } from 'react';
import { X, Mic, MicOff, Video, VideoOff, PhoneOff, FileText, Check, MessageSquare, ShieldCheck, Clock, Award, Printer, Plus, Stethoscope } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function ConsultationRoomModal({ appointment, onClose }) {
  const { language } = useLanguage();
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [activeTab, setActiveTab] = useState('dossier'); // 'dossier' | 'notes'
  const [doctorNotes, setDoctorNotes] = useState('Patient confirms chronic sleep disruption and high workplace pressure. Recommended 4-7-8 breathing and 2-week follow-up.');
  const [notesSaved, setNotesSaved] = useState(false);
  const [showRxModal, setShowRxModal] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSaveNotes = () => {
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 2000);
  };

  const appendIntervention = (text) => {
    setDoctorNotes(prev => prev ? `${prev}\n• ${text}` : `• ${text}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 rounded-3xl max-w-5xl w-full h-[90vh] my-auto flex flex-col shadow-2xl border border-slate-800 text-white overflow-hidden relative">
        
        {/* Top Room Bar */}
        <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm sm:text-base">
                  Dr. Alan Samuel & {appointment?.patientName || 'Rahul K.'}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {appointment?.mode?.toUpperCase() || 'VIDEO'} ({language === 'kn' ? 'ಮಾದರಿ ಡೆಮೊ' : 'SIMULATED DEMO'})
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {language === 'kn' ? 'ಪ್ರಾತ್ಯಕ್ಷಿಕೆ ಟೆಲಿ-ಸಮಾಲೋಚನಾ ರೂಮ್' : 'Simulated Tele-Consultation Room Demo'} • ID: {appointment?.id || 'APT-58291'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono font-bold text-emerald-400">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatTime(callDuration)}</span>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Room Body: Video Stream Grid + Clinical Intake Panel */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          
          {/* Main Video Stage (7 cols) */}
          <div className="lg:col-span-7 bg-slate-950 p-4 flex flex-col justify-between relative">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-full max-h-[500px]">
              
              {/* Doctor Camera Preview */}
              <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-700 flex items-center justify-center">
                {videoOn ? (
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="w-20 h-20 rounded-full bg-teal-600/30 border-2 border-teal-400 flex items-center justify-center text-teal-300 text-2xl font-bold shadow-md">
                      AS
                    </div>
                    <span className="text-[11px] text-teal-300/80 font-mono">Tele-Video Stream Active</span>
                  </div>
                ) : (
                  <div className="text-slate-400 text-xs">Camera Off</div>
                )}
                <span className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-sm text-xs font-semibold px-2.5 py-1 rounded-lg">
                  Dr. Alan Samuel (Clinician)
                </span>
              </div>

              {/* Patient Camera / Avatar */}
              <div className="relative rounded-2xl overflow-hidden bg-slate-800 border border-slate-700 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-emerald-600/30 border-2 border-emerald-400 flex items-center justify-center text-emerald-300 text-2xl font-bold animate-pulse">
                  {appointment?.patientName?.charAt(0) || 'P'}
                </div>
                <span className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-sm text-xs font-semibold px-2.5 py-1 rounded-lg">
                  {appointment?.patientName || 'Rahul K.'} (Patient)
                </span>
              </div>
            </div>

            {/* In-Call Controls */}
            <div className="flex items-center justify-center gap-3 pt-4">
              <button
                onClick={() => setMicOn(!micOn)}
                className={`p-3.5 rounded-2xl border transition-colors cursor-pointer ${
                  micOn ? 'bg-slate-800 border-slate-700 text-white' : 'bg-rose-600 text-white border-rose-600'
                }`}
              >
                {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>

              <button
                onClick={() => setVideoOn(!videoOn)}
                className={`p-3.5 rounded-2xl border transition-colors cursor-pointer ${
                  videoOn ? 'bg-slate-800 border-slate-700 text-white' : 'bg-rose-600 text-white border-rose-600'
                }`}
              >
                {videoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>

              <button
                onClick={onClose}
                className="px-6 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
              >
                <PhoneOff className="w-4 h-4" />
                <span>{language === 'kn' ? 'ಸಮಾಲೋಚನೆ ಮುಕ್ತಾಯಗೊಳಿಸಿ' : 'End Consultation'}</span>
              </button>
            </div>
          </div>

          {/* Right Clinical Dossier & Notes Side Panel (5 cols) */}
          <div className="lg:col-span-5 bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col h-full overflow-hidden">
            {/* Panel Tabs */}
            <div className="flex border-b border-slate-800 bg-slate-900 text-xs">
              <button
                onClick={() => setActiveTab('dossier')}
                className={`flex-1 py-3 font-bold border-b-2 transition-all cursor-pointer ${
                  activeTab === 'dossier'
                    ? 'border-emerald-500 text-emerald-400 bg-slate-800/50'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {language === 'kn' ? 'ಸಮಾಲೋಚನೆ ಪೂರ್ವ ಸಾರಾಂಶ' : 'Pre-Consultation Summary'}
              </button>

              <button
                onClick={() => setActiveTab('notes')}
                className={`flex-1 py-3 font-bold border-b-2 transition-all cursor-pointer ${
                  activeTab === 'notes'
                    ? 'border-emerald-500 text-emerald-400 bg-slate-800/50'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {language === 'kn' ? 'ವೈದ್ಯರ ಟಿಪ್ಪಣಿಗಳು ಮತ್ತು ಸಲಹೆ' : "Doctor's Notes & Advice"}
              </button>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-y-auto p-4 text-xs space-y-3">
              {activeTab === 'dossier' ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-slate-800 border border-slate-700">
                    <span className="font-bold text-slate-400 uppercase text-[10px] block">Chief Complaint</span>
                    <p className="text-slate-200 mt-1">
                      {appointment?.summaryData?.clinicalDossier?.chiefComplaint ||
                        'Reports progressive emotional exhaustion, difficulty winding down at night, and persistent workplace rumination for the past 6 weeks.'}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-800 border border-slate-700">
                    <span className="font-bold text-slate-400 uppercase text-[10px] block">Sleep Architecture</span>
                    <p className="text-slate-200 mt-1">
                      {appointment?.summaryData?.clinicalDossier?.psychiatricReviewOfSystems?.sleepArchitecture ||
                        'Delayed sleep onset (~90+ mins in bed before sleep), restless waking around 4 AM.'}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-800 border border-slate-700">
                    <span className="font-bold text-slate-400 uppercase text-[10px] block">Cognitive & Thought Patterns</span>
                    <p className="text-slate-200 mt-1">
                      {appointment?.summaryData?.clinicalDossier?.psychiatricReviewOfSystems?.cognitionThoughts ||
                        'Excessive anticipation of workplace failure, cognitive looping, decision fatigue.'}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300">
                    <span className="font-bold uppercase text-[10px] block">Risk Screening</span>
                    <p className="mt-1">
                      {appointment?.summaryData?.clinicalDossier?.psychiatricReviewOfSystems?.riskAssessment ||
                        'Screened LOW risk. No acute danger flags detected.'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-slate-300 font-bold uppercase text-[10px]">
                      Session Impressions & Clinical Plan
                    </label>
                    <button
                      onClick={() => setShowRxModal(true)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs cursor-pointer transition-colors"
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>Generate Digital Rx</span>
                    </button>
                  </div>

                  {/* 1-Click Clinical Interventions for Dr. Alan */}
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                      Quick Non-Pharmacological Interventions:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      <button
                        type="button"
                        onClick={() => appendIntervention('Sleep Hygiene: 30m screen off before bed, fixed wake time, zero caffeine post-3 PM.')}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 text-[10px] border border-slate-700 transition-colors cursor-pointer"
                      >
                        + Sleep Hygiene
                      </button>
                      <button
                        type="button"
                        onClick={() => appendIntervention('CBT Homework: Complete 1 entry/day in Thought Diary to reframe catastrophizing.')}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 text-[10px] border border-slate-700 transition-colors cursor-pointer"
                      >
                        + CBT Diary Homework
                      </button>
                      <button
                        type="button"
                        onClick={() => appendIntervention('Autonomic Regulation: 4-7-8 breathing twice daily (morning & before sleep).')}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 text-[10px] border border-slate-700 transition-colors cursor-pointer"
                      >
                        + 4-7-8 Breathing
                      </button>
                      <button
                        type="button"
                        onClick={() => appendIntervention('Follow-up tele-consultation scheduled in 14 days.')}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 text-[10px] border border-slate-700 transition-colors cursor-pointer"
                      >
                        + 2-Week Follow-up
                      </button>
                    </div>
                  </div>

                  <textarea
                    rows={7}
                    value={doctorNotes}
                    onChange={(e) => setDoctorNotes(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />

                  <div className="flex items-center justify-between">
                    <button
                      onClick={handleSaveNotes}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {notesSaved ? <Check className="w-3.5 h-3.5" /> : null}
                      <span>{notesSaved ? 'Notes Saved!' : 'Save Clinical Notes'}</span>
                    </button>

                    <span className="text-[10px] text-slate-500">
                      Syncs to patient profile
                    </span>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Digital Rx Slip Modal */}
        {showRxModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-sm">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 text-slate-800 shadow-2xl border border-slate-200 relative animate-fade-in text-xs font-sans">
              <button
                onClick={() => setShowRxModal(false)}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="border-b-2 border-slate-900 pb-3 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 uppercase">Dr. Alan Samuel</h3>
                    <p className="text-[11px] text-slate-500">Consultant Psychiatrist</p>
                    <p className="text-[10px] text-slate-400">Samvaad Pan-India Subsidized Tele-Health Network</p>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-bold text-sm">
                    Rx
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 mb-3 font-mono text-[11px] space-y-0.5">
                <div><strong>Patient:</strong> {appointment?.patientName || 'Rahul K.'}</div>
                <div><strong>Mode:</strong> {appointment?.mode?.toUpperCase()} Tele-Consultation</div>
                <div><strong>Date:</strong> {new Date().toLocaleDateString('en-IN')}</div>
                <div><strong>Clinical Session Type:</strong> Supportive Tele-Psychiatry Consultation</div>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-xl mb-4 font-serif text-slate-800 space-y-1">
                <span className="font-sans font-bold text-[10px] uppercase text-slate-400 block font-mono">Consultation Advice & Recommendations:</span>
                <p className="whitespace-pre-line text-xs">{doctorNotes}</p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                <div className="text-[10px] text-slate-400 font-mono">
                  <div>Tele-Mental Health Consultation Summary</div>
                  <div>Samvaad Affordable Care Initiative</div>
                </div>
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Slip</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
