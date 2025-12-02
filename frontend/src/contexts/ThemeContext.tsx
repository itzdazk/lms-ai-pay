import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Get initial theme from localStorage or default to 'dark'
  const [theme, setThemeState] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    return savedTheme || 'dark';
  });

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const appRoot = document.getElementById('root');

    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      body.style.backgroundColor = '#000000';
      body.style.color = '#FFFFFF';
      if (appRoot) {
        (appRoot as HTMLElement).style.backgroundColor = '#000000';
        (appRoot as HTMLElement).style.color = '#FFFFFF';
      }
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
      body.style.backgroundColor = '#FFFFFF';
      body.style.color = '#000000';
      if (appRoot) {
        (appRoot as HTMLElement).style.backgroundColor = '#FFFFFF';
        (appRoot as HTMLElement).style.color = '#000000';
      }
    }

    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setThemeState(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}


