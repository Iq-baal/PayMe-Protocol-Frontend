import React from 'react';
import ReactDOM from 'react-dom/client';
import './config/amplify'; // Initialize AWS Amplify
import App from './App';
import { logger } from './utils/logger';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

logger.log('Initializing PayMe app');

const root = ReactDOM.createRoot(rootElement);

// Service Worker Registration for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        logger.log('ServiceWorker registration successful with scope:', registration.scope);
      })
      .catch(err => {
        logger.error('ServiceWorker registration failed:', err);
      });
  });
}

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);