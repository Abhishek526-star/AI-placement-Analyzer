import React, { createContext, useContext, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', 'prismatic-obsidian');
    root.classList.add('dark');
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        theme: 'prismatic-obsidian',
        setTheme: () => {},
        toggleTheme: () => {},
        isDark: true
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
