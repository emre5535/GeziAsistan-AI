import { Navigation, Clock } from 'lucide-react';
import { roadDistanceKm, travelTimeMinutes } from '../utils/algorithms';

export function Connector({ from, to }) {
  const validCoords =
    from?.lat && from?.lng && to?.lat && to?.lng &&
    !(from.lat === 0 && from.lng === 0) &&
    !(to.lat === 0 && to.lng === 0);

  const dist = validCoords ? roadDistanceKm(from.lat, from.lng, to.lat, to.lng) : null;
  const travelMin = validCoords ? travelTimeMinutes(from.lat, from.lng, to.lat, to.lng) : null;

  return (
    <div className="flex items-center gap-3 px-3 py-1 my-1 no-print group" aria-hidden="true">
      {/* SVG line */}
      <div className="flex-shrink-0 flex flex-col items-center">
        <svg width="18" height="36" viewBox="0 0 18 36" fill="none">
          <line
            x1="9" y1="0" x2="9" y2="36"
            stroke="rgba(96,165,250,0.5)"
            strokeWidth="1.5"
            strokeDasharray="5 4"
            className="connector-dash"
          />
        </svg>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-2">
        {dist !== null ? (
          <>
            <span className="inline-flex items-center gap-1 text-xs text-secondary card-bg px-2 py-0.5 rounded-xl border card-border">
              <Navigation size={10} className="text-blue-500" />
              {dist.toFixed(1)} km
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-secondary card-bg px-2 py-0.5 rounded-xl border card-border">
              <Clock size={10} className="text-sky-500" />
              ~{travelMin} dk
            </span>
          </>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs text-muted card-bg px-2 py-0.5 rounded-xl border card-border">
            <Navigation size={10} />
            ? km
          </span>
        )}
      </div>
    </div>
  );
}
