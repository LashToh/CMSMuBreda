import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const RegisterContext = createContext(null);

export function RegisterProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);

  const openRegister = useCallback(() => setIsOpen(true), []);
  const closeRegister = useCallback(() => setIsOpen(false), []);

  const value = useMemo(
    () => ({ isOpen, openRegister, closeRegister }),
    [isOpen, openRegister, closeRegister],
  );

  return (
    <RegisterContext.Provider value={value}>
      {children}
    </RegisterContext.Provider>
  );
}

export function useRegister() {
  const context = useContext(RegisterContext);
  if (!context) {
    throw new Error('useRegister must be used within RegisterProvider');
  }
  return context;
}
