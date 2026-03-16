import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft, Save, Share2, RotateCcw, Loader2, CheckCircle,
  AlertCircle, Undo2, Redo2, MapPin, Sparkles, Calendar,
  Route, Clock, Printer
} from 'lucide-react';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { nanoid } from 'nanoid';
import { DayTabs } from '../editor/DayTabs';
import { StopCard } from '../editor/StopCard';
import { Connector } from '../editor/Connector';
import { SmartSearch } from '../editor/SmartSearch';
import { AIPanel } from '../editor/AIPanel';
import { AmbientBackground } from '../components/AmbientBackground';
import { ThemeToggle } from '../components/ThemeToggle';
import { saveRoute } from '../hooks/useRoutes';
import { calculateTimeline, computeRouteStats, formatDuration } from '../utils/algorithms';

const INPUT_CLS = 'input-themed rounded-[1rem] px-3 py-2 text-sm font-medium w-full';

function SaveIndicator({ status, onRetry }) {
  if (status === 'idle') return null;
  return (
    <div className="flex items-center gap-1.5 text-xs">
      {status === 'saving' && <><Loader2 size={13} className="animate-spin text-blue-400" /><span className="text-zinc-400">Kaydediliyor...</span></>}
      {status === 'saved' && <><CheckCircle size={13} className="text-emerald-400" /><span className="text-emerald-400">Kaydedildi</span></>}
      {status === 'error' && (
        <><AlertCircle size={13} className="text-red-400" /><span className="text-red-400">Kayıt Hatası</span>
          <button onClick={onRetry} className="underline text-red-400 hover:text-red-300 ml-1">Tekrar</button>
        </>
      )}
    </div>
  );
}

export function EditorScreen({ uid, routeId, initialRoute, onBack, saveStatus, toast, undoRedo, onGuestSave }) {
  const { state: route, set: setRoute, undo, redo, canUndo, canRedo } = undoRedo;
  const [activeDay, setActiveDay] = useState(1);
  const [mobileTab, setMobileTab] = useState('stops'); // 'stops' | 'ai'
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(route?.name || '');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const saveTimerRef = useRef(null);

  // Debounced auto-save
  const scheduleSave = useCallback((data) => {
    saveStatus.setSaving();
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        if (uid === 'guest') {
          if (onGuestSave) onGuestSave(data);
          saveStatus.setSaved();
          return;
        }
        await saveRoute(uid, routeId, data);
        saveStatus.setSaved();
      } catch {
        saveStatus.setError();
      }
    }, 1500);
  }, [uid, routeId, saveStatus, onGuestSave]);

  const updateRoute = useCallback((patch) => {
    const next = typeof patch === 'function' ? patch(route) : { ...route, ...patch };
    setRoute(next);
    scheduleSave(next);
  }, [route, setRoute, scheduleSave]);

  // Resolve active day
  const days = [...new Set((route?.itinerary || []).map(i => i.day))].sort((a, b) => a - b);
  const allDays = days.length > 0 ? days : [1];
  const maxDay = Math.max(...allDays);

  const addDay = () => {
    const newDay = maxDay + 1;
    updateRoute({ dayStartTimes: { ...(route.dayStartTimes || {}), [newDay]: '09:00' }, dayDates: { ...(route.dayDates || {}), [newDay]: '' } });
    setActiveDay(newDay);
  };

  const deleteDay = (day) => {
    if (allDays.length <= 1) return;
    const remaining = allDays.filter(d => d !== day);
    // Renumber days above deleted
    const remap = {};
    remaining.forEach((d, i) => { remap[d] = i + 1; });
    const newItinerary = (route.itinerary || []).filter(i => i.day !== day).map(i => ({ ...i, day: remap[i.day] ?? i.day }));
    const newStartTimes = {};
    const newDates = {};
    remaining.forEach(d => { newStartTimes[remap[d]] = (route.dayStartTimes || {})[d] || '09:00'; newDates[remap[d]] = (route.dayDates || {})[d] || ''; });
    updateRoute({ itinerary: newItinerary, dayStartTimes: newStartTimes, dayDates: newDates });
    setActiveDay(Math.min(activeDay, remaining.length));
  };

  // Day items sorted
  const dayItems = (route?.itinerary || []).filter(i => i.day === activeDay).sort((a, b) => a.order - b.order);

  // Timeline enriched
  const startTime = (route?.dayStartTimes || {})[activeDay] || '09:00';
  const enriched = calculateTimeline(dayItems, startTime);

  // Stats
  const stats = computeRouteStats(route?.itinerary || [], route?.dayStartTimes || {});

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = dayItems.findIndex(i => i.id === active.id);
    const newIdx = dayItems.findIndex(i => i.id === over.id);
    const reordered = arrayMove(dayItems, oldIdx, newIdx).map((item, idx) => ({ ...item, order: idx }));
    const merged = [...(route.itinerary || []).filter(i => i.day !== activeDay), ...reordered];
    updateRoute({ itinerary: merged });
  };

  const handleStopUpdate = (id, patch) => {
    const next = (route.itinerary || []).map(i => i.id === id ? { ...i, ...patch } : i);
    updateRoute({ itinerary: next });
  };

  const handleStopDelete = (id) => {
    const next = (route.itinerary || []).filter(i => i.id !== id);
    updateRoute({ itinerary: next });
  };

  const handleAddStop = (stop) => {
    const maxOrder = Math.max(-1, ...dayItems.map(i => i.order));
    const newStop = { ...stop, day: activeDay, order: maxOrder + 1, notes: stop.notes || '' };
    updateRoute({ itinerary: [...(route.itinerary || []), newStop] });
  };

  const handleAddStops = (stops) => {
    const maxOrder = Math.max(-1, ...dayItems.map(i => i.order));
    const newStops = stops.map((s, i) => ({ ...s, day: activeDay, order: maxOrder + 1 + i }));
    updateRoute({ itinerary: [...(route.itinerary || []), ...newStops] });
  };

  const handleOptimizeItinerary = (newItinerary) => updateRoute({ itinerary: newItinerary });

  const handleNameSave = () => {
    setEditingName(false);
    if (nameInput.trim()) updateRoute({ name: nameInput.trim() });
    else setNameInput(route.name);
  };

  const handleShare = () => {
    const url = `${window.location.origin}?route=${routeId}&owner=${uid}`;
    navigator.clipboard.writeText(url).then(() => toast.success('URL panoya kopyalandı!'));
  };

  const handleManualSave = async () => {
    saveStatus.setSaving();
    try {
      if (uid === 'guest') {
        if (onGuestSave) onGuestSave(route);
        saveStatus.setSaved();
        toast.success('Manuel olarak kaydedildi.');
        return;
      }
      await saveRoute(uid, routeId, route);
      saveStatus.setSaved();
      toast.success('Manuel olarak kaydedildi.');
    } catch {
      saveStatus.setError();
      toast.error('Kayıt başarısız.');
    }
  };

  const handleReset = () => {
    updateRoute(initialRoute);
    setShowResetConfirm(false);
    toast.info('Rota sıfırlandı.');
  };

  const handlePrint = () => window.print();

  // Left column content
  const LeftColumn = (
    <div className="flex flex-col gap-4 h-full overflow-y-auto pr-1">
      {/* Day settings */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">Tarih</label>
          <input type="date" value={(route?.dayDates || {})[activeDay] || ''}
            onChange={(e) => updateRoute({ dayDates: { ...(route.dayDates || {}), [activeDay]: e.target.value } })}
            className="input-themed w-full rounded-xl px-3 py-2 text-sm" aria-label="Gün tarihi" />
        </div>
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">Başlangıç</label>
          <input type="time" value={(route?.dayStartTimes || {})[activeDay] || '09:00'}
            onChange={(e) => updateRoute({ dayStartTimes: { ...(route.dayStartTimes || {}), [activeDay]: e.target.value } })}
            className="input-themed w-full rounded-xl px-3 py-2 text-sm" aria-label="Gün başlangıç saati" />
        </div>
      </div>

      {/* Stops */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} modifiers={[restrictToVerticalAxis]}>
        <SortableContext items={dayItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-1">
            {enriched.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-14 h-14 card-bg card-border rounded-[1.5rem] flex items-center justify-center mb-3 shadow-sm">
                  <MapPin size={24} className="text-muted" />
                </div>
                <p className="text-secondary text-sm font-medium">Bu günde henüz durak yok.</p>
                <p className="text-muted text-xs mt-1">Aşağıdan konum ekle veya AI öner butonunu kullan.</p>
              </div>
            )}
            {enriched.map((item, idx) => (
              <div key={item.id}>
                {idx > 0 && <Connector from={enriched[idx - 1]} to={item} />}
                <StopCard
                  item={item}
                  onUpdate={(patch) => handleStopUpdate(item.id, patch)}
                  onDelete={handleStopDelete}
                />
              </div>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Smart Search */}
      <SmartSearch onAddStop={handleAddStop} />
    </div>
  );

  // Right column / AI panel
  const RightPanel = (
    <AIPanel
      itinerary={route?.itinerary || []}
      activeDay={activeDay}
      routeName={route?.name || ''}
      onUpdateItinerary={handleOptimizeItinerary}
      onAddStops={handleAddStops}
      toast={toast}
    />
  );

  return (
    <div className="min-h-screen page-bg flex flex-col">
      <AmbientBackground />

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="no-print sticky top-0 z-30 backdrop-blur-3xl header-bg border-b card-border">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Back */}
            <button onClick={onBack} className="p-2 rounded-2xl icon-btn" aria-label="Geri dön">
              <ArrowLeft size={18} />
            </button>

            {/* Name */}
            {editingName ? (
              <input autoFocus value={nameInput} onChange={(e) => setNameInput(e.target.value)}
                onBlur={handleNameSave} onKeyDown={(e) => { if (e.key === 'Enter') handleNameSave(); if (e.key === 'Escape') { setEditingName(false); setNameInput(route.name); } }}
                className="input-themed font-bold text-lg rounded-[1rem] px-3 py-1.5 w-48 sm:w-72"
                aria-label="Rota adını düzenle" />
            ) : (
              <button onClick={() => setEditingName(true)} className="font-bold text-primary text-lg hover:text-blue-500 transition-colors truncate max-w-[180px] sm:max-w-xs" aria-label="Rota adını düzenle" title="Düzenlemek için tıkla">
                {route?.name}
              </button>
            )}

            <SaveIndicator status={saveStatus.status} onRetry={handleManualSave} />

            <div className="ml-auto flex items-center gap-2 flex-wrap">
              {/* Undo/Redo */}
              <button onClick={undo} disabled={!canUndo} className="p-2 rounded-2xl icon-btn disabled:opacity-30" aria-label="Geri al (Ctrl+Z)"><Undo2 size={15} /></button>
              <button onClick={redo} disabled={!canRedo} className="p-2 rounded-2xl icon-btn disabled:opacity-30" aria-label="İleri al (Ctrl+Y)"><Redo2 size={15} /></button>
              <ThemeToggle />
              {/* Reset */}
              {showResetConfirm ? (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted hidden sm:block">Emin misiniz?</span>
                  <button onClick={handleReset} className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs rounded-2xl transition-all active:scale-95">Evet</button>
                  <button onClick={() => setShowResetConfirm(false)} className="px-3 py-1.5 icon-btn text-xs rounded-2xl">İptal</button>
                </div>
              ) : (
                <button onClick={() => setShowResetConfirm(true)} className="p-2 rounded-2xl icon-btn hover:text-red-500" aria-label="Rotayı sıfırla" title="Sıfırla"><RotateCcw size={15} /></button>
              )}
              <button onClick={handleManualSave} className="p-2 rounded-2xl icon-btn hover:text-emerald-500" aria-label="Kaydet" title="Kaydet"><Save size={15} /></button>
              <button onClick={handlePrint} className="p-2 rounded-2xl icon-btn" aria-label="Yazdır/PDF" title="Yazdır/PDF"><Printer size={15} /></button>
              <button onClick={handleShare} className="p-2 rounded-2xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 transition-all active:scale-95" aria-label="Paylaş" title="URL Paylaş"><Share2 size={15} /></button>
            </div>
          </div>

          {/* Stats strip */}
          <div className="flex items-center gap-4 mt-2 pt-2 border-t card-border flex-wrap">
            {[
              { icon: Calendar, label: `${stats.days} Gün` },
              { icon: MapPin, label: `${stats.stops} Durak` },
              { icon: Route, label: `${stats.totalDistKm} km` },
              { icon: Clock, label: formatDuration(stats.totalStayMin) },
            ].map(({ icon: Icon, label }) => (
              <span key={label} className="flex items-center gap-1.5 text-xs text-secondary font-medium">
                <Icon size={11} className="text-blue-500" />
                {label}
              </span>
            ))}
          </div>
        </div>
      </header>

      {/* ── Day Tabs ─────────────────────────────────────────────────────── */}
      <div className="no-print max-w-7xl mx-auto px-4 pt-4 w-full">
        <DayTabs days={allDays} activeDay={activeDay} dayDates={route?.dayDates || {}}
          onSelectDay={setActiveDay} onAddDay={addDay} onDeleteDay={deleteDay} />
      </div>

      {/* ── Mobile tab switcher ───────────────────────────────────────────── */}
      <div className="no-print md:hidden max-w-7xl mx-auto px-4 pt-3 w-full">
        <div className="flex border-b card-border">
          {[{ key: 'stops', label: 'Duraklar', icon: MapPin }, { key: 'ai', label: 'AI Asistan', icon: Sparkles }].map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setMobileTab(key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all ${mobileTab === key ? 'text-blue-500 border-b-2 border-blue-500' : 'text-muted hover:text-primary'}`}
              aria-selected={mobileTab === key} role="tab" aria-label={label}>
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Content ──────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl mx-auto px-4 py-4 w-full">
        {/* Desktop: two columns */}
        <div className="hidden md:grid md:grid-cols-[1fr,340px] gap-6 h-full">
          <div className="min-h-0">{LeftColumn}</div>
          <div className="sticky top-[130px] max-h-[calc(100vh-150px)] overflow-y-auto w-full scrollbar-hide">
            <div className="rounded-[2rem] card-border card-bg backdrop-blur-3xl p-5 shadow-sm border">
              {RightPanel}
            </div>
          </div>
        </div>

        {/* Mobile: single column with tabs */}
        <div className="md:hidden">
          {mobileTab === 'stops' ? LeftColumn : (
            <div className="rounded-[2rem] card-border card-bg backdrop-blur-3xl p-5 shadow-sm border">
              {RightPanel}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
