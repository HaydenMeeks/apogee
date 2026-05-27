import { useState, useRef, useEffect } from 'react';
import { askClaude } from '../claude.js';

const S = {
  bg: '#0A0A0A', surface: '#141414', card: '#1C1C1C',
  border: 'rgba(255,255,255,0.08)', border2: 'rgba(255,255,255,0.14)',
  text: '#F4F4F2', text2: 'rgba(244,244,242,0.7)', muted: 'rgba(244,244,242,0.35)',
  green: '#00C46A', g2: '#00A858',
};

const QUICK_PROMPTS = [
  "I'm on a road trip next week — no gym access",
  "I'm feeling fatigued, should I reduce volume?",
  "What should I focus on this week?",
  "I missed yesterday's run — what should I do?",
  "Can you explain why this week's sessions are structured this way?",
];

export default function CoachChat({ plan, completions, weekRatings, onClose }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `Week ${plan ? Math.floor((new Date() - new Date(plan.meta.startDate)) / (7 * 86400000)) + 1 : 1} of your block. What do you need?` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');
    const newMessages = [...messages, { role: 'user', content: msg }];
    setMessages(newMessages);
    setLoading(true);
    try {
      const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }));
      const reply = await askClaude(apiMessages, plan, completions, weekRatings);
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection issue. Try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '16px 16px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>Coach</div>
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, color: S.muted, letterSpacing: 2, marginTop: 1 }}>POWERED BY CLAUDE</div>
        </div>
        <button onClick={onClose} style={{ width: 44, height: 44, borderRadius: '50%', background: S.card, border: `1px solid ${S.border}`, color: S.text, fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>✕</button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '85%', padding: '10px 13px', borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              background: m.role === 'user' ? 'var(--green)' : 'var(--card)',
              color: m.role === 'user' ? '#0A0A0A' : 'var(--text)',
              fontSize: 14, lineHeight: 1.6,
              border: m.role === 'assistant' ? '1px solid var(--border)' : 'none',
            }}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: '16px 16px 16px 4px', padding: '12px 16px' }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: S.muted, animation: `dot-pulse 1.2s ${i * 0.2}s ease-in-out infinite` }}/>
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      {/* Quick prompts */}
      {messages.length <= 1 && (
        <div style={{ padding: '0 14px 10px', flexShrink: 0 }}>
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, color: S.muted, letterSpacing: 2, marginBottom: 8 }}>QUICK START</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {QUICK_PROMPTS.map((p, i) => (
              <button key={i} onClick={() => send(p)} style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 10, padding: '9px 12px', fontSize: 13, color: S.text2, cursor: 'pointer', textAlign: 'left', transition: 'border-color .15s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = S.green}
                onMouseLeave={e => e.currentTarget.style.borderColor = S.border}>
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div style={{ padding: '10px 14px calc(10px + env(safe-area-inset-bottom, 0px))', borderTop: `1px solid ${S.border}`, flexShrink: 0, display: 'flex', gap: 8 }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
          placeholder="Ask your coach anything…"
          rows={1}
          style={{
            flex: 1, background: 'var(--card)', border: '1px solid var(--border2)',
            borderRadius: 16, color: S.text, fontSize: 14,
            padding: '10px 16px', outline: 'none',
            fontFamily: 'DM Sans, sans-serif',
            resize: 'none', overflow: 'hidden',
            minHeight: 44, maxHeight: 120,
            lineHeight: '1.5',
          }}
          onFocus={e => e.target.style.borderColor = S.green}
          onBlur={e => e.target.style.borderColor = S.border2}
          onInput={e => {
            e.target.style.height = 'auto';
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
          }}
        />
        <button onClick={() => send()} disabled={!input.trim() || loading} style={{ width: 44, height: 44, borderRadius: '50%', background: input.trim() && !loading ? S.green : S.card, border: 'none', color: input.trim() && !loading ? '#0A0A0A' : S.muted, fontSize: 18, cursor: input.trim() && !loading ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .2s', flexShrink: 0 }}>
          ↑
        </button>
      </div>

      <style>{`
        @keyframes dot-pulse {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
