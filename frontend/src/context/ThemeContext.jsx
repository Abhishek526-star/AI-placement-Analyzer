import React, { createContext, useContext, useEffect, useState } from 'react';

export const LUXURY_THEMES = [
  {
    id: 'prismatic-obsidian',
    label: 'Prismatic Obsidian',
    category: 'Dark Cyber Luxury',
    swatches: ['#ff6b6b', '#6366f1', '#00e5b0'],
    canvas: '#090B14'
  },
  {
    id: 'alabaster-editorial',
    label: 'Alabaster Editorial',
    category: 'Warm Light Luxury',
    swatches: ['#e54d2e', '#0d9488', '#171412'],
    canvas: '#F7F4EE'
  },
  {
    id: 'emerald-biolume',
    label: 'Emerald Biolume',
    category: 'Botanical Cyber Noir',
    swatches: ['#10b981', '#00f5d4', '#f43f5e'],
    canvas: '#06120F'
  },
  {
    id: 'sunset-amethyst',
    label: 'Sunset Amethyst',
    category: 'Velvet Dusk & Orchid',
    swatches: ['#c084fc', '#fb7185', '#38bdf8'],
    canvas: '#13091F'
  }
];

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    const saved = localStorage.getItem('bento-theme') || localStorage.getItem('theme');
    if (saved && LUXURY_THEMES.some((t) => t.id === saved)) {
      return saved;
    }
    if (saved === 'light') return 'alabaster-editorial';
    return 'prismatic-obsidian';
  });

  const [skeletonSimulator, setSkeletonSimulator] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);

    if (theme === 'alabaster-editorial') {
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
    }

    localStorage.setItem('bento-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const setTheme = (themeId) => {
    if (LUXURY_THEMES.some((t) => t.id === themeId)) {
      setThemeState(themeId);
    }
  };

  const toggleTheme = () => {
    setThemeState((prev) =>
      prev === 'alabaster-editorial' ? 'prismatic-obsidian' : 'alabaster-editorial'
    );
  };

  const toggleSkeletonSimulator = () => {
    setSkeletonSimulator((prev) => !prev);
  };

  const isDark = theme !== 'alabaster-editorial';

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
        isDark,
        themes: LUXURY_THEMES,
        skeletonSimulator,
        toggleSkeletonSimulator
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
