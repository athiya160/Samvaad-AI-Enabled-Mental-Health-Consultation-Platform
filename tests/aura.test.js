// Comprehensive Test Suite for Samvaad's Aura AI Companion & Reflection Engine
// Covers all scenarios mandated by Dr. Alan Samuel's specifications

import assert from 'node:assert';
import http from 'node:http';
import express from 'express';
import { checkSafetyScreen, CRISIS_HOTLINES } from '../server/safetyGuardrails.js';
import { LLMService } from '../server/llmService.js';
import { AURA_CHAT_SYSTEM_PROMPT, REFLECTION_SUMMARY_SYSTEM_PROMPT } from '../server/systemPrompts.js';
import { apiRouter } from '../server/apiRouter.js';
import { AICompanionEngine } from '../src/services/aiCompanionService.js';

let totalTests = 0;
let passedTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
  }
}

async function runAsyncTest(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
  }
}

console.log('\n======================================================');
console.log(' Starting Aura Conversational AI & Safety Verification');
console.log('======================================================\n');

// --------------------------------------------------------------------
// TEST GROUP 1: Deterministic Safety & Crisis Screening
// --------------------------------------------------------------------
console.log('[Test Group 1] Crisis Screening & Emergency Safeguards');

runTest('1.1 Should immediately catch English suicidal / self-harm thoughts', () => {
  const result = checkSafetyScreen('I feel hopeless and I want to end my life', 'en');
  assert.strictEqual(result.isCrisis, true, 'Must flag as crisis');
  assert.ok(result.text.includes('1800-599-0019'), 'Must include KIRAN helpline');
  assert.ok(result.text.includes('14416'), 'Must include Tele-MANAS helpline');
  assert.ok(result.text.includes('112'), 'Must include 112 emergency');
});

runTest('1.2 Should immediately catch Kannada suicidal / self-harm thoughts', () => {
  const result = checkSafetyScreen('ನನಗೆ ಬದುಕಲು ಇಷ್ಟವಿಲ್ಲ, ಸಾಯಬೇಕು ಅನಿಸುತ್ತಿದೆ', 'kn');
  assert.strictEqual(result.isCrisis, true, 'Must flag as crisis');
  assert.ok(result.text.includes('1800-599-0019'), 'Must include KIRAN helpline');
  assert.ok(result.text.includes('14416'), 'Must include Tele-MANAS helpline');
});

runTest('1.3 Should escalate acute somatic emergencies (e.g. crushing chest pain)', () => {
  const result = checkSafetyScreen('I have sudden severe crushing chest pain and cannot breathe', 'en');
  assert.strictEqual(result.isCrisis, true, 'Must flag as acute physical emergency');
  assert.strictEqual(result.isPhysicalEmergency, true);
  assert.ok(result.text.includes('112'), 'Must advise calling 112 / emergency department');
});

runTest('1.4 Non-crisis messages should pass safety filter smoothly', () => {
  const result = checkSafetyScreen('I am stressed about my college semester exams and my friends are distant', 'en');
  assert.strictEqual(result.isCrisis, false, 'Should not falsely trigger crisis on normal stress');
});

// --------------------------------------------------------------------
// TEST GROUP 2: LLM Service & Message Formatting
// --------------------------------------------------------------------
console.log('\n[Test Group 2] LLM Service Configuration & Message Formatting');

const testLlm = new LLMService();

runTest('2.1 Format Gemini contents: strips static bot greeting and ensures user start', () => {
  const history = [
    { sender: 'bot', text: 'Hello, I am Aura.' },
    { sender: 'user', text: 'My thoughts keep racing at night and I feel constant physical anxiety.' }
  ];
  const contents = testLlm.formatGeminiContents(history, 'My thoughts keep racing at night and I feel constant physical anxiety.');
  assert.ok(contents.length >= 1, 'Contents must have elements');
  assert.strictEqual(contents[0].role, 'user', 'Gemini contents must start with user turn');
  assert.ok(contents[0].parts[0].text.includes('racing at night'));
});

runTest('2.2 Format Gemini contents: merges consecutive turns from same role', () => {
  const history = [
    { sender: 'user', text: 'First part of message' },
    { sender: 'user', text: 'Second part of message' },
    { sender: 'bot', text: 'I understand' }
  ];
  const contents = testLlm.formatGeminiContents(history, 'New question');
  // Turns should be strictly alternating user -> model -> user
  for (let i = 0; i < contents.length - 1; i++) {
    assert.notStrictEqual(contents[i].role, contents[i + 1].role, 'Gemini requires alternating roles');
  }
});

runTest('2.3 Format OpenAI messages: correctly includes system prompt and role mapping', () => {
  const history = [
    { sender: 'user', text: 'I broke up with my boyfriend' },
    { sender: 'bot', text: 'I am so sorry to hear that.' }
  ];
  const messages = testLlm.formatOpenAIMessages(history, 'How do I move on?', AURA_CHAT_SYSTEM_PROMPT);
  assert.strictEqual(messages[0].role, 'system', 'First message must be system');
  assert.strictEqual(messages[1].role, 'user');
  assert.strictEqual(messages[2].role, 'assistant');
  assert.strictEqual(messages[3].role, 'user');
  assert.strictEqual(messages[3].content, 'How do I move on?');
});

// --------------------------------------------------------------------
// TEST GROUP 3: Service Unavailable Handling (Requirement 11)
// --------------------------------------------------------------------
console.log('\n[Test Group 3] Service Unavailable & Graceful Transparency (Req 11)');

await runAsyncTest('3.1 Should return clear service-unavailable when no API key configured', async () => {
  // Instance without API keys
  const unconfiguredLlm = new LLMService();
  unconfiguredLlm.geminiApiKey = '';
  unconfiguredLlm.openaiApiKey = '';

  const res = await unconfiguredLlm.generateChatResponse('How do I move on?', [], 'en');
  assert.strictEqual(res.ok, false, 'Should be marked as not ok');
  assert.strictEqual(res.error, 'SERVICE_UNAVAILABLE');
  assert.strictEqual(res.isConfigured, false);
  assert.ok(res.message.includes('1800-599-0019'), 'Must include crisis hotline in unavailable message');
  // Ensure it does NOT return the old canned response
  assert.ok(!res.message.includes("I'm holding space for what you've shared"), 'Must not return old canned response');
});

await runAsyncTest('3.2 Service-unavailable in Kannada should return helpful Kannada guidance', async () => {
  const unconfiguredLlm = new LLMService();
  unconfiguredLlm.geminiApiKey = '';
  unconfiguredLlm.openaiApiKey = '';

  const res = await unconfiguredLlm.generateChatResponse('ನನಗೆ ಸಹಾಯ ಬೇಕು', [], 'kn');
  assert.strictEqual(res.ok, false);
  assert.ok(res.message.includes('1800-599-0019'));
  assert.ok(res.message.includes('ಕಿರಣ್') || res.message.includes('ಟೆಲಿ-ಮಾನಸ್'));
});

// --------------------------------------------------------------------
// TEST GROUP 4: Conversation History & Conversational Quality Checks
// --------------------------------------------------------------------
console.log('\n[Test Group 4] Conversational Scenarios & Anti-Regression Rules');

runTest('4.1 System prompt enforces answering breakup question directly without redirecting to summary', () => {
  assert.ok(AURA_CHAT_SYSTEM_PROMPT.includes('RESPOND DIRECTLY TO THE USER\'S LATEST MESSAGE'), 'Must require responding to latest message');
  assert.ok(AURA_CHAT_SYSTEM_PROMPT.includes('Do NOT push the user to click "Generate Reflection Summary"'), 'Must forbid forcing reflection summary');
  assert.ok(AURA_CHAT_SYSTEM_PROMPT.includes('NO CANNED OR REPEATING TEMPLATES'), 'Must forbid canned templates');
  assert.ok(AURA_CHAT_SYSTEM_PROMPT.includes('NEVER MAKE UNSUPPORTED ASSUMPTIONS'), 'Must forbid unsupported assumptions');
});

runTest('4.2 System prompt restricts follow-up questions to AT MOST ONE and allows zero', () => {
  assert.ok(AURA_CHAT_SYSTEM_PROMPT.includes('AT MOST ONE thoughtful, relevant follow-up question'), 'Must limit questions to at most one');
  assert.ok(AURA_CHAT_SYSTEM_PROMPT.includes('DO NOT force every response to end in a question'), 'Must not force trailing question');
});

runTest('4.3 System prompt forbids inventing timeline claims', () => {
  assert.ok(AURA_CHAT_SYSTEM_PROMPT.includes('timeline'), 'Must explicitly mention timeline guideline');
});

runTest('4.4 System prompt contains explicit clinical guidance for breakup and somatic distress', () => {
  assert.ok(AURA_CHAT_SYSTEM_PROMPT.includes('HANDLING RELATIONSHIP LOSS, BREAKUPS & SOMATIC DISTRESS'), 'Must contain breakup clinical section');
  assert.ok(AURA_CHAT_SYSTEM_PROMPT.includes('moving on'), 'Must address moving on guidance');
  assert.ok(AURA_CHAT_SYSTEM_PROMPT.includes('somatic distress'), 'Must validate somatic distress');
});

runTest('4.5 Fallback engine handles breakup with physical suffering with clinical grounding', () => {
  const engine = new AICompanionEngine();
  const history = [
    { sender: 'user', text: "My thoughts keep racing at night and I feel constant physical anxiety." },
    { sender: 'bot', text: "I understand that physical tension feels overwhelming." }
  ];
  const response = engine.generateFallbackChatResponse(
    "Few days back me and my boyfriend broke up. I'm suffering a lot from this. How to move on? My health is suffering from this.",
    history,
    'en'
  );

  assert.ok(response.text.length > 50, 'Response must be substantial');
  // Must address moving on
  assert.ok(response.text.toLowerCase().includes('moving on'), 'Must address moving on directly');
  // Must validate physical health / somatic suffering
  assert.ok(response.text.toLowerCase().includes('health') || response.text.toLowerCase().includes('physical') || response.text.toLowerCase().includes('nervous system'), 'Must address physical/health impact');
  // Must weave prior context
  assert.ok(response.text.toLowerCase().includes('physical anxiety'), 'Must weave prior physical anxiety context');
  // Must end with at most one question
  const questionMarks = (response.text.match(/\?/g) || []).length;
  assert.ok(questionMarks <= 1, `Must have at most one question mark, had: ${questionMarks}`);
});

// --------------------------------------------------------------------
// TEST GROUP 5: Reflection Summary Engine (No Keyword False Positives)
// --------------------------------------------------------------------
console.log('\n[Test Group 5] Reflection Summary Engine Accuracy');

runTest('5.1 User mentioning "at night" without sleep issue MUST NOT be classified under sleep disruption', () => {
  const messages = [
    { sender: 'user', text: 'My thoughts keep racing at night and I feel constant physical anxiety.' }
  ];
  const summary = testLlm.generateFactualFallbackReflection(messages, 'en');

  // Explored topics must include racing thoughts & anxiety
  const hasThoughts = summary.exploredTopics.some(t => t.toLowerCase().includes('racing') || t.toLowerCase().includes('thought'));
  const hasAnxiety = summary.exploredTopics.some(t => t.toLowerCase().includes('anxiety'));
  const hasSleep = summary.exploredTopics.some(t => t.toLowerCase().includes('sleep'));

  assert.strictEqual(hasThoughts, true, 'Must capture racing thoughts');
  assert.strictEqual(hasAnxiety, true, 'Must capture anxiety');
  assert.strictEqual(hasSleep, false, 'CRITICAL: Must NOT classify as sleep disruption simply because "night" was mentioned!');
});

runTest('5.2 User explicitly reporting insomnia MUST be classified under sleep disruption', () => {
  const messages = [
    { sender: 'user', text: "I have severe insomnia and cannot sleep for the past 3 weeks." }
  ];
  const summary = testLlm.generateFactualFallbackReflection(messages, 'en');
  const hasSleep = summary.exploredTopics.some(t => t.toLowerCase().includes('sleep'));
  assert.strictEqual(hasSleep, true, 'Should capture sleep disruption when explicitly stated');
});

runTest('5.3 Breakup + physical anxiety reflection correctly identifies breakup and somatic tension', () => {
  const messages = [
    { sender: 'user', text: "My thoughts keep racing at night and I feel constant physical anxiety." },
    { sender: 'bot', text: "I hear you..." },
    { sender: 'user', text: "Few days back me and my boyfriend broke up. I'm suffering a lot from this. How to move on? My health is suffering from this." }
  ];
  const summary = testLlm.generateFactualFallbackReflection(messages, 'en');
  const hasBreakup = summary.exploredTopics.some(t => t.toLowerCase().includes('breakup') || t.toLowerCase().includes('relationship'));
  const hasAnxiety = summary.exploredTopics.some(t => t.toLowerCase().includes('anxiety'));

  assert.strictEqual(hasBreakup, true, 'Must capture breakup');
  assert.strictEqual(hasAnxiety, true, 'Must capture physical anxiety');
  assert.ok(summary.whatYouShared.length > 0, 'Must include verbatim quotes');
  assert.ok(summary.disclaimer.includes('non-diagnostic'), 'Must include non-diagnostic disclaimer');
});

runTest('5.4 Clinical Dossier reflects objective patient reports for Dr. Alan', () => {
  const messages = [
    { sender: 'user', text: "Few days back me and my boyfriend broke up. My thoughts race and I feel physical anxiety." }
  ];
  const dossier = testLlm.generateFactualFallbackDossier(messages);
  assert.ok(dossier.dossierId.startsWith('DOS-'), 'Must have dossier ID');
  assert.strictEqual(dossier.patientReportedThemes.sleepArchitecture.includes('Not explicitly reported'), true);
  assert.strictEqual(dossier.patientReportedThemes.somaticAutonomic.includes('somatic tension'), true);
});

// --------------------------------------------------------------------
// TEST GROUP 6: Backend API Integration Endpoints
// --------------------------------------------------------------------
console.log('\n[Test Group 6] Backend Express API Endpoints Integration');

await runAsyncTest('6.1 Express app mounts /api/health and returns 200', async () => {
  const app = express();
  app.use(express.json());
  app.use('/api', apiRouter);

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;

  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/health`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.status, 'ok');
    assert.strictEqual(typeof data.llmConfigured, 'boolean');
  } finally {
    server.close();
  }
});

await runAsyncTest('6.2 /api/chat intercepts crisis keywords before reaching LLM', async () => {
  const app = express();
  app.use(express.json());
  app.use('/api', apiRouter);

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;

  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'I want to die, please help me', language: 'en' })
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.isCrisis, true);
    assert.strictEqual(data.provider, 'safety_guardrail');
    assert.ok(data.text.includes('1800-599-0019'));
  } finally {
    server.close();
  }
});

await runAsyncTest('6.3 /api/reflection returns structured reflection and clinical dossier', async () => {
  const app = express();
  app.use(express.json());
  app.use('/api', apiRouter);

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;

  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/reflection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { sender: 'user', text: "My thoughts keep racing at night and I feel constant physical anxiety." },
          { sender: 'user', text: "I've been feeling disconnected from friends and withdrawing socially." }
        ],
        language: 'en'
      })
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.ok, true);
    assert.ok(data.reflection);
    assert.ok(data.clinicalDossier);
    assert.ok(data.reflection.exploredTopics.length >= 2);
  } finally {
    server.close();
  }
});

// --------------------------------------------------------------------
// TEST SUMMARY
// --------------------------------------------------------------------
console.log('\n======================================================');
console.log(` Test Results: ${passedTests} / ${totalTests} Passed (${Math.round((passedTests / totalTests) * 100)}%)`);
console.log('======================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
