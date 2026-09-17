import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

interface PrivacyContextType {
  isPrivacyMode: boolean;
  togglePrivacyMode: () => void;
  formatValue: (value: number) => string;
  autoHideEnabled: boolean;
  setAutoHideEnabled: (enabled: boolean) => void;
  setIsPrivacyMode: (val: boolean) => void;
}

const PrivacyContext = createContext<PrivacyContextType | undefined>(undefined);

export const PrivacyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);
  const [autoHideEnabled, setAutoHideEnabledState] = useState(() => {
    return localStorage.getItem('fin-autohide') === 'true';
  });

  const togglePrivacyMode = () => setIsPrivacyMode(prev => !prev);
  
  const setAutoHideEnabled = (enabled: boolean) => {
    setAutoHideEnabledState(enabled);
    localStorage.setItem('fin-autohide', String(enabled));
  };

  const formatValue = (value: number) => {
    if (isPrivacyMode) {
      return 'R$ ****';
    }
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  // Inactivity timer logic
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      if (autoHideEnabled && !isPrivacyMode) {
        // 5 minutes = 300,000 ms
        timeoutId = setTimeout(() => {
          setIsPrivacyMode(true);
        }, 300000);
      }
    };

    const handleUserActivity = () => {
      resetTimer();
    };

    if (autoHideEnabled) {
      window.addEventListener('mousemove', handleUserActivity);
      window.addEventListener('keydown', handleUserActivity);
      window.addEventListener('touchstart', handleUserActivity);
      window.addEventListener('scroll', handleUserActivity);
      window.addEventListener('click', handleUserActivity);
      resetTimer(); // start initially
    }

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('touchstart', handleUserActivity);
      window.removeEventListener('scroll', handleUserActivity);
      window.removeEventListener('click', handleUserActivity);
    };
  }, [autoHideEnabled, isPrivacyMode]);

  return (
    <PrivacyContext.Provider value={{ isPrivacyMode, togglePrivacyMode, formatValue, autoHideEnabled, setAutoHideEnabled, setIsPrivacyMode }}>
      {children}
    </PrivacyContext.Provider>
  );
};

export const usePrivacy = () => {
  const context = useContext(PrivacyContext);
  if (context === undefined) {
    throw new Error('usePrivacy must be used within a PrivacyProvider');
  }
  return context;
};
