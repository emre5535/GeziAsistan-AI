import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 flex items-center justify-center bg-zinc-950 p-6 z-50">
          <div className="glass-card rounded-[2.5rem] border border-white/10 bg-white/5 backdrop-blur-3xl p-10 max-w-md w-full text-center space-y-6 shadow-xl shadow-black/20">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle size={32} className="text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Beklenmedik Bir Hata Oluştu</h2>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Uygulama bir sorunla karşılaştı. Sayfayı yenileyerek tekrar deneyin.
              </p>
              {this.state.error && (
                <code className="block mt-3 text-xs text-red-400/80 bg-red-500/10 rounded-xl p-3 text-left overflow-auto max-h-32">
                  {this.state.error.message}
                </code>
              )}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-2xl transition-all active:scale-95"
              aria-label="Sayfayı yenile"
            >
              <RefreshCw size={16} />
              Sayfayı Yenile
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
