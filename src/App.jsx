import { useEffect, useState } from 'react';
import './index.css';
import { initFirebase } from './utils/firebase';
import { ThemeProvider } from './contexts/ThemeContext';
import { useAuth } from './hooks/useAuth';
import { useRoutes, getRouteOnce, saveRoute } from './hooks/useRoutes';
import { useSaveStatus } from './hooks/useSaveStatus';
import { useToast } from './hooks/useToast';
import { useUndoRedo } from './hooks/useUndoRedo';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastContainer } from './components/Toast';
import { FullScreenLoader } from './components/Skeleton';
import { LoginScreen } from './screens/LoginScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { EditorScreen } from './screens/EditorScreen';
import { Share2, AlertCircle } from 'lucide-react';

// ─── Initialize Firebase ─────────────────────────────────────────────────────
let firebaseReady = false;
try {
  initFirebase();
  firebaseReady = true;
} catch (e) {
  console.error('Firebase init failed:', e);
}

// ─── Config guard ─────────────────────────────────────────────────────────────
function ConfigError() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="text-center space-y-4 max-w-md">
        <div className="text-4xl">⚙️</div>
        <h1 className="text-xl font-bold text-white">Yapılandırma Eksik</h1>
        <p className="text-zinc-400 text-sm">
          <code className="text-blue-400">index.html</code> içindeki{' '}
          <code className="text-yellow-400">window.__firebase_config</code> ve{' '}
          <code className="text-yellow-400">window.__gemini_api_key</code>{' '}
          değerlerini kendi proje bilgilerinizle doldurun.
        </p>
      </div>
    </div>
  );
}

// ─── Inner App (uses hooks that depend on Firebase) ───────────────────────────
function InnerApp() {
  const { user, loading: authLoading, signingIn, error: authError, signIn, logout } = useAuth();
  const { routes, loading: routesLoading, createRoute, deleteRoute, copyRoute } = useRoutes(user?.uid);
  const saveStatus = useSaveStatus();
  const { toasts, toast, removeToast } = useToast();

  // Editor state
  const [view, setView] = useState('dashboard'); // 'login' | 'dashboard' | 'editor'
  const [activeRouteId, setActiveRouteId] = useState(null);
  const [activeRouteInitial, setActiveRouteInitial] = useState(null);

  // Shared Route state
  const [sharedRouteData, setSharedRouteData] = useState(null);
  const [sharedLoading, setSharedLoading] = useState(false);
  const [sharedError, setSharedError] = useState(false);

  // Guest and Local Route state
  const [isGuest, setIsGuest] = useState(() => localStorage.getItem('gezi_guest_mode') === 'true');
  const [guestRoutes, setGuestRoutes] = useState(() => {
    try { return JSON.parse(localStorage.getItem('gezi_guest_routes') || '[]'); } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('gezi_guest_routes', JSON.stringify(guestRoutes));
  }, [guestRoutes]);

  const displayRoutes = user ? routes : guestRoutes;

  // Find the current route data
  const activeRouteData = displayRoutes.find(r => r.id === activeRouteId) || activeRouteInitial;

  // Undo/redo for itinerary
  const undoRedo = useUndoRedo(activeRouteData || {});

  // For pending route navigation
  const [pendingRouteId, setPendingRouteId] = useState(null);

  // When a pending route finally appears in 'routes', open it
  useEffect(() => {
    if (pendingRouteId) {
      const found = displayRoutes.find(r => r.id === pendingRouteId);
      if (found) {
        openRoute(found);
        setPendingRouteId(null);
      }
    }
  }, [displayRoutes, pendingRouteId]);

  // URL deep linking: ?route=<id>&owner=<uid>
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const rid = params.get('route');
    const owner = params.get('owner');

    if (rid && user && !activeRouteData && view === 'dashboard') {
      if (owner && owner !== user.uid) {
        if (!sharedRouteData && !sharedLoading && !sharedError) {
          setSharedLoading(true);
          getRouteOnce(owner, rid)
            .then(data => {
              if (data) setSharedRouteData(data);
              else setSharedError(true);
            })
            .catch(() => setSharedError(true))
            .finally(() => setSharedLoading(false));
        }
      } else {
        const found = displayRoutes.find(r => r.id === rid);
        if (found) openRoute(found);
      }
    }
  }, [user, displayRoutes, activeRouteData, view, sharedRouteData, sharedLoading, sharedError]);

  // Redirect based on auth
  useEffect(() => {
    if (authLoading) return;
    if (!user && !isGuest) setView('login');
    else if (view === 'login') setView('dashboard');
  }, [user, isGuest, authLoading, view]);

  const openRoute = (route) => {
    setActiveRouteId(route.id);
    setActiveRouteInitial(route);
    undoRedo.set(route);
    setView('editor');
    // Update URL
    const url = new URL(window.location.href);
    url.searchParams.set('route', route.id);
    window.history.pushState({}, '', url);
  };

  const handleOpenRoute = (id) => {
    const found = displayRoutes.find(r => r.id === id);
    if (found) openRoute(found);
  };

  const handleCreateRoute = async (name) => {
    if (!user && isGuest) {
      const newId = `local-${Date.now()}`;
      setGuestRoutes(prev => [{ id: newId, name, startDate: '', startTime: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), itinerary: [] }, ...prev]);
      setActiveRouteId(newId);
      setView('editor');
      return;
    }
    const id = await createRoute(name);
    if (id) {
      setActiveRouteId(id);
      setView('editor');
    }
  };

  const handleImportRoute = async (routeData) => {
    if (!user && isGuest) {
      const newId = `local-${Date.now()}`;
      const toSave = { ...routeData, id: newId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      setGuestRoutes(prev => [toSave, ...prev]);
      toast.success('Örnek rota eklendi! 🗺️');
    } else if (user) {
      const newId = await createRoute(routeData.name);
      if (newId) {
        const toSave = { ...routeData, id: undefined, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        await saveRoute(user.uid, newId, toSave);
        toast.success('Örnek rota eklendi! 🗺️');
      }
    }
  };

  const handleBackToDashboard = () => {
    setView('dashboard');
    setActiveRouteId(null);
    // Clear URL param
    const url = new URL(window.location.href);
    url.searchParams.delete('route');
    window.history.pushState({}, '', url);
  };

  const handleCancelShared = () => {
    setSharedRouteData(null);
    setSharedError(false);
    const url = new URL(window.location.href);
    url.searchParams.delete('owner');
    url.searchParams.delete('route');
    window.history.pushState({}, '', url);
  };

  const handleSaveSharedRoute = async () => {
    if (!sharedRouteData) return;

    if (!user && isGuest) {
      const newId = `local-${Date.now()}`;
      const toSave = { ...sharedRouteData, name: `${sharedRouteData.name} (Paylaşılan)`, id: newId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      setGuestRoutes(prev => [toSave, ...prev]);
      
      setSharedRouteData(null);
      const url = new URL(window.location.href);
      url.searchParams.delete('owner');
      url.searchParams.set('route', newId);
      window.history.pushState({}, '', url);
      
      openRoute(toSave);
      toast.success('Paylaşılan rota başarıyla kopyalandı! 🚀');
      return;
    }

    const newId = await createRoute(`${sharedRouteData.name} (Paylaşılan)`);
    if (newId) {
      const toSave = { ...sharedRouteData, name: `${sharedRouteData.name} (Paylaşılan)`, id: undefined };
      await saveRoute(user.uid, newId, toSave);
      
      setSharedRouteData(null);
      const url = new URL(window.location.href);
      url.searchParams.delete('owner');
      url.searchParams.set('route', newId);
      window.history.pushState({}, '', url);
      
      const dummyRoute = { ...toSave, id: newId };
      openRoute(dummyRoute);
      toast.success('Paylaşılan rota başarıyla kopyalandı! 🚀');
    }
  };

  const handleGuestSignIn = () => {
    setIsGuest(true);
    localStorage.setItem('gezi_guest_mode', 'true');
  };

  if (authLoading || sharedLoading) return <FullScreenLoader message="Bilgiler yükleniyor..." />;

  if (view === 'login' || (!user && !isGuest)) {
    return <LoginScreen onSignIn={signIn} onGuestSignIn={handleGuestSignIn} loading={authLoading} signingIn={signingIn} error={authError} />;
  }

  // Check if we need to render shared route modal overlay
  const renderSharedModal = () => {
    if (!sharedRouteData && !sharedError) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleCancelShared}></div>
        <div className="card-bg card-border border backdrop-blur-3xl rounded-[2.5rem] p-8 w-full max-w-sm relative z-10 shadow-2xl animate-in fade-in zoom-in duration-300">
          {sharedError ? (
            <div className="text-center space-y-4">
              <AlertCircle size={48} className="text-red-500 mx-auto" />
              <h3 className="text-xl font-bold text-primary">Rota Bulunamadı</h3>
              <p className="text-secondary text-sm">Bu rota silinmiş veya erişime kapalı olabilir.</p>
              <button onClick={handleCancelShared} className="w-full btn-primary py-3 rounded-2xl font-medium mt-2">Tamam</button>
            </div>
          ) : (
            <div className="text-center space-y-5">
              <div className="w-16 h-16 bg-blue-500/10 rounded-[1.5rem] flex items-center justify-center mx-auto border border-blue-500/20">
                <Share2 size={28} className="text-blue-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-primary">{sharedRouteData.name}</h3>
                <p className="text-secondary text-sm mt-2">Bu rotayı kendi hesabınıza kopyalayıp düzenlemek ister misiniz?</p>
              </div>
              <div className="flex flex-col gap-2 mt-4">
                <button onClick={handleSaveSharedRoute} className="w-full btn-primary py-3.5 rounded-2xl font-medium shadow-lg shadow-blue-500/20 text-sm">Rotayı Kaydet</button>
                <button onClick={handleCancelShared} className="w-full py-3.5 rounded-2xl text-secondary hover:text-primary transition-colors text-sm font-medium">Vazgeç</button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (view === 'editor' && activeRouteData) {
    return (
      <EditorScreen
        uid={user ? user.uid : 'guest'}
        routeId={activeRouteId}
        initialRoute={activeRouteInitial}
        onBack={handleBackToDashboard}
        saveStatus={user ? saveStatus : { status: 'saved', setSaving: ()=>{}, setSaved: ()=>{}, setError: ()=>{} }}
        toast={toast}
        undoRedo={undoRedo}
        onGuestSave={!user ? (data) => setGuestRoutes(prev => prev.map(r => r.id === activeRouteId ? { ...r, ...data, updatedAt: new Date().toISOString() } : r)) : null}
      />
    );
  }

  return (
    <>
      <DashboardScreen
        user={user}
        routes={displayRoutes}
        loading={user ? routesLoading : false}
        onOpenRoute={handleOpenRoute}
        onCreateRoute={handleCreateRoute}
        onImportRoute={handleImportRoute}
        onDeleteRoute={user ? deleteRoute : (id) => setGuestRoutes(prev => prev.filter(r => r.id !== id))}
        onCopyRoute={user ? copyRoute : (route) => setGuestRoutes(prev => [{...route, id: `local-${Date.now()}`, name: `${route.name} (Kopya)`, createdAt: new Date().toISOString()}, ...prev])}
        onLogout={() => { logout(); setIsGuest(false); localStorage.removeItem('gezi_guest_mode'); }}
      />
      {renderSharedModal()}
    </>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  const { toasts, toast, removeToast } = useToast();

  if (!firebaseReady) return <ConfigError />;

  return (
    <ThemeProvider>
      <ErrorBoundary>
        <InnerApp />
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </ErrorBoundary>
    </ThemeProvider>
  );
}
