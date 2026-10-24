import React, { useState, useEffect } from 'react';
import { Smile, Frown, Meh, Sun, Wind, BookOpen, Brain, Sparkles, Check, ArrowRight, Play, Pause, Zap } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import confetti from 'canvas-confetti';

export default function TherapyTools() {
  const { language } = useLanguage();
  const [activeTool, setActiveTool] = useState('mood'); // 'mood' | 'thought' | 'breathing'

  // Mood Tracker State
  const [selectedMood, setSelectedMood] = useState('Neutral');
  const [energyLevel, setEnergyLevel] = useState(6);
  const [moodLog, setMoodLog] = useState([
    { day: 'Mon', mood: 'Calm', score: 7 },
    { day: 'Tue', mood: 'Overwhelmed', score: 3 },
    { day: 'Wed', mood: 'Neutral', score: 5 },
    { day: 'Thu', mood: 'Heavy', score: 4 },
    { day: 'Fri', mood: 'Calm', score: 7 },
    { day: 'Sat', mood: 'Radiant', score: 8 },
    { day: 'Today', mood: 'Neutral', score: 6 },
  ]);
  const [loggedToday, setLoggedToday] = useState(false);

  // Thought Diary State
  const [situation, setSituation] = useState('');
  const [autoThought, setAutoThought] = useState('');
  const [distortion, setDistortion] = useState('Catastrophizing');
  const [rationalThought, setRationalThought] = useState('');
  const [reframedSuccess, setReframedSuccess] = useState(false);

  // Breathing Guide State
  const [breathingPhase, setBreathingPhase] = useState('Inhale'); // Inhale (4s) -> Hold (7s) -> Exhale (8s)
  const [timerSeconds, setTimerSeconds] = useState(4);
  const [isBreathingActive, setIsBreathingActive] = useState(false);

  useEffect(() => {
    let interval = null;
    if (isBreathingActive) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            if (breathingPhase === 'Inhale') {
              setBreathingPhase('Hold');
              return 7;
            } else if (breathingPhase === 'Hold') {
              setBreathingPhase('Exhale');
              return 8;
            } else {
              setBreathingPhase('Inhale');
              return 4;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isBreathingActive, breathingPhase]);

  const handleLogMood = () => {
    setMoodLog(prev => [
      ...prev.slice(1),
      { day: 'Today', mood: selectedMood, score: energyLevel }
    ]);
    setLoggedToday(true);
    setTimeout(() => setLoggedToday(false), 2500);
  };

  const handleAIReframe = () => {
    if (!autoThought.trim()) return;
    
    // CBT reframing engine
    let suggestion = '';
    if (distortion === 'Catastrophizing') {
      suggestion = language === 'kn'
        ? "ಈ ಪರಿಸ್ಥಿತಿ ತೀವ್ರವೆನಿಸಿದರೂ, ಕೆಟ್ಟದ್ದೇ ಸಂಭವಿಸುತ್ತದೆ ಎಂಬ ಖಾತರಿಯಿಲ್ಲ. ನಾನು ಈ ಹಿಂದೆಯೂ ಕಠಿಣ ಸಂದರ್ಭಗಳನ್ನು ಧೈರ್ಯದಿಂದ ನಿಭಾಯಿಸಿದ್ದೇನೆ ಮತ್ತು ಈಗಲೂ ನಿಭಾಯಿಸುವ ಸಾಮರ್ಥ್ಯ ನನಗಿದೆ."
        : `While this situation feels intense right now, the absolute worst-case scenario is rarely guaranteed. Even if challenges arise, I have handled difficult moments before and have resources to navigate them.`;
    } else if (distortion === 'Mind Reading') {
      suggestion = language === 'kn'
        ? "ಯಾವುದೇ ಪುರಾವೆಗಳಿಲ್ಲದೆ ಇತರರು ನನ್ನ ಬಗ್ಗೆ ಕೆಟ್ಟದಾಗಿ ಯೋಚಿಸುತ್ತಿದ್ದಾರೆ ಎಂದು ನಾನೇ ಊಹಿಸಿಕೊಳ್ಳುತ್ತಿದ್ದೇನೆ. ಜನರ ಪ್ರತಿಕ್ರಿಯೆಗಳು ಅವರ ಸ್ವಂತ ಒತ್ತಡದಿಂದ ಇರಬಹುದು, ನನ್ನ ಯೋಗ್ಯತೆಯಿಂದಲ್ಲ."
        : `I am assuming what others are thinking without direct evidence. People's reactions are often about their own stress, not my worth.`;
    } else if (distortion === 'All-or-Nothing') {
      suggestion = language === 'kn'
        ? "ಸ್ವಲ್ಪ ವಿಳಂಬ ಅಥವಾ ತಪ್ಪು ಎಂದರೆ ಸಂಪೂರ್ಣ ವೈಫಲ್ಯವಲ್ಲ. ಜೀವನದಲ್ಲಿ ಪ್ರತಿಯೊಂದೂ ಕಪ್ಪು ಅಥವಾ ಬಿಳುಪಾಗಿರುವುದಿಲ್ಲ; ಸಣ್ಣ ಮುನ್ನಡೆಯೂ ಮುಖ್ಯವಾದ ಪ್ರಗತಿಯೇ ಆಗಿದೆ."
        : `A partial delay or mistake does not mean total failure. Life exists in shades of gray, and progress is still progress.`;
    } else {
      suggestion = language === 'kn'
        ? "ನನ್ನ ಭಾವನೆಗಳನ್ನು ನಾನು ಗೌರವಿಸುತ್ತೇನೆ, ಆದರೆ ಭಾವನೆಗಳೇ ಸತ್ಯವಲ್ಲ. ನಿಧಾನವಾಗಿ ಆಲೋಚಿಸಿ ಮುಂದಿನ ಸಣ್ಣ ಹೆಜ್ಜೆ ಇಟ್ಟಂತೆ ನನ್ನ ಮನಸ್ಥಿತಿ ಶಾಂತವಾಗುತ್ತದೆ."
        : `I can acknowledge this emotional reaction without accepting it as permanent fact. Emotions will shift as I take one small grounded step.`;
    }

    setRationalThought(suggestion);
    setReframedSuccess(true);
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
  };

  const loadThoughtPreset = (sit, thought, dist) => {
    setSituation(sit);
    setAutoThought(thought);
    setDistortion(dist);
    setRationalThought('');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      
      {/* Title */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-sage-800 bg-sage-100/80 px-3.5 py-1.5 rounded-full border border-sage-200/70 mb-3 shadow-soft-sm">
          <Sparkles className="w-3.5 h-3.5 text-sage-600" />
          <span>{language === 'kn' ? 'ಸಂವಾದ ಸ್ವಯಂ ಆರೈಕೆ ಪರಿಕರಗಳು • ಹಂತ 2 ಮುನ್ನೋಟ' : 'Interactive Therapy Suite • Phase 2 Preview'}</span>
        </span>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          {language === 'kn' ? 'ಸ್ವಯಂ ಆರೈಕೆ ಮತ್ತು ಅರಿವಿನ ಸಾಧನಗಳು' : 'Self-Care & Cognitive Rhythms'}
        </h2>
        <p className="text-sm text-slate-600 mt-2.5 leading-relaxed">
          {language === 'kn'
            ? 'ವೈದ್ಯರ ಸಮಾಲೋಚನೆಗಳ ನಡುವೆ ರೋಗಿಗಳಿಗೆ ಸಹಾಯ ಮಾಡಲು ವಿನ್ಯಾಸಗೊಳಿಸಲಾದ ಪರಿಕರಗಳು — ದೈನಂದಿನ ಮನಸ್ಥಿತಿ ಪರಿಶೀಲನೆ, ನಕಾರಾತ್ಮಕ ಆಲೋಚನೆಗಳ ಪುನಾರಚನೆ ಮತ್ತು ಉಸಿರಾಟದ ನಿಯಂತ್ರಣ.'
            : 'Integrated psychoeducational tools designed to support patients between clinical consultations — offering daily mood check-ins, automated cognitive reframing, and autonomic nervous system regulation.'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2.5 mb-10">
        <button
          onClick={() => setActiveTool('mood')}
          className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTool === 'mood'
              ? 'bg-sage-600 text-white shadow-soft-md shadow-sage-600/25 ring-1 ring-sage-500'
              : 'bg-white/90 hover:bg-sage-50/80 text-slate-600 border border-sage-200/60 shadow-soft-sm'
          }`}
        >
          <Smile className="w-4 h-4" />
          <span>{language === 'kn' ? 'ಮನಸ್ಥಿತಿ ಮತ್ತು ಶಕ್ತಿ ಟ್ರ್ಯಾಕರ್' : 'Mood & Energy Rhythm'}</span>
        </button>

        <button
          onClick={() => setActiveTool('thought')}
          className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTool === 'thought'
              ? 'bg-sage-600 text-white shadow-soft-md shadow-sage-600/25 ring-1 ring-sage-500'
              : 'bg-white/90 hover:bg-sage-50/80 text-slate-600 border border-sage-200/60 shadow-soft-sm'
          }`}
        >
          <Brain className="w-4 h-4" />
          <span>{language === 'kn' ? 'CBT ಆಲೋಚನಾ ಡೈರಿ' : 'CBT Thought Diary'}</span>
        </button>

        <button
          onClick={() => setActiveTool('breathing')}
          className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTool === 'breathing'
              ? 'bg-sage-600 text-white shadow-soft-md shadow-sage-600/25 ring-1 ring-sage-500'
              : 'bg-white/90 hover:bg-sage-50/80 text-slate-600 border border-sage-200/60 shadow-soft-sm'
          }`}
        >
          <Wind className="w-4 h-4" />
          <span>{language === 'kn' ? '4-7-8 ಉಸಿರಾಟದ ಮಾರ್ಗದರ್ಶಿ' : '4-7-8 Parasympathetic Reset'}</span>
        </button>
      </div>

      {/* TOOL 1: MOOD TRACKER */}
      {activeTool === 'mood' && (
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 sm:p-8 border border-sage-100 shadow-soft-xl max-w-3xl mx-auto space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-sage-100">
            <div>
              <h3 className="font-bold text-lg text-slate-900">
                {language === 'kn' ? 'ಇಂದು ನಿಮ್ಮ ಮನಸ್ಥಿತಿ ಹೇಗಿದೆ?' : 'How is your emotional climate today?'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {language === 'kn'
                  ? 'ದೈನಂದಿನ ಮಾನಸಿಕ ಶಕ್ತಿಯನ್ನು ದಾಖಲಿಸುವುದು ನಿಮ್ಮ ವೈದ್ಯರಿಗೆ ಚಿಕಿತ್ಸೆಯ ಪ್ರಗತಿಯನ್ನು ಅಳೆಯಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ.'
                  : 'Tracking somatic energy and emotional patterns provides objective longitudinal context for your psychiatrist.'}
              </p>
            </div>
            {loggedToday && (
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200 animate-fade-in flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>{language === 'kn' ? 'ಇಂದಿನ ಸ್ಥಿತಿ ದಾಖಲಾಗಿದೆ!' : 'Logged for Today!'}</span>
              </span>
            )}
          </div>

          {/* Mood Emojis */}
          <div className="grid grid-cols-5 gap-2.5 sm:gap-3.5">
            {[
              { label: 'Overwhelmed', knLabel: 'ಅತಿಯಾದ ಒತ್ತಡ', icon: Frown, color: 'text-rose-500', bg: 'bg-rose-50/80 border-rose-200' },
              { label: 'Heavy', knLabel: 'ಭಾರವಾದ ಮನಸ್ಸು', icon: Meh, color: 'text-amber-500', bg: 'bg-amber-50/80 border-amber-200' },
              { label: 'Neutral', knLabel: 'ಸಾಮಾನ್ಯ', icon: Meh, color: 'text-slate-500', bg: 'bg-slate-50 border-slate-200' },
              { label: 'Calm', knLabel: 'ಶಾಂತ', icon: Smile, color: 'text-sage-600', bg: 'bg-sage-50 border-sage-200' },
              { label: 'Radiant', knLabel: 'ಉತ್ಸಾಹಭರಿತ', icon: Sun, color: 'text-amber-500', bg: 'bg-amber-50/80 border-amber-200' },
            ].map(m => {
              const Icon = m.icon;
              const isSel = selectedMood === m.label;
              return (
                <button
                  key={m.label}
                  type="button"
                  onClick={() => setSelectedMood(m.label)}
                  className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer ${
                    isSel ? `${m.bg} ring-2 ring-sage-600 scale-105 font-bold shadow-soft-sm` : 'border-slate-200/80 bg-white hover:bg-slate-50/80'
                  }`}
                >
                  <Icon className={`w-6 h-6 mx-auto mb-1.5 ${m.color}`} />
                  <span className="text-[11px] block text-slate-800 font-medium">
                    {language === 'kn' ? m.knLabel : m.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Energy Slider */}
          <div className="p-4 sm:p-5 rounded-2xl bg-warmivory-50/70 border border-warmivory-200/80">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2.5">
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>{language === 'kn' ? 'ದೈಹಿಕ ಮತ್ತು ಮಾನಸಿಕ ಶಕ್ತಿ' : 'Somatic Energy & Vitality'}</span>
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-sage-100 text-sage-900 border border-sage-200">
                {energyLevel} / 10
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={energyLevel}
              onChange={(e) => setEnergyLevel(Number(e.target.value))}
              className="w-full accent-sage-600 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-400 mt-1.5 font-medium">
              <span>{language === 'kn' ? 'ಕ್ಷೀಣ (1)' : 'Depleted (1)'}</span>
              <span>{language === 'kn' ? 'ಸಾಮಾನ್ಯ (5)' : 'Baseline (5)'}</span>
              <span>{language === 'kn' ? 'ಪೂರ್ಣ ಶಕ್ತಿ (10)' : 'Fully Energized (10)'}</span>
            </div>
          </div>

          <button
            onClick={handleLogMood}
            className="w-full py-3.5 rounded-2xl bg-sage-600 hover:bg-sage-700 text-white font-bold text-sm shadow-soft-md shadow-sage-600/25 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
          >
            {language === 'kn' ? 'ಇಂದಿನ ಸ್ಥಿತಿಯನ್ನು ದಾಖಲಿಸಿ' : "Record Today's Check-In"}
          </button>

          {/* 7-Day Trend Chart Preview */}
          <div className="pt-5 border-t border-sage-100">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3.5">
              {language === 'kn' ? '7-ದಿನಗಳ ಮಾನಸಿಕ ಶಕ್ತಿಯ ಪಥ' : '7-Day Somatic Energy Trajectory'}
            </h4>
            <div className="grid grid-cols-7 gap-2.5 text-center">
              {moodLog.map((entry, i) => {
                const dayLabels = {
                  Mon: language === 'kn' ? 'ಸೋಮ' : 'Mon',
                  Tue: language === 'kn' ? 'ಮಂಗಳ' : 'Tue',
                  Wed: language === 'kn' ? 'ಬುಧ' : 'Wed',
                  Thu: language === 'kn' ? 'ಗುರು' : 'Thu',
                  Fri: language === 'kn' ? 'ಶುಕ್ರ' : 'Fri',
                  Sat: language === 'kn' ? 'ಶನಿ' : 'Sat',
                  Today: language === 'kn' ? 'ಇಂದು' : 'Today',
                };
                return (
                  <div key={i} className="flex flex-col items-center">
                    <div className="h-24 w-full bg-slate-100/80 rounded-2xl flex items-end p-1 border border-slate-200/50">
                      <div
                        style={{ height: `${entry.score * 10}%` }}
                        className={`w-full rounded-xl transition-all ${
                          entry.score >= 7 
                            ? 'bg-gradient-to-t from-emerald-600 to-sage-500' 
                            : entry.score >= 5 
                            ? 'bg-gradient-to-t from-amber-500 to-amber-400' 
                            : 'bg-gradient-to-t from-rose-500 to-rose-400'
                        }`}
                      />
                    </div>
                    <span className="text-[11px] font-bold text-slate-700 mt-2">
                      {dayLabels[entry.day] || entry.day}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">{entry.score}/10</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TOOL 2: CBT THOUGHT DIARY */}
      {activeTool === 'thought' && (
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 sm:p-8 border border-sage-100 shadow-soft-xl max-w-3xl mx-auto space-y-5">
          <div className="pb-3 border-b border-sage-100">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold text-lg text-slate-900">
                {language === 'kn' ? 'CBT ನಕಾರಾತ್ಮಕ ಆಲೋಚನೆಗಳ ಪುನಾರಚನೆ' : 'CBT Thought Reframing Diary'}
              </h3>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-200">
                {language === 'kn' ? 'ಅರಿವಿನ ಪುನರ್ಸಮತೋಲನ' : 'Cognitive Rebalancer'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-3 leading-relaxed">
              {language === 'kn'
                ? 'ಸ್ವಯಂಚಾಲಿತ ಕೆಟ್ಟ ಆಲೋಚನೆಗಳನ್ನು ಗುರುತಿಸಿ, ತಾರ್ಕಿಕ ಮತ್ತು ಸಮತೋಲಿತ ದೃಷ್ಟಿಕೋನವನ್ನು ಕಂಡುಕೊಳ್ಳಿ.'
                : 'Examine automatic catastrophic thoughts, identify cognitive blindspots, and formulate grounded rational alternatives.'}
            </p>

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {language === 'kn' ? 'ಪರೀಕ್ಷಾರ್ಥ ಸನ್ನಿವೇಶಗಳು:' : 'Scenarios:'}
              </span>
              <button
                type="button"
                onClick={() => loadThoughtPreset(
                  language === 'kn' ? "ನನ್ನ ಮ್ಯಾನೇಜರ್ ಸಂಜೆ 6 ಗಂಟೆಯಾದರೂ ಪ್ರಾಜೆಕ್ಟ್ ಇಮೇಲ್‌ಗೆ ಉತ್ತರಿಸಿಲ್ಲ." : "My manager did not reply to my project status update email by 6 PM.",
                  language === 'kn' ? "ನಾನು ಅಸಮರ್ಥ ಎಂದು ಅವರು ಭಾವಿಸಿದ್ದಾರೆ ಮತ್ತು ನಾನು ಕೆಲಸ ಕಳೆದುಕೊಳ್ಳಬಹುದು." : "They think I am incompetent and I might lose my job.",
                  "Catastrophizing"
                )}
                className="text-[11px] px-2.5 py-1 rounded-xl bg-warmivory-100/70 hover:bg-sage-100 text-slate-700 hover:text-sage-900 border border-warmivory-300/60 transition-colors cursor-pointer"
              >
                {language === 'kn' ? 'ಕಚೇರಿ ಇಮೇಲ್ ವಿಳಂಬ' : 'Workplace Email Delay'}
              </button>
              <button
                type="button"
                onClick={() => loadThoughtPreset(
                  language === 'kn' ? "ಇನ್ನು 3 ದಿನದಲ್ಲಿ ಪರೀಕ್ಷೆ ಇದೆ, ಇನ್ನೂ ಅನೇಕ ಅಧ್ಯಾಯಗಳು ಬಾಕಿ ಇವೆ." : "Final semester exam is in 3 days and I have chapters left.",
                  language === 'kn' ? "ನಾನು ಖಂಡಿತ ಫೇಲ್ ಆಗುತ್ತೇನೆ ಮತ್ತು ಕುಟುಂಬದ ಗೌರವ ಹಾಳಾಗುತ್ತದೆ." : "I will fail this exam and completely ruin my family's reputation.",
                  "Catastrophizing"
                )}
                className="text-[11px] px-2.5 py-1 rounded-xl bg-warmivory-100/70 hover:bg-sage-100 text-slate-700 hover:text-sage-900 border border-warmivory-300/60 transition-colors cursor-pointer"
              >
                {language === 'kn' ? 'ಪರೀಕ್ಷೆಯ ಆತಂಕ' : 'Exam Apprehension'}
              </button>
              <button
                type="button"
                onClick={() => loadThoughtPreset(
                  language === 'kn' ? "ನನ್ನ ಆಪ್ತ ಸ್ನೇಹಿತ ಫೋನ್ ಕರೆಯಲ್ಲಿ ನಿರ್ಲಿಪ್ತವಾಗಿ ಮಾತನಾಡಿದ." : "My close friend seemed quiet and distracted during our phone call.",
                  language === 'kn' ? "ಅವರಿಗೆ ನನ್ನ ಸಹವಾಸ ಇಷ್ಟವಿಲ್ಲ, ಬಹುಶಃ ಸ್ನೇಹ ಕಡಿದುಕೊಳ್ಳುತ್ತಾರೆ." : "They are tired of me and probably don't want to be friends anymore.",
                  "Mind Reading"
                )}
                className="text-[11px] px-2.5 py-1 rounded-xl bg-warmivory-100/70 hover:bg-sage-100 text-slate-700 hover:text-sage-900 border border-warmivory-300/60 transition-colors cursor-pointer"
              >
                {language === 'kn' ? 'ಸ್ನೇಹಿತರ ಅಂತರ' : 'Interpersonal Distance'}
              </button>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1.5 tracking-wider">
                {language === 'kn' ? '1. ನಡೆದ ಘಟನೆ (ಸನ್ನಿವೇಶ)' : '1. Activating Event (Situation)'}
              </label>
              <input
                type="text"
                value={situation}
                onChange={(e) => setSituation(e.target.value)}
                placeholder={language === 'kn' ? 'ಉದಾ: ಸಭೆಯಲ್ಲಿ ನನ್ನ ವರದಿಯನ್ನು ಯಾರೂ ಪ್ರಶಂಸಿಸಲಿಲ್ಲ...' : 'e.g., My team lead did not acknowledge my report during the meeting...'}
                className="w-full px-4 py-2.5 rounded-xl border border-sage-200/80 bg-white text-sm focus:outline-none focus:border-sage-500 focus:ring-2 focus:ring-sage-200 transition-all"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1.5 tracking-wider">
                {language === 'kn' ? '2. ಮನಸ್ಸಿನಲ್ಲಿ ತಕ್ಷಣ ಬಂದ ಆಲೋಚನೆ' : '2. Automatic Negative Thought (Internal Monologue)'}
              </label>
              <textarea
                rows={2}
                value={autoThought}
                onChange={(e) => setAutoThought(e.target.value)}
                placeholder={language === 'kn' ? 'ಉದಾ: ಎಲ್ಲರೂ ನನ್ನನ್ನು ಗಮನಿಸಿ ನಾನು ನಿಷ್ಪ್ರಯೋಜಕ ಎಂದು ಭಾವಿಸುತ್ತಿದ್ದಾರೆ...' : 'e.g., Everyone noticed and thinks I have nothing valuable to contribute...'}
                className="w-full px-4 py-2.5 rounded-xl border border-sage-200/80 bg-white text-sm focus:outline-none focus:border-sage-500 focus:ring-2 focus:ring-sage-200 transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1.5 tracking-wider">
                  {language === 'kn' ? '3. ಆಲೋಚನಾ ದೋಷವನ್ನು ಗುರುತಿಸಿ' : '3. Identify Cognitive Distortion'}
                </label>
                <select
                  value={distortion}
                  onChange={(e) => setDistortion(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-sage-200/80 bg-white text-slate-800 text-xs sm:text-sm focus:outline-none focus:border-sage-500 cursor-pointer"
                >
                  <option value="Catastrophizing">
                    {language === 'kn' ? 'ಕೆಟ್ಟದ್ದನ್ನೇ ಊಹಿಸುವುದು (Catastrophizing)' : 'Catastrophizing (Expecting worst case)'}
                  </option>
                  <option value="Mind Reading">
                    {language === 'kn' ? 'ಇತರರ ಮನಸ್ಸು ಓದುವ ಭ್ರಮೆ (Mind Reading)' : 'Mind Reading (Projecting judgment)'}
                  </option>
                  <option value="All-or-Nothing">
                    {language === 'kn' ? 'ಎಲ್ಲವೂ ಅಥವಾ ಶೂನ್ಯ ಆಲೋಚನೆ (All-or-Nothing)' : 'All-or-Nothing (Black-and-white thinking)'}
                  </option>
                  <option value="Emotional Reasoning">
                    {language === 'kn' ? 'ಭಾವನಾತ್ಮಕ ತೀರ್ಮಾನ (Emotional Reasoning)' : 'Emotional Reasoning (Feeling implies fact)'}
                  </option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleAIReframe}
                  disabled={!autoThought.trim()}
                  className="w-full py-2.5 rounded-xl bg-sage-600 hover:bg-sage-700 text-white font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-soft-sm shadow-sage-600/20 disabled:bg-slate-200 disabled:cursor-not-allowed hover:scale-[1.01]"
                >
                  <Sparkles className="w-4 h-4 text-emerald-200" />
                  <span>{language === 'kn' ? 'ಸಮತೋಲಿತ ಆಲೋಚನೆ ಪಡೆಯಿರಿ' : 'Generate Rational Reframe'}</span>
                </button>
              </div>
            </div>

            {rationalThought && (
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-sage-50/90 to-emerald-50/90 border border-sage-200/80 space-y-2 animate-fade-in shadow-soft-sm">
                <div className="flex items-center gap-1.5 text-sage-900 font-bold uppercase text-[10px] tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-sage-600" />
                  <span>
                    {language === 'kn' ? '4. ಸಮತೋಲಿತ ತಾರ್ಕಿಕ ದೃಷ್ಟಿಕೋನ (CBT ಪುನಾರಚನೆ)' : '4. Balanced Rational Perspective (CBT Counter-Evidence)'}
                  </span>
                </div>
                <p className="text-slate-800 text-xs sm:text-sm leading-relaxed font-serif">
                  "{rationalThought}"
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TOOL 3: GUIDED 4-7-8 BREATHING */}
      {activeTool === 'breathing' && (
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 sm:p-8 border border-sage-100 shadow-soft-xl max-w-xl mx-auto text-center space-y-6">
          <div>
            <h3 className="font-bold text-xl sm:text-2xl text-slate-900 tracking-tight">
              {language === 'kn' ? '4-7-8 ನರಮಂಡಲ ಶಾಂತಗೊಳಿಸುವ ಉಸಿರಾಟ' : '4-7-8 Parasympathetic Reset'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              {language === 'kn'
                ? 'ಆತಂಕ ಮತ್ತು ಆಂತರಿಕ ಒತ್ತಡವನ್ನು ತಗ್ಗಿಸಿ ನಿಮ್ಮ ನರಮಂಡಲವನ್ನು ಶಾಂತಗೊಳಿಸುವ ವೈದ್ಯಕೀಯ ಉಸಿರಾಟ ವಿಧಾನ.'
                : "Dr. Andrew Weil's breathing protocol. Stimulates the vagal nerve to lower acute heart rate and downregulate the autonomic nervous system."}
            </p>
          </div>

          {/* Visual Breathing Bubble */}
          <div className="py-8 flex flex-col items-center justify-center">
            <div
              className={`w-52 h-52 rounded-full flex flex-col items-center justify-center transition-all duration-1000 shadow-soft-xl ${
                breathingPhase === 'Inhale'
                  ? 'bg-gradient-to-tr from-sage-100 via-teal-100 to-emerald-100 scale-110 border-4 border-sage-400 shadow-glow-sage'
                  : breathingPhase === 'Hold'
                  ? 'bg-gradient-to-tr from-amber-100 via-warmivory-100 to-yellow-100 scale-110 border-4 border-amber-400'
                  : 'bg-gradient-to-tr from-lavender-100 via-slate-100 to-teal-50 scale-90 border-4 border-slate-300'
              }`}
            >
              <span className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-1">
                {breathingPhase === 'Inhale' 
                  ? (language === 'kn' ? 'ಉಸಿರೆಳೆದುಕೊಳ್ಳಿ' : 'Inhale')
                  : breathingPhase === 'Hold'
                  ? (language === 'kn' ? 'ಉಸಿರು ಬಿಗಿಹಿಡಿಯಿರಿ' : 'Hold')
                  : (language === 'kn' ? 'ಉಸಿರು ಹೊರಬಿಡಿ' : 'Exhale')}
              </span>
              <span className="text-5xl font-extrabold text-slate-800 font-mono">
                {timerSeconds}s
              </span>
            </div>

            <p className="text-xs text-slate-600 font-medium mt-6 max-w-xs h-6">
              {breathingPhase === 'Inhale' && (language === 'kn' ? 'ಮೂಗಿನ ಮೂಲಕ 4 ಸೆಕೆಂಡುಗಳ ಕಾಲ ನಿಧಾನವಾಗಿ ಉಸಿರೆಳೆದುಕೊಳ್ಳಿ...' : 'Breathe in quietly through your nose (4s)...')}
              {breathingPhase === 'Hold' && (language === 'kn' ? 'ಯಾವುದೇ ಬಿಗಿತವಿಲ್ಲದೆ 7 ಸೆಕೆಂಡುಗಳ ಕಾಲ ಉಸಿರನ್ನು ಹಿಡಿದಿಟ್ಟುಕೊಳ್ಳಿ...' : 'Hold breath effortlessly without tension (7s)...')}
              {breathingPhase === 'Exhale' && (language === 'kn' ? 'ಬಾಯಿಯ ಮೂಲಕ 8 ಸೆಕೆಂಡುಗಳ ಕಾಲ ನಿಧಾನವಾಗಿ ಉಸಿರು ಹೊರಬಿಡಿ...' : 'Exhale completely through your mouth with a soft whoosh (8s)...')}
            </p>
          </div>

          <div className="flex justify-center">
            <button
              onClick={() => setIsBreathingActive(!isBreathingActive)}
              className={`px-7 py-3 rounded-2xl font-bold text-sm flex items-center gap-2.5 shadow-soft-md transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                isBreathingActive
                  ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/25'
                  : 'bg-sage-600 hover:bg-sage-700 text-white shadow-sage-600/25'
              }`}
            >
              {isBreathingActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
              <span>
                {isBreathingActive 
                  ? (language === 'kn' ? 'ವಿರಾಮಗೊಳಿಸಿ' : 'Pause Exercise')
                  : (language === 'kn' ? '4-7-8 ಉಸಿರಾಟವನ್ನು ಪ್ರಾರಂಭಿಸಿ' : 'Begin 4-7-8 Breathing')}
              </span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
