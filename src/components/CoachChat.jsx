import { useState, useRef, useEffect } from 'react';
import { askClaude } from '../claude.js';

export default function CoachChat({ plan, completions, weekRatings, onClose }) {
  const curWk = plan ? Math.floor((new Date() - new Date(plan.meta.startDate)) / (7 * 86400000)) : 0;
  const wk = plan?.weeks[Math.max(0, Math.min(curWk, (plan?.weeks?.length||1)-1))];

  const systemPrompt = `You are a world-class ultra-endurance coach. Your athlete is ${plan?.meta?.athlete || 'Hayden'}, ${plan?.meta?.bodyweightKg || 95}kg, training for ${plan?.meta?.races?.map(r=>r.name).join(' and ') || 'ultramarathon races'}.

Current week: ${curWk + 1} of ${plan?.weeks?.length || 25}. Phase: ${wk?.phase || 'Base Building'}.
This week's target: ${wk?.targets?.hrs || 0} hours.
Sessions this week: ${wk?.sessions?.map(s => s.name).join(', ') || 'none'}.

AeT: 132-135bpm. AnT: 157bpm. All easy runs capped at 132bpm. The athlete is following the Johnston ME protocol.

Be direct, specific, and concise. No fluff. Answer like a coach texting an athlete — short, clear, actionable. If asked about modifying sessions, give a specific recommendation.`;

  const initMsg = `Week ${curWk + 1} of your block. What do you need?`;

  const [messages, setMessages] = useState([{ role: 'assistant', content: initMsg }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    const newMsgs = [...messages, { role: 'user', content: text }];
    setMessages(newMsgs);
    setLoading(true);
    try {
      const reply = await askClaude(
        newMsgs.map(m => ({ role: m.role, content: m.content })),
        systemPrompt
      );
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong — try again.' }]);
    }
    setLoading(false);
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'var(--bg)', display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px',
        paddingTop: 'calc(12px + env(safe-area-inset-top, 0px))',
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface)',
      }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Coach</div>
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, color: 'var(--muted)', letterSpacing: 2, marginTop: 1 }}>POWERED BY CLAUDE</div>
        </div>
        <button onClick={onClose} style={{
          width: 44, height: 44, borderRadius: '50%',
          background: 'var(--card)', border: '1px solid var(--border)',
          color: 'var(--text)', fontSize: 18,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', flexShrink: 0,
        }}>✕</button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '85%', padding: '10px 13px',
              borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              background: m.role === 'user' ? 'var(--green)' : 'var(--card)',
              color: m.role === 'user' ? '#0A0A0A' : 'var(--text)',
              fontSize: 15, lineHeight: 1.6,
              border: m.role === 'assistant' ? '1px solid var(--border)' : 'none',
            }}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{
              padding: '10px 14px', borderRadius: '16px 16px 16px 4px',
              background: 'var(--card)', border: '1px solid var(--border)',
              color: 'var(--muted)', fontSize: 14, fontFamily: 'DM Mono, monospace', letterSpacing: 2,
            }}>...</div>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      {/* Input */}
      <div style={{
        flexShrink: 0,
        padding: '10px 14px',
        paddingBottom: 'calc(10px + env(safe-area-inset-bottom, 0px))',
        borderTop: '1px solid var(--border)',
        background: 'var(--bg)',
        display: 'flex', gap: 8, alignItems: 'flex-end',
      }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
          placeholder="Ask your coach anything…"
          rows={1}
          style={{
            flex: 1,
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            color: 'var(--text)',
            fontSize: 16,
            padding: '10px 16px',
            outline: 'none',
            fontFamily: 'DM Sans, sans-serif',
            resize: 'none',
            overflow: 'hidden',
            minHeight: 44,
            maxHeight: 120,
            lineHeight: '1.5',
          }}
          onInput={e => {
            e.target.style.height = 'auto';
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
          }}
        />
        <button
          onClick={send}
          disabled={!input.trim() || loading}
          style={{
            width: 44, height: 44, borderRadius: '50%',
            background: input.trim() && !loading ? 'var(--green)' : 'var(--card)',
            border: '1px solid var(--border)',
            color: input.trim() && !loading ? '#0A0A0A' : 'var(--muted)',
            fontSize: 18, cursor: input.trim() && !loading ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.2s',
            flexShrink: 0,
          }}
        >↑</button>
      </div>
    </div>
  );
}
