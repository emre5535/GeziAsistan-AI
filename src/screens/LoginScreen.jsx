import { useState, useEffect } from 'react';
import { Loader2, MapPin } from 'lucide-react';
import { AmbientBackground } from '../components/AmbientBackground';
import { ThemeToggle } from '../components/ThemeToggle';
import { useTheme } from '../contexts/ThemeContext';



export function LoginScreen({ onSignIn, loading, signingIn, error }) {
  const { theme } = useTheme();
  const [rememberMe, setRememberMe] = useState(true);

  // Load last preference
  useEffect(() => {
    const saved = localStorage.getItem('gezi_remember_me');
    if (saved !== null) setRememberMe(saved === 'true');
  }, []);

  const handleSignIn = () => {
    localStorage.setItem('gezi_remember_me', rememberMe);
    onSignIn(rememberMe);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 page-bg relative">
      <AmbientBackground />
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="glass-card w-full max-w-md rounded-[2.5rem] border card-border card-bg backdrop-blur-3xl p-10 shadow-xl shadow-black/20 space-y-8">
        {/* Logo */}
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-sky-400 rounded-[1.5rem] flex items-center justify-center mx-auto shadow-lg shadow-blue-500/30">
            <MapPin size={36} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-primary">Akıllı Gezi Asistanı</h1>
            <p className="text-sm mt-1 leading-relaxed text-secondary">
              Seyahatini planla, yapay zekayla optimize et
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="space-y-2">
          {[
            { icon: '🗺️', text: 'Çoklu gün rota planlama' },
            { icon: '🤖', text: 'AI destekli güzergah optimizasyonu' },
            { icon: '⏱️', text: 'Otomatik zaman çizelgesi hesaplama' },
          ].map((f) => (
            <div key={f.text} className="flex items-center gap-3 text-secondary text-sm">
              <span>{f.icon}</span>
              <span>{f.text}</span>
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-2xl">
            <span className="text-red-400 text-sm">{error}</span>
          </div>
        )}

        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative flex items-center justify-center w-5 h-5">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="peer appearance-none w-5 h-5 rounded-md card-border border bg-white/5 checked:bg-blue-500 checked:border-blue-500 transition-all cursor-pointer shadow-sm"
                aria-label="Beni hatırla"
              />
              <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <span className="text-sm font-medium text-secondary group-hover:text-primary transition-colors select-none">
              Beni Hatırla
            </span>
          </label>

          <button
            onClick={handleSignIn}
            disabled={signingIn || loading}
            className="w-full flex items-center justify-center gap-3 py-4 px-6 btn-primary font-semibold rounded-[1.25rem] shadow-lg shadow-blue-500/20"
            aria-label="Google ile giriş yap"
          >
          {signingIn ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="white" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="rgba(255,255,255,0.8)" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="rgba(255,255,255,0.6)" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="rgba(255,255,255,0.7)" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          {signingIn ? 'Giriş yapılıyor...' : 'Google ile Giriş Yap'}
          </button>

        <p className="text-center text-muted text-xs">
          Giriş yaparak hizmet koşullarını kabul etmiş olursunuz.
        </p>
      </div>
    </div>
    </div>
  );
}
