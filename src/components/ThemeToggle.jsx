import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-2xl transition-all active:scale-95 ${
        theme === 'dark'
          ? 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-amber-400'
          : 'bg-black/5 hover:bg-black/10 text-zinc-500 hover:text-blue-500'
      } ${className}`}
      aria-label={theme === 'dark' ? 'Aydınlık moda geç' : 'Karanlık moda geç'}
      title={theme === 'dark' ? 'Aydınlık Mod' : 'Karanlık Mod'}
    >
      {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
