import { tw } from '@/lib/theme';
import { useTheme } from '../contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle({ className = '' }) {
 const { theme, toggleTheme } = useTheme();

 return (
 <button
 onClick={toggleTheme}
 className={'px-2 py-2 rounded-xl transition-all duration-300 hover:bg-gray-800/40/10 active:scale-90 ' + className}
 aria-label='Alternar tema'
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