import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Sparkles,
  FileText,
  Bot,
  User,
  RefreshCw,
  ShieldAlert,
  Mic,
  MicOff,
  CheckCircle,
  Heart,
  Lock,
  AlertCircle,
  Info,
  X,
  PhoneCall,
  Wind,
  Activity,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';
import { PSYCHIATRIC_DOMAINS } from '../data/psychiatricDomains';
import { AICompanionEngine, MASTER_GREETING } from '../services/aiCompanionService';
import { useLanguage } from '../context/LanguageContext';

export default function AICompanionChat({ onOpenReflectionModal, onBookDoctorWithSummary, initialPrompt }) {
  const { language, t } = useLanguage();
  const [engine] = useState(() => new AICompanionEngine());
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isCrisisModalOpen, setIsCrisisModalOpen] = useState(false);
  const [isGroundingOpen, setIsGroundingOpen] = useState(false);
  const [groundingTab, setGroundingTab] = useState('breathing'); // 'breathing' | 'sensory' | 'pacing'
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  // Box Breathing cycle state
  const [breathPhase, setBreathPhase] = useState('Inhale'); // 'Inhale' | 'Hold' | 'Exhale' | 'Rest'
  const [breathCount, setBreathCount] = useState(4);
  const [isBreathingActive, setIsBreathingActive] = useState(false);

  const [messages, setMessages] = useState([
    {
      id: 'welcome-1',
      sender: 'bot',
      text: MASTER_GREETING[language] || MASTER_GREETING.en,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [inputText, setInputText] = useState(initialPrompt || '');
  const [isTyping, setIsTyping] = useState(false);
  const [detectedDomainIds, setDetectedDomainIds] = useState(['primary_concern']);
  const [isCrisisActive, setIsCrisisActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [lastFailedMessage, setLastFailedMessage] = useState(null);

  useEffect(() => {
    if (initialPrompt) {
      setInputText(initialPrompt);
    }
  }, [initialPrompt]);

  const chatContainerRef = useRef(null);

  const scrollToBottom = (behavior = 'smooth') => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior
      });
    }
  };

  // Only scroll internally inside the chat box when user chats; never force window scroll
  useEffect(() => {
    if (messages.length > 1 || isTyping) {
      scrollToBottom('smooth');
    }
  }, [messages, isTyping]);

  // Update initial welcome message if user changes language before sending messages
  useEffect(() => {
    if (messages.length === 1 && messages[0].id === 'welcome-1') {
      setMessages([
        {
          id: 'welcome-1',
          sender: 'bot',
          text: MASTER_GREETING[language] || MASTER_GREETING.en,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, [language]);

  // Box Breathing cycle timer
  useEffect(() => {
    if (!isBreathingActive) return;
    const interval = setInterval(() => {
      setBreathCount((prev) => {
        if (prev > 1) return prev - 1;

        // Transition phases: Inhale (4s) -> Hold (4s) -> Exhale (4s) -> Rest (4s)
        setBreathPhase((curPhase) => {
          if (curPhase === 'Inhale') return 'Hold';
          if (curPhase === 'Hold') return 'Exhale';
          if (curPhase === 'Exhale') return 'Rest';
          return 'Inhale';
        });
        return 4;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isBreathingActive]);

  // Handle Speech Recognition if browser supports it
  const toggleSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Voice input is not supported in this browser. Please type your message.");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = language === 'kn' ? 'kn-IN' : 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = false;

    if (!isListening) {
      setIsListening(true);
      recognition.start();
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputText(prev => prev ? `${prev} ${transcript}` : transcript);
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
    } else {
      setIsListening(false);
    }
  };

  const handleSendMessage = async (textToSend = null) => {
    const text = textToSend || inputText;
    if (!text.trim() || isTyping) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputText('');
    setIsTyping(true);
    setLastFailedMessage(null);

    try {
      const response = await engine.generateResponse(text.trim(), newMessages, language);
      setIsTyping(false);

      if (response.isCrisis) {
        setIsCrisisActive(true);
      }

      if (response.detectedDomains) {
        setDetectedDomainIds(response.detectedDomains);
      }

      if (response.isServiceUnavailable) {
        setLastFailedMessage(text.trim());
      }

      setMessages(prev => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: response.text,
          isCrisis: response.isCrisis,
          isPhysicalEmergency: response.isPhysicalEmergency,
          isServiceUnavailable: response.isServiceUnavailable,
          provider: response.provider,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err) {
      console.error('Chat error:', err);
      setIsTyping(false);
      setLastFailedMessage(text.trim());
      setMessages(prev => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          isServiceUnavailable: true,
          text: language === 'kn'
            ? 'ಔರಾ AI ಸೇವೆ ಪ್ರಸ್ತುತ ಲಭ್ಯವಿಲ್ಲ. ತಕ್ಷಣದ ಸಹಾಯಕ್ಕಾಗಿ ದಯವಿಟ್ಟು 1800-599-0019 (ಕಿರಣ್) ಅಥವಾ 14416 (ಟೆಲಿ-ಮಾನಸ್) ಗೆ ಕರೆ ಮಾಡಿ.'
            : 'Aura conversational AI service is temporarily unavailable. If you are experiencing distress, please reach out to our 24x7 toll-free helpline: 1800-599-0019 (KIRAN) or 14416 (Tele-MANAS).',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  };

  const samplePrompts = [
    {
      category: language === 'kn' ? 'ಬ್ರೇಕಪ್ ಮತ್ತು ದೈಹಿಕ ನೋವು' : 'Breakup & Somatic Pain',
      badge: language === 'kn' ? 'ಸಂಬಂಧದ ಆಘಾತ' : 'Relationship Loss',
      icon: '💔',
      text: language === 'kn'
        ? "ಕೆಲವು ದಿನಗಳ ಹಿಂದೆ ಬ್ರೇಕಪ್ ಆಗಿದೆ, ತುಂಬಾ ನೋವಾಗುತ್ತಿದೆ. ಇದರಿಂದ ಹೊರಬರುವುದು ಹೇಗೆ? ಆರೋಗ್ಯವೂ ಹದಗೆಡುತ್ತಿದೆ."
        : "Few days back me and my boyfriend broke up. I'm suffering a lot from this. How to move on? My health is suffering from this."
    },
    {
      category: language === 'kn' ? 'ರಾತ್ರಿಯ ಆಲೋಚನೆ ಮತ್ತು ಆತಂಕ' : 'Nocturnal Rumination',
      badge: language === 'kn' ? 'ಆತಂಕ' : 'Racing Thoughts',
      icon: '🌪️',
      text: language === 'kn'
        ? "ಮನಸ್ಸಿನಲ್ಲಿ ಯಾವಾಗಲೂ ಆಲೋಚನೆಗಳು ಓಡುತ್ತಿವೆ, ದೈಹಿಕ ಆತಂಕ ಹೆಚ್ಚಾಗಿದೆ."
        : "My thoughts keep racing at night and I feel constant physical anxiety."
    },
    {
      category: language === 'kn' ? 'ಸಾಮಾಜಿಕ ಅಂತರ ಮತ್ತು ಒಂಟಿತನ' : 'Social Disconnection',
      badge: language === 'kn' ? 'ಒಂಟಿತನ' : 'Isolation',
      icon: '🍃',
      text: language === 'kn'
        ? "ಸ್ನೇಹಿತರಿಂದ ದೂರವಿರುತ್ತಿದ್ದೇನೆ ಮತ್ತು ಸಾಮಾಜಿಕವಾಗಿ ಒಂಟಿತನ ಕಾಡುತ್ತಿದೆ."
        : "I've been feeling disconnected from friends and withdrawing socially."
    },
    {
      category: language === 'kn' ? 'ಕೆಲಸದ ಒತ್ತಡ ಮತ್ತು ಗಡುವು' : 'Workplace Pressure',
      badge: language === 'kn' ? 'ಕೆಲಸದ ಒತ್ತಡ' : 'Deadlines',
      icon: '💼',
      text: language === 'kn'
        ? "ಕೆಲಸದ ಒತ್ತಡ ಮತ್ತು ಗಡುವುಗಳು ನನ್ನ ಮನಸ್ಸಿನ ಶಾಂತಿಯನ್ನು ಹಾಳುಮಾಡುತ್ತಿವೆ."
        : "I've been feeling stressed about work lately and overwhelmed by deadlines."
    }
  ];

  const handleOpenSummary = async () => {
    setIsGeneratingSummary(true);
    try {
      const result = await engine.generatePersonalReflection(messages, language);
      setIsGeneratingSummary(false);
      onOpenReflectionModal({ reflection: result.reflection, messages });
    } catch (err) {
      console.error('Reflection error:', err);
      setIsGeneratingSummary(false);
      const fallback = engine.generateFallbackReflection(messages, language);
      onOpenReflectionModal({ reflection: fallback, messages });
    }
  };

  const userMessagesCount = messages.filter(m => m.sender === 'user').length;

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-3 sm:py-5">
      
      {/* Container Card */}
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-soft-xl border border-stone-200/90 overflow-hidden flex flex-col h-[calc(100vh-190px)] min-h-[580px] max-h-[790px]">
        
        {/* Clinical Chat Header */}
        <div className="p-3.5 sm:p-5 bg-gradient-to-r from-stone-50 via-sage-50/70 to-emerald-50/80 border-b border-stone-200/80">
          <div className="flex flex-wrap items-center justify-between gap-3">
            
            {/* Identity & Status */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-sage-800 via-sage-700 to-emerald-700 text-white flex items-center justify-center shadow-soft-md shadow-sage-900/15 border border-emerald-500/20 flex-shrink-0">
                <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-200" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-extrabold text-slate-900 text-base sm:text-lg tracking-tight">
                    {language === 'kn' ? 'ಔರಾ • ಕ್ಲಿನಿಕಲ್ ಸಂವಾದ ಮತ್ತು ಆತ್ಮಾವಲೋಕನ' : 'Aura • Clinical Intake & Reflection'}
                  </h2>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-100/90 px-2.5 py-0.5 rounded-full border border-emerald-200 shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    {language === 'kn' ? 'ಖಾಸಗಿ ಮತ್ತು ಗೌಪ್ಯ' : 'Private & Confidential'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 hidden sm:block font-medium">
                  {language === 'kn'
                    ? 'ಡಾ. ಅಲನ್ ಸ್ಯಾಮ್ಯುಯೆಲ್ (ಮನೋವೈದ್ಯರು) ಮಾರ್ಗದರ್ಶನದಲ್ಲಿ • ಕೈಗೆಟುಕುವ ಟೆಲಿ-ಮಾನಸಿಕ ಆರೋಗ್ಯ ಉಪಕ್ರಮ'
                    : 'Supervised by Dr. Alan Samuel (Psychiatrist) • Affordable, Stigma-Free Tele-Mental Health Initiative'}
                </p>
              </div>
            </div>

            {/* Quick Action Controls */}
            <div className="flex items-center gap-2">
              {/* Somatic Calming Drawer Toggle */}
              <button
                type="button"
                onClick={() => setIsGroundingOpen(prev => !prev)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer shadow-2xs ${
                  isGroundingOpen
                    ? 'bg-sage-100 border-sage-300 text-sage-900'
                    : 'bg-white border-stone-200 text-slate-700 hover:bg-stone-50 hover:border-stone-300'
                }`}
                title="Somatic Grounding & Calming Exercises"
              >
                <Wind className="w-3.5 h-3.5 text-sage-600" />
                <span className="hidden md:inline">{language === 'kn' ? 'ಶಾಂತಿ ಪರಿಕರಗಳು' : 'Somatic Calming'}</span>
                {isGroundingOpen ? <ChevronUp className="w-3 h-3 text-slate-400" /> : <ChevronDown className="w-3 h-3 text-slate-400" />}
              </button>

              {/* Emergency Helplines Button */}
              <button
                type="button"
                onClick={() => setIsCrisisModalOpen(true)}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200/80 transition-all cursor-pointer shadow-2xs"
                title="24x7 Verified Crisis Helplines"
              >
                <PhoneCall className="w-3.5 h-3.5 text-rose-600" />
                <span className="hidden sm:inline">{language === 'kn' ? '24/7 ಸಹಾಯವಾಣಿ' : '24x7 Helplines'}</span>
              </button>

              {/* Privacy Transparency */}
              <button
                type="button"
                onClick={() => setIsPrivacyModalOpen(true)}
                className="p-1.5 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-stone-100 border border-stone-200 transition-colors cursor-pointer"
                title="View Privacy & AI Transparency Notice"
              >
                <Info className="w-4 h-4" />
              </button>

              {/* Action to Generate Summary */}
              <button
                onClick={handleOpenSummary}
                disabled={isGeneratingSummary || userMessagesCount === 0}
                className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 transition-all duration-200 cursor-pointer shadow-soft-sm ${
                  userMessagesCount > 0 && !isGeneratingSummary
                    ? 'bg-gradient-to-r from-sage-800 via-sage-700 to-emerald-700 hover:from-sage-900 hover:to-emerald-800 text-white shadow-soft-md shadow-sage-900/20 scale-[1.02] hover:-translate-y-0.5'
                    : 'bg-stone-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                {isGeneratingSummary ? (
                  <RefreshCw className="w-4 h-4 text-emerald-300 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4 text-emerald-200" />
                )}
                <span>{isGeneratingSummary ? (language === 'kn' ? 'ಸಾರಾಂಶ ಸಿದ್ಧವಾಗುತ್ತಿದೆ...' : 'Generating Summary...') : t('generateReflectionBtn')}</span>
                {userMessagesCount > 0 && !isGeneratingSummary && (
                  <span className="bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full font-mono">
                    {userMessagesCount} {language === 'kn' ? 'ಸಂದೇಶ' : (userMessagesCount === 1 ? 'msg' : 'msgs')}
                  </span>
                )}
              </button>
            </div>

          </div>
        </div>

        {/* Collapsible Somatic Grounding Drawer */}
        {isGroundingOpen && (
          <div className="bg-gradient-to-b from-sage-50/95 to-stone-50 border-b border-sage-200/80 p-3.5 sm:p-4 animate-fade-in transition-all">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-sage-700" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  {language === 'kn' ? 'ದೈಹಿಕ ಮತ್ತು ಮಾನಸಿಕ ಶಾಂತಿಗಾಗಿ ಪರಿಕರಗಳು' : 'Clinical Somatic Grounding & Regulation'}
                </h3>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setGroundingTab('breathing')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    groundingTab === 'breathing'
                      ? 'bg-sage-700 text-white shadow-2xs'
                      : 'bg-white text-slate-600 hover:bg-stone-100 border border-stone-200'
                  }`}
                >
                  {language === 'kn' ? '4-4-4 ಬಾಕ್ಸ್ ಉಸಿರಾಟ' : 'Box Breathing (4-4-4)'}
                </button>
                <button
                  type="button"
                  onClick={() => setGroundingTab('sensory')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    groundingTab === 'sensory'
                      ? 'bg-sage-700 text-white shadow-2xs'
                      : 'bg-white text-slate-600 hover:bg-stone-100 border border-stone-200'
                  }`}
                >
                  {language === 'kn' ? '5-4-3-2-1 ಇಂದ್ರಿಯ ಗ್ರಹಿಕೆ' : '5-4-3-2-1 Sensory'}
                </button>
                <button
                  type="button"
                  onClick={() => setGroundingTab('pacing')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    groundingTab === 'pacing'
                      ? 'bg-sage-700 text-white shadow-2xs'
                      : 'bg-white text-slate-600 hover:bg-stone-100 border border-stone-200'
                  }`}
                >
                  {language === 'kn' ? 'ಸ್ವಯಂ ಆರೈಕೆ ಸಲಹೆಗಳು' : 'Heartbreak Pacing'}
                </button>
              </div>
            </div>

            {/* Tab 1: Box Breathing */}
            {groundingTab === 'breathing' && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/90 p-4 rounded-2xl border border-sage-200 shadow-soft-sm">
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 rounded-2xl bg-sage-50 border border-sage-300 flex items-center justify-center shadow-inner">
                    <span className="text-2xl font-black text-sage-900 font-mono">
                      {isBreathingActive ? breathCount : '4'}
                    </span>
                    <span className="absolute -bottom-1 text-[9px] font-bold text-sage-700 uppercase">
                      sec
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                      {isBreathingActive ? breathPhase : (language === 'kn' ? 'ಸಿದ್ಧರಾಗಿ' : 'Ready')}
                    </span>
                    <p className="text-sm font-semibold text-slate-800">
                      {breathPhase === 'Inhale' && (language === 'kn' ? 'ಮೂಗಿನ ಮೂಲಕ ನಿಧಾನವಾಗಿ ಉಸಿರೆಳೆದುಕೊಳ್ಳಿ...' : 'Breathe in slowly through your nose...')}
                      {breathPhase === 'Hold' && (language === 'kn' ? 'ಉಸಿರನ್ನು ಶಾಂತವಾಗಿ ಹಿಡಿದಿಟ್ಟುಕೊಳ್ಳಿ...' : 'Gently hold your breath, feeling stillness...')}
                      {breathPhase === 'Exhale' && (language === 'kn' ? 'ಬಾಯಿಯ ಮೂಲಕ ನಿಧಾನವಾಗಿ ಉಸಿರು ಬಿಡಿ...' : 'Release gently through mouth, letting tension melt...')}
                      {breathPhase === 'Rest' && (language === 'kn' ? 'ವಿಶ್ರಾಂತಿ ಪಡೆಯಿರಿ, ಮುಂದಿನ ಚಕ್ರಕ್ಕೆ ಸಿದ್ಧರಾಗಿ...' : 'Rest and relax before the next gentle breath...')}
                    </p>
                    <span className="text-[11px] text-slate-500">
                      {language === 'kn' ? 'ಹೃದಯ ಬಡಿತವನ್ನು ಸ್ಥಿರಗೊಳಿಸಲು ಮತ್ತು ದೈಹಿಕ ಬಿಗಿತವನ್ನು ಕಡಿಮೆ ಮಾಡಲು ಸಹಾಯಕ' : 'Resets the parasympathetic nervous system, easing acute heartbreak and chest tightness.'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsBreathingActive(prev => !prev)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-soft-sm ${
                    isBreathingActive
                      ? 'bg-rose-600 hover:bg-rose-700 text-white'
                      : 'bg-sage-700 hover:bg-sage-800 text-white'
                  }`}
                >
                  {isBreathingActive ? (language === 'kn' ? 'ನಿಲ್ಲಿಸಿ' : 'Pause Pacing') : (language === 'kn' ? 'ಉಸಿರಾಟ ಆರಂಭಿಸಿ' : 'Start Box Breathing')}
                </button>
              </div>
            )}

            {/* Tab 2: 5-4-3-2-1 Sensory Grounding */}
            {groundingTab === 'sensory' && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-white/90 p-3 rounded-2xl border border-sage-200 text-xs">
                <div className="p-2 bg-stone-50 rounded-xl border border-stone-200/80">
                  <span className="font-extrabold text-sage-800 block text-sm mb-0.5">5 SEE</span>
                  <span className="text-[11px] text-slate-600">{language === 'kn' ? 'ಕಣ್ಣಿಗೆ ಕಾಣುವ 5 ವಸ್ತುಗಳನ್ನು ಗಮನಿಸಿ' : '5 items in your room'}</span>
                </div>
                <div className="p-2 bg-stone-50 rounded-xl border border-stone-200/80">
                  <span className="font-extrabold text-sage-800 block text-sm mb-0.5">4 TOUCH</span>
                  <span className="text-[11px] text-slate-600">{language === 'kn' ? 'ಸ್ಪರ್ಶಿಸಬಹುದಾದ 4 ವಸ್ತುಗಳು' : '4 physical textures'}</span>
                </div>
                <div className="p-2 bg-stone-50 rounded-xl border border-stone-200/80">
                  <span className="font-extrabold text-sage-800 block text-sm mb-0.5">3 HEAR</span>
                  <span className="text-[11px] text-slate-600">{language === 'kn' ? 'ಕೇಳಿಸುವ 3 ಶಬ್ದಗಳು' : '3 sounds around you'}</span>
                </div>
                <div className="p-2 bg-stone-50 rounded-xl border border-stone-200/80">
                  <span className="font-extrabold text-sage-800 block text-sm mb-0.5">2 SMELL</span>
                  <span className="text-[11px] text-slate-600">{language === 'kn' ? 'ಆಘ್ರಾಣಿಸಬಹುದಾದ 2 ವಾಸನೆಗಳು' : '2 scents in the air'}</span>
                </div>
                <div className="p-2 bg-stone-50 rounded-xl border border-stone-200/80 col-span-2 sm:col-span-1">
                  <span className="font-extrabold text-sage-800 block text-sm mb-0.5">1 TASTE</span>
                  <span className="text-[11px] text-slate-600">{language === 'kn' ? 'ಸ್ವಯಂ ಕರುಣೆ ಅಥವಾ ರುಚಿ' : '1 sip of water or kind thought'}</span>
                </div>
              </div>
            )}

            {/* Tab 3: Heartbreak Pacing Guidelines */}
            {groundingTab === 'pacing' && (
              <div className="bg-white/90 p-3.5 rounded-2xl border border-sage-200 text-xs text-slate-700 space-y-1.5 leading-relaxed">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Biological basics:</strong> Sip room-temperature water. If appetite has crashed, eat small portions (fruits, warm soup, khichdi) rather than forcing large meals.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Release physical tension:</strong> Place a warm hand gently over your sternum/heart. Unclench your jaw and gently roll your shoulders back.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Digital protection:</strong> Mute or archive chat threads with your ex. Every glance at old messages reactivates neuro-attachment distress.</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Gentle Notice Bar: AI Companion Boundary */}
        <div className="bg-amber-50/70 border-b border-amber-200/60 px-4 py-1.5 text-[11px] text-amber-900 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
            <span>
              {language === 'kn'
                ? 'ಔರಾ ಕೇವಲ AI ಸಹಾಯಕವಾಗಿದ್ದು, ವೈದ್ಯರು ಅಥವಾ ಚಿಕಿತ್ಸಕರಲ್ಲ. ತುರ್ತು ಅಥವಾ ಜೀವ ಅಪಾಯದ ಸಮಯದಲ್ಲಿ ತಕ್ಷಣ 112 ಅಥವಾ 1800-599-0019 ಸಂಪರ್ಕಿಸಿ.'
                : 'Aura is an AI companion for supportive listening, not a therapist, doctor, or emergency service. In crisis, call 112 or 1800-599-0019.'}
            </span>
          </div>
          <span className="text-[10px] font-mono text-amber-800 hidden md:inline flex-shrink-0">
            {language === 'kn' ? 'ಶೂನ್ಯ ಲಾಗಿನ್ ಅಗತ್ಯ' : 'Zero Login Required'}
          </span>
        </div>

        {/* Exploratory Topics Hints */}
        <div className="bg-stone-50/80 px-4 py-2 border-b border-stone-200/70 text-xs overflow-x-auto whitespace-nowrap flex items-center justify-between gap-3 text-slate-500">
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="font-bold text-slate-600 text-[11px] uppercase tracking-wider flex-shrink-0">
              {language === 'kn' ? 'ಆಯ್ಕೆಯ ವಿಷಯಗಳು:' : 'Topics to explore:'}
            </span>
            <div className="flex items-center gap-1.5">
              {PSYCHIATRIC_DOMAINS.slice(0, 7).map((domain) => (
                <button
                  key={domain.id}
                  type="button"
                  onClick={() => setInputText(domain.questionsHint)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white hover:bg-emerald-50 text-slate-600 hover:text-emerald-900 border border-stone-200 shadow-2xs hover:border-emerald-300 transition-all cursor-pointer"
                  title={`${domain.description}`}
                >
                  {language === 'kn' ? domain.kannadaName : domain.name}
                </button>
              ))}
            </div>
          </div>

          <span className="text-[10px] font-medium text-slate-400 hidden lg:inline flex-shrink-0">
            {language === 'kn' ? 'ಮುಕ್ತವಾಗಿ ಮಾತನಾಡಿ • ಯಾವುದೇ ನಿರ್ಬಂಧವಿಲ್ಲ' : 'Natural conversation • No checklists'}
          </span>
        </div>

        {/* Message Thread */}
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#fbfbfa]">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-soft-sm ${
                  msg.sender === 'user'
                    ? 'bg-slate-900 text-white'
                    : 'bg-gradient-to-tr from-sage-800 via-sage-700 to-emerald-700 text-white border border-emerald-500/20'
                }`}
              >
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-emerald-100" />}
              </div>

              <div
                className={`max-w-[88%] sm:max-w-[80%] rounded-3xl p-4 sm:p-5 text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-slate-900 text-white rounded-tr-sm shadow-soft-md'
                    : msg.isCrisis
                    ? 'bg-rose-50 border-2 border-rose-300 text-rose-950 rounded-tl-sm font-medium shadow-soft-md'
                    : msg.isServiceUnavailable
                    ? 'bg-amber-50 border-2 border-amber-300 text-amber-950 rounded-tl-sm font-medium shadow-soft-sm'
                    : 'bg-white border border-stone-200/90 text-slate-800 rounded-tl-sm shadow-soft-sm'
                }`}
              >
                {/* Bubble Header */}
                <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-stone-100">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[11px] font-bold tracking-tight ${msg.sender === 'user' ? 'text-slate-300' : 'text-slate-700'}`}>
                      {msg.sender === 'user' ? (language === 'kn' ? 'ನೀವು' : 'You') : 'Aura'}
                    </span>
                    {msg.sender === 'bot' && (
                      <span className="text-[9px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                        {language === 'kn' ? 'ಕ್ಲಿನಿಕಲ್ ಸಹಾಯಕ' : 'Clinical Companion'}
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] font-mono ${msg.sender === 'user' ? 'text-slate-400' : 'text-slate-400'}`}>
                    {msg.timestamp}
                  </span>
                </div>

                {msg.isCrisis && (
                  <div className="flex items-center gap-1.5 text-rose-700 font-bold text-xs mb-2.5">
                    <ShieldAlert className="w-4 h-4" />
                    <span>{language === 'kn' ? 'ತುರ್ತು ಸುರಕ್ಷತಾ ಮಾಹಿತಿ' : 'Immediate Safety Support'}</span>
                  </div>
                )}

                {msg.isServiceUnavailable && (
                  <div className="flex items-center gap-1.5 text-amber-800 font-bold text-xs mb-2.5">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>{language === 'kn' ? 'AI ಸೇವೆ ತಾತ್ಕಾಲಿಕವಾಗಿ ಲಭ್ಯವಿಲ್ಲ' : 'AI Service Unavailable'}</span>
                  </div>
                )}

                <p className="whitespace-pre-line leading-relaxed font-sans">{msg.text}</p>

                {msg.isServiceUnavailable && lastFailedMessage && (
                  <div className="mt-3 pt-2.5 border-t border-amber-200/80 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSendMessage(lastFailedMessage)}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>{language === 'kn' ? 'ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ' : 'Retry Message'}</span>
                    </button>
                    <span className="text-[11px] text-amber-800">
                      {language === 'kn' ? 'ಅಥವಾ ಸಹಾಯವಾಣಿ 1800-599-0019 ಸಂಪರ್ಕಿಸಿ' : 'Or reach helpline 1800-599-0019'}
                    </span>
                  </div>
                )}

                <div
                  className={`text-[10px] mt-2 flex items-center gap-1 font-mono ${
                    msg.sender === 'user' ? 'text-slate-400 justify-end' : 'text-slate-400'
                  }`}
                >
                  {msg.provider && (
                    <span className="text-[9px] text-slate-500 bg-stone-100 px-1.5 py-0.5 rounded border border-stone-200">
                      {msg.provider}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-sage-800 via-sage-700 to-emerald-700 text-white flex items-center justify-center shadow-soft-sm border border-emerald-500/20">
                <Bot className="w-4 h-4 text-emerald-100" />
              </div>
              <div className="bg-white border border-stone-200 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2 shadow-soft-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.4s]"></span>
                <span className="text-xs text-slate-600 font-semibold ml-2">
                  {language === 'kn' ? 'ಔರಾ ಆಲೋಚಿಸುತ್ತಿದೆ ಮತ್ತು ಸ್ಪಂದಿಸುತ್ತಿದೆ...' : 'Aura is listening & reflecting...'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Starter Prompts */}
        {userMessagesCount < 2 && (
          <div className="px-4 py-2.5 bg-stone-50/90 border-t border-stone-200/80 overflow-x-auto text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-bold text-[11px] uppercase tracking-wider flex-shrink-0">
                {language === 'kn' ? 'ಪ್ರಮುಖ ವಿಷಯಗಳು:' : 'Clinical prompts:'}
              </span>
              <div className="flex items-center gap-2">
                {samplePrompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(prompt.text)}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-50/80 border border-stone-200 text-slate-700 hover:text-emerald-900 hover:border-emerald-300 transition-all whitespace-nowrap text-xs font-semibold cursor-pointer shadow-2xs flex items-center gap-1.5"
                    title={prompt.text}
                  >
                    <span>{prompt.icon}</span>
                    <span>{prompt.category}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-white border-t border-stone-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2.5"
          >
            {/* Mic Button for Accessibility */}
            <button
              type="button"
              onClick={toggleSpeechRecognition}
              className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                isListening
                  ? 'bg-rose-100 border-rose-300 text-rose-700 animate-pulse'
                  : 'bg-stone-50 border-stone-200 text-slate-500 hover:bg-stone-100 hover:text-slate-700'
              }`}
              title={isListening ? (language === 'kn' ? 'ಕೇಳಿಸಿಕೊಳ್ಳಲಾಗುತ್ತಿದೆ...' : 'Listening...') : (language === 'kn' ? 'ಮಾತನಾಡಿ' : 'Speak your thoughts')}
            >
              {isListening ? <Mic className="w-4 h-4 text-rose-600" /> : <Mic className="w-4 h-4" />}
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={t('chatPlaceholder')}
              className="flex-1 bg-stone-50 border border-stone-200 focus:border-sage-500 focus:bg-white focus:outline-none rounded-2xl px-4 py-3 text-sm text-slate-900 transition-all placeholder:text-slate-400 font-normal"
            />

            <button
              type="submit"
              disabled={!inputText.trim() || isTyping}
              className={`p-3.5 rounded-2xl transition-all duration-200 cursor-pointer shadow-soft-sm ${
                inputText.trim() && !isTyping
                  ? 'bg-gradient-to-r from-sage-700 to-emerald-600 hover:from-sage-800 hover:to-emerald-700 text-white shadow-soft-md shadow-sage-900/20 hover:scale-105'
                  : 'bg-stone-100 text-slate-300 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-1">
            <span className="font-medium">
              {t('anonymousNotice')}
            </span>
            <span className="hidden sm:inline">
              {language === 'kn' ? 'AI ಆತ್ಮಾವಲೋಕನಕ್ಕೆ ಸಹಕರಿಸುತ್ತದೆ; ಇದು ವೈದ್ಯಕೀಯ ಚಿಕಿತ್ಸೆಯಲ್ಲ' : 'AI companion for self-reflection; not medical treatment'}
            </span>
          </div>
        </div>

      </div>

      {/* Emergency Helplines Directory Modal */}
      {isCrisisModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-soft-xl border border-stone-200 relative">
            <button
              onClick={() => setIsCrisisModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-stone-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-800 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-rose-700" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {language === 'kn' ? '24x7 ತುರ್ತು ಸಹಾಯವಾಣಿಗಳು' : '24x7 Immediate Crisis Support'}
                </h3>
                <p className="text-xs text-slate-500">
                  {language === 'kn' ? 'ಉಚಿತ ಮತ್ತು ಗೌಪ್ಯ ರಾಷ್ಟ್ರೀಯ ಸಹಾಯವಾಣಿಗಳು' : 'Free, confidential, verified national helplines'}
                </p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-rose-950 block text-sm">KIRAN (Govt. of India)</span>
                  <span className="text-[11px] text-rose-800">24x7 Mental Health Helpline • 13 Languages</span>
                </div>
                <a
                  href="tel:18005990019"
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs flex items-center gap-1 shadow-2xs"
                >
                  <PhoneCall className="w-3 h-3" />
                  1800-599-0019
                </a>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-emerald-950 block text-sm">Tele-MANAS</span>
                  <span className="text-[11px] text-emerald-800">National Tele Mental Health Programme</span>
                </div>
                <a
                  href="tel:14416"
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black rounded-xl text-xs flex items-center gap-1 shadow-2xs"
                >
                  <PhoneCall className="w-3 h-3" />
                  14416
                </a>
              </div>

              <div className="p-3 bg-stone-50 border border-stone-200 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block text-sm">AASRA Helpline</span>
                  <span className="text-[11px] text-slate-600">24x7 Crisis Support & Suicide Prevention</span>
                </div>
                <a
                  href="tel:+919820466726"
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-black rounded-xl text-xs flex items-center gap-1 shadow-2xs"
                >
                  <PhoneCall className="w-3 h-3" />
                  +91 98204 66726
                </a>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-amber-950 block text-sm">National Emergency</span>
                  <span className="text-[11px] text-amber-800">Police, Ambulance, Immediate Safety</span>
                </div>
                <a
                  href="tel:112"
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-xl text-xs flex items-center gap-1 shadow-2xs"
                >
                  <PhoneCall className="w-3 h-3" />
                  112
                </a>
              </div>
            </div>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setIsCrisisModalOpen(false)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                {language === 'kn' ? 'ಮುಚ್ಚಿ' : 'Close Helplines'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy & Transparency Modal */}
      {isPrivacyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-soft-xl border border-stone-200 relative">
            <button
              onClick={() => setIsPrivacyModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-stone-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <Lock className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {language === 'kn' ? 'ಗೌಪ್ಯತೆ ಮತ್ತು AI ಪಾರದರ್ಶಕತೆ' : 'Privacy & AI Transparency'}
                </h3>
                <p className="text-xs text-slate-500">
                  {language === 'kn' ? 'ನಿಮ್ಮ ಸಂವಾದದ ಸಂಸ್ಕರಣೆಯ ವಿವರ' : 'How your conversation is handled'}
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                <span className="font-bold text-slate-800 block mb-0.5">
                  {language === 'kn' ? 'ಖಾಸಗಿ ಸೆಷನ್ (ಲಾಗಿನ್ ಅಗತ್ಯವಿಲ್ಲ)' : 'Private Session (No Login Required to Chat)'}
                </span>
                <p>
                  {language === 'kn'
                    ? 'ಸಂವಾದವನ್ನು ಬಳಸಲು ನಿಮ್ಮ ಹೆಸರು, ಇಮೇಲ್ ಅಥವಾ ಫೋನ್ ಸಂಖ್ಯೆಯನ್ನು ನಾವು ಕೇಳುವುದಿಲ್ಲ. ಸಂವಾದವು ಯಾವುದೇ ರೋಗಿಯ ಖಾತೆಗೆ ಲಿಂಕ್ ಆಗುವುದಿಲ್ಲ.'
                    : 'We do not require your real name, phone number, or email to talk to Aura. Sessions are conducted anonymously without mandatory accounts.'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                <span className="font-bold text-slate-800 block mb-0.5">
                  {language === 'kn' ? 'AI ಮಾದರಿಯ ಸಂಸ್ಕರಣೆ' : 'Server-side AI Processing'}
                </span>
                <p>
                  {language === 'kn'
                    ? 'ನಿಮ್ಮ ಸಂದೇಶಗಳನ್ನು ಲೈವ್ AI ಮಾದರಿಯ ಮೂಲಕ ಸುರಕ್ಷಿತ ಸರ್ವರ್ ಸಂಪರ್ಕದಿಂದ ಸಂಸ್ಕರಿಸಲಾಗುತ್ತದೆ. ಸೂಕ್ಷ್ಮ ಬ್ಯಾಂಕಿಂಗ್ ಅಥವಾ ಪಾಸ್‌ವರ್ಡ್ ವಿವರಗಳನ್ನು ಎಂದಿಗೂ ಹಂಚಿಕೊಳ್ಳಬೇಡಿ.'
                    : 'Your conversation is transmitted securely to our backend server and processed by language models to provide empathetic responses and generate your optional reflection summary. Please never share passwords or banking details.'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-950">
                <span className="font-bold text-amber-900 block mb-0.5">
                  {language === 'kn' ? 'ಕ್ಲಿನಿಕಲ್ ಮಿತಿಗಳು' : 'Clinical Boundaries'}
                </span>
                <p>
                  {language === 'kn'
                    ? 'ಔರಾ ಕೇವಲ ಭಾವನಾತ್ಮಕ ಬೆಂಬಲ ಮತ್ತು ಆತ್ಮಾವಲೋಕನಕ್ಕಾಗಿ ಇರುವ AI ಸಹಾಯಕ. ಇದು ವೈದ್ಯಕೀಯ ರೋಗನಿರ್ಣಯ ಅಥವಾ ತುರ್ತು ಸೇವೆ ಅಲ್ಲ.'
                    : 'Aura is an AI companion designed for emotional reflection and active listening. It is not a licensed physician, psychiatrist, or emergency hotline.'}
                </p>
              </div>
            </div>

            <div className="mt-5 text-center">
              <button
                type="button"
                onClick={() => setIsPrivacyModalOpen(false)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                {language === 'kn' ? 'ಅರ್ಥವಾಯಿತು' : 'I Understand'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
