// Deterministic Safety Guardrails & Emergency Escalation for Samvaad
// Enforces Section 14 (Crisis and Safety Protocol):
// 1. Pause routine history-taking
// 2. Respond supportively and directly
// 3. Ask appropriate safety questions when indicated
// 4. Encourage appropriate human assistance
// 5. Provide verified, relevant crisis or emergency information
// 6. Follow the platform's predefined escalation procedures
// Strict red-flag protocol: Does not claim chatbot can guarantee user safety

export const CRISIS_HOTLINES = {
  kiran: {
    name: 'KIRAN National Mental Health Helpline (Govt. of India)',
    number: '1800-599-0019',
    details: '24x7, toll-free, available across 13 Indian languages'
  },
  teleManas: {
    name: 'Tele-MANAS (National Tele Mental Health Programme)',
    number: '14416 / 1800-891-4416',
    details: '24x7 pan-India toll-free government service'
  },
  aasra: {
    name: 'AASRA Suicide Prevention Helpline',
    number: '+91 98204 66726',
    details: '24x7 confidential crisis support'
  },
  emergency: {
    name: 'National Emergency Services (Police / Medical)',
    number: '112',
    details: 'Immediate pan-India emergency response'
  },
  womenHelpline: {
    name: 'Women in Distress / Domestic Abuse Helpline',
    number: '181 / 1091 (NCW: 7827170170)',
    details: '24x7 domestic violence and emergency protection'
  },
  childline: {
    name: 'CHILDLINE (Child Abuse & Exploitation Helpline)',
    number: '1098',
    details: '24x7 emergency assistance for children & minors'
  }
};

// 1. Suicide or Self-Harm Patterns
const SUICIDE_PATTERNS = [
  /\b(suicide|suicidal)\b/i,
  /\b(kill|killing)\s+(myself|me)\b/i,
  /\b(end|ending)\s+(my\s+life|it\s+all)\b/i,
  /\bwant\s+to\s+die\b/i,
  /\bhurt(ing)?\s+myself\b/i,
  /\bself[-\s]?harm\b/i,
  /\bno\s+(reason|point)\s+to\s+live\b/i,
  /\bbetter\s+off\s+dead\b/i,
  /\bhang(ing)?\s+myself\b/i,
  /\bslit(ting)?\s+my\s+wrists?\b/i,
  /\boverdose\b/i,
  /ಆತ್ಮಹತ್ಯೆ/i,
  /ಸಾಯಬೇಕು/i,
  /ಸಾಯಲು\s*ಇಷ್ಟ/i,
  /ಬದುಕಲು\s*ಇಷ್ಟವಿಲ್ಲ/i,
  /ಜೀವ\s*ಬಿಡಬೇಕು/i,
  /ನನ್ನನ್ನು\s*ನಾನು\s*ನೋಯಿಸಿಕೊಳ್ಳ/i
];

// 2. Immediate Physical Danger Patterns
const IMMEDIATE_DANGER_PATTERNS = [
  /\b(in\s+immediate\s+danger|life\s+is\s+in\s+danger)\b/i,
  /\b(someone\s+is\s+(trying\s+to\s+kill|attacking|hunting)\s+me)\b/i,
  /\b(being\s+attacked|threatened\s+with\s+(a\s+gun|a\s+knife|a\s+weapon))\b/i,
  /\b(locked\s+in|trapped\s+and\s+cannot\s+escape)\b/i,
  /ಪ್ರಾಣಾಪಾಯ/i,
  /ಹಲ್ಲೆ\s*ಮಾಡುತ್ತಿದ್ದಾರೆ/i,
  /ಕೊಲ್ಲಲು\s*ಪ್ರಯತ್ನ/i
];

// 3. Abuse or Exploitation Patterns
const ABUSE_PATTERNS = [
  /\b(domestic\s+violence|domestic\s+abuse|abusive\s+(partner|relationship|husband|wife|marriage|household))\b/i,
  /\b(partner|husband|wife|boyfriend|girlfriend|spouse|father|mother|parent)\s+(beats?|hits?|hurts?|punches?|abuses?)\s+me\b/i,
  /\b(physically|sexually|verbally|emotionally)\s+(abusive|abused)\b/i,
  /\b(being\s+abused|being\s+hit|being\s+beaten|child\s+abuse)\b/i,
  /\b(molested|raped|sexual\s+assault|blackmailed|exploited|assaulted)\b/i,
  /\b(parents\s+beating\s+me)\b/i,
  /ಕೌಟುಂಬಿಕ\s*ಹಿಂಸೆ/i,
  /ಹೊಡೆಯುತ್ತಿದ್ದಾರೆ/i,
  /ಲೈಂಗಿಕ\s*ದೌರ್ಜನ್ಯ/i,
  /ಕಿರುಕುಳ\s*ನೀಡುತ್ತಿದ್ದಾರೆ/i
];

// 4. Somatic / Physical Emergency Patterns
const PHYSICAL_EMERGENCY_PATTERNS = [
  /\b(crushing|severe|sharp)\s+chest\s+pain\b/i,
  /\bheart\s+attack\b/i,
  /\bcan'?t\s+breathe\b/i,
  /\bsevere\s+shortness\s+of\s+breath\b/i,
  /\bsudden\s+numbness\b/i,
  /\b(stroke|seizure)\b/i,
  /ಎದೆ\s*ನೋವು/i,
  /ಉಸಿರಾಟದ\s*ತೊಂದರೆ/i
];

export function checkSafetyScreen(text, language = 'en') {
  if (!text || typeof text !== 'string') {
    return { isCrisis: false };
  }

  const isSuicide = SUICIDE_PATTERNS.some(p => p.test(text));
  const isDanger = IMMEDIATE_DANGER_PATTERNS.some(p => p.test(text));
  const isAbuse = ABUSE_PATTERNS.some(p => p.test(text));
  const isPhysical = PHYSICAL_EMERGENCY_PATTERNS.some(p => p.test(text));

  if (!isSuicide && !isDanger && !isAbuse && !isPhysical) {
    return { isCrisis: false };
  }

  // 1. SUICIDE OR SELF-HARM
  if (isSuicide) {
    if (language === 'kn') {
      return {
        isCrisis: true,
        crisisType: 'suicide_selfharm',
        text: `ನಾನು ನಿಮ್ಮ ನೋವನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳಬಲ್ಲೆ, ಮತ್ತು ನೀವು ಈ ಕಷ್ಟದ ಕ್ಷಣದಲ್ಲಿ ಒಂಟಿಯಾಗಿಲ್ಲ. ನಿಮ್ಮ ಸುರಕ್ಷತೆ ಮತ್ತು ಜೀವ ನಮಗೆ ಅತ್ಯಂತ ಮುಖ್ಯವಾಗಿದೆ. ನಾನು ಕೇವಲ ಒಂದು AI ಸಹಾಯಕನಾಗಿದ್ದು, ಜೀವ ರಕ್ಷಣೆಯ ಸೇವೆ ನೀಡಲು ಅಥವಾ ನಿಮ್ಮ ಸುರಕ್ಷತೆಯನ್ನು ಖಾತರಿಪಡಿಸಲು ಸಾಧ್ಯವಿಲ್ಲ.

ಸುರಕ್ಷತಾ ಪ್ರಶ್ನೆ: ನೀವು ಈಗ ಸುರಕ್ಷಿತ ಸ್ಥಳದಲ್ಲಿದ್ದೀರಾ? ನಿಮ್ಮ ಜೊತೆಗೆ ಯಾರಾದರೂ ಆಪ್ತರು ಅಥವಾ ಕುಟುಂಬದವರು ಇದ್ದಾರೆಯೇ?

ದಯವಿಟ್ಟು ತಕ್ಷಣವೇ ಈ ಉಚಿತ 24x7 ರಾಷ್ಟ್ರೀಯ ಸಹಾಯವಾಣಿಗಳನ್ನು ಸಂಪರ್ಕಿಸಿ:
• ಕಿರಣ್ (KIRAN): 1800-599-0019 (ಭಾರತ ಸರ್ಕಾರ, 13 ಭಾಷೆಗಳಲ್ಲಿ)
• ಟೆಲಿ-ಮಾನಸ್ (Tele-MANAS): 14416 ಅಥವಾ 1800-891-4416
• ಆಸರಾ (AASRA): +91 98204 66726
• ರಾಷ್ಟ್ರೀಯ ತುರ್ತು ಸಹಾಯವಾಣಿ: 112

ದಯವಿಟ್ಟು ತಕ್ಷಣವೇ ಒಬ್ಬ ತಜ್ಞರೊಂದಿಗೆ, ಕುಟುಂಬದವರೊಂದಿಗೆ ಅಥವಾ ಆಪ್ತರೊಂದಿಗೆ ಮಾತನಾಡಿ. ತಜ್ಞರು ನಿಮ್ಮೊಂದಿಗೆ ಮಾತನಾಡಲು ಸದಾ ಸಿದ್ಧರಾಗಿದ್ದಾರೆ.`
      };
    }

    return {
      isCrisis: true,
      crisisType: 'suicide_selfharm',
      text: `I hear how heavy and painful things feel right now, and I want you to know you do not have to carry this alone. Your life and safety matter deeply. Because I am an AI companion, I cannot provide emergency crisis care or guarantee your safety.

Safety check: Are you in a safe place right now? Is there someone with you whom you trust?

Please reach out immediately to trained, compassionate professionals who are available 24x7 without judgment:
• KIRAN Toll-Free Helpline: 1800-599-0019 (Govt. of India, 24x7, 13 languages)
• Tele-MANAS: 14416 or 1800-891-4416 (National Tele Mental Health Programme)
• AASRA: +91 98204 66726 (24x7 Confidential Crisis Support)
• National Emergency: 112

Please reach out to one of these free services, or contact a trusted friend, family member, or the nearest hospital right away.`
    };
  }

  // 2. IMMEDIATE DANGER
  if (isDanger) {
    if (language === 'kn') {
      return {
        isCrisis: true,
        crisisType: 'immediate_danger',
        text: `ನೀವು ತಕ್ಷಣದ ಅಪಾಯದಲ್ಲಿದ್ದೀರಿ ಎಂದು ತೋರುತ್ತಿದೆ. ನಿಮ್ಮ ಭೌತಿಕ ಸುರಕ್ಷತೆ ಈಗ ಎಲ್ಲಕ್ಕಿಂತ ಮುಖ್ಯ. ನಾನು ಕೇವಲ AI ಸಹಾಯಕನಾಗಿದ್ದು, ಸ್ಥಳಕ್ಕೆ ಬಂದು ರಕ್ಷಣೆ ನೀಡಲು ಸಾಧ್ಯವಿಲ್ಲ.

ಸುರಕ್ಷತಾ ಪ್ರಶ್ನೆ: ನೀವು ಈಗಲೇ ಸುರಕ್ಷಿತ ಸ್ಥಳಕ್ಕೆ ತೆರಳಲು ಸಾಧ್ಯವೇ? 112 ಗೆ ಕರೆ ಮಾಡಲು ಸಾಧ್ಯವೇ?

ದಯವಿಟ್ಟು ತಕ್ಷಣವೇ ಕರೆ ಮಾಡಿ:
• ರಾಷ್ಟ್ರೀಯ ತುರ್ತು ಸಹಾಯವಾಣಿ (ಪೊಲೀಸ್ / ಆಂಬುಲೆನ್ಸ್): 112
• ಮಹಿಳಾ ಸಹಾಯವಾಣಿ: 181 / 1091

ದಯವಿಟ್ಟು ತಕ್ಷಣವೇ ತುರ್ತು ಸೇವೆಗಳನ್ನು ಅಥವಾ ಹತ್ತಿರದವರನ್ನು ಸಂಪರ್ಕಿಸಿ.`
      };
    }

    return {
      isCrisis: true,
      crisisType: 'immediate_danger',
      text: `It sounds like you may be in immediate physical danger. Your physical safety is the absolute top priority right now. Because I am an AI companion, I cannot intervene physically or dispatch emergency services directly.

Safety check: Can you safely step away to a secure location right now? Can you reach someone near you?

Please contact emergency authorities immediately:
• National Emergency Services (Police / Medical): 112
• Women's Emergency Helpline: 181 / 1091

Please call 112 or seek assistance from people nearby right away.`
    };
  }

  // 3. ABUSE OR EXPLOITATION
  if (isAbuse) {
    if (language === 'kn') {
      return {
        isCrisis: true,
        crisisType: 'abuse_exploitation',
        text: `ನೀವು ಹಂಚಿಕೊಂಡಿರುವ ಹಿಂಸೆ ಅಥವಾ ಕಿರುಕುಳದ ಅನುಭವವನ್ನು ಕೇಳಿ ನಮಗೆ ವಿಷಾದವಿದೆ. ಯಾರೊಬ್ಬರೂ ಹಿಂಸೆ ಅಥವಾ ದೌರ್ಜನ್ಯವನ್ನು ಅನುಭವಿಸಬಾರದು. ನಾನು ಕೇವಲ ಒಂದು AI ಸಹಾಯಕನಾಗಿದ್ದು, ಕಾನೂನು ಅಥವಾ ಭೌತಿಕ ರಕ್ಷಣೆ ಒದಗಿಸಲು ಸಾಧ್ಯವಿಲ್ಲ.

ಸುರಕ್ಷತಾ ಪ್ರಶ್ನೆ: ನೀವು ಪ್ರಸ್ತುತ ಆ ವ್ಯಕ್ತಿಯಿಂದ ಸುರಕ್ಷಿತ ಅಂತರದಲ್ಲಿದ್ದೀರಾ? ತುರ್ತು ಸಹಾಯಕ್ಕೆ ಫೋನ್ ಲಭ್ಯವಿದೆಯೇ?

ಗೌಪ್ಯ ಮತ್ತು ತಕ್ಷಣದ ಸಹಾಯಕ್ಕಾಗಿ ದಯವಿಟ್ಟು ಈ ಸಹಾಯವಾಣಿಗಳನ್ನು ಸಂಪರ್ಕಿಸಿ:
• ರಾಷ್ಟ್ರೀಯ ತುರ್ತು ಸಂಖ್ಯೆ: 112
• ರಾಷ್ಟ್ರೀಯ ಮಹಿಳಾ ಆಯೋಗ (NCW) ಸಹಾಯವಾಣಿ: 7827170170
• ಮಹಿಳಾ ಸಹಾಯವಾಣಿ (ಗೌಪ್ಯ): 181 / 1091
• ಮಕ್ಕಳ ಸಹಾಯವಾಣಿ (ಮಕ್ಕಳಿಗೆ): 1098
• ಮಾನಸಿಕ ಬೆಂಬಲಕ್ಕಾಗಿ ಕಿರಣ್: 1800-599-0019

ದಯವಿಟ್ಟು ತಕ್ಷಣವೇ ಈ ಅಧಿಕೃತ ಸೇವೆಗಳನ್ನು ಅಥವಾ ನೀವು ನಂಬುವ ಆಪ್ತರನ್ನು ಸಂಪರ್ಕಿಸಿ.`
      };
    }

    return {
      isCrisis: true,
      crisisType: 'abuse_exploitation',
      text: `I hear what you are going through, and I am deeply concerned for your well-being. No one deserves to be subjected to violence, abuse, or exploitation. Because I am an AI companion, I cannot provide legal protection or physical shelter directly.

Safety check: Are you in a physically safe place right now away from the person causing harm?

Please reach out to verified, confidential support services immediately:
• National Emergency Services: 112
• National Commission for Women (NCW) Helpline: 7827170170
• Women in Distress Helpline: 181 / 1091
• CHILDLINE (for minors/children): 1098
• Mental Health Support (KIRAN): 1800-599-0019

Please connect with one of these confidential support services or a trusted advocate who can help keep you safe.`
    };
  }

  // 4. SOMATIC / PHYSICAL EMERGENCY
  if (isPhysical) {
    if (language === 'kn') {
      return {
        isCrisis: true,
        crisisType: 'somatic_emergency',
        isPhysicalEmergency: true,
        text: `ನೀವು ವಿವರಿಸಿದ ದೈಹಿಕ ಲಕ್ಷಣಗಳು (ಉದಾ: ತೀವ್ರ ಎದೆ ನೋವು ಅಥವಾ ಉಸಿರಾಟದ ತೊಂದರೆ) ತಕ್ಷಣದ ವೈದ್ಯಕೀಯ ಗಮನವನ್ನು ಬೇಡುತ್ತವೆ. ಆತಂಕದಿಂದಲೂ ಇಂತಹ ಲಕ್ಷಣಗಳು ಕಾಣಿಸಿಕೊಳ್ಳಬಹುದಾದರೂ, ದೈಹಿಕ ಸುರಕ್ಷತೆಯ ದೃಷ್ಟಿಯಿಂದ ತುರ್ತು ವೈದ್ಯಕೀಯ ತಪಾಸಣೆ ಅತ್ಯಗತ್ಯ.

ದಯವಿಟ್ಟು ತಕ್ಷಣವೇ 112 ಗೆ ಕರೆ ಮಾಡಿ ಅಥವಾ ಹತ್ತಿರದ ಆಸ್ಪತ್ರೆಯ ತುರ್ತು ಚಿಕಿತ್ಸಾ ವಿಭಾಗಕ್ಕೆ ತೆರಳಿ.`
      };
    }

    return {
      isCrisis: true,
      crisisType: 'somatic_emergency',
      isPhysicalEmergency: true,
      text: `The physical symptoms you described (such as severe chest pain or acute difficulty breathing) require immediate medical evaluation. While severe anxiety can sometimes cause physical sensations, it is vital to rule out any acute medical emergency first.

Please call 112 immediately or have someone take you to the nearest emergency room or hospital right away.`
    };
  }

  return { isCrisis: false };
}
