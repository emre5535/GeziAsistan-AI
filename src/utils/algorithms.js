// ─── 1. Distance & Time Algorithms ─────────────────────────────────────────

/**
 * Haversine formula – straight-line distance between two GPS coords (km)
 */
export function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Road distance (km) – applies 1.35x road-curve factor (Aegean/Türkiye)
 */
export function roadDistanceKm(lat1, lng1, lat2, lng2) {
  return haversineKm(lat1, lng1, lat2, lng2) * 1.35;
}

/**
 * Estimated travel time (minutes) at avg 60 km/h + 15% traffic buffer
 */
export function travelTimeMinutes(lat1, lng1, lat2, lng2) {
  const distKm = roadDistanceKm(lat1, lng1, lat2, lng2);
  return Math.round(distKm * 1.15);
}

// ─── 2. Timeline ────────────────────────────────────────────────────────────

/**
 * Converts total minutes to "HH:MM" string (may exceed 24:00 for overnight)
 */
export function minToTime(totalMin) {
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Calculates arrival/departure times and travel minutes for each stop in a day.
 * @param {Array}  dayItems     – sorted array of itinerary items for a day
 * @param {string} startTimeStr – "HH:MM"
 * @returns enriched array with travelMinutes, arrivalTime, departureTime, isNextDay
 */
export function calculateTimeline(dayItems, startTimeStr = '09:00') {
  const [h, m] = startTimeStr.split(':').map(Number);
  let currentMin = h * 60 + (m || 0);

  return dayItems.map((item, idx) => {
    let travelMin = 0;
    if (idx > 0) {
      const prev = dayItems[idx - 1];
      const validCoords =
        prev.lat && prev.lng && item.lat && item.lng &&
        !(prev.lat === 0 && prev.lng === 0) &&
        !(item.lat === 0 && item.lng === 0);
      travelMin = validCoords
        ? travelTimeMinutes(prev.lat, prev.lng, item.lat, item.lng)
        : null; // null = unknown
    }

    const arrivalMin = currentMin + (travelMin ?? 0);
    const departureMin = arrivalMin + (item.duration || 0);
    currentMin = departureMin;

    return {
      ...item,
      travelMinutes: travelMin,
      arrivalTime: minToTime(arrivalMin),
      departureTime: item.duration === 0 ? null : minToTime(departureMin),
      isNextDay: arrivalMin >= 1440, // past midnight
    };
  });
}

// ─── 3. Route Stats ─────────────────────────────────────────────────────────

/**
 * Compute aggregate stats for an entire route (all days)
 */
export function computeRouteStats(itinerary, dayStartTimes) {
  // Group by day preserving order
  const byDay = {};
  itinerary.forEach((item) => {
    if (!byDay[item.day]) byDay[item.day] = [];
    byDay[item.day].push(item);
  });

  let totalDistKm = 0;
  let totalStayMin = 0;

  Object.keys(byDay).forEach((day) => {
    const items = [...byDay[day]].sort((a, b) => a.order - b.order);
    for (let i = 1; i < items.length; i++) {
      const a = items[i - 1];
      const b = items[i];
      if (a.lat && a.lng && b.lat && b.lng) {
        totalDistKm += roadDistanceKm(a.lat, a.lng, b.lat, b.lng);
      }
    }
    items.forEach((it) => (totalStayMin += it.duration || 0));
  });

  const days = Object.keys(byDay).length;
  const stops = itinerary.length;

  return {
    days,
    stops,
    totalDistKm: Math.round(totalDistKm * 10) / 10,
    totalStayMin,
  };
}

// ─── 4. Helpers ─────────────────────────────────────────────────────────────

export function formatDuration(minutes) {
  if (!minutes || minutes === 0) return 'Geçiş';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} dk`;
  if (m === 0) return `${h} sa`;
  return `${h} sa ${m} dk`;
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

export function formatTimestamp(ts) {
  if (!ts) return '—';
  try {
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
  } catch {
    return '—';
  }
}
