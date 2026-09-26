import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { Analytics } from '@vercel/analytics/react';
import ChatBot from './components/ChatBot';

createRoot(document.getElementById('root')).render(
  <>
    <App />
    <Analytics />
    <ChatBot />
  </>
);
