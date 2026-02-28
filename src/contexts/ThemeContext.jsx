import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
 const [theme, setTheme] = useState(() => {
 if (typeof window !== 'undefined') {
 const stored = localStorage.getItem('sf_theme');
 if (stored) return stored;
 return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
 }
 return 'dark';
 });

 useEffect(() => {
 const root = document.documentElement;
 if (theme === 'dark') {
 root.classList.add('dark');
 root.classList.remove('light');
 } else {
 root.classList.remove('dark');
 root.classList.add('light');
 }
 localStorage.setItem('sf_theme', theme);
 }, [theme]);

 const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');
 const setThemeValue = (value) => setTheme(value);

 return (
 <ThemeContext.Provider value={{ theme, toggleTheme, setTheme: setThemeValue }}>
 {children}
 </ThemeContext.Provider>
 );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
 const context = useContext(ThemeContext);
 if (!context) throw new Error('useTheme deve ser usado dentro de <ThemeProvider>');
 return context;
}
