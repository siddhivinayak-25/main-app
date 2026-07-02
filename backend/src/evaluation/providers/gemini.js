/**
 * GeminiProvider — Gemini 2.5 Flash evaluation provider
 *
 * Implements EvaluatorProvider using Google's Gemini 2.5 Flash model.
 * This is currently the only provider. The engine is architected to support
 * parallel and cross-model evaluation by adding more providers here.
 *
 * Each dimension has its own prompt, designed according to the architecture doc:
 * "evaluate how the candidate thinks and builds with AI agents"
 */

import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { EvaluatorProvider } from './base.js';
import { applyBounds, RUBRIC } from '../rubric.js';

function filterEvents(telemetry, ...types) {
  return (telemetry || []).filter(e => types.includes(e.eventType || e.type));
}

async function callLLM(llm, system, user) {
  const res = await llm.invoke([new SystemMessage(system), new HumanMessage(user)]);
  const text = typeof res.content === 'string' ? res.content : JSON.stringify(res.content);
  // Extract JSON block
  const match = text.match(/\{[\s\S]*?"score"\s*:\s*(\d+(?:\.\d+)?)[\s\S]*?\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch { /* fall through */ }
  }
  const num = text.match(/\b(\d{1,2})\b/);
  return { score: num ? Number(num[1]) : 12, feedback: text.slice(0, 400), confidence: 0.5 };
}

export class GeminiProvider extends EvaluatorProvider {
  get name()  { return 'gemini'; }
  get label() { return 'Gemini 2.5 Flash'; }
  get capabilities() {
    return ['promptQuality', 'errorRecovery', 'codeQuality'];
  }
  get isAvailable() { return !!process.env.GEMINI_API_KEY; }

  _llm() {
    if (!this.isAvailable) throw new Error('GEMINI_API_KEY not set');
    return new ChatGoogleGenerativeAI({
      model: 'gemini-2.5-flash',
      apiKey: process.env.GEMINI_API_KEY,
      temperature: 0.1,
      maxOutputTokens: 512,
    });
  }

  async evaluateDimension(dimensionId, context, rubric) {
    const dim = rubric.dimensions[dimensionId];
    if (!dim) throw new Error(`Unknown dimension: ${dimensionId}`);

    switch (dimensionId) {
      case 'promptQuality':   return this._promptQuality(context, dim);
      case 'errorRecovery':   return this._errorRecovery(context, dim);
      case 'codeQuality':     return this._codeQuality(context, dim);
      default: throw new Error(`${this.name} cannot score dimension: ${dimensionId}`);
    }
  }

  async _promptQuality({ telemetry, testConfig }, dim) {
    const prompts = filterEvents(telemetry, 'PROMPT_SENT', 'ai_prompt');
    if (!prompts.length) return { score: dim.floor, feedback: 'No AI prompts recorded.', confidence: 1.0 };

    const timeline = prompts.slice(0, 12).map((e, i) => {
      const prev = telemetry.filter(t => t.timestamp < e.timestamp).slice(-1)[0];
      const ctx = prev?.eventType === 'CODE_REJECTED' ? ' (after rejection)'
                : prev?.eventType === 'ERROR_ENCOUNTERED' ? ' (after error)' : '';
      return `[Prompt ${i + 1}${ctx}]\n"${(e.payload?.prompt || e.payload?.content || '').slice(0, 500)}"`;
    }).join('\n\n');

    const result = await callLLM(this._llm(),
      `You are evaluating a candidate's ability to direct AI models during an agentic coding assessment.
Score out of ${dim.maxRaw} points:
- Specificity & clarity (0-${Math.round(dim.maxRaw * 0.30)} pts): were prompts vague or precise?
- Iteration quality (0-${Math.round(dim.maxRaw * 0.25)} pts): did prompts improve meaningfully after failures?
- Context inclusion (0-${Math.round(dim.maxRaw * 0.25)} pts): did they include errors, expected behavior, constraints?
- Decomposition (0-${Math.round(dim.maxRaw * 0.20)} pts): did they break complex tasks into clear sub-goals?

Return ONLY valid JSON (no markdown):
{"score":<0-${dim.maxRaw}>,"feedback":"<2 sentence assessment>","highlight":"<standout positive or null>","concern":"<main weakness or null>","confidence":<0.0-1.0>}`,
      `Task: ${testConfig?.instructions || 'N/A'}\n\nPrompt timeline:\n${timeline}`
    );

    return { ...result, score: applyBounds('promptQuality', result.score) };
  }

  async _errorRecovery({ telemetry }, dim) {
    const errors    = filterEvents(telemetry, 'ERROR_ENCOUNTERED', 'error');
    const recovered = filterEvents(telemetry, 'ERROR_RECOVERED', 'correction');
    const rejected  = filterEvents(telemetry, 'CODE_REJECTED');

    if (!errors.length && !rejected.length) {
      return { score: dim.floor, feedback: 'No errors encountered — clean session.', confidence: 1.0 };
    }

    const summary = errors.slice(0, 6).map((e, i) => {
      const recovery = telemetry.filter(t => t.timestamp > e.timestamp &&
        ['ERROR_RECOVERED','PROMPT_SENT'].includes(t.eventType)).slice(0,1)[0];
      const delta = recovery ? `${Math.round((recovery.timestamp - e.timestamp)/1000)}s to respond` : 'no recovery observed';
      return `Error ${i+1}: ${(e.payload?.message || 'runtime error').slice(0,200)}\n→ ${delta}`;
    }).join('\n\n');

    const result = await callLLM(this._llm(),
      `You are evaluating a candidate's ability to recover from AI errors and runtime failures.
Score out of ${dim.maxRaw} points:
- Recognized when AI output was wrong (0-${Math.round(dim.maxRaw * 0.30)} pts)
- Corrected course effectively without spiraling (0-${Math.round(dim.maxRaw * 0.35)} pts)
- Maintained momentum despite errors (0-${Math.round(dim.maxRaw * 0.35)} pts)

Return ONLY valid JSON (no markdown):
{"score":<0-${dim.maxRaw}>,"feedback":"<2 sentence assessment>","highlight":"<standout recovery or null>","concern":"<main weakness or null>","confidence":<0.0-1.0>}`,
      `Errors: ${errors.length} | Rejections: ${rejected.length} | Recoveries: ${recovered.length}\n\n${summary}`
    );

    return { ...result, score: applyBounds('errorRecovery', result.score) };
  }

  async _codeQuality({ telemetry, files }, dim) {
    const submission = filterEvents(telemetry, 'SESSION_SUBMITTED')[0];
    const finalCode = submission?.payload?.finalCode
      || Object.values(files || {}).map(f => f.content).join('\n\n')
      || '';
    const accepted = filterEvents(telemetry, 'CODE_ACCEPTED').length;
    const rejected = filterEvents(telemetry, 'CODE_REJECTED').length;
    const modified = filterEvents(telemetry, 'CODE_MODIFIED').length;

    if (!finalCode.trim()) return { score: dim.floor, feedback: 'No final code found.', confidence: 0.9 };

    const result = await callLLM(this._llm(),
      `You are evaluating code from an AI-augmented engineering assessment.
The candidate used AI to help — judge the RESULT and the HUMAN JUDGMENT shown.
Score out of ${dim.maxRaw} points:
- Readability & naming (0-${Math.round(dim.maxRaw * 0.25)} pts)
- Structure & modularity (0-${Math.round(dim.maxRaw * 0.25)} pts)
- Error handling & edge cases (0-${Math.round(dim.maxRaw * 0.25)} pts)
- Thoughtful AI usage — Accept/Reject/Modify judgment (0-${Math.round(dim.maxRaw * 0.25)} pts)

AI interaction: ${accepted} accepted, ${rejected} rejected, ${modified} modified.

Return ONLY valid JSON (no markdown):
{"score":<0-${dim.maxRaw}>,"feedback":"<2 sentence assessment>","highlight":"<strongest aspect or null>","concern":"<main weakness or null>","confidence":<0.0-1.0>}`,
      `Code:\n\`\`\`\n${finalCode.slice(0, 3000)}\n\`\`\``
    );

    return { ...result, score: applyBounds('codeQuality', result.score) };
  }

  async synthesize(dimensionScores, context, rubric) {
    const breakdown = Object.entries(dimensionScores)
      .map(([k, v]) => `  ${rubric.dimensions[k]?.label || k}: ${v.score}/${rubric.dimensions[k]?.maxRaw} — ${v.feedback}`)
      .join('\n');

    try {
      const res = await this._llm().invoke([
        new SystemMessage(
          `You are HireOS, the world's first Agentic Hiring Intelligence platform. ` +
          `Write a sharp 2-3 sentence recruiter-facing assessment. Be specific about behaviours, not just numbers. ` +
          `Reference the candidate's actual actions (prompts, error recoveries, code decisions). ` +
          `Do not start with "The candidate". End with one concrete hiring recommendation.`
        ),
        new HumanMessage(`Score breakdown:\n${breakdown}`),
      ]);
      return typeof res.content === 'string' ? res.content : JSON.stringify(res.content);
    } catch {
      const total = Object.values(dimensionScores).reduce((s, v) => s + (v.score || 0), 0);
      return `Composite score ${total}/100 across 5 evaluation dimensions.`;
    }
  }
}
