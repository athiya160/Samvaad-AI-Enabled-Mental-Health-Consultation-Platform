import React, { createContext, useContext, useState } from 'react';

const TRANSLATIONS = {
  en: {
    brandName: 'Samvaad',
    brandTagline: 'Affordable, Stigma-Free Mental Health Care for Bharat',
    crisisTag: 'In Crisis? Call Toll-Free 1800-599-0019 (KIRAN) or 14416 (Tele-MANAS)',
    navAiCompanion: 'AI Reflection Tool',
    navConsultants: 'Find Doctors (< ₹500)',
    navTherapyTools: 'Self-Care Tools (Preview)',
    navDoctorPortal: 'Doctor Portal Demo',
    proposalSpecs: 'Proposal Specs',
    anonymousId: 'Sign In',
    consultantPortal: 'Consultant Portal',
    home: 'Home',
    auraChat: 'Aura Chat',
    doctors: 'Doctors',
    tools: 'Tools',
    doc: 'Doc',
    heroBadge: 'Pan-India Mental Health Initiative',
    heroTitle: 'Speak Freely. Without Stigma. At a Price You Can Afford.',
    heroSubtitle: 'Most consultations in India cost ₹1,500+. We are changing that. Consult qualified psychiatrists and psychologists starting at just ₹299. Explore your thoughts with our free AI companion—no login required.',
    heroCtaTalk: 'Try Free AI Reflection',
    heroCtaDoctors: 'Browse Doctors (< ₹500)',
    heroPill1: 'Zero Login Needed to Reflect',
    heroPill2: 'Standardized < ₹500 Fees',
    heroPill3: 'Private & Confidential',
    chatTitle: 'Aura — AI Emotional Companion',
    chatSubtitle: 'A supportive, non-judgmental space to reflect on what is on your mind. Aura is an AI companion, not a therapist or doctor. In emergencies, call 112 or 1800-599-0019.',
    chatPlaceholder: 'Type what you are feeling in your own words (e.g., "Few days back me and my boyfriend broke up... how do I move on?")...',
    generateReflectionBtn: 'Generate Reflection Summary',
    domainsCovered: 'Explored Areas',
    anonymousNotice: 'Private session. No account, name, or phone number required to talk with Aura. Securely processed by AI for personal self-reflection.',
    consultantsHeading: 'Pan-India Consultant Network (Proposal Preview)',
    consultantsSubheading: 'Sample specialist profiles illustrating Dr. Alan’s subsidized tele-consultation model across states.',
    drAlanTag: 'Dr. Alan Samuel — Consultant Psychiatrist',
    bookConsultation: 'Book Consultation',
    savePseudoAnon: 'Save Reflection',
    doctorDashboardTitle: 'Pre-Consultation Summary Dashboard',
    doctorDashboardSubtitle: 'Pre-consultation patient reflection summaries providing preliminary context for doctor review.'
  },
  kn: {
    brandName: 'ಸಂವಾದ (Samvaad)',
    brandTagline: 'ಭಾರತಕ್ಕಾಗಿ ಕೈಗೆಟುಕುವ, ಕಳಂಕ-ಮುಕ್ತ ಮಾನಸಿಕ ಆರೋಗ್ಯ ಸೇವೆ',
    crisisTag: 'ತುರ್ತು ಸಹಾಯ ಬೇಕೆ? ಉಚಿತ ಸಹಾಯವಾಣಿ 1800-599-0019 (ಕಿರಣ್) ಅಥವಾ 14416 (ಟೆಲಿ-ಮಾನಸ್)',
    navAiCompanion: 'AI ಆತ್ಮಾವಲೋಕನ ಸಾಧನ',
    navConsultants: 'ವೈದ್ಯರನ್ನು ಹುಡುಕಿ (< ₹500)',
    navTherapyTools: 'ಸ್ವಯಂ ಆರೈಕೆ ಪರಿಕರಗಳು (ಮುನ್ನೋಟ)',
    navDoctorPortal: 'ವೈದ್ಯರ ಪೋರ್ಟಲ್',
    proposalSpecs: 'ಯೋಜನಾ ವಿವರಗಳು',
    anonymousId: 'ಲಾಗಿನ್',
    consultantPortal: 'ತಜ್ಞರ ಪೋರ್ಟಲ್',
    home: 'ಮುಖಪುಟ',
    auraChat: 'ಔರಾ ಚಾಟ್',
    doctors: 'ವೈದ್ಯರು',
    tools: 'ಪರಿಕರಗಳು',
    doc: 'ವಿವರ',
    heroBadge: 'ಅಖಿಲ ಭಾರತ ಮಾನಸಿಕ ಆರೋಗ್ಯ ಅಭಿಯಾನ',
    heroTitle: 'ಮುಕ್ತವಾಗಿ ಮಾತನಾಡಿ. ಯಾವುದೇ ಭಯವಿಲ್ಲದೆ. ಕೈಗೆಟುಕುವ ದರದಲ್ಲಿ.',
    heroSubtitle: 'ಭಾರತದಲ್ಲಿ ಹೆಚ್ಚಿನ ಸಮಾಲೋಚನೆ ಶುಲ್ಕ ₹1,500 ಕ್ಕಿಂತ ಹೆಚ್ಚು. ನಾವು ಅದನ್ನು ಬದಲಾಯಿಸುತ್ತಿದ್ದೇವೆ. ಕೇವಲ ₹299 ರಿಂದ ಅರ್ಹ ಮನೋವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸುವ ವೇದಿಕೆ. ಯಾವುದೇ ಲಾಗಿನ್ ಇಲ್ಲದೆ ನಮ್ಮ ಉಚಿತ AI ಜೊತೆ ಮುಕ್ತವಾಗಿ ಮಾತನಾಡಿ.',
    heroCtaTalk: 'ಉಚಿತ AI ಜೊತೆ ಮಾತನಾಡಿ',
    heroCtaDoctors: 'ವೈದ್ಯರನ್ನು ನೋಡಿ (< ₹500)',
    heroPill1: 'ಲಾಗಿನ್ ಅಗತ್ಯವಿಲ್ಲ',
    heroPill2: 'ಕೇವಲ ₹500 ಕ್ಕಿಂತ ಕಡಿಮೆ ಶುಲ್ಕ',
    heroPill3: 'ಖಾಸಗಿ ಮತ್ತು ಗೌಪ್ಯ',
    chatTitle: 'ಔರಾ (Aura) — ನಿಮ್ಮ ಆಪ್ತ AI ಸಹಾಯಕ',
    chatSubtitle: 'ನಿಮ್ಮ ಮನಸ್ಸಿನಲ್ಲಿರುವುದನ್ನು ಹಂಚಿಕೊಳ್ಳುವ ಸುರಕ್ಷಿತ ಸ್ಥಳ. ಔರಾ ಕೇವಲ AI ಸಹಾಯಕವಾಗಿದ್ದು, ತುರ್ತು ಅಥವಾ ವೈದ್ಯಕೀಯ ಚಿಕಿತ್ಸೆಗೆ ಪರ್ಯಾಯವಲ್ಲ. ತುರ್ತು ನೆರವಿಗೆ 112 ಅಥವಾ 1800-599-0019 ಕರೆ ಮಾಡಿ.',
    chatPlaceholder: 'ನಿಮ್ಮ ಅನುಭವವನ್ನು ನಿಮ್ಮದೇ ಮಾತುಗಳಲ್ಲಿ ಹಂಚಿಕೊಳ್ಳಿ (ಉದಾ: "ಕೆಲವು ದಿನಗಳ ಹಿಂದೆ ಬ್ರೇಕಪ್ ಆಗಿದೆ, ಹೇಗೆ ಮುಂದೆ ಸಾಗುವುದು ತಿಳಿಯುತ್ತಿಲ್ಲ")...',
    generateReflectionBtn: 'ಆತ್ಮಾವಲೋಕನ ಸಾರಾಂಶ ಪಡೆಯಿರಿ',
    domainsCovered: 'ಪರಿಶೀಲಿಸಲಾದ ವಿಷಯಗಳು',
    anonymousNotice: 'ಖಾಸಗಿ ಮತ್ತು ಗೌಪ್ಯ: ಯಾವುದೇ ಖಾತೆ, ಹೆಸರು ಅಥವಾ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ಇಲ್ಲದೆ ಮುಕ್ತವಾಗಿ ಮಾತನಾಡಿ.',
    consultantsHeading: 'ಅಖಿಲ ಭಾರತ ತಜ್ಞರ ಜಾಲ (ಮಾದರಿ ಮುನ್ನೋಟ)',
    consultantsSubheading: 'ಡಾ. ಅಲನ್ ಅವರ ಕಲ್ಪನೆಯಂತೆ ಕೈಗೆಟುಕುವ ಸಮಾಲೋಚನೆ ಮಾದರಿಯನ್ನು ತೋರಿಸುವ ತಜ್ಞರ ವಿವರಗಳು.',
    drAlanTag: 'ಡಾ. ಅಲನ್ ಸ್ಯಾಮ್ಯುಯೆಲ್ — ಸಲಹಾ ಮನೋವೈದ್ಯರು',
    bookConsultation: 'ಸಮಾಲೋಚನೆ ಕಾಯ್ದಿರಿಸಿ',
    savePseudoAnon: 'ಸಾರಾಂಶ ಉಳಿಸಿ',
    doctorDashboardTitle: 'ಸಮಾಲೋಚನೆ ಪೂರ್ವ ಸಾರಾಂಶ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    doctorDashboardSubtitle: 'ವೈದ್ಯರ ಪರಿಶೀಲನೆಗಾಗಿ AI ಸಿದ್ಧಪಡಿಸಿದ ರೋಗಿಯ ಪ್ರಾಥಮಿಕ ಸಾರಾಂಶ.'
  }
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en');

  const t = (key) => {
    return TRANSLATIONS[language]?.[key] || TRANSLATIONS['en']?.[key] || key;
  };

  const toggleLanguage = () => {
    setLanguage(prev => (prev === 'en' ? 'kn' : 'en'));
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
