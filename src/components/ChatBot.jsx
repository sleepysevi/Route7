import { useState } from 'react';

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userMsg })
    });
    const { reply } = await res.json();
    setMessages(prev => [...prev, { role: 'bot', text: reply }]);
  };

  return (
    <>
      {/* Floating icon */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: 'fixed', bottom: 20, right: 20, zIndex: 1000,
          width: 56, height: 56, borderRadius: '50%',
          background: 'var(--primary)', color: 'white', border: 'none',
          fontSize: 24, cursor: 'pointer', boxShadow: 'var(--shadow-fab)'
        }}
      >
        {open ? '✕' : '💬'}
      </button>

      {/* Chat panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 90, right: 20, zIndex: 1000,
          width: 320, height: 420, background: 'var(--surface-solid)', color: 'var(--ink)',
          borderRadius: 12, display: 'flex', flexDirection: 'column',
          boxShadow: 'var(--shadow-chat)', overflow: 'hidden'
        }}>
          <div style={{ padding: 12, borderBottom: '1px solid var(--line)', fontWeight: 'bold' }}>
            Ask Route7
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
            {messages.map((m, i) => (
              <p key={i} style={{ margin: '4px 0' }}>
                <strong>{m.role === 'user' ? 'You' : 'Bot'}:</strong> {m.text}
              </p>
            ))}
          </div>
          <div style={{ display: 'flex', padding: 8, borderTop: '1px solid var(--line)' }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Ask about routes or fares..."
              style={{ flex: 1, padding: 8, borderRadius: 6, border: 'none', marginRight: 8, background: 'var(--inset)', color: 'var(--ink)' }}
            />
            <button onClick={sendMessage} style={{ padding: '8px 12px', borderRadius: 6, border: 'none', background: 'var(--primary)', color: 'white' }}>
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}