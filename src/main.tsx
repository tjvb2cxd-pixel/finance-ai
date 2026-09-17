import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { PrivacyProvider } from './contexts/PrivacyContext.tsx';
import { ThemeProvider } from './contexts/ThemeContext.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <PrivacyProvider>
        <App />
      </PrivacyProvider>
    </ThemeProvider>
  </StrictMode>,
);
