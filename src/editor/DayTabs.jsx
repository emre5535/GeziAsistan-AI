import { useRef } from 'react';
import { Plus, X, ChevronRight } from 'lucide-react';

export function DayTabs({ days, activeDay, dayDates, onSelectDay, onAddDay, onDeleteDay }) {
  const scrollRef = useRef(null);

  return (
    <div className="flex items-center gap-2 overflow-x-auto scroll-smooth pb-1 no-scrollbar" ref={scrollRef} role="tablist" aria-label="Günler">
      {days.map((day) => {
        const isActive = day === activeDay;
        const dateStr = dayDates[day] ? new Date(dayDates[day]).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) : '—';
        return (
          <div key={day} className="relative group flex-shrink-0">
            <button
              role="tab"
              aria-selected={isActive}
              onClick={() => onSelectDay(day)}
              className={`flex flex-col items-center px-4 py-2 rounded-2xl border transition-all active:scale-95 text-xs min-w-[72px] ${
                isActive
                  ? 'bg-blue-500/20 border-blue-500/60 text-blue-500 font-semibold'
                  : 'card-bg card-border text-secondary hover:text-primary'
              }`}
              aria-label={`${day}. gün`}
            >
              <span className="font-semibold">{day}. Gün</span>
              <span className="text-muted text-[10px] mt-0.5">{dateStr}</span>
            </button>
            {days.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); onDeleteDay(day); }}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity active:scale-95"
                aria-label={`${day}. günü sil`}
                title={`${day}. günü sil`}
              >
                <X size={8} className="text-white" />
              </button>
            )}
          </div>
        );
      })}

      {/* Add Day */}
      <button
        onClick={onAddDay}
        className="flex-shrink-0 flex items-center gap-1 px-3 py-2 rounded-2xl card-bg card-border text-secondary hover:bg-blue-500/10 hover:text-blue-500 hover:border-blue-500/30 transition-all active:scale-95 text-xs min-w-[44px] justify-center"
        aria-label="Yeni gün ekle"
        title="Yeni gün ekle"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
