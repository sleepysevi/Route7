import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import RouteSevenIcon from './RouteSevenIcon';

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [pendingContext, setPendingContext] = useState(null);
  const prefersReducedMotion = useReducedMotion();

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, context: pendingContext })
      });
      const response = await res.json();
      if (!res.ok) throw new Error(response.error || 'Route service failed');
      const { reply } = response;
      setMessages(prev => [...prev, { role: 'bot', text: reply }]);
      setPendingContext(response.context || null);
    } catch (error) {
      console.error('Chatbot request failed:', error);
      setMessages(prev => [...prev, {
        role: 'bot',
        text: 'I couldn’t reach the route service. Please try again.'
      }]);
    }
  };

  return (
    <>
      {/* Floating icon */}
      <motion.button
        onClick={() => setOpen(!open)}
        aria-label={open ? 'Close chat' : 'Open chat'}
        style={{
          position: 'fixed', bottom: 20, right: 20, zIndex: 1000,
          width: 56, height: 56, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--chat-fab)', color: 'var(--chat-fab-icon)', border: 'none',
          fontSize: 24, cursor: 'pointer', boxShadow: 'var(--shadow-fab)'
        }}
        animate={open || prefersReducedMotion ? { scale: 1 } : { scale: [1, 1.03, 1] }}
        transition={{
          duration: 2, ease: 'easeInOut', repeat: open || prefersReducedMotion ? 0 : Infinity
        }}
        whileHover={{ scale: 1.08, transition: { type: 'spring', stiffness: 300, damping: 20 } }}
        whileTap={{ scale: 0.92 }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={open ? 'close' : 'chat'}
            initial={{ opacity: 0, rotate: -90 }}
            animate={{ opacity: 1, rotate: 0 }}
            exit={{ opacity: 0, rotate: 90 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            style={{ display: 'block', lineHeight: 1 }}
          >
            {open ? '✕' : <RouteSevenIcon />}
          </motion.span>
        </AnimatePresence>
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            style={{
              position: 'fixed', bottom: 90, right: 20, zIndex: 1000,
              width: 320, height: 420, background: 'var(--surface-solid)', color: 'var(--ink)',
              borderRadius: 12, display: 'flex', flexDirection: 'column',
              boxShadow: 'var(--shadow-chat)', overflow: 'hidden',
              transformOrigin: 'bottom right'
            }}
          >
            <div style={{ padding: 12, borderBottom: '1px solid var(--line)', fontWeight: 'bold' }}>
              Ask Seven
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
              {messages.map((m, i) => (
                <p key={i} style={{ margin: '4px 0', whiteSpace: 'pre-wrap' }}>
                  <strong>{m.role === 'user' ? 'You' : 'ZevBot'}:</strong> {m.text}
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
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
