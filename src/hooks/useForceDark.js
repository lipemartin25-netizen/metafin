import { useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Força dark mode enquanto o componente está montado.
 * Ao desmontar, restaura o tema anterior do usuário.
 */
export function useForceDark() {
 const { theme, setTheme } = useTheme();

 useEffect(() => {
 const previous = theme;
 setTheme('dark');
 document.documentElement.classList.add('dark');
 document.documentElement.classList.remove('light');

 return () => {
 setTheme(previous);
 if (previous === 'light') {
 document.documentElement.classList.remove('dark');
 document.documentElement.classList.add('light');
 }
 };
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, []);
}
