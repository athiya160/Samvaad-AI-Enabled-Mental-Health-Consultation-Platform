// 12 Clinical Psychiatric & Psychological Exploration Domains
// Referenced in consultation with Dr. Alan Samuel

export const PSYCHIATRIC_DOMAINS = [
  {
    id: 'primary_concern',
    name: 'Primary Concern & Mood',
    kannadaName: 'ಮುಖ್ಯ ಕಾಳಜಿ ಮತ್ತು ಮನಸ್ಥಿತಿ',
    description: 'Presenting complaint, emotional climate, and predominant mood state',
    keywords: ['sad', 'down', 'hopeless', 'heavy', 'crying', 'empty', 'numb', 'angry', 'mood', 'feeling', 'depressed', 'low', 'frustrated'],
    questionsHint: 'How would you describe what is weighing most heavily on your mind right now?'
  },
  {
    id: 'duration_timeline',
    name: 'Duration & Timeline',
    kannadaName: 'ಅವಧಿ ಮತ್ತು ಬೆಳವಣಿಗೆ',
    description: 'Onset, progression, episodic vs continuous nature',
    keywords: ['days', 'weeks', 'months', 'years', 'started', 'since', 'lately', 'recently', 'always', 'gradually', 'suddenly'],
    questionsHint: 'How long have you felt this way, and has it been steady or coming in waves?'
  },
  {
    id: 'sleep_architecture',
    name: 'Sleep Architecture',
    kannadaName: 'ನಿದ್ರೆಯ ಮಾದರಿ',
    description: 'Initial insomnia, middle awakening, early morning awakening, or hypersomnia',
    keywords: ['sleep', 'insomnia', 'night', 'wake', 'awake', 'tired', 'dreams', 'nightmares', 'bed', 'restless'],
    questionsHint: 'How has your sleep been lately—falling asleep, staying asleep, or waking up early?'
  },
  {
    id: 'appetite_energy',
    name: 'Energy & Somatic Vitality',
    kannadaName: 'ಚೈತನ್ಯ ಮತ್ತು ಹಸಿವು',
    description: 'Appetite shifts, physical exhaustion, psychomotor slowing/agitation',
    keywords: ['appetite', 'food', 'eating', 'weight', 'exhausted', 'energy', 'drain', 'fatigue', 'lethargic', 'body'],
    questionsHint: 'Have you noticed any shifts in your daily energy levels or changes in appetite?'
  },
  {
    id: 'thought_patterns',
    name: 'Cognitive & Thought Patterns',
    kannadaName: 'ಆಲೋಚನಾ ಮಾದರಿ',
    description: 'Overthinking, rumination, cognitive distortions, guilt, self-criticism',
    keywords: ['overthinking', 'racing', 'thoughts', 'ruminate', 'guilt', 'worthless', 'regret', 'failure', 'mind', 'worry'],
    questionsHint: 'Do your thoughts tend to race, replay past events, or predict worst-case outcomes?'
  },
  {
    id: 'anxiety_triggers',
    name: 'Anxiety & Panic Triggers',
    kannadaName: 'ಆತಂಕ ಮತ್ತು ಪ್ರಚೋದಕಗಳು',
    description: 'Autonomic symptoms (palpitations, tremors, breathlessness) and situational triggers',
    keywords: ['anxiety', 'panic', 'nervous', 'chest', 'breathing', 'heart', 'sweating', 'shaking', 'triggers', 'crowds', 'fear'],
    questionsHint: 'Do you ever experience sudden physical sensations of anxiety, like a fast heartbeat or tight chest?'
  },
  {
    id: 'daily_functioning',
    name: 'Impact on Daily Functioning',
    kannadaName: 'ದೈನಂದಿನ ಜೀವನದ ಮೇಲಿನ ಪ್ರಭಾವ',
    description: 'Occupational, academic, or household productivity and executive function',
    keywords: ['work', 'job', 'study', 'college', 'exam', 'focus', 'concentrate', 'productive', 'chores', 'procrastination', 'motivation'],
    questionsHint: 'How has this been affecting your work, studies, or simple day-to-day routines?'
  },
  {
    id: 'social_relationships',
    name: 'Social Connectedness & Support',
    kannadaName: 'ಸಾಮಾಜಿಕ ಸಂಬಂಧಗಳು',
    description: 'Social withdrawal, isolation, relational strain with family/partner/friends',
    keywords: ['friends', 'family', 'partner', 'parents', 'alone', 'isolated', 'lonely', 'people', 'arguments', 'avoiding'],
    questionsHint: 'Have you felt like withdrawing from family or friends, or feeling disconnected even around others?'
  },
  {
    id: 'life_stressors',
    name: 'Precipitating Life Stressors',
    kannadaName: 'ಜೀವನದ ಒತ್ತಡಗಳು',
    description: 'Financial, grief, breakup, academic pressure, career transition',
    keywords: ['money', 'finance', 'debt', 'breakup', 'divorce', 'loss', 'death', 'pressure', 'boss', 'marriage', 'future'],
    questionsHint: 'Was there any specific incident or pressure recently that intensified these feelings?'
  },
  {
    id: 'coping_mechanisms',
    name: 'Coping Strategies & Habits',
    kannadaName: 'ನಿಭಾಯಿಸುವ ವಿಧಾನಗಳು',
    description: 'Helpful vs unhelpful coping (walking, music, scrolling, isolation, substance use)',
    keywords: ['coping', 'music', 'walk', 'exercise', 'smoking', 'alcohol', 'scrolling', 'screen', 'distract', 'try', 'helps'],
    questionsHint: 'When things feel overwhelming, what do you usually do to get through the day?'
  },
  {
    id: 'emotional_regulation',
    name: 'Emotional Regulation & Shifts',
    kannadaName: 'ಭಾವನಾತ್ಮಕ ಸಮತೋಲನ',
    description: 'Emotional lability, mood swings, sudden tearfulness or irritability',
    keywords: ['swings', 'irritated', 'burst', 'angry', 'crying', 'snapping', 'unstable', 'up and down'],
    questionsHint: 'Do you find your emotions shifting rapidly or feeling irritable without a clear reason?'
  },
  {
    id: 'safety_risk_screen',
    name: 'Safety & Well-being Screening',
    kannadaName: 'ಸುರಕ್ಷತೆ ಮತ್ತು ತುರ್ತು ಪರಿಶೀಲನೆ',
    description: 'Screening for safety, hopelessness, and crisis triggers (Strict red flag protocols)',
    keywords: ['suicide', 'die', 'kill', 'end it', 'harm', 'give up', 'no reason to live', 'death wish', 'hurt myself'],
    questionsHint: 'When things get hard, do you feel safe with yourself?'
  }
];

export const CRISIS_RESOURCES = [
  {
    name: 'KIRAN Mental Health Helpline',
    tollFree: '1800-599-0019',
    description: 'Govt. of India 24x7 toll-free mental health rehabilitation helpline (13 languages)',
    type: 'Government'
  },
  {
    name: 'Tele-MANAS',
    tollFree: '14416 / 1800-891-4416',
    description: 'National Tele Mental Health Programme of India (24x7, Pan-India)',
    type: 'Government'
  },
  {
    name: 'Vandrevala Foundation Helpline',
    tollFree: '+91 9999 666 555',
    description: '24x7 free mental health counseling support across India via call and WhatsApp',
    type: 'Non-Profit'
  },
  {
    name: 'AASRA Helpline',
    tollFree: '+91 98204 66726',
    description: '24x7 confidential suicide prevention & crisis support',
    type: 'Crisis Helpline'
  }
];
