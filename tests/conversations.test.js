// Multi-Turn Conversation Scenarios Verification
// Simulates the exact test dialogues specified by Dr. Alan

import assert from 'node:assert';
import { checkSafetyScreen } from '../server/safetyGuardrails.js';
import { LLMService } from '../server/llmService.js';

console.log('\n======================================================');
console.log(' Running Multi-Turn Dialogue Scenarios & Invariant Checks');
console.log('======================================================\n');

const llm = new LLMService();

// Scenario 1 & 4: Breakup + Repeated question
console.log('[Scenario 1 & 4] Breakup Question & Repeated Question Handling');
{
  const history = [
    { sender: 'user', text: "Few days back me and my boyfriend broke up. I'm suffering a lot from this. How to move on? My health is suffering from this." }
  ];

  // Invariant 1: Safety check must pass
  const safety = checkSafetyScreen(history[0].text, 'en');
  assert.strictEqual(safety.isCrisis, false, 'Breakup is not crisis by default');

  // Invariant 2: Gemini formatting must map user turns properly
  const contents = llm.formatGeminiContents(history, history[0].text);
  assert.strictEqual(contents.length, 1);
  assert.strictEqual(contents[0].role, 'user');
  assert.ok(contents[0].parts[0].text.includes('boyfriend broke up'));

  // Invariant 3: When asked second time, history must preserve prior turn
  const historyTurn2 = [
    ...history,
    { sender: 'bot', text: "I'm sorry you are going through this. A breakup takes time..." },
    { sender: 'user', text: "I'm suffering a lot. How do I move on?" }
  ];
  const contentsTurn2 = llm.formatGeminiContents(historyTurn2, historyTurn2[2].text);
  assert.strictEqual(contentsTurn2.length, 3);
  assert.strictEqual(contentsTurn2[0].role, 'user');
  assert.strictEqual(contentsTurn2[1].role, 'model');
  assert.strictEqual(contentsTurn2[2].role, 'user');
  console.log('  ✓ Breakup multi-turn preserves context and interleaves user/model turns');
}

// Scenario 2: Racing thoughts & Physical anxiety (Anti-Sleep Assumption test)
console.log('\n[Scenario 2] Racing Thoughts & Physical Anxiety (Anti-Sleep Invariant)');
{
  const userMsg = "My thoughts keep racing at night and I feel constant physical anxiety.";
  const summary = llm.generateFactualFallbackReflection([{ sender: 'user', text: userMsg }], 'en');

  assert.ok(summary.exploredTopics.includes('Physical anxiety sensations'), 'Must identify physical anxiety');
  assert.ok(summary.exploredTopics.includes('Racing thoughts & overthinking'), 'Must identify racing thoughts');
  assert.ok(!summary.exploredTopics.includes('Sleep disruption'), 'MUST NOT identify sleep disruption when insomnia was not stated');
  console.log('  ✓ Explored topics accurately reflect physical anxiety & racing thoughts without sleep assumption');
}

// Scenario 3: Social withdrawal & Disconnection from friends
console.log('\n[Scenario 3] Social Disconnection from Friends');
{
  const userMsg = "I've been feeling disconnected from friends and withdrawing socially.";
  const summary = llm.generateFactualFallbackReflection([{ sender: 'user', text: userMsg }], 'en');

  assert.ok(summary.exploredTopics.includes('Social connection & withdrawal'), 'Must identify social connection & withdrawal');
  assert.ok(!summary.identifiedPatterns[0].includes('timeline'), 'Must not make assumptions about timelines');
  console.log('  ✓ Social withdrawal correctly mapped without canned timeline assumption');
}

// Scenario 5: Topic Change
console.log('\n[Scenario 5] Topic Change in Conversation');
{
  const multiTopicHistory = [
    { sender: 'user', text: "I have immense work deadlines at my job." },
    { sender: 'bot', text: "Work pressure can feel exhausting..." },
    { sender: 'user', text: "Actually, what's really bothering me is I feel lonely and isolated from people." }
  ];
  const summary = llm.generateFactualFallbackReflection(multiTopicHistory, 'en');

  assert.ok(summary.exploredTopics.includes('Work & academic stress'), 'Captures initial work stress');
  assert.ok(summary.exploredTopics.includes('Social connection & withdrawal'), 'Captures switched loneliness topic');
  console.log('  ✓ Multi-topic conversation successfully captures both concerns');
}

// Scenario 6: Kannada Conversation
console.log('\n[Scenario 6] Kannada Dialogue & Reflection');
{
  const kannadaMsg = "ಕೆಲವು ದಿನಗಳ ಹಿಂದೆ ಬ್ರೇಕಪ್ ಆಗಿದೆ, ತುಂಬಾ ನೋವಾಗುತ್ತಿದೆ. ಮನಸ್ಸಿನಲ್ಲಿ ಆಲೋಚನೆಗಳು ಓಡುತ್ತಿವೆ.";
  const summary = llm.generateFactualFallbackReflection([{ sender: 'user', text: kannadaMsg }], 'kn');

  assert.ok(summary.exploredTopics.includes('ಸಂಬಂಧದ ಬಿರುಕು ಮತ್ತು ನೋವು'), 'Identifies breakup in Kannada');
  assert.ok(summary.exploredTopics.includes('ಆಲೋಚನೆಗಳ ಸುಳಿಗಾಳಿ'), 'Identifies racing thoughts in Kannada');
  console.log('  ✓ Kannada language handling verified');
}

// Scenario 7: Self-harm escalation
console.log('\n[Scenario 7] Crisis Self-Harm Immediate Interception');
{
  const crisisEnglish = checkSafetyScreen("I don't see any reason to live anymore, I want to end it all", 'en');
  assert.strictEqual(crisisEnglish.isCrisis, true);
  assert.ok(crisisEnglish.text.includes('1800-599-0019'));
  assert.ok(crisisEnglish.text.includes('14416'));

  const crisisKannada = checkSafetyScreen("ನನಗೆ ಬದುಕಲು ಇಷ್ಟವಿಲ್ಲ, ಸಾಯಬೇಕು ಅನಿಸುತ್ತಿದೆ", 'kn');
  assert.strictEqual(crisisKannada.isCrisis, true);
  assert.ok(crisisKannada.text.includes('1800-599-0019'));
  console.log('  ✓ Crisis safety guardrail escalates self-harm in English and Kannada');
}

// Scenario 8: Multi-Concern Reflection Summary
console.log('\n[Scenario 8] Comprehensive Multi-Concern Reflection Summary');
{
  const multiConcernMessages = [
    { sender: 'user', text: "My thoughts keep racing at night and I feel constant physical anxiety." },
    { sender: 'bot', text: "That physical sensation can feel very tense..." },
    { sender: 'user', text: "Few days back me and my boyfriend broke up. I'm suffering a lot. How to move on?" },
    { sender: 'bot', text: "A breakup takes time..." },
    { sender: 'user', text: "I've also been feeling disconnected from friends and withdrawing socially." }
  ];

  const summary = llm.generateFactualFallbackReflection(multiConcernMessages, 'en');
  const dossier = llm.generateFactualFallbackDossier(multiConcernMessages);

  assert.ok(summary.exploredTopics.includes('Relationship loss & breakup'));
  assert.ok(summary.exploredTopics.includes('Physical anxiety sensations'));
  assert.ok(summary.exploredTopics.includes('Racing thoughts & overthinking'));
  assert.ok(summary.exploredTopics.includes('Social connection & withdrawal'));
  assert.ok(!summary.exploredTopics.includes('Sleep disruption'), 'Sleep disruption must not be falsely included');

  assert.strictEqual(summary.whatYouShared.length, 3, 'Must capture user quotes');
  assert.ok(dossier.chiefComplaint.includes('racing at night'));
  assert.ok(dossier.patientReportedThemes.sleepArchitecture.includes('Not explicitly reported as a primary complaint'));
  console.log('  ✓ Multi-concern reflection correctly synthesizes all 4 concerns without false sleep assumption');
}

console.log('\n======================================================');
console.log(' All Multi-Turn Invariant Scenarios Passed Successfully!');
console.log('======================================================\n');
