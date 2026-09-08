import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { Analytics } from '@vercel/analytics/react';
import { createRoot } from 'react-dom/client';

createRoot(document.getElementById('root')).render(
  <>
    <App />
    <Analytics />
  </>
);
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
