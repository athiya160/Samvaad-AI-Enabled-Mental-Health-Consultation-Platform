import React, { useState, useEffect } from 'react';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import CrisisBanner from './components/CrisisBanner';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import AICompanionChat from './components/AICompanionChat';
import ReflectionModal from './components/ReflectionModal';
import ConsultantDirectory from './components/ConsultantDirectory';
import BookingModal from './components/BookingModal';
import DoctorDashboard from './components/DoctorDashboard';
import TherapyTools from './components/TherapyTools';
import AccountAuthModal from './components/AccountAuthModal';
import ConsultationRoomModal from './components/ConsultationRoomModal';
import ClinicalProposalDocModal from './components/ClinicalProposalDocModal';
import DemoPresenterBar from './components/DemoPresenterBar';
import Footer from './components/Footer';
import { CONSULTANTS } from './data/consultants';
import { Sparkles, HeartHandshake, ShieldCheck, ArrowRight, UserCheck, MessageCircleHeart, Stethoscope } from 'lucide-react';

function MainApp() {
  const { language, t } = useLanguage();
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'chat' | 'doctors' | 'therapy-tools' | 'doctor-portal'

  // Modals state
  const [reflectionData, setReflectionData] = useState(null);
  const [activeSummaryToSave, setActiveSummaryToSave] = useState(null);
  const [bookingSummaryToAttach, setBookingSummaryToAttach] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalInitialView, setAuthModalInitialView] = useState('auth_prompt');
  const [isSpecsDocOpen, setIsSpecsDocOpen] = useState(false);
  const [selectedPromptForChat, setSelectedPromptForChat] = useState('');
  const [selectedDoctorForBooking, setSelectedDoctorForBooking] = useState(null);
  const [activeConsultationRoomApt, setActiveConsultationRoomApt] = useState(null);

  // Authenticated User State from Backend
  const [currentUser, setCurrentUser] = useState(null);

  // Check existing session on load
  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.ok && data.user) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => {});
  }, []);

  // Mock prefilled appointments for Dr. Alan Samuel's dashboard
  const [appointments, setAppointments] = useState([
    {
      id: 'APT-10492',
      doctorName: 'Dr. Alan Samuel',
      doctorId: 'dr-alan-samuel',
      patientName: 'Sample Patient A [Fictional Demo Data]',
      patientPhone: 'DEMO-SESSION-01 (Fictional)',
      mode: 'video',
      date: 'Today (Demonstration)',
      time: '4:30 PM - 5:15 PM',
      price: 499,
      hasSummaryAttached: true,
      summaryData: {
        clinicalDossier: {
          dossierId: 'DOS-819203 [Demo]',
          patientId: 'Sample Patient A [Fictional Demonstration Record]',
          timestamp: 'Today, 2:15 PM (Demo)',
          chiefComplaint: 'Patient reported feeling emotionally exhausted, experiencing delayed sleep onset, and having work pressures on their mind.',
          durationAndOnset: 'Reported subacute onset (~several weeks duration).',
          psychiatricReviewOfSystems: {
            moodAffect: 'Reported feelings of fatigue and occasional irritability.',
            sleepArchitecture: 'Reported delayed sleep onset and restless awakenings.',
            cognitionThoughts: 'Reported persistent work concerns and looping thoughts when unwinding.',
            somaticAutonomic: 'Reported occasional tension headaches under stress.',
            riskAssessment: 'Fictional Demo Data: No crisis keywords detected in pre-consult chat. (Clinical risk must be evaluated independently by doctor).'
          },
          intakeRecommendation: 'Sample exploratory points: sleep hygiene review, stress boundary discussion, supportive counseling.'
        }
      },
      status: 'Simulated Demo'
    },
    {
      id: 'APT-10493',
      doctorName: 'Dr. Alan Samuel',
      doctorId: 'dr-alan-samuel',
      patientName: 'Sample Patient B [Fictional Demo Data]',
      patientPhone: 'DEMO-SESSION-02 (Fictional)',
      mode: 'chat',
      date: 'Today (Demonstration)',
      time: '6:00 PM - 6:45 PM',
      price: 299,
      hasSummaryAttached: true,
      summaryData: {
        clinicalDossier: {
          dossierId: 'DOS-920144 [Demo]',
          patientId: 'Sample Patient B [Fictional Demonstration Record]',
          timestamp: 'Today, 3:30 PM (Demo)',
          chiefComplaint: 'Reported stress around upcoming academic evaluations and feeling overwhelmed.',
          durationAndOnset: 'Reported episodic stress over recent weeks.',
          psychiatricReviewOfSystems: {
            moodAffect: 'Reported situational worry and academic strain.',
            sleepArchitecture: 'Reported irregular sleep hours during busy study periods.',
            cognitionThoughts: 'Reported worry regarding future academic expectations.',
            somaticAutonomic: 'Reported butterflies in stomach prior to presentations.',
            riskAssessment: 'Fictional Demo Data: No crisis indicators noted in chat. (Clinical risk to be evaluated by doctor).'
          },
          intakeRecommendation: 'Sample exploratory points: exam stress management, relaxation techniques.'
        }
      },
      status: 'Simulated Demo'
    }
  ]);

  // Ensure switching tabs always resets view to the top cleanly
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [activeTab]);

  const handleOpenReflectionModal = (data) => {
    setReflectionData(data);
    setActiveSummaryToSave(data);
    setBookingSummaryToAttach(data);
  };

  const handleOpenSaveModalFromReflection = (summary) => {
    const sum = summary || reflectionData;
    setActiveSummaryToSave(sum);
    setBookingSummaryToAttach(sum);
    setReflectionData(null);
    setAuthModalInitialView('auth_prompt');
    setIsAuthModalOpen(true);
  };

  const handleBookDoctorFromSummary = (dossier) => {
    const summary = dossier || bookingSummaryToAttach || activeSummaryToSave || reflectionData;
    if (summary) {
      setBookingSummaryToAttach(summary);
      setActiveSummaryToSave(summary);
    }
    setReflectionData(null);
    setIsAuthModalOpen(false);
    const drAlan = CONSULTANTS.find(c => c.id === 'dr-alan-samuel') || CONSULTANTS[0];
    setSelectedDoctorForBooking(drAlan);
  };

  const handleConfirmAppointment = (appointmentData) => {
    setAppointments(prev => [appointmentData, ...prev]);
  };

  const handleTriggerScenario = (type) => {
    if (type === 'insomnia') {
      setSelectedPromptForChat("I haven't slept properly for over 3 weeks. My job has immense pressure and my mind won't stop racing at 3 AM.");
      setActiveTab('chat');
    } else if (type === 'crisis') {
      setSelectedPromptForChat("I feel completely hopeless and exhausted, and I don't know if I can keep going anymore.");
      setActiveTab('chat');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fafaf8] text-slate-800 overflow-x-hidden">
      
      {/* 24x7 Emergency Helplines (Govt & NGO) */}
      <CrisisBanner />

      {/* Main Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onOpenVault={() => {
          setAuthModalInitialView('vault');
          setIsAuthModalOpen(true);
        }}
        onOpenLogin={() => {
          setAuthModalInitialView('login');
          setIsAuthModalOpen(true);
        }}
        onOpenSpecsDoc={() => setIsSpecsDocOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        
        {/* VIEW 1: HOME */}
        {activeTab === 'home' && (
          <div>
            <Hero
              onStartChat={() => {
                const chatEl = document.getElementById('ai-chat-section');
                if (chatEl) {
                  chatEl.scrollIntoView({ behavior: 'smooth' });
                } else {
                  setActiveTab('chat');
                }
              }}
              onBrowseDoctors={() => setActiveTab('doctors')}
            />

            {/* LIVE AI COMPANION EMBEDDED DIRECTLY ON HOMEPAGE */}
            <div id="ai-chat-section" className="py-8 bg-gradient-to-b from-slate-50/70 to-[#fbfbfa] border-b border-slate-200">
              <div className="max-w-4xl mx-auto px-4 text-center mb-4">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
                  {language === 'kn' ? 'ನೇರ AI ಆತ್ಮಾವಲೋಕನ ಸಾಧನ' : 'Live Interactive AI Companion'}
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
                  {language === 'kn' ? 'ಔರಾ (Aura) ಜೊತೆ ಮುಕ್ತವಾಗಿ ಮಾತನಾಡಿ' : 'Talk with Aura — Free & Confidential'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  {language === 'kn' ? 'ಯಾವುದೇ ಲಾಗಿನ್ ಅಥವಾ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ಇಲ್ಲದೆ ನಿಮ್ಮ ಮನಸ್ಸಿನಲ್ಲಿರುವುದನ್ನು ಹಂಚಿಕೊಳ್ಳಿ' : 'Share whatever is on your mind below. No login or phone number required.'}
                </p>
              </div>

              <AICompanionChat
                onOpenReflectionModal={setReflectionData}
                onBookDoctorWithSummary={handleBookDoctorFromSummary}
                initialPrompt={selectedPromptForChat}
              />
            </div>

            {/* Platform Highlights & Values */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
              <div className="text-center max-w-2xl mx-auto mb-12">
                <span className="text-xs font-bold text-sage-800 uppercase tracking-wider bg-sage-100 px-3 py-1 rounded-full border border-sage-200">
                  {language === 'kn' ? 'ಸಂವಾದ ಹೇಗೆ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ' : 'How Samvaad Works'}
                </span>
                <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-3">
                  {language === 'kn' ? 'ಮಾನಸಿಕ ನೆಮ್ಮದಿಗೆ ಮುಕ್ತ ಮತ್ತು ಸುಲಭ ಹಾದಿ' : 'A Gentle, Stigma-Free Path to Mental Well-being'}
                </h2>
                <p className="text-sm text-slate-600 mt-2">
                  {language === 'kn' ? 'ರೋಗಿಯ ಗೌಪ್ಯತೆ, ಸ್ಥಳೀಯ ಭಾಷೆಗಳು ಮತ್ತು ಪಾರದರ್ಶಕ ಕೈಗೆಟುಕುವ ದರಗಳಿಗೆ ಆದ್ಯತೆ.' : 'Designed specifically around patient comfort, local Indian languages, and fair, transparent pricing.'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Step 1 */}
                <div className="bg-white/95 rounded-3xl p-7 sm:p-8 border border-stone-200/90 shadow-soft-md hover:shadow-soft-xl hover:-translate-y-1 transition-all duration-200 relative flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-100 to-teal-50 text-emerald-800 flex items-center justify-center font-black text-lg mb-5 border border-emerald-200/80 shadow-2xs">
                      1
                    </div>
                    <h3 className="font-bold text-lg text-slate-900 mb-2">
                      {language === 'kn' ? 'ಉಚಿತ AI ಸಹಾಯಕ (Aura)' : 'Free AI Reflection Companion'}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6 font-normal">
                      {language === 'kn' ? 'ಸ್ನೇಹಿತರೊಂದಿಗೆ ಮಾತನಾಡುವಂತೆ ಮುಕ್ತವಾಗಿ ಮಾತನಾಡಿ. ಯಾವುದೇ ಪ್ರಶ್ನಾವಳಿಗಳಿಲ್ಲ, ಲಾಗಿನ್ ಅಗತ್ಯವಿಲ್ಲ. ನಿದ್ರೆ, ಆಲೋಚನೆ ಮತ್ತು ಒತ್ತಡವನ್ನು ಸುಲಭವಾಗಿ ಅನ್ವೇಷಿಸಿ.' : 'Talk freely like chatting with a friend. Zero multiple-choice forms and zero login required. Aura explores your sleep, thoughts, and stressors naturally.'}
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('chat')}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5 cursor-pointer pt-3 border-t border-stone-100"
                  >
                    <span>{language === 'kn' ? 'ಔರಾ ಜೊತೆ ಉಚಿತವಾಗಿ ಮಾತನಾಡಿ' : 'Try Aura Free'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Step 2 */}
                <div className="bg-white/95 rounded-3xl p-7 sm:p-8 border border-stone-200/90 shadow-soft-md hover:shadow-soft-xl hover:-translate-y-1 transition-all duration-200 relative flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sage-100 to-emerald-50 text-sage-800 flex items-center justify-center font-black text-lg mb-5 border border-sage-200/80 shadow-2xs">
                      2
                    </div>
                    <h3 className="font-bold text-lg text-slate-900 mb-2">
                      {language === 'kn' ? 'ವೈಯಕ್ತಿಕ ಆತ್ಮಾವಲೋಕನ ಸಾರಾಂಶ' : 'Personal Reflection Summary'}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6 font-normal">
                      {language === 'kn' ? 'ನಿಮ್ಮ ಆತ್ಮಾವಲೋಕನ ಸಾರಾಂಶವನ್ನು ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ ಅಥವಾ ಖಾಸಗಿ ಖಾತೆಯೊಂದಿಗೆ ಸುರಕ್ಷಿತವಾಗಿ ಉಳಿಸಿ. ಬಲವಾದ ಪಾಸ್‌ವರ್ಡ್ ಹ್ಯಾಶಿಂಗ್ ಮತ್ತು ಏಕ-ಬಳಕೆಯ ಚೇತರಿಕೆ ಕೋಡ್‌ಗಳು ನಿಮ್ಮ ಡೇಟಾವನ್ನು ರಕ್ಷಿಸುತ್ತವೆ.' : 'Download your personal reflection summary or save it securely with a Private Account. Strong password hashing and single-use recovery codes keep your data safe.'}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setAuthModalInitialView(currentUser ? 'vault' : 'auth_prompt');
                      setIsAuthModalOpen(true);
                    }}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5 cursor-pointer pt-3 border-t border-stone-100"
                  >
                    <span>{language === 'kn' ? 'ಖಾಸಗಿ ಖಾತೆ ತಿಳಿಯಿರಿ' : 'Explore Private Account'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Step 3 */}
                <div className="bg-white/95 rounded-3xl p-7 sm:p-8 border border-stone-200/90 shadow-soft-md hover:shadow-soft-xl hover:-translate-y-1 transition-all duration-200 relative flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-100 to-cyan-50 text-teal-800 flex items-center justify-center font-black text-lg mb-5 border border-teal-200/80 shadow-2xs">
                      3
                    </div>
                    <h3 className="font-bold text-lg text-slate-900 mb-2">
                      {language === 'kn' ? 'ಕೈಗೆಟುಕುವ ಸಮಾಲೋಚನೆಗಳು (< ₹500)' : 'Affordable Consultations (< ₹500)'}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6 font-normal">
                      {language === 'kn' ? 'ಅಖಿಲ ಭಾರತದ ಅರ್ಹ ತಜ್ಞರನ್ನು ಚಾಟ್ (₹299), ಆಡಿಯೋ (₹399) ಅಥವಾ ವಿಡಿಯೋ (₹499) ಮೂಲಕ ಸಂಪರ್ಕಿಸಿ.' : 'Consult qualified specialists across India via Chat (₹299), Audio (₹399), or Video (₹499), with pre-consultation reflection summaries for context.'}
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('doctors')}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5 cursor-pointer pt-3 border-t border-stone-100"
                  >
                    <span>{language === 'kn' ? 'ತಜ್ಞರನ್ನು ವೀಕ್ಷಿಸಿ' : 'Browse Specialists'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>

              {/* Featured Pan-India Clinical Leadership Banner */}
              <div className="mt-14 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 sm:p-10 text-white relative overflow-hidden shadow-soft-xl border border-slate-700/60">
                <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center relative z-10">
                  
                  <div className="md:col-span-8 space-y-3.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30">
                      {language === 'kn' ? 'ನೈತಿಕ ಆರೋಗ್ಯ ಸೇವಾ ತತ್ವ' : 'Ethical Healthcare Philosophy'}
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-black leading-tight text-white">
                      {language === 'kn' ? '"ಆರೋಗ್ಯ ರಕ್ಷಣೆ ಪವಿತ್ರ ಸೇವೆ, ಕೇವಲ ವ್ಯಾಪಾರವಲ್ಲ."' : '"Healthcare is a noble service, not just business."'}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl font-normal">
                      {language === 'kn' 
                        ? '— ಡಾ. ಅಲನ್ ಸ್ಯಾಮ್ಯುಯೆಲ್ (ಸಲಹಾ ಮನೋವೈದ್ಯರು). ಹಣಕಾಸಿನ ಕೊರತೆಯಿಂದ ಯಾರೊಬ್ಬರೂ ಮಾನಸಿಕ ಚಿಕಿತ್ಸೆಯಿಂದ ವಂಚಿತರಾಗಬಾರದು ಎಂಬ ಉದ್ದೇಶದಿಂದ ಭಾರತದಾದ್ಯಂತ ಶುಲ್ಕವನ್ನು ₹500 ಕ್ಕಿಂತ ಕಡಿಮೆ ನಿಗದಿಪಡಿಸಲಾಗಿದೆ.' 
                        : '— Dr. Alan Samuel (Consultant Psychiatrist). We are standardizing tele-mental health rates under ₹500 across India so that financial constraints never stand between a human being and ethical, dignified psychological support.'}
                    </p>
                    <div className="pt-2 flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => {
                          const drAlan = CONSULTANTS.find(c => c.id === 'dr-alan-samuel');
                          setSelectedDoctorForBooking(drAlan);
                        }}
                        className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs sm:text-sm shadow-soft-md hover:shadow-glow-emerald transition-all cursor-pointer"
                      >
                        {language === 'kn' ? 'ಡಾ. ಅಲನ್ ಸ್ಯಾಮ್ಯುಯೆಲ್ ಅವರೊಂದಿಗೆ ಸಮಾಲೋಚನೆ ಕಾಯ್ದಿರಿಸಿ (< ₹500)' : 'Book Session with Dr. Alan Samuel (< ₹500)'}
                      </button>
                      <button
                        onClick={() => setActiveTab('doctors')}
                        className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm border border-slate-700 transition-colors cursor-pointer"
                      >
                        {language === 'kn' ? 'ಅಖಿಲ ಭಾರತದ ಎಲ್ಲಾ ವೈದ್ಯರನ್ನು ನೋಡಿ' : 'View All Pan-India Doctors'}
                      </button>
                    </div>
                  </div>

                  {/* Dignified Clinical Badge (No stock photos) */}
                  <div className="md:col-span-4 flex justify-center md:justify-end">
                    <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-3xl bg-gradient-to-br from-emerald-950/90 to-slate-900 border-2 border-emerald-500/30 shadow-2xl flex flex-col items-center justify-center text-center p-4">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shadow-inner mb-2">
                        <Stethoscope className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-300" />
                      </div>
                      <span className="text-sm font-bold text-white tracking-wide">
                        {language === 'kn' ? 'ಡಾ. ಅಲನ್ ಸ್ಯಾಮ್ಯುಯೆಲ್' : 'Dr. Alan Samuel'}
                      </span>
                      <span className="text-[11px] text-emerald-300 font-mono mt-0.5">
                        {language === 'kn' ? 'ಸಲಹಾ ಮನೋವೈದ್ಯರು' : 'Consultant Psychiatrist'}
                      </span>
                      <span className="text-[10px] text-slate-400 mt-1">
                        {language === 'kn' ? 'ಕರ್ನಾಟಕದ ತಜ್ಞರು' : 'Karnataka Specialist'}
                      </span>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>
        )}

        {/* VIEW 2: AI COMPANION CHAT */}
        {activeTab === 'chat' && (
          <AICompanionChat
            onOpenReflectionModal={handleOpenReflectionModal}
            onBookDoctorWithSummary={handleBookDoctorFromSummary}
            initialPrompt={selectedPromptForChat}
          />
        )}

        {/* VIEW 3: PAN-INDIA CONSULTANTS DIRECTORY */}
        {activeTab === 'doctors' && (
          <ConsultantDirectory
            onSelectDoctor={(doc) => setSelectedDoctorForBooking(doc)}
            prefilledSummary={reflectionData}
          />
        )}

        {/* VIEW 4: THERAPY SUITE (MOOD TRACKER / CBT DIARY / BREATHING) */}
        {activeTab === 'therapy-tools' && (
          <TherapyTools />
        )}

        {/* VIEW 5: DOCTOR CLINICAL DASHBOARD (DR. ALAN'S VIEW) */}
        {activeTab === 'doctor-portal' && (
          <DoctorDashboard
            appointments={appointments}
            onLaunchConsultationRoom={(apt) => setActiveConsultationRoomApt(apt)}
          />
        )}

      </main>

      {/* Modals */}
      {reflectionData && (
        <ReflectionModal
          data={reflectionData}
          onClose={() => setReflectionData(null)}
          onSaveSummary={handleOpenSaveModalFromReflection}
          onSavePseudo={handleOpenSaveModalFromReflection}
          onBookDoctor={handleBookDoctorFromSummary}
        />
      )}

      {isAuthModalOpen && (
        <AccountAuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          currentUser={currentUser}
          onAuthSuccess={(user) => {
            setCurrentUser(user);
          }}
          onLogout={async () => {
            await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
            setCurrentUser(null);
          }}
          onAccountDeleted={() => {
            setCurrentUser(null);
          }}
          summaryToSave={activeSummaryToSave || reflectionData}
          conversationMessages={reflectionData?.messages || activeSummaryToSave?.messages || []}
          onBookDoctorWithSummary={handleBookDoctorFromSummary}
          initialView={authModalInitialView}
        />
      )}

      {selectedDoctorForBooking && (
        <BookingModal
          doctor={selectedDoctorForBooking}
          prefilledSummary={bookingSummaryToAttach || activeSummaryToSave || reflectionData}
          currentUser={currentUser}
          onClose={() => setSelectedDoctorForBooking(null)}
          onConfirmBooking={handleConfirmAppointment}
          onViewDoctorPortal={() => {
            setSelectedDoctorForBooking(null);
            setActiveTab('doctor-portal');
          }}
        />
      )}

      {activeConsultationRoomApt && (
        <ConsultationRoomModal
          appointment={activeConsultationRoomApt}
          onClose={() => setActiveConsultationRoomApt(null)}
        />
      )}

      {isSpecsDocOpen && (
        <ClinicalProposalDocModal
          isOpen={isSpecsDocOpen}
          onClose={() => setIsSpecsDocOpen(false)}
          onNavigateTab={(tab) => setActiveTab(tab)}
          onSelectPrompt={(prompt) => {
            setSelectedPromptForChat(prompt);
            setActiveTab('chat');
          }}
        />
      )}

      {/* Interactive Demo Presenter Dock (For Presenting to Dr. Alan) */}
      <DemoPresenterBar
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        onOpenProposal={() => setIsSpecsDocOpen(true)}
        onTriggerScenario={handleTriggerScenario}
      />

      {/* Footer */}
      <Footer />

    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <MainApp />
    </LanguageProvider>
  );
}
