import { useState } from 'react';
import { LogOut, Plus, Trash2, Copy, MapPin, Search, X, Check, Route, Calendar } from 'lucide-react';
import { AmbientBackground } from '../components/AmbientBackground';
import { RouteSkeleton } from '../components/Skeleton';
import { ThemeToggle } from '../components/ThemeToggle';
import { getSampleRoute } from '../sampleRoute';
import { formatTimestamp, computeRouteStats } from '../utils/algorithms';

const INPUT_CLS = 'input-themed bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all w-full';

function RouteCard({ route, onOpen, onDelete, onCopy }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const stats = computeRouteStats(route.itinerary || [], route.dayStartTimes || {});

  return (
    <div
      className="group rounded-[2rem] border card-border card-bg backdrop-blur-3xl p-5 space-y-3 cursor-pointer transition-all duration-300 hover:bg-white/10 hover:border-blue-500/30 hover:shadow-xl hover:shadow-blue-500/5 relative"
      onClick={() => onOpen(route.id)}
      role="button"
      tabIndex={0}
      aria-label={`Rotayı aç: ${route.name}`}
      onKeyDown={(e) => e.key === 'Enter' && onOpen(route.id)}
    >
      {/* Name */}
      <h3 className="font-bold text-primary text-lg leading-tight pr-16">{route.name}</h3>

      {/* Stats row */}
      <div className="flex flex-wrap gap-3 text-xs text-zinc-400">
        <span className="flex items-center gap-1 text-secondary">
          <Calendar size={12} />
          {stats.days} gün
        </span>
        <span className="flex items-center gap-1 text-secondary">
          <MapPin size={12} />
          {stats.stops} durak
        </span>
        <span className="flex items-center gap-1 text-secondary">
          <Route size={12} />
          {stats.totalDistKm} km
        </span>
      </div>

      <p className="text-zinc-500 text-xs">{formatTimestamp(route.createdAt)}</p>

      {/* Action buttons */}
      <div
        className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => onCopy(route)}
          className="p-2 rounded-xl bg-white/10 hover:bg-blue-500/20 text-zinc-400 hover:text-blue-400 transition-all active:scale-95"
          aria-label="Rotayı kopyala"
          title="Kopyala"
        >
          <Copy size={14} />
        </button>
        {confirmDelete ? (
          <div className="flex gap-1">
            <button
              onClick={() => onDelete(route.id)}
              className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-all active:scale-95"
              aria-label="Silmeyi onayla"
              title="Evet, Sil"
            >
              <Check size={14} />
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="p-2 rounded-xl icon-btn"
              aria-label="İptal"
              title="İptal"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="p-2 rounded-xl icon-btn hover:text-red-500"
            aria-label="Rotayı sil"
            title="Sil"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

function NewRouteCard({ onCreate, onCancel }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await onCreate(name);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-[2rem] border card-border card-bg backdrop-blur-3xl p-5 space-y-3 relative overflow-hidden">
      <div className="absolute inset-0 bg-blue-500/5 pointer-events-none"></div>
      <h3 className="font-semibold text-primary text-sm relative">Yeni Rota Oluştur</h3>
      <input
        autoFocus
        type="text"
        placeholder="Rota adı..."
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') handle(); if (e.key === 'Escape') onCancel(); }}
        className={INPUT_CLS}
        maxLength={80}
        aria-label="Yeni rota adı"
      />
      <div className="flex gap-2">
        <button
          onClick={handle}
          disabled={!name.trim() || loading}
          className="flex-1 py-2.5 btn-primary font-semibold rounded-2xl text-sm disabled:opacity-40"
          aria-label="Rotayı oluştur"
        >
          {loading ? 'Oluşturuluyor...' : 'Oluştur'}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2.5 rounded-2xl icon-btn text-sm"
          aria-label="İptal"
        >
          İptal
        </button>
      </div>
    </div>
  );
}

export function DashboardScreen({ user, routes, loading, onOpenRoute, onCreateRoute, onDeleteRoute, onCopyRoute, onLogout, onImportRoute }) {
  const [search, setSearch] = useState('');
  const [showNewCard, setShowNewCard] = useState(false);

  const filtered = routes.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async (name) => {
    try {
      await onCreateRoute(name);
      setShowNewCard(false);
    } catch (e) {
      // Error handled by app
    }
  };

  const handleLoadSample = () => {
    if (onImportRoute) {
      onImportRoute(getSampleRoute());
    }
  };

  return (
    <div className="min-h-screen page-bg">
      <AmbientBackground />
      {/* Header */}
      <header className="no-print sticky top-0 z-30 backdrop-blur-3xl header-bg border-b card-border">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-sky-400 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <MapPin size={16} className="text-white" />
            </div>
            <span className="font-bold text-primary text-lg hidden sm:block">Gezi Asistanı</span>
          </div>
          <div className="flex items-center gap-3">
            {user?.photoURL ? (
              <img src={user.photoURL} alt={user.displayName} className="w-8 h-8 rounded-full border border-white/20" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                <span className="text-blue-400 text-xs font-bold">M</span>
              </div>
            )}
            <span className="text-secondary text-sm hidden sm:block">{user?.displayName || 'Misafir Kullanıcı'}</span>
            <ThemeToggle />
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-2xl icon-btn text-sm"
              aria-label="Çıkış yap"
            >
              <LogOut size={16} />
              <span className="hidden sm:block">Çıkış</span>
            </button>
          </div>
        </div>
      </header>

      {/* Body */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Title + search + new */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-primary">Rotalarım</h2>
            <p className="text-secondary text-sm mt-1">{routes.length} rota</p>
          </div>
          <div className="flex gap-3 items-center">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Rota ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-themed pl-9 pr-4 py-2.5 rounded-2xl text-sm w-48"
                aria-label="Rota ara"
              />
            </div>
            <button
              onClick={handleLoadSample}
              className="hidden sm:flex items-center gap-2 px-4 py-2.5 card-border card-bg hover:bg-white/5 font-semibold rounded-2xl text-sm whitespace-nowrap text-secondary transition-all"
              aria-label="Örnek Rota Yükle"
            >
              <MapPin size={16} className="text-blue-400" />
              <span>Örnek Ege Turu Yükle</span>
            </button>
            <button
              onClick={() => setShowNewCard(true)}
              className="flex items-center gap-2 px-4 py-2.5 btn-primary font-semibold rounded-2xl text-sm whitespace-nowrap shadow-lg shadow-blue-500/20"
              aria-label="Yeni rota oluştur"
            >
              <Plus size={16} />
              <span>Yeni Rota</span>
            </button>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {showNewCard && (
            <NewRouteCard onCreate={handleCreate} onCancel={() => setShowNewCard(false)} />
          )}

          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <RouteSkeleton key={i} />)
          ) : filtered.length === 0 && !showNewCard ? (
            <div className="col-span-full flex flex-col items-center justify-center py-24 gap-6">
              <div className="w-24 h-24 card-bg rounded-[2rem] flex items-center justify-center shadow-sm">
                <MapPin size={40} className="text-muted" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-semibold text-primary mb-2">
                  {search ? 'Sonuç bulunamadı' : 'Henüz rotanız yok'}
                </h3>
                <p className="text-secondary text-sm">
                  {search ? `"${search}" ile eşleşen rota yok.` : 'İlk rotanı oluştur ve seyahatini planlamaya başla!'}
                </p>
              </div>
              {!search && (
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setShowNewCard(true)}
                    className="flex items-center justify-center gap-2 px-6 py-3 btn-primary font-semibold rounded-2xl shadow-lg shadow-blue-500/20 w-full sm:w-auto"
                    aria-label="İlk rotayı oluştur"
                  >
                    <Plus size={20} />
                    İlk Rotanı Oluştur
                  </button>
                  <button
                    onClick={handleLoadSample}
                    className="flex items-center justify-center gap-2 px-6 py-3 card-border card-bg text-primary hover:bg-white/5 font-semibold rounded-2xl transition-all w-full sm:w-auto"
                    aria-label="Örnek Ege Turu Yükle"
                  >
                    <MapPin size={20} className="text-blue-400" />
                    Örnek Ege Turu Yükle
                  </button>
                </div>
              )}
            </div>
          ) : (
            filtered.map((route) => (
              <RouteCard
                key={route.id}
                route={route}
                onOpen={onOpenRoute}
                onDelete={onDeleteRoute}
                onCopy={onCopyRoute}
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
}
