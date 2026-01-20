import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import App from './App';
import './i18n/i18n'; // Inicializar i18n

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <Suspense fallback={<div className="bg-black h-screen w-screen text-white flex items-center justify-center">Loading LuxScaler...</div>}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </Suspense>
    </ErrorBoundary>
  </React.StrictMode>
);