import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle({ className = '' }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sf_theme') || 'dark';
    }
    return 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('sf_theme', theme);
  }, [theme]);

  const toggle = () => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));

  const label = 'Alternar tema';

  return (
    <button
      onClick={toggle}
      className={'px-2 py-2 rounded-xl transition-all duration-300 hover:bg-white/10 active:scale-90 ' + className}
      aria-label={label}
      title={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
    >
      {theme === 'dark' ? (
        <Sun size={18} className='text-yellow-400 hover:text-yellow-300 transition-colors' />
      ) : (
        <Moon size={18} className='text-slate-600 hover:text-slate-800 transition-colors' />
      )}
    </button>
  );
}
