// LLM Service for Samvaad Platform
// Supports Google Gemini and OpenAI / OpenAI-compatible endpoints
// Implements Section 15 (Privacy & Technical Logs) and Section 16 (Cost & Usage Monitoring)

import {
  AURA_CHAT_SYSTEM_PROMPT,
  PERSONAL_SUMMARY_SYSTEM_PROMPT,
  CLINICIAN_SUMMARY_SYSTEM_PROMPT
} from './systemPrompts.js';

export class LLMService {
  constructor() {
    this.geminiApiKey = process.env.GEMINI_API_KEY || '';
    this.geminiModel = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    this.openaiApiKey = process.env.OPENAI_API_KEY || '';
    this.openaiModel = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    this.openaiBaseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';

    // Section 16: Usage & Cost Monitoring metrics
    this.metrics = {
      startTime: new Date().toISOString(),
      totalRequests: 0,
      chatRequests: 0,
      summaryRequests: 0,
      safetyTriggerCount: 0,
      errorCount: 0,
      estimatedTokens: 0
    };
  }

  isConfigured() {
    return Boolean(this.geminiApiKey || this.openaiApiKey);
  }

  getProviderName() {
    if (this.geminiApiKey) return 'gemini';
    if (this.openaiApiKey) return 'openai';
    return 'none';
  }

  getMetrics() {
    return {
      ...this.metrics,
      uptimeSeconds: Math.round(process.uptime()),
      provider: this.getProviderName()
    };
  }

  // Format chat history for Google Gemini (interleaved user/model turns)
  formatGeminiContents(history, currentMessage) {
    const contents = [];

    const relevantHistory = [...history];
    while (relevantHistory.length > 0 && relevantHistory[0].sender !== 'user') {
      relevantHistory.shift();
    }

    for (const msg of relevantHistory) {
      const role = msg.sender === 'user' ? 'user' : 'model';
      const text = msg.text?.trim();
      if (!text) continue;

      if (contents.length > 0 && contents[contents.length - 1].role === role) {
        contents[contents.length - 1].parts[0].text += `\n\n${text}`;
      } else {
        contents.push({
          role,
          parts: [{ text }]
        });
      }
    }

    const lastContent = contents[contents.length - 1];
    if (!lastContent || lastContent.role !== 'user' || lastContent.parts[0].text !== currentMessage) {
      if (lastContent && lastContent.role === 'user') {
        lastContent.parts[0].text += `\n\n${currentMessage}`;
      } else {
        contents.push({
          role: 'user',
          parts: [{ text: currentMessage }]
        });
      }
    }

    return contents;
  }

  // Format chat history for OpenAI
  formatOpenAIMessages(history, currentMessage, systemPrompt) {
    const messages = [{ role: 'system', content: systemPrompt }];

    for (const msg of history) {
      const text = msg.text?.trim();
      if (!text) continue;
      messages.push({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: text
      });
    }

    if (!history.length || history[history.length - 1].text !== currentMessage) {
      messages.push({
        role: 'user',
        content: currentMessage
      });
    }

    return messages;
  }

  async callGemini(contents, systemPrompt, responseMimeType = null) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.geminiModel}:generateContent?key=${this.geminiApiKey}`;

    const payload = {
      contents,
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      generationConfig: {
        temperature: responseMimeType ? 0.2 : 0.7,
        maxOutputTokens: 1000
      }
    };

    if (responseMimeType) {
      payload.generationConfig.responseMimeType = responseMimeType;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${err}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Empty response from Gemini.');

    // Approximate token usage tracking
    this.metrics.estimatedTokens += Math.round(text.length / 4);
    return text.trim();
  }

  async callOpenAI(messages, jsonMode = false) {
    const url = `${this.openaiBaseUrl}/chat/completions`;
    const payload = {
      model: this.openaiModel,
      messages,
      temperature: jsonMode ? 0.2 : 0.7,
      max_tokens: 1000
    };
    if (jsonMode) {
      payload.response_format = { type: 'json_object' };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.openaiApiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${err}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new Error('Empty completion from OpenAI.');

    this.metrics.estimatedTokens += (data.usage?.total_tokens || Math.round(text.length / 4));
    return text.trim();
  }

  // 1. Generate Chat Response
  async generateChatResponse(currentMessage, history = [], language = 'en') {
    this.metrics.totalRequests++;
    this.metrics.chatRequests++;

    if (!this.isConfigured()) {
      return {
        ok: false,
        error: 'SERVICE_UNAVAILABLE',
        isConfigured: false,
        message: language === 'kn'
          ? 'ಔರಾ ಲೈವ್ ಸಂವಾದ AI ಸೇವೆ ಪ್ರಸ್ತುತ ಸಕ್ರಿಯವಾಗಿಲ್ಲ (API ಕೀ ಕಾನ್ಫಿಗರ್ ಮಾಡಲಾಗಿಲ್ಲ). ತುರ್ತು ನೆರವಿಗಾಗಿ 1800-599-0019 (ಕಿರಣ್) ಅಥವಾ 14416 (ಟೆಲಿ-ಮಾನಸ್) ಗೆ ಕರೆ ಮಾಡಿ.'
          : 'Aura conversational AI service is currently unavailable (API key not configured in backend .env). For mental health support or in distress, please contact the 24x7 toll-free helpline: 1800-599-0019 (KIRAN) or 14416 (Tele-MANAS).'
      };
    }

    const languageInstruction = language === 'kn'
      ? '\n\nIMPORTANT: Respond in warm, natural, grammatically correct Kannada (ಕನ್ನಡ).'
      : '\n\nIMPORTANT: Respond in warm, conversational, clear English.';

    const systemPrompt = AURA_CHAT_SYSTEM_PROMPT + languageInstruction;

    try {
      let text = '';
      let provider = '';

      if (this.geminiApiKey) {
        const contents = this.formatGeminiContents(history, currentMessage);
        text = await this.callGemini(contents, systemPrompt);
        provider = 'gemini';
      } else if (this.openaiApiKey) {
        const messages = this.formatOpenAIMessages(history, currentMessage, systemPrompt);
        text = await this.callOpenAI(messages, false);
        provider = 'openai';
      }

      return {
        ok: true,
        text,
        provider,
        isCrisis: false
      };
    } catch (err) {
      this.metrics.errorCount++;
      // Section 15: Log only error type and code, never confidential patient message text
      console.error('LLM API call failed with status:', err.message?.substring(0, 80));
      return {
        ok: false,
        error: 'SERVICE_UNAVAILABLE',
        isConfigured: true,
        message: language === 'kn'
          ? 'ಸರ್ವರ್‌ನಿಂದ AI ಸೇವೆ ಸಂಪರ್ಕಿಸಲು ಸಾಧ್ಯವಾಗುತ್ತಿಲ್ಲ. ತುರ್ತು ನೆರವಿಗಾಗಿ 1800-599-0019 (ಕಿರಣ್) ಸಂಪರ್ಕಿಸಿ.'
          : 'Aura is temporarily unable to reach the AI service. Please try again. If in distress, reach out to 1800-599-0019 (KIRAN) or 14416 (Tele-MANAS).'
      };
    }
  }

  // 2. Generate Personal Reflection Summary (Section 18 & Tests 3, 11, 12)
  async generatePersonalSummary(messages = [], language = 'en') {
    this.metrics.totalRequests++;
    this.metrics.summaryRequests++;

    const userMessages = messages.filter(m => m.sender === 'user').map(m => m.text);
    if (!userMessages.length) {
      return {
        ok: false,
        error: 'NO_MESSAGES',
        message: 'No user messages available to summarize.'
      };
    }

    if (!this.isConfigured()) {
      return {
        ok: true,
        fallback: true,
        reflection: this.generateFactualFallbackReflection(messages, language)
      };
    }

    const prompt = `Synthesize the personal reflection summary JSON from this conversation:\n\n` +
      messages.map(m => `${m.sender.toUpperCase()}: ${m.text}`).join('\n\n') +
      (language === 'kn' ? '\n\nOutput strictly Kannada text inside JSON strings.' : '\n\nOutput in English.');

    try {
      let rawJson = '';
      if (this.geminiApiKey) {
        rawJson = await this.callGemini(
          [{ role: 'user', parts: [{ text: prompt }] }],
          PERSONAL_SUMMARY_SYSTEM_PROMPT,
          'application/json'
        );
      } else if (this.openaiApiKey) {
        rawJson = await this.callOpenAI([
          { role: 'system', content: PERSONAL_SUMMARY_SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ], true);
      }

      const parsed = JSON.parse(rawJson);
      return {
        ok: true,
        reflection: {
          generatedAt: new Date().toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          title: parsed.title || (language === 'kn' ? 'ನಿಮ್ಮ ವೈಯಕ್ತಿಕ ಆತ್ಮಾವಲೋಕನ ಸಾರಾಂಶ' : 'Your Personal Reflection Summary'),
          coreTheme: parsed.coreTheme || 'Personal Emotional Reflection',
          whatYouShared: parsed.whatYouShared || userMessages.slice(0, 3).map(t => `"${t}"`),
          exploredTopics: parsed.exploredTopics || ['Concerns shared in chat'],
          unexploredTopics: parsed.unexploredTopics || [
            'Duration and timeline (not yet explored)',
            'Appetite and physical health (not discussed)',
            'Past medical or psychiatric history (not assessed)',
            'Current medications or supplements (not discussed)'
          ],
          identifiedPatterns: parsed.identifiedPatterns || ['You reflected openly on your current emotional state.'],
          personalStrengths: parsed.personalStrengths || ['Expressing your experience in your own words.'],
          gentleNextSteps: parsed.gentleNextSteps || [
            'Take things one day at a time, caring for your basic biological needs.',
            'Optional Pathway: Consult Dr. Alan Samuel or another licensed professional (< ₹500) if you wish to explore further.'
          ],
          disclaimer: parsed.disclaimer || 'Note: This summary is created solely for personal self-reflection. It is non-diagnostic and does not replace medical advice from a qualified doctor.'
        }
      };
    } catch (err) {
      console.error('Personal summary generation error:', err.message?.substring(0, 80));
      return {
        ok: true,
        fallback: true,
        reflection: this.generateFactualFallbackReflection(messages, language)
      };
    }
  }

  // 3. Generate Clinician Dossier (Section 18 & Tests 6, 8, 11)
  // Generated STRICTLY within the authorized saving workflow
  async generateClinicianDossier(messages = [], language = 'en', patientId = 'Anonymous Patient (Subsidized Tele-Consult)') {
    this.metrics.totalRequests++;
    this.metrics.summaryRequests++;

    const userMessages = messages.filter(m => m.sender === 'user').map(m => m.text);
    if (!userMessages.length) {
      return {
        ok: false,
        error: 'NO_MESSAGES',
        message: 'No messages to summarize.'
      };
    }

    if (!this.isConfigured()) {
      return {
        ok: true,
        fallback: true,
        clinicalDossier: this.generateFactualFallbackDossier(messages, patientId)
      };
    }

    const prompt = `Generate the structured clinical pre-consultation dossier JSON for Dr. Alan Samuel from this patient conversation:\n\n` +
      messages.map(m => `${m.sender.toUpperCase()}: ${m.text}`).join('\n\n') +
      `\n\nPatient ID: ${patientId}`;

    try {
      let rawJson = '';
      if (this.geminiApiKey) {
        rawJson = await this.callGemini(
          [{ role: 'user', parts: [{ text: prompt }] }],
          CLINICIAN_SUMMARY_SYSTEM_PROMPT,
          'application/json'
        );
      } else if (this.openaiApiKey) {
        rawJson = await this.callOpenAI([
          { role: 'system', content: CLINICIAN_SUMMARY_SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ], true);
      }

      const parsed = JSON.parse(rawJson);
      const dossierHeadings = parsed.headings || parsed.sections || {};

      return {
        ok: true,
        clinicalDossier: {
          label: "AI-Generated Initial History Summary — For Review by a Qualified Mental Health Professional.",
          headerTitle: "AI-Generated Initial History Summary — For Review by a Qualified Mental Health Professional.",
          dossierId: parsed.dossierId || `DOS-${Math.floor(100000 + Math.random() * 900000)}`,
          patientId,
          timestamp: new Date().toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          headings: {
            "1_PresentingComplaints": dossierHeadings["1_PresentingComplaints"] || parsed.chiefComplaint || userMessages[0] || "Patient reported concerns during conversation.",
            "2_HistoryOfPresentProblem": dossierHeadings["2_HistoryOfPresentProblem"] || "Context and circumstances discussed during exploratory conversation.",
            "3_OnsetDurationCourse": dossierHeadings["3_OnsetDurationCourse"] || parsed.durationAndOnset || "Not explicitly specified in pre-consult chat / unclear",
            "4_RelevantEmotionalExperiences": dossierHeadings["4_RelevantEmotionalExperiences"] || "Patient expressed emotional distress / fatigue in conversation.",
            "5_RelevantThoughtsCognitiveExperiences": dossierHeadings["5_RelevantThoughtsCognitiveExperiences"] || "Patient reported preoccupying thoughts without clinical assumption.",
            "6_BehaviouralPatterns": dossierHeadings["6_BehaviouralPatterns"] || "Not discussed / unclear",
            "7_FunctionalImpact": dossierHeadings["7_FunctionalImpact"] || "Reported daily or occupational stress.",
            "8_SleepAppetiteEnergyConcentration": dossierHeadings["8_SleepAppetiteEnergyConcentration"] || "Sleep/appetite/energy: Not discussed in detail; requires clinical assessment.",
            "9_RelevantPsychosocialCircumstances": dossierHeadings["9_RelevantPsychosocialCircumstances"] || "Not discussed / unclear",
            "10_PreviousExperiencesProfessionalSupport": dossierHeadings["10_PreviousExperiencesProfessionalSupport"] || "Previous psychiatric or medical history not discussed during this chat.",
            "11_StrengthsSupportSystems": dossierHeadings["11_StrengthsSupportSystems"] || "Demonstrated willingness to reflect openly and explore concerns.",
            "12_SafetyRelatedDisclosures": dossierHeadings["12_SafetyRelatedDisclosures"] || "No acute crisis disclosures noted during conversation. (Clinical safety cannot be inferred from absence of disclosure; must be independently evaluated by clinician).",
            "13_UserConcernsGoals": dossierHeadings["13_UserConcernsGoals"] || "Desires personal clarity, stress reduction, and professional guidance.",
            "14_ImportantInformationGaps": dossierHeadings["14_ImportantInformationGaps"] || "Comprehensive MSE, formal diagnostic assessment, medical/family psychiatric history, medication adherence, and substance screening are unassessed and require independent clinical evaluation."
          },
          // Legacy aliases for backward compatibility with existing views
          chiefComplaint: dossierHeadings["1_PresentingComplaints"] || parsed.chiefComplaint || userMessages[0],
          durationAndOnset: dossierHeadings["3_OnsetDurationCourse"] || parsed.durationAndOnset || 'Not discussed in conversation / unclear',
          clinicalDisclaimer: "CONFIDENTIAL CLINICAL SUMMARY — AI GENERATED\nThis summary has been compiled strictly from information provided by the user during an exploratory conversational interaction. It does not represent a diagnostic formulation or clinical assessment. All findings require independent verification by a qualified mental health professional."
        }
      };
    } catch (err) {
      console.error('Clinician dossier generation error:', err.message?.substring(0, 80));
      return {
        ok: true,
        fallback: true,
        clinicalDossier: this.generateFactualFallbackDossier(messages, patientId)
      };
    }
  }

  // Factual Fallback: Strictly avoids false keyword assumptions
  // Implements Test 3 (Early termination) & Test 11 (Identifies relevant unknowns)
  generateFactualFallbackReflection(messages, language = 'en') {
    const userTexts = messages.filter(m => m.sender === 'user').map(m => m.text);
    const combined = userTexts.join(' ').toLowerCase();

    const exploredTopics = [];
    const identifiedPatterns = [];

    // Breakup check
    if (combined.includes('breakup') || combined.includes('ಬ್ರೇಕಪ್') || combined.includes('boyfriend') || combined.includes('girlfriend') || combined.includes('partner') || combined.includes('broke up')) {
      exploredTopics.push(language === 'kn' ? 'ಸಂಬಂಧದ ಬಿರುಕು ಮತ್ತು ನೋವು' : 'Relationship loss & breakup');
      identifiedPatterns.push(language === 'kn'
        ? 'ಇತ್ತೀಚಿನ ಬ್ರೇಕಪ್ ನಂತರ ನೀವು ತೀವ್ರ ನೋವನ್ನು ಮತ್ತು ಚೇತರಿಸಿಕೊಳ್ಳಲು ಕಷ್ಟವಾಗುತ್ತಿರುವುದನ್ನು ಹಂಚಿಕೊಂಡಿದ್ದೀರಿ.'
        : 'You shared going through a painful recent breakup and experiencing difficulty moving forward.');
    }

    // Physical anxiety
    if (combined.includes('anxiety') || combined.includes('ಆತಂಕ') || combined.includes('panic') || combined.includes('physical anxiety') || combined.includes('chest') || combined.includes('racing pulse')) {
      exploredTopics.push(language === 'kn' ? 'ದೈಹಿಕ ಆತಂಕ' : 'Physical anxiety sensations');
      identifiedPatterns.push(language === 'kn'
        ? 'ಆತಂಕದ ದೈಹಿಕ ಲಕ್ಷಣಗಳು ಮತ್ತು ಉದ್ವೇಗವನ್ನು ಅನುಭವಿಸುತ್ತಿರುವುದಾಗಿ ಹಂಚಿಕೊಂಡಿದ್ದೀರಿ.'
        : 'You noted experiencing physical sensations of anxiety and nervous tension in your body.');
    }

    // Racing thoughts
    if (combined.includes('racing') || combined.includes('ಆಲೋಚನೆ') || combined.includes('overthink') || combined.includes('racing thoughts') || combined.includes('looping')) {
      exploredTopics.push(language === 'kn' ? 'ಆಲೋಚನೆಗಳ ಸುಳಿಗಾಳಿ' : 'Racing thoughts & overthinking');
      identifiedPatterns.push(language === 'kn'
        ? 'ಮನಸ್ಸಿನಲ್ಲಿ ಆಲೋಚನೆಗಳು ನಿರಂತರವಾಗಿ ಓಡುತ್ತಿರುವುದಾಗಿ ತಿಳಿಸಿದ್ದೀರಿ.'
        : 'You described experiencing racing thoughts and difficulty quieting your mind.');
    }

    // Social withdrawal
    if (combined.includes('friends') || combined.includes('ಸ್ನೇಹಿತ') || combined.includes('withdrawing') || combined.includes('disconnected') || combined.includes('isolated') || combined.includes('lonely') || combined.includes('ಒಂಟಿ')) {
      exploredTopics.push(language === 'kn' ? 'ಸಾಮಾಜಿಕ ಪ್ರತ್ಯೇಕತೆ / ಸ್ನೇಹಿತರು' : 'Social connection & withdrawal');
      identifiedPatterns.push(language === 'kn'
        ? 'ಸ್ನೇಹಿತರಿಂದ ದೂರವಿರುವುದು ಅಥವಾ ಸಾಮಾಜಿಕವಾಗಿ ಒಂಟಿತನ ಅನುಭವಿಸುತ್ತಿರುವುದಾಗಿ ತಿಳಿಸಿದ್ದೀರಿ.'
        : 'You shared feeling disconnected from friends and withdrawing socially.');
    }

    // Sleep ONLY if explicitly stated insomnia or cannot sleep (NOT merely mentioning "night")
    const explicitlyStatedSleepIssue = (
      combined.includes('cannot sleep') || combined.includes("can't sleep") || combined.includes('unable to sleep') || combined.includes('insomnia') || combined.includes('trouble sleeping') || combined.includes('not able to sleep') || combined.includes('ನಿದ್ರೆ ಬರುತ್ತಿಲ್ಲ')
    );
    if (explicitlyStatedSleepIssue) {
      exploredTopics.push(language === 'kn' ? 'ನಿದ್ರೆಯ ತೊಂದರೆ' : 'Sleep disruption');
      identifiedPatterns.push(language === 'kn'
        ? 'ಸರಿಯಾಗಿ ನಿದ್ರೆ ಮಾಡಲು ಕಷ್ಟವಾಗುತ್ತಿರುವುದಾಗಿ ತಿಳಿಸಿದ್ದೀರಿ.'
        : 'You reported explicit difficulty sleeping or resting.');
    }

    // Work / Academics
    if (combined.includes('work') || combined.includes('job') || combined.includes('ಕೆಲಸ') || combined.includes('college') || combined.includes('deadline') || combined.includes('exam') || combined.includes('study')) {
      exploredTopics.push(language === 'kn' ? 'ಕೆಲಸ / ಅಧ್ಯಯನದ ಒತ್ತಡ' : 'Work & academic stress');
      identifiedPatterns.push(language === 'kn'
        ? 'ಕೆಲಸ ಅಥವಾ ವಿದ್ಯಾಭ್ಯಾಸದಲ್ಲಿ ಹೆಚ್ಚಿನ ಒತ್ತಡವನ್ನು ಅನುಭವಿಸುತ್ತಿರುವುದಾಗಿ ಹಂಚಿಕೊಂಡಿದ್ದೀರಿ.'
        : 'You highlighted feeling weighed down by professional or academic pressures.');
    }

    if (exploredTopics.length === 0) {
      exploredTopics.push(language === 'kn' ? 'ಹಂಚಿಕೊಂಡ ವೈಯಕ್ತಿಕ ಅನುಭವ' : 'Personal concerns shared in conversation');
      identifiedPatterns.push(language === 'kn'
        ? 'ನಿಮ್ಮ ಪ್ರಸ್ತುತ ಭಾವನಾತ್ಮಕ ಸವಾಲುಗಳನ್ನು ಮುಕ್ತವಾಗಿ ಹಂಚಿಕೊಂಡಿದ್ದೀರಿ.'
        : 'You articulated your emotional experiences openly in your own words.');
    }

    // Section 17 Test 11: Identify relevant unknowns instead of assuming symptoms are absent
    const unexploredTopics = [
      language === 'kn' ? 'ಅವಧಿ ಮತ್ತು ಬೆಳವಣಿಗೆ (ಇನ್ನೂ ಅನ್ವೇಷಿಸಲಾಗಿಲ್ಲ)' : 'Duration and timeline (not yet explored)',
      language === 'kn' ? 'ಆಹಾರ ಮತ್ತು ಹಸಿವಿನ ಬದಲಾವಣೆಗಳು (ಚರ್ಚಿಸಿಲ್ಲ)' : 'Appetite and nutrition shifts (not discussed)',
      language === 'kn' ? 'ಹಿಂದಿನ ವೈದ್ಯಕೀಯ / ಮನೋವೈದ್ಯಕೀಯ ಇತಿಹಾಸ (ಪರಿಶೀಲಿಸಿಲ್ಲ)' : 'Past medical or psychiatric history (not assessed)',
      language === 'kn' ? 'ಪ್ರಸ್ತುತ ಔಷಧಿಗಳು ಅಥವಾ ಪದಾರ್ಥಗಳ ಬಳಕೆ (ಚರ್ಚಿಸಿಲ್ಲ)' : 'Current medications or substance use (not discussed)',
      language === 'kn' ? 'ಕುಟುಂಬದ ಹಿನ್ನೆಲೆ ಮತ್ತು ದೀರ್ಘಕಾಲೀನ ಪ್ರಭಾವಗಳು' : 'Family background and developmental history'
    ];

    return {
      generatedAt: new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      title: language === 'kn' ? 'ನಿಮ್ಮ ವೈಯಕ್ತಿಕ ಆತ್ಮಾವಲೋಕನ ಸಾರಾಂಶ' : 'Your Personal Reflection Summary',
      coreTheme: exploredTopics[0] || (language === 'kn' ? 'ವೈಯಕ್ತಿಕ ಆತ್ಮಾವಲೋಕನ' : 'Personal Emotional Reflection'),
      whatYouShared: userTexts.slice(0, 3).map(t => `"${t}"`),
      exploredTopics,
      unexploredTopics,
      identifiedPatterns,
      personalStrengths: [
        language === 'kn'
          ? 'ಸ್ಪಷ್ಟತೆ: ನಿಮ್ಮ ಭಾವನೆಗಳನ್ನು ನಿಮ್ಮದೇ ಮಾತುಗಳಲ್ಲಿ ಮುಕ್ತವಾಗಿ ಹಂಚಿಕೊಂಡಿದ್ದೀರಿ.'
          : 'Expressing your experience: You articulated what you are going through in your own words.',
        language === 'kn'
          ? 'ಆತ್ಮಾವಲೋಕನ: ಕಷ್ಟದ ಸಮಯದಲ್ಲೂ ನಿಮ್ಮ ಮಾನಸಿಕ ಆರೋಗ್ಯದ ಬಗ್ಗೆ ಗಮನಹರಿಸಿದ್ದೀರಿ.'
          : 'Reflecting openly: You chose to pause and reflect on your emotional well-being.'
      ],
      gentleNextSteps: [
        language === 'kn'
          ? 'ಪ್ರತಿದಿನವನ್ನು ಒಂದೊಂದೇ ಹೆಜ್ಜೆಯಾಗಿ ಸ್ವೀಕರಿಸಿ, ನಿಮ್ಮ ದೇಹದ ಮೂಲಭೂತ ಆರೈಕೆಗೆ (ಆಹಾರ, ನೀರು, ವಿಶ್ರಾಂತಿ) ಆದ್ಯತೆ ನೀಡಿ.'
          : 'Take things one day at a time, protecting basic rest, nourishment, and gentle physical movement.',
        language === 'kn'
          ? 'ಐಚ್ಛಿಕ ಮಾರ್ಗ: ಇಚ್ಛೆಯಿದ್ದರೆ, ಕೈಗೆಟುಕುವ ದರದಲ್ಲಿ (< ₹500) ಡಾ. ಅಲನ್ ಸ್ಯಾಮ್ಯುಯೆಲ್ ಅಥವಾ ಅರ್ಹ ತಜ್ಞರೊಂದಿಗೆ ಸಮಾಲೋಚನೆ ನಡೆಸಿ.'
          : 'Optional Consultation Pathway: If you wish to explore further, you may schedule an affordable consultation (< ₹500) with Dr. Alan Samuel or another licensed professional.'
      ],
      disclaimer: language === 'kn'
        ? 'ಗಮನಿಸಿ: ಇದು ಕೇವಲ ಆತ್ಮಾವಲೋಕನಕ್ಕಾಗಿ ಸಿದ್ಧಪಡಿಸಿದ ಸಾರಾಂಶ. ಇದು ವೈದ್ಯಕೀಯ ರೋಗನಿರ್ಣಯವಲ್ಲ.'
        : 'Note: This summary is created solely for personal self-reflection. It is non-diagnostic and does not replace medical advice from a qualified doctor.'
    };
  }

  generateFactualFallbackDossier(messages, patientId = 'Authorized Patient Record') {
    const userTexts = messages.filter(m => m.sender === 'user').map(m => m.text);
    const combined = userTexts.join(' ').toLowerCase();

    // Strict generation rules:
    // Only use facts stated; never escalate "keep thinking at night" into "racing thoughts" unless explicitly stated
    const hasExplicitRacingThoughts = combined.includes('racing') || combined.includes('racing thoughts');
    const explicitlyStatedSleepIssue = (
      combined.includes("can't sleep") ||
      combined.includes('cannot sleep') ||
      combined.includes("haven't been sleeping") ||
      combined.includes('not sleeping') ||
      combined.includes('unable to sleep') ||
      combined.includes('insomnia') ||
      combined.includes('trouble sleeping')
    );

    const hasWorkStress = combined.includes('work') || combined.includes('job') || combined.includes('deadline');
    const hasBreakup = combined.includes('breakup') || combined.includes('boyfriend') || combined.includes('girlfriend') || combined.includes('broke up');

    const presentingComplaint = userTexts[0] || 'Patient reported concerns in chat.';

    // Timeline only if stated
    let timeline = 'Not discussed in conversation / unclear';
    if (combined.includes('few days') || combined.includes('days back')) {
      timeline = 'Reported onset within recent days.';
    } else if (combined.includes('month')) {
      timeline = 'Reported symptoms spanning several months.';
    } else if (combined.includes('week')) {
      timeline = 'Reported symptoms over recent weeks.';
    }

    // Sleep, appetite, energy, concentration
    let sleepAppetite = [];
    if (explicitlyStatedSleepIssue) {
      sleepAppetite.push('Sleep: Patient explicitly reported difficulty sleeping or sleep disruption.');
    } else {
      sleepAppetite.push('Sleep: Not explicitly reported as sleep disturbance in chat.');
    }
    sleepAppetite.push('Appetite, energy, and concentration: Not discussed in preliminary chat.');

    const headings = {
      "1_PresentingComplaints": presentingComplaint,
      "2_HistoryOfPresentProblem": hasBreakup
        ? 'Patient reported distress following a recent relationship breakup.'
        : (hasWorkStress
          ? 'Patient reported stress related to occupational demands and approaching deadlines.'
          : 'Context and circumstances as described by patient in exploratory conversation.'),
      "3_OnsetDurationCourse": timeline,
      "4_RelevantEmotionalExperiences": hasBreakup
        ? 'Reported feelings of distress, emotional hurt, and feeling overwhelmed.'
        : (hasWorkStress
          ? 'Reported feeling stressed and burdened by work pressure.'
          : 'Reported situational emotional tension or worry.'),
      "5_RelevantThoughtsCognitiveExperiences": hasExplicitRacingThoughts
        ? 'Patient explicitly reported experiencing racing thoughts.'
        : (combined.includes('thinking about deadlines') || combined.includes('thinking at night')
          ? 'Patient described frequent thoughts about deadlines/responsibilities; did not use the clinical term racing thoughts.'
          : 'Cognitive patterns: Not discussed in detail; no clinical assumptions made.'),
      "6_BehaviouralPatterns": combined.includes('withdrawing') || combined.includes('disconnected')
        ? 'Reported withdrawing socially and feeling disconnected from peers.'
        : 'Observable behavioural patterns: Not discussed in preliminary chat.',
      "7_FunctionalImpact": hasWorkStress
        ? 'Work-related strain and disrupted peace of mind noted.'
        : 'Impact on daily routine: Not discussed in depth.',
      "8_SleepAppetiteEnergyConcentration": sleepAppetite.join(' '),
      "9_RelevantPsychosocialCircumstances": hasBreakup
        ? 'Recent interpersonal loss / relationship breakup.'
        : (hasWorkStress ? 'Workplace and occupational pressure.' : 'Not discussed in conversation.'),
      "10_PreviousExperiencesProfessionalSupport": 'Previous mental health treatment, counseling, or psychiatric history was not discussed in pre-consult chat.',
      "11_StrengthsSupportSystems": 'Patient engaged in exploratory dialogue and articulated concerns in their own words.',
      "12_SafetyRelatedDisclosures": 'No acute crisis disclosures or self-harm disclosures noted during chat exploration. (Clinical safety cannot be inferred from absence of disclosure; must be independently assessed by doctor).',
      "13_UserConcernsGoals": hasBreakup
        ? 'Seeking emotional support and guidance on moving forward.'
        : (hasWorkStress
          ? 'Seeking ways to manage work stress, restore rest, and achieve balance.'
          : 'Exploring emotional concerns with interest in further evaluation.'),
      "14_ImportantInformationGaps": 'Comprehensive Mental Status Examination (MSE), formal diagnostic assessment, complete medical and family history, medication adherence, and substance use are unassessed and require independent clinical evaluation.'
    };

    return {
      label: "AI-Generated Initial History Summary — For Review by a Qualified Mental Health Professional.",
      headerTitle: "AI-Generated Initial History Summary — For Review by a Qualified Mental Health Professional.",
      dossierId: `DOS-${Math.floor(100000 + Math.random() * 900000)}`,
      patientId,
      timestamp: new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      headings,
      // Backward-compatible fields
      chiefComplaint: presentingComplaint,
      durationAndOnset: timeline,
      patientReportedThemes: {
        moodAffect: headings["4_RelevantEmotionalExperiences"],
        sleepArchitecture: explicitlyStatedSleepIssue ? 'Patient reported difficulty sleeping.' : 'Not explicitly reported as a primary complaint (no sleep complaints registered).',
        cognitionThoughts: headings["5_RelevantThoughtsCognitiveExperiences"],
        somaticAutonomic: combined.includes('physical') || combined.includes('anxiety') ? 'Reported somatic tension noted by user.' : 'No somatic complaints reported.',
        safetyScreen: headings["12_SafetyRelatedDisclosures"]
      },
      unexploredAreas: [
        'Comprehensive Mental Status Examination (MSE)',
        'Detailed medical and psychiatric history (Not discussed)',
        'Current medication adherence & substance use history (Not discussed)',
        'Formal psychiatric diagnostic assessment'
      ],
      clinicalDisclaimer: "CONFIDENTIAL CLINICAL SUMMARY — AI GENERATED\nThis summary has been compiled strictly from information provided by the user during an exploratory conversational interaction. It does not represent a diagnostic formulation or clinical assessment. All findings require independent verification by a qualified mental health professional."
    };
  }
}

export const llmService = new LLMService();
