import { useState, memo } from 'react';
import { GripVertical, MapPin, BedDouble, ExternalLink, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const DURATION_OPTIONS = [
  { value: 0, label: 'Geçiş Noktası' },
  { value: 15, label: '15 dk' },
  { value: 30, label: '30 dk' },
  { value: 45, label: '45 dk' },
  { value: 60, label: '1 sa' },
  { value: 90, label: '1 sa 30 dk' },
  { value: 120, label: '2 sa' },
  { value: 180, label: '3 sa' },
  { value: 240, label: '4 sa' },
  { value: 'custom', label: 'Özel...' },
];

const SELECT_CLS = 'input-themed rounded-2xl px-3 py-1.5 text-xs appearance-none cursor-pointer';
const INPUT_CLS = 'input-themed rounded-2xl px-3 py-1.5 text-xs w-20';

const MapPreview = memo(({ lat, lng, name }) => {
  const [loaded, setLoaded] = useState(false);
  if (!lat || !lng) return null;
  return (
    <a 
      href={`https://maps.google.com/maps?q=${lat},${lng}`}
      target="_blank"
      rel="noopener noreferrer"
      className="map-preview relative w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 bg-zinc-800 block cursor-pointer group"
      title={`${name} - Haritada Aç`}
    >
      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-center justify-center pointer-events-none">
        <ExternalLink size={16} className="text-white drop-shadow-md" />
      </div>
      {!loaded && <div className="absolute inset-0 skeleton-shimmer bg-zinc-800 animate-pulse rounded-2xl" aria-hidden="true" />}
      <iframe
        title={`${name} harita`}
        src={`https://maps.google.com/maps?q=${lat},${lng}&t=k&z=15&output=embed`}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className={`w-full h-full border-0 transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        scrolling="no"
        style={{ pointerEvents: 'none' }}
        aria-hidden="true"
      />
    </a>
  );
});

export const StopCard = memo(function StopCard({ item, onUpdate, onDelete }) {
  const [showNotes, setShowNotes] = useState(false);
  const [customDuration, setCustomDuration] = useState('');
  const [isCustom, setIsCustom] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, zIndex: isDragging ? 50 : undefined };

  const handleDurationChange = (val) => {
    if (val === 'custom') {
      setIsCustom(true);
    } else {
      setIsCustom(false);
      onUpdate({ duration: Number(val) });
    }
  };

  const handleCustomDuration = () => {
    const n = parseInt(customDuration, 10);
    if (n >= 1 && n <= 480) { onUpdate({ duration: n }); setIsCustom(false); }
  };

  const isOver24 = item.arrivalTime && parseInt(item.arrivalTime.split(':')[0], 10) >= 24;
  const bgClass = item.isAccommodation
    ? 'bg-amber-500/5 border-amber-500/30'
    : 'card-bg card-border';

  return (
    <div ref={setNodeRef} style={style} className={`rounded-[2rem] border ${bgClass} backdrop-blur-3xl p-4 transition-all duration-300 shadow-sm relative overflow-hidden group/card`}>
      <div className="absolute inset-0 bg-black/5 opacity-0 group-hover/card:opacity-100 transition-opacity pointer-events-none dark:bg-white/5"></div>
      {/* Top row */}
      <div className="flex items-start gap-3">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="mt-1 text-zinc-600 hover:text-zinc-400 cursor-grab active:cursor-grabbing flex-shrink-0 touch-none"
          aria-label="Sürükle"
          title="Yeniden sırala"
        >
          <GripVertical size={16} />
        </button>

        {/* Icon */}
        <div className={`mt-1 flex-shrink-0 ${item.isAccommodation ? 'text-amber-500' : 'text-blue-500'}`}>
          {item.isAccommodation ? <BedDouble size={16} /> : <MapPin size={16} />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h4 className="font-semibold text-primary text-sm leading-tight truncate">{item.name}</h4>
              {/* Arrival / Departure */}
              {item.arrivalTime && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-secondary">
                    Varış: <span className="text-primary font-medium">{item.arrivalTime}</span>
                    {isOver24 && <span className="ml-1 text-sky-500 text-[10px]">🌙 +1 Gün</span>}
                  </span>
                  {item.departureTime && (
                    <span className="text-xs text-secondary">
                      Çıkış: <span className="text-primary font-medium">{item.departureTime}</span>
                    </span>
                  )}
                </div>
              )}
            </div>
            {/* Map preview */}
            <MapPreview lat={item.lat} lng={item.lng} name={item.name} />
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Duration select */}
            {!isCustom ? (
              <select
                value={DURATION_OPTIONS.find(o => o.value === item.duration) ? item.duration : 'custom'}
                onChange={(e) => handleDurationChange(e.target.value)}
                className={SELECT_CLS}
                aria-label="Kalış süresi"
              >
                {DURATION_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            ) : (
              <div className="flex items-center gap-1">
                <input
                  type="number" min="1" max="480" placeholder="dk"
                  value={customDuration}
                  onChange={(e) => setCustomDuration(e.target.value)}
                  onBlur={handleCustomDuration}
                  onKeyDown={(e) => e.key === 'Enter' && handleCustomDuration()}
                  className={INPUT_CLS}
                  aria-label="Özel kalış süresi (dakika)"
                />
                <span className="text-xs text-muted">dk</span>
              </div>
            )}

            {/* Google Maps link */}
            {item.lat && item.lng && (
              <a
                href={`https://maps.google.com/maps?q=${item.lat},${item.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-500 hover:opacity-80 transition-opacity"
                aria-label="Google Haritalar'da aç"
              >
                <ExternalLink size={11} />
                Harita
              </a>
            )}

            {/* Accommodation toggle */}
            <button
              onClick={() => onUpdate({ isAccommodation: !item.isAccommodation })}
              className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-xl border transition-all active:scale-95 ${
                item.isAccommodation
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-500'
                  : 'input-themed text-secondary hover:text-primary'
              }`}
              aria-label={item.isAccommodation ? 'Konaklama olarak işaretli' : 'Konaklama olarak işaretle'}
              title="Konaklama Toggle"
            >
              <BedDouble size={11} />
              {item.isAccommodation ? 'Konaklama' : 'Konaklama?'}
            </button>

            {/* Notes toggle */}
            <button
              onClick={() => setShowNotes(!showNotes)}
              className="inline-flex items-center gap-1 text-xs text-secondary hover:text-primary transition-colors"
              aria-label="Notları göster/gizle"
            >
              {showNotes ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
              Not
            </button>

            {/* Delete */}
            <button
              onClick={() => onDelete(item.id)}
              className="ml-auto text-muted hover:text-red-500 transition-colors active:scale-95"
              aria-label={`${item.name} durağını sil`}
              title="Sil"
            >
              <Trash2 size={14} />
            </button>
          </div>

          {/* Notes */}
          {showNotes && (
            <div className="mt-1 space-y-1">
              <textarea
                value={item.notes || ''}
                onChange={(e) => {
                  if (e.target.value.length <= 300) onUpdate({ notes: e.target.value });
                }}
                placeholder="Bu durak için not ekle..."
                rows={2}
                className="w-full input-themed rounded-[1rem] px-3 py-2 text-xs placeholder-zinc-500 transition-all resize-none"
                aria-label="Durak notu"
              />
              <p className="text-right text-[10px] text-muted">{(item.notes || '').length}/300</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
