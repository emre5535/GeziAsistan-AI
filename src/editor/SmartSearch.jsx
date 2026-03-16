import { useState, useRef, useCallback } from 'react';
import { Search, Loader2, MapPin, Plus, X, Check } from 'lucide-react';
import { nanoid } from 'nanoid';

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`;

const INPUT_CLS = 'flex-1 bg-transparent text-primary placeholder-zinc-500 focus:outline-none text-sm';

export function SmartSearch({ onAddStop }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCoordInput, setShowCoordInput] = useState(false);
  const [coord, setCoord] = useState({ name: '', lat: '', lng: '' });
  const debounceRef = useRef(null);
  const abortRef = useRef(null);

  const search = useCallback(async (q) => {
    if (q.length < 3) { setResults([]); return; }

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const apiKey = window.__gemini_api_key || '';
      const prompt = `Kullanıcının girdiği metin: "${q}"\nGörevin: Bu metinle alakalı en fazla 5 gerçek lokasyon öner.\nYALNIZCA aşağıdaki JSON formatında yanıt ver, başka hiçbir şey yazma:\n[{"name":"Lokasyon Adı","lat":0.0,"lng":0.0,"country":"TR"}]`;

      const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        signal: controller.signal,
      });

      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
      // Extract JSON array from response
      const match = text.match(/\[[\s\S]*\]/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        setResults(Array.isArray(parsed) ? parsed.slice(0, 5) : []);
      } else {
        setResults([]);
      }
    } catch (e) {
      if (e.name !== 'AbortError') setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setResults([]);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 800);
  };

  const handleSelect = (loc) => {
    onAddStop({
      id: nanoid(8),
      name: loc.name,
      lat: loc.lat,
      lng: loc.lng,
      duration: 60,
      isAccommodation: false,
      notes: '',
    });
    setQuery('');
    setResults([]);
  };

  const handleCoordAdd = () => {
    const lat = parseFloat(coord.lat);
    const lng = parseFloat(coord.lng);
    if (!coord.name.trim() || isNaN(lat) || isNaN(lng)) return;
    onAddStop({ id: nanoid(8), name: coord.name.trim(), lat, lng, duration: 60, isAccommodation: false, notes: '' });
    setCoord({ name: '', lat: '', lng: '' });
    setShowCoordInput(false);
  };

  return (
    <div className="space-y-2">
      {/* Search input */}
      <div className="relative">
        <div className="flex items-center gap-2 input-themed rounded-2xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-500/50 transition-all">
          <Search size={16} className="text-secondary flex-shrink-0" />
          <input
            type="text"
            placeholder="Konum ara ve ekle... (min 3 karakter)"
            value={query}
            onChange={handleChange}
            className={INPUT_CLS}
            aria-label="Konum ara"
            autoComplete="off"
          />
          {loading && <Loader2 size={14} className="text-blue-400 animate-spin flex-shrink-0" />}
          {query && !loading && (
            <button onClick={() => { setQuery(''); setResults([]); }} className="icon-btn" aria-label="Temizle">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Dropdown */}
        {results.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-2 z-20 rounded-2xl card-border card-bg backdrop-blur-3xl shadow-xl overflow-hidden">
            {results.map((loc, i) => (
              <button
                key={i}
                onClick={() => handleSelect(loc)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-all text-left text-sm group"
                aria-label={`${loc.name} ekle`}
              >
                <MapPin size={14} className="text-blue-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-primary font-medium truncate block">{loc.name}</span>
                  <span className="text-muted text-xs">{loc.country} · {loc.lat?.toFixed(4)}, {loc.lng?.toFixed(4)}</span>
                </div>
                <Plus size={14} className="text-secondary group-hover:text-blue-500 transition-colors flex-shrink-0" />
              </button>
            ))}
            <button
              onClick={() => { setShowCoordInput(true); setResults([]); setQuery(''); }}
              className="w-full flex items-center gap-3 px-4 py-3 border-t card-border hover:bg-black/5 hover:text-primary transition-all text-left text-sm text-secondary"
              aria-label="Koordinat ile ekle"
            >
              <Plus size={14} />
              Koordinat ile Ekle
            </button>
          </div>
        )}
      </div>

      {/* Coordinate input */}
      {showCoordInput && (
        <div className="rounded-2xl border border-blue-500/30 bg-blue-500/5 p-4 space-y-3">
          <p className="text-xs font-semibold text-blue-500">Koordinat ile Durak Ekle</p>
          <div className="grid grid-cols-2 gap-2">
            <input type="number" placeholder="Enlem (lat)" value={coord.lat} onChange={(e) => setCoord(c => ({ ...c, lat: e.target.value }))}
              className="input-themed rounded-2xl px-3 py-2 text-xs w-full" aria-label="Enlem" />
            <input type="number" placeholder="Boylam (lng)" value={coord.lng} onChange={(e) => setCoord(c => ({ ...c, lng: e.target.value }))}
              className="input-themed rounded-2xl px-3 py-2 text-xs w-full" aria-label="Boylam" />
          </div>
          <input type="text" placeholder="Konum adı" value={coord.name} onChange={(e) => setCoord(c => ({ ...c, name: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && handleCoordAdd()}
            className="w-full input-themed rounded-2xl px-3 py-2 text-xs" aria-label="Konum adı" />
          <div className="flex gap-2">
            <button onClick={handleCoordAdd} className="flex items-center justify-center flex-1 gap-1 px-3 py-2 btn-primary hover:bg-blue-600 text-xs font-semibold rounded-2xl transition-all active:scale-95" aria-label="Ekle">
              <Check size={12} /> Ekle
            </button>
            <button onClick={() => setShowCoordInput(false)} className="px-3 py-2 icon-btn text-xs rounded-2xl" aria-label="İptal">
              İptal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
