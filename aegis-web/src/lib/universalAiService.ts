/**
 * Multi-provider AI advisor: Gemini, xAI Grok, Meta Llama (OpenRouter/Groq),
 * Azure OpenAI, and local offline rules fallback.
 * Solastrata™ BIPV-T Active Glazing Systems
 */

export type AiProviderId =
  | 'gemini'
  | 'grok'
  | 'llama'
  | 'azure'
  | 'offline';

export interface AiProviderInfo {
  id: AiProviderId;
  label: string;
  envKey: string;
  available: boolean;
}

export interface SimulationContext {
  vlt: number;
  hazePct: number;
  fretPct: number;
  uFactor: number;
  shgc: number;
  electricalEtaPct: number;
  thermalEtaPct: number;
  netPowerWm2: number;
  year1ElectricKwh: number;
  year1ThermalKwh: number;
  nfrc100Pass: boolean;
  nfrc200Pass: boolean;
  dp105Ok: boolean;
  frameMaterialName: string;
  frameCostPerFt: number;
  frameCteMatchPct: number;
  simplePaybackYears: number;
  npv: number;
  lcoe: number;
  stackSummary: string;
  cavityGas: string;
  pvMaterial: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

function env(key: string): string {
  try {
    const meta = import.meta as unknown as { env?: Record<string, string | undefined> };
    return (meta.env?.[key] ?? '').trim();
  } catch {
    return '';
  }
}

export function listProviders(): AiProviderInfo[] {
  return [
    {
      id: 'gemini',
      label: '♊ Gemini (Free)',
      envKey: 'VITE_GEMINI_API_KEY',
      available: !!env('VITE_GEMINI_API_KEY'),
    },
    {
      id: 'grok',
      label: '𝕏 Grok',
      envKey: 'VITE_XAI_API_KEY',
      available: !!env('VITE_XAI_API_KEY'),
    },
    {
      id: 'llama',
      label: '🦙 Meta Llama',
      envKey: 'VITE_META_LLAMA_API_KEY',
      available: !!env('VITE_META_LLAMA_API_KEY'),
    },
    {
      id: 'azure',
      label: '🔷 Azure OpenAI',
      envKey: 'VITE_AZURE_OPENAI_KEY',
      available: !!env('VITE_AZURE_OPENAI_KEY'),
    },
    {
      id: 'offline',
      label: '⚙️ Offline Rules',
      envKey: '',
      available: true,
    },
  ];
}

export function buildSystemPrompt(ctx: SimulationContext): string {
  return `You are the Solastrata™ AI Architectural & Commercial Advisor — an expert in BIPV-T fenestration, NFRC/ASTM compliance, manufacturer partnerships, and grant writing for Solastrata™ BIPV-T Active Glazing Systems.

ACTIVE SIMULATION STATE (inject into every answer; do not invent conflicting numbers):
- Optical: VLT=${ctx.vlt}, Haze=${ctx.hazePct}%, FRET=${ctx.fretPct}%
- Thermal: U-factor=${ctx.uFactor} W/m²·K (NFRC 100 ${ctx.nfrc100Pass ? 'PASS' : 'FAIL'}), SHGC=${ctx.shgc} (NFRC 200 ${ctx.nfrc200Pass ? 'PASS' : 'FAIL'})
- Electrical: η_el=${ctx.electricalEtaPct}%, η_th=${ctx.thermalEtaPct}%, net power=${ctx.netPowerWm2} W/m², PV=${ctx.pvMaterial}, cavity=${ctx.cavityGas}
- Annual yield: ${ctx.year1ElectricKwh} kWh electric, ${ctx.year1ThermalKwh} kWh thermal-eq
- Structural: DP105 ${ctx.dp105Ok ? 'OK' : 'REVIEW'}
- Frame: ${ctx.frameMaterialName} @ $${ctx.frameCostPerFt}/lin-ft, CTE match ${ctx.frameCteMatchPct}%
- Finance (NEB): simple payback ${ctx.simplePaybackYears} yr, NPV $${ctx.npv}, LCOE $${ctx.lcoe}/kWh
- Glass stack: ${ctx.stackSummary}

Respond in clear professional English suitable for architects, code officials, and manufacturers. Use markdown headings and bullets when helpful. Always refer to the product as Solastrata™.`;
}

export function offlineAdvisorReply(userMessage: string, ctx: SimulationContext): string {
  const q = userMessage.toLowerCase();

  if (q.includes('astm') || q.includes('e1300') || q.includes('nfrc') || q.includes('audit') || q.includes('compliance')) {
    const n100 = ctx.nfrc100Pass ? '**PASS** (<= 0.85)' : '**FAIL** - raise thermal break / argon';
    const n200 = ctx.nfrc200Pass ? '**PASS** (0.20-0.40)' : '**REVIEW**';
    const dp = ctx.dp105Ok ? '**OK** for DP105 (5.02 kPa)' : '**REVIEW** span/thickness';
    return [
      '## Solastrata™ ASTM E1300 & NFRC Compliance Audit',
      '',
      '| Check | Value | Status |',
      '|-------|-------|--------|',
      '| NFRC 100 U-factor | ' + ctx.uFactor + ' W/m2K | ' + n100 + ' |',
      '| NFRC 200 SHGC | ' + ctx.shgc + ' | ' + n200 + ' |',
      '| ASTM E1300 / DP105 | — | ' + dp + ' |',
      '| CTE / delamination | Frame ' + ctx.frameMaterialName + ' | CTE match **' + ctx.frameCteMatchPct + '%** |',
      '',
      '**Recommendations**',
      '1. Keep cavity gas **' + ctx.cavityGas + '** and Low-E path for U <= 0.85.',
      '2. Confirm laminated stack neutral axis and edge support for DP105.',
      '3. Document wet leakage & NEC 690 rapid shutdown in Solastrata™ submittal package.',
      '',
      '*Offline rules engine — add an API key for fuller narrative drafting.*',
    ].join('\n');
  }

  if (q.includes('mti') || q.includes('grant') || q.includes('proposal')) {
    return [
      '## Draft MTI Grant Proposal Narrative (excerpt)',
      '',
      '**Project title:** Solastrata™ BIPV-T Active Glazing Systems — Dual-Stream Energy Harvesting Window',
      '',
      '**Technical summary.** Electrical η **' +
        ctx.electricalEtaPct +
        '%**, thermal η **' +
        ctx.thermalEtaPct +
        '%**, net **' +
        ctx.netPowerWm2 +
        ' W/m²**, U-factor **' +
        ctx.uFactor +
        '**, SHGC **' +
        ctx.shgc +
        '**. Year-1 yield: **' +
        ctx.year1ElectricKwh +
        ' kWh** electric and **' +
        ctx.year1ThermalKwh +
        ' kWh** thermal-equivalent.',
      '',
      '**Market & ROI.** NEB simple payback ~**' +
        ctx.simplePaybackYears +
        ' years**, NPV **$' +
        ctx.npv +
        '**, LCOE **$' +
        ctx.lcoe +
        '/kWh**. Frame: **' +
        ctx.frameMaterialName +
        '** ($' +
        ctx.frameCostPerFt +
        '/ft), CTE match **' +
        ctx.frameCteMatchPct +
        '%**.',
      '',
      '**Work plan.** (1) NFRC/ASTM lab certification, (2) pilot install with metered export, (3) CSI Division 08 submittal package for Solastrata™.',
      '',
      '*Offline draft — refine with Gemini/Grok for full MTI section formatting.*',
    ].join('\n');
  }

  if (q.includes('nda') || q.includes('pitch') || q.includes('manufacturer') || q.includes('partner')) {
    return [
      '## Manufacturer NDA Pitch Outline',
      '',
      '**One-liner.** Solastrata™ is a buildable BIPV-T window stack with digital-twin-validated NFRC/DP metrics.',
      '',
      '**Why partner now**',
      '- **Performance:** η_el ' +
        ctx.electricalEtaPct +
        '% · η_th ' +
        ctx.thermalEtaPct +
        '% · U ' +
        ctx.uFactor +
        ' · SHGC ' +
        ctx.shgc,
      '- **Compliance:** NFRC 100 ' +
        (ctx.nfrc100Pass ? 'PASS' : 'in progress') +
        ' · NFRC 200 ' +
        (ctx.nfrc200Pass ? 'PASS' : 'in progress') +
        ' · DP105 ' +
        (ctx.dp105Ok ? 'OK' : 'in review'),
      '- **Frame:** ' + ctx.frameMaterialName + ' · **Commercial:** payback ~' + ctx.simplePaybackYears + ' yr',
      '',
      '**Ask.** Mutual NDA → BOM cost share → pilot SKU under private-label or JV for Solastrata™ BIPV-T Active Glazing Systems.',
      '',
      '*Offline outline — cloud models can expand legal/commercial language.*',
    ].join('\n');
  }

  return [
    '## Solastrata™ Advisor (offline)',
    '',
    'I received: *"' + userMessage.slice(0, 200) + (userMessage.length > 200 ? '…' : '') + '"*',
    '',
    '**Live twin snapshot**',
    '- U **' + ctx.uFactor + '** · SHGC **' + ctx.shgc + '** · VLT **' + ctx.vlt + '**',
    '- Net power **' + ctx.netPowerWm2 + ' W/m²** · Y1 **' + ctx.year1ElectricKwh + ' kWh** elec',
    '- Frame **' + ctx.frameMaterialName + '** · Payback **' + ctx.simplePaybackYears + ' yr**',
    '',
    'Try quick actions: **Audit ASTM/NFRC**, **MTI Grant Narrative**, or **Manufacturer NDA Pitch**.',
  ].join('\n');
}

async function callGemini(system: string, messages: ChatMessage[], apiKey: string): Promise<string> {
  const url =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' +
    encodeURIComponent(apiKey);
  const contents = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));
  const body = {
    system_instruction: { parts: [{ text: system }] },
    contents,
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error('Gemini ' + res.status + ': ' + err.slice(0, 200));
  }
  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
  if (!text) throw new Error('Gemini returned empty response');
  return text;
}

async function callOpenAiCompatible(
  endpoint: string,
  apiKey: string,
  model: string,
  system: string,
  messages: ChatMessage[],
  extraHeaders?: Record<string, string>,
): Promise<string> {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + apiKey,
      ...extraHeaders,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'system', content: system }, ...messages.filter((m) => m.role !== 'system')],
      temperature: 0.4,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error('API ' + res.status + ': ' + err.slice(0, 200));
  }
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = data.choices?.[0]?.message?.content ?? '';
  if (!text) throw new Error('Empty model response');
  return text;
}

export async function chatWithProvider(
  provider: AiProviderId,
  userMessage: string,
  history: ChatMessage[],
  ctx: SimulationContext,
): Promise<string> {
  const system = buildSystemPrompt(ctx);
  const messages: ChatMessage[] = [...history, { role: 'user', content: userMessage }];

  if (provider === 'offline') {
    return offlineAdvisorReply(userMessage, ctx);
  }

  try {
    if (provider === 'gemini') {
      const key = env('VITE_GEMINI_API_KEY');
      if (!key) return offlineAdvisorReply(userMessage, ctx);
      return await callGemini(system, messages, key);
    }
    if (provider === 'grok') {
      const key = env('VITE_XAI_API_KEY');
      if (!key) return offlineAdvisorReply(userMessage, ctx);
      return await callOpenAiCompatible(
        'https://api.x.ai/v1/chat/completions',
        key,
        'grok-2',
        system,
        messages,
      );
    }
    if (provider === 'llama') {
      const key = env('VITE_META_LLAMA_API_KEY');
      if (!key) return offlineAdvisorReply(userMessage, ctx);
      const endpoint =
        env('VITE_LLAMA_ENDPOINT') || 'https://openrouter.ai/api/v1/chat/completions';
      return await callOpenAiCompatible(
        endpoint,
        key,
        env('VITE_LLAMA_MODEL') || 'meta-llama/llama-3.1-8b-instruct',
        system,
        messages,
      );
    }
    if (provider === 'azure') {
      const key = env('VITE_AZURE_OPENAI_KEY');
      const endpoint = env('VITE_AZURE_OPENAI_ENDPOINT');
      const deployment = env('VITE_AZURE_OPENAI_DEPLOYMENT') || 'gpt-4o-mini';
      if (!key || !endpoint) return offlineAdvisorReply(userMessage, ctx);
      const url =
        endpoint.replace(/\/$/, '') +
        '/openai/deployments/' +
        deployment +
        '/chat/completions?api-version=2024-02-15-preview';
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': key,
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: system },
            ...messages.filter((m) => m.role !== 'system'),
          ],
          temperature: 0.4,
        }),
      });
      if (!res.ok) throw new Error('Azure ' + res.status);
      const data = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      return data.choices?.[0]?.message?.content ?? offlineAdvisorReply(userMessage, ctx);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return (
      '**Provider error** (' +
      provider +
      '): ' +
      msg +
      '\n\nFalling back to offline rules:\n\n' +
      offlineAdvisorReply(userMessage, ctx)
    );
  }

  return offlineAdvisorReply(userMessage, ctx);
}

export const QUICK_PROMPTS = {
  compliance:
    'Audit ASTM E1300 & NFRC Compliance for the active Solastrata™ configuration. Summarize pass/fail and concrete remediation steps.',
  grant:
    'Draft an MTI grant proposal narrative section for Solastrata™ BIPV-T Active Glazing Systems using the injected simulation metrics. Keep it professional and fundable.',
  nda:
    'Generate a manufacturer NDA pitch outline for Solastrata™ private-label or JV partnership based on the live twin data.',
} as const;
