// Comprehensive Workflow & Priority Audit Verification Test
// Tests Priorities 1, 2, 3, 4 and Dr. Alan Samuel's specifications

import assert from 'node:assert';
import { AICompanionEngine, EXACT_MANDATORY_DISCLAIMER } from '../src/services/aiCompanionService.js';
import { llmService } from '../server/llmService.js';
import { checkSafetyScreen } from '../server/safetyGuardrails.js';

let passed = 0;
let total = 0;

function test(name, fn) {
  total++;
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
  }
}

async function testAsync(name, fn) {
  total++;
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
  }
}

console.log('======================================================');
console.log(' Starting Workflow & High-Priority Fix Verification');
console.log('======================================================\n');

// --------------------------------------------------------------------
// PRIORITY 3: AI Behavior & Conversation Fixes
// --------------------------------------------------------------------
console.log('[Priority 3] Conversational Companion Fixes:');

test('3.1 Turn 1: "My thoughts keep racing at night and I feel constant physical anxiety" does NOT assume insomnia', () => {
  const engine = new AICompanionEngine();
  const resp = engine.generateFallbackChatResponse(
    "My thoughts keep racing at night and I feel constant physical anxiety.",
    []
  );
  assert.ok(!resp.text.toLowerCase().includes('insomnia'), 'Must not diagnose insomnia');
  assert.ok(!resp.text.toLowerCase().includes('sleep disruption'), 'Must not assume sleep disruption');
  assert.ok(resp.text.toLowerCase().includes('physical tension') || resp.text.toLowerCase().includes('physical anxiety'), 'Must acknowledge physical anxiety');
  assert.ok(resp.text.toLowerCase().includes('thoughts'), 'Must acknowledge racing thoughts');
});

test('3.2 Turn 2: "I\'ve been feeling disconnected from friends and withdrawing socially" does NOT assume timeline', () => {
  const engine = new AICompanionEngine();
  const history = [
    { sender: 'user', text: "My thoughts keep racing at night and I feel constant physical anxiety." },
    { sender: 'bot', text: "That physical tension..." }
  ];
  const resp = engine.generateFallbackChatResponse(
    "I've been feeling disconnected from friends and withdrawing socially.",
    history
  );
  assert.ok(!resp.text.toLowerCase().includes('appreciate you opening up about the timeline'), 'Must not claim timeline discussed');
  assert.ok(resp.text.toLowerCase().includes('friend') || resp.text.toLowerCase().includes('disconnect'), 'Must explore friendship connection');
});

test('3.3 Turn 3: "My friends are not talking with me properly" explores friendship instead of generic deflection', () => {
  const engine = new AICompanionEngine();
  const history = [
    { sender: 'user', text: "My thoughts keep racing at night and I feel constant physical anxiety." },
    { sender: 'bot', text: "That physical tension..." },
    { sender: 'user', text: "I've been feeling disconnected from friends and withdrawing socially." },
    { sender: 'bot', text: "Feeling disconnected..." }
  ];
  const resp = engine.generateFallbackChatResponse(
    "My friends are not talking with me properly.",
    history
  );
  assert.ok(resp.text.toLowerCase().includes('friend') || resp.text.toLowerCase().includes('talking with you'), 'Must explore friendship communication');
  assert.ok(!resp.text.includes("holding space for what you've shared"), 'Must not return canned holding space');
});

test('3.4 Turn 4: Breakup + health suffering provides validation, self-care, references prior anxiety, asks 1 question', () => {
  const engine = new AICompanionEngine();
  const history = [
    { sender: 'user', text: "My thoughts keep racing at night and I feel constant physical anxiety." },
    { sender: 'bot', text: "That physical tension..." }
  ];
  const resp = engine.generateFallbackChatResponse(
    "Few days back me and my boyfriend broke up. I'm suffering a lot from this. How to move on? My health is suffering from this.",
    history
  );
  assert.ok(resp.text.toLowerCase().includes('breakup'), 'Must acknowledge breakup');
  assert.ok(resp.text.toLowerCase().includes('physically anxious'), 'Must weave prior physical anxiety context');
  assert.ok(resp.text.toLowerCase().includes('one day at a time') || resp.text.toLowerCase().includes('eating'), 'Must offer gentle realistic pacing');
  assert.ok(!resp.text.includes("Generate Reflection Summary"), 'Must not push summary generation prematurely');
  // Check that follow up questions are limited
  const questionCount = (resp.text.match(/\?/g) || []).length;
  assert.ok(questionCount <= 1, `Questions asked: ${questionCount}; should be at most 1`);
});

test('3.5 Turn 5: Repeated breakup question does NOT return canned template', () => {
  const engine = new AICompanionEngine();
  const history = [
    { sender: 'user', text: "Few days back me and my boyfriend broke up. I'm suffering a lot from this. How to move on? My health is suffering from this." },
    { sender: 'bot', text: "I'm sorry you're going through this..." }
  ];
  const resp = engine.generateFallbackChatResponse(
    "Few days back me and my boyfriend broke up. How to move on?",
    history
  );
  assert.ok(!resp.text.includes("I hear you clearly, and I am holding space"), 'Must not return repetitive canned boilerplate');
  assert.ok(resp.text.toLowerCase().includes('breakup'), 'Must respond directly to breakup question');
});

// --------------------------------------------------------------------
// PRIORITY 1: Personal Reflection Workflow & Headings
// --------------------------------------------------------------------
console.log('\n[Priority 1] Personal Reflection Workflow & Headings:');

test('1.1 Personal reflection includes specified headings', () => {
  const engine = new AICompanionEngine();
  const messages = [
    { sender: 'user', text: "Few days back me and my boyfriend broke up. I feel physical anxiety and racing thoughts." }
  ];
  const ref = engine.generateFallbackReflection(messages, 'en');

  assert.ok(Array.isArray(ref.exploredTopics), 'Has exploredTopics (What Was Discussed)');
  assert.ok(Array.isArray(ref.identifiedPatterns), 'Has identifiedPatterns (Feelings & Observed Patterns)');
  assert.ok(Array.isArray(ref.unexploredTopics), 'Has unexploredTopics (Not Discussed / Unclear)');
  assert.ok(Array.isArray(ref.personalStrengths), 'Has personalStrengths (Personal Strengths)');
  assert.ok(Array.isArray(ref.gentleNextSteps), 'Has gentleNextSteps (Things to Reflect On)');
});

test('1.2 Personal reflection includes EXACT mandatory disclaimer', () => {
  const engine = new AICompanionEngine();
  const messages = [
    { sender: 'user', text: "I feel stressed at work." }
  ];
  const ref = engine.generateFallbackReflection(messages, 'en');
  assert.strictEqual(ref.disclaimer, EXACT_MANDATORY_DISCLAIMER);
});

test('1.3 Unexplored topics are explicitly flagged as Not Discussed / Unclear', () => {
  const engine = new AICompanionEngine();
  const messages = [
    { sender: 'user', text: "Few days back me and my boyfriend broke up." }
  ];
  const ref = engine.generateFallbackReflection(messages, 'en');
  const allMarked = ref.unexploredTopics.every(t => t.includes('Not discussed in conversation'));
  assert.strictEqual(allMarked, true, 'Every unassessed domain must be marked as not discussed in conversation');
});

// --------------------------------------------------------------------
// PRIORITY 2: Saving & Clinician Summary Workflow
// --------------------------------------------------------------------
console.log('\n[Priority 2] Saving & Clinician Summary Workflow:');

test('2.1 Clinician summary dossier generated only within saving workflow', () => {
  const engine = new AICompanionEngine();
  const messages = [
    { sender: 'user', text: "Few days back me and my boyfriend broke up." }
  ];
  const dossier = engine.generateClinicianFacingSummary(messages, 'en', 'Test Patient');
  assert.ok(dossier.dossierId.startsWith('DOS-'), 'Must have dossier ID');
  assert.ok(dossier.chiefComplaint.includes('boyfriend broke up'), 'Chief complaint reflects verbatim user concern');
  assert.strictEqual(dossier.patientReportedThemes.sleepArchitecture.includes('Not explicitly reported'), true);
});

// --------------------------------------------------------------------
// PRIORITY 4: Consultation & Privacy Protocols
// --------------------------------------------------------------------
console.log('\n[Priority 4] Consultation & Privacy Protocols:');

test('4.1 Crisis safety protocols catch immediate danger and domestic abuse', () => {
  const abuse = checkSafetyScreen('My partner beats me and is physically abusive', 'en');
  assert.strictEqual(abuse.isCrisis, true);
  assert.strictEqual(abuse.crisisType, 'abuse_exploitation');
  assert.ok(abuse.text.includes('181') || abuse.text.includes('112'));

  const danger = checkSafetyScreen('Someone is attacking me I am in immediate danger', 'en');
  assert.strictEqual(danger.isCrisis, true);
  assert.strictEqual(danger.crisisType, 'immediate_danger');
  assert.ok(danger.text.includes('112'));
});

// --------------------------------------------------------------------
// Summary
// --------------------------------------------------------------------
console.log('\n======================================================');
console.log(` Audit Results: ${passed} / ${total} Passed (${Math.round((passed / total) * 100)}%)`);
console.log('======================================================\n');

if (passed !== total) {
  process.exit(1);
}
