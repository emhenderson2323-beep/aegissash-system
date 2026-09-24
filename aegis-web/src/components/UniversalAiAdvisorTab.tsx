import { useMemo, useState, type ReactNode } from 'react';
import {
  AiProviderId,
  ChatMessage,
  SimulationContext,
  listProviders,
  chatWithProvider,
  QUICK_PROMPTS,
} from '../lib/universalAiService';

export interface UniversalAiAdvisorTabProps {
  context: SimulationContext;
}

function renderMarkdown(text: string): ReactNode[] {
  const lines = text.split('\n');
  const nodes: ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith('## ')) {
      nodes.push(
        <h3 key={i} style={{ margin: '0.75rem 0 0.35rem', fontSize: '1rem', color: '#c4b5fd' }}>
          {line.slice(3)}
        </h3>,
      );
    } else if (line.startsWith('# ')) {
      nodes.push(
        <h2 key={i} style={{ margin: '0.75rem 0 0.35rem', fontSize: '1.1rem' }}>
          {line.slice(2)}
        </h2>,
      );
    } else if (line.startsWith('|') && line.includes('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].startsWith('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      nodes.push(
        <pre
          key={`t${i}`}
          style={{
            fontSize: '0.72rem',
            overflow: 'auto',
            background: '#0a1020',
            padding: '0.5rem',
            borderRadius: '0.4rem',
            border: '1px solid var(--border)',
          }}
        >
          {tableLines.join('\n')}
        </pre>,
      );
      continue;
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      nodes.push(
        <div key={i} style={{ paddingLeft: '0.75rem', fontSize: '0.85rem' }}>
          • {formatInline(line.slice(2))}
        </div>,
      );
    } else if (line.trim() === '') {
      nodes.push(<div key={i} style={{ height: '0.4rem' }} />);
    } else {
      nodes.push(
        <p key={i} style={{ margin: '0.25rem 0', fontSize: '0.85rem', lineHeight: 1.45 }}>
          {formatInline(line)}
        </p>,
      );
    }
    i++;
  }
  return nodes;
}

function formatInline(s: string): ReactNode {
  const parts = s.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, idx) => {
    if (p.startsWith('**') && p.endsWith('**')) {
      return (
        <strong key={idx} style={{ color: 'var(--cyan)' }}>
          {p.slice(2, -2)}
        </strong>
      );
    }
    return <span key={idx}>{p}</span>;
  });
}

export function UniversalAiAdvisorTab({ context }: UniversalAiAdvisorTabProps) {
  const providers = useMemo(() => listProviders(), []);
  const [provider, setProvider] = useState<AiProviderId>(() => {
    const withKey = providers.find((p) => p.id !== 'offline' && p.available);
    return withKey?.id ?? 'offline';
  });
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeProvider = providers.find((p) => p.id === provider) ?? providers[providers.length - 1];

  const send = async (text: string) => {
    const msg = text.trim();
    if (!msg || busy) return;
    setBusy(true);
    setError(null);
    setHistory((h) => [...h, { role: 'user', content: msg }]);
    setInput('');
    try {
      const reply = await chatWithProvider(provider, msg, history, context);
      setHistory((h) => [...h, { role: 'assistant', content: reply }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const copyLast = () => {
    const last = [...history].reverse().find((m) => m.role === 'assistant');
    if (last) void navigator.clipboard.writeText(last.content);
  };

  return (
    <div className="stack ai-advisor">
      <div className="card">
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.75rem',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h3 className="section-title" style={{ marginBottom: '0.25rem' }}>
              🤖 AI Architectural &amp; Commercial Advisor
            </h3>
            <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>
              Status:{' '}
              <span style={{ color: activeProvider.available ? 'var(--good)' : 'var(--warn)' }}>
                {activeProvider.label}
                {provider !== 'offline'
                  ? activeProvider.available
                    ? ' · API key detected'
                    : ' · no key → offline fallback'
                  : ' · local heuristics'}
              </span>
            </div>
          </div>
          <div className="field" style={{ marginBottom: 0, minWidth: 200 }}>
            <label>Provider</label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as AiProviderId)}
            >
              {providers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                  {p.id !== 'offline' ? (p.available ? ' ✓' : ' (no key)') : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="btn-row" style={{ flexWrap: 'wrap', marginTop: '0.75rem' }}>
          <button
            type="button"
            className="btn secondary"
            disabled={busy}
            onClick={() => void send(QUICK_PROMPTS.compliance)}
          >
            🏛️ Audit ASTM E1300 &amp; NFRC Compliance
          </button>
          <button
            type="button"
            className="btn secondary"
            disabled={busy}
            onClick={() => void send(QUICK_PROMPTS.grant)}
          >
            📜 Draft MTI Grant Proposal Narrative
          </button>
          <button
            type="button"
            className="btn secondary"
            disabled={busy}
            onClick={() => void send(QUICK_PROMPTS.nda)}
          >
            💼 Generate Manufacturer NDA Pitch
          </button>
          <button
            type="button"
            className="btn secondary"
            onClick={copyLast}
            disabled={!history.some((m) => m.role === 'assistant')}
          >
            Copy Response
          </button>
        </div>

        <div
          style={{
            marginTop: '0.75rem',
            fontSize: '0.68rem',
            color: 'var(--muted)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <span>U={context.uFactor}</span>
          <span>SHGC={context.shgc}</span>
          <span>VLT={context.vlt}</span>
          <span>{context.year1ElectricKwh} kWh/yr</span>
          <span>{context.frameMaterialName}</span>
          <span>payback {context.simplePaybackYears} yr</span>
        </div>
      </div>

      <div
        className="card"
        style={{
          minHeight: 280,
          maxHeight: 420,
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.65rem',
        }}
      >
        {history.length === 0 && (
          <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
            Ask about compliance, grants, or manufacturer partnerships. Live twin metrics are injected
            into every request automatically.
          </div>
        )}
        {history.map((m, idx) => (
          <div
            key={idx}
            style={{
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '92%',
              background: m.role === 'user' ? '#1e3a5f' : 'var(--panel2)',
              border: '1px solid var(--border)',
              borderRadius: '0.6rem',
              padding: '0.65rem 0.85rem',
            }}
          >
            <div style={{ fontSize: '0.65rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>
              {m.role === 'user' ? 'You' : 'Advisor'}
            </div>
            {m.role === 'assistant' ? (
              renderMarkdown(m.content)
            ) : (
              <div style={{ fontSize: '0.85rem' }}>{m.content}</div>
            )}
          </div>
        ))}
        {busy && <div style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>Thinking…</div>}
        {error && <div style={{ color: 'var(--bad)', fontSize: '0.8rem' }}>{error}</div>}
      </div>

      <div className="card">
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            style={{
              flex: 1,
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              borderRadius: '0.45rem',
              padding: '0.55rem 0.65rem',
            }}
            placeholder="Ask the advisor…"
            value={input}
            disabled={busy}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void send(input);
              }
            }}
          />
          <button
            type="button"
            className="btn"
            disabled={busy || !input.trim()}
            onClick={() => void send(input)}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
