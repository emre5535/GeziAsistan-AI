import { useState, useRef, useCallback } from 'react';
import { Search, Loader2, MapPin, Plus, X, Check } from 'lucide-react';
import { nanoid } from 'nanoid';

import { fetchWithGeminiFallback } from '../utils/gemini';

const INPUT_CLS = 'flex-1 bg-transparent text-primary placeholder-zinc-500 focus:outline-none text-sm';

export function SmartSearch({ onAddStop }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorInfo, setErrorInfo] = useState(null);
  const [showCoordInput, setShowCoordInput] = useState(false);
  const [coord, setCoord] = useState({ name: '', lat: '', lng: '', address: '' });
  const [resolving, setResolving] = useState(false);
  const abortRef = useRef(null);

  const search = useCallback(async (q) => {
    if (q.length < 3) { setResults([]); setErrorInfo(null); return; }

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setErrorInfo(null);
    try {
      const prompt = `Kullanıcının girdiği metin: "${q}"\nGörevin: Bu metinle alakalı en fazla 5 gerçek lokasyon öner.\nYALNIZCA aşağıdaki JSON formatında yanıt ver, başka hiçbir şey yazma:\n[{"name":"Lokasyon Adı","lat":0.0,"lng":0.0,"country":"TR"}]`;

      const payload = { contents: [{ parts: [{ text: prompt }] }] };
      const data = await fetchWithGeminiFallback(payload, controller.signal);
      
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
      if (e.name !== 'AbortError') {
        setErrorInfo(e.isQuotaError ? 'Kotanız doldu, lütfen bekleyip tekrar deneyin.' : 'Arama sırasında bir hata oluştu.');
        setResults([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // AI Coordinate Resolver for Manual Entry
  const resolveAddress = async () => {
    if (!coord.name && !coord.address) return;
    setResolving(true);
    try {
      const prompt = `Görevin: Aşağıdaki mekan/adres bilgilerini enlem ve boylam koordinatlarına çevirmek.
      İsim: "${coord.name}"
      Adres: "${coord.address}"
      
      YALNIZCA şu JSON formatında yanıt ver: {"lat": 0.0, "lng": 0.0}`;
      const text = await callGeminiText(prompt);
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        if (parsed.lat && parsed.lng) {
          setCoord(prev => ({ ...prev, lat: parsed.lat, lng: parsed.lng }));
        }
      }
    } catch (e) {
      console.error('Resolve failed', e);
    } finally {
      setResolving(false);
    }
  };

  const handleChange = (e) => {
    setQuery(e.target.value);
    setErrorInfo(null);
  };

  const handleSearch = () => {
    if (query.trim()) {
      search(query.trim());
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
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
    onAddStop({ 
      id: nanoid(8), 
      name: coord.name.trim(), 
      lat, 
      lng, 
      duration: 60, 
      isAccommodation: false, 
      notes: coord.address ? `Adres: ${coord.address}` : '' 
    });
    setCoord({ name: '', lat: '', lng: '', address: '' });
    setShowCoordInput(false);
  };

  return (
    <div className="space-y-2">
      {/* Search input */}
      <div className="relative">
        <div className="flex items-center gap-2 input-themed rounded-2xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-500/50 transition-all">
          <button 
            type="button"
            onClick={handleSearch}
            className="p-1 rounded-xl hover:bg-white/10 text-secondary hover:text-primary transition-colors flex-shrink-0"
            aria-label="Ara"
          >
            <Search size={16} />
          </button>
          <input
            type="text"
            placeholder="Konum ara... (yazıp Enter'a basın)"
            value={query}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            className={INPUT_CLS}
            aria-label="Konum ara"
            autoComplete="off"
          />
          {loading && <Loader2 size={14} className="text-blue-400 animate-spin flex-shrink-0" />}
          {query && !loading && (
            <button type="button" onClick={() => { setQuery(''); setResults([]); }} className="icon-btn flex-shrink-0" aria-label="Temizle">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Error label */}
        {errorInfo && !loading && (
          <div className="absolute top-full left-0 mt-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-2 text-red-500 text-xs z-10 w-full animate-in fade-in slide-in-from-top-1">
            <X size={12} />
            {errorInfo}
          </div>
        )}

        {/* Dropdown */}
        {(results.length > 0 || query.match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/)) && (
          <div className="absolute left-0 right-0 top-full mt-2 z-20 rounded-2xl card-border card-bg backdrop-blur-3xl shadow-xl overflow-hidden">
            {/* Detect if query is a coordinate */}
            {(() => {
              const coordMatch = query.match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/);
              if (coordMatch) {
                const lat = parseFloat(coordMatch[1]);
                const lng = parseFloat(coordMatch[2]);
                return (
                  <button
                    onClick={() => handleSelect({ name: 'Yeni Koordinat', lat, lng, country: 'Manuel' })}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-blue-500/10 hover:bg-blue-500/20 transition-all text-left text-sm border-b card-border"
                  >
                    <MapPin size={14} className="text-blue-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-blue-400 font-bold block italic uppercase text-[10px]">Koordinat Tespit Edildi</span>
                      <span className="text-primary font-medium">{lat}, {lng}</span>
                    </div>
                    <Plus size={14} className="text-blue-500" />
                  </button>
                );
              }
              return null;
            })()}

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
              aria-label="Manuel veya Adres ile ekle"
            >
              <Plus size={14} />
              Manuel Konum / Adres Ekle
            </button>
          </div>
        )}
      </div>

      {/* Manual / Address input */}
      {showCoordInput && (
        <div className="rounded-2xl border border-blue-500/30 bg-blue-500/5 p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-blue-500 uppercase tracking-wider">Manuel Konum Ekle</p>
            <button onClick={() => setShowCoordInput(false)} className="icon-btn p-1"><X size={14} /></button>
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="text-[10px] text-secondary font-bold mb-1 block">KONUM ADI</label>
              <input type="text" placeholder="Örn: Akdağ Milli Parkı" value={coord.name} onChange={(e) => setCoord(c => ({ ...c, name: e.target.value }))}
                className="w-full input-themed rounded-xl px-3 py-2 text-xs" aria-label="Konum adı" />
            </div>

            <div>
              <label className="text-[10px] text-secondary font-bold mb-1 block">AÇIK ADRES / TANIM (İsteğe Bağlı)</label>
              <textarea placeholder="Örn: Denizli-Antalya Karayolu Üzeri..." value={coord.address} onChange={(e) => setCoord(c => ({ ...c, address: e.target.value }))}
                className="w-full input-themed rounded-xl px-3 py-2 text-xs min-h-[60px] resize-none" aria-label="Açık adres" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-secondary font-bold mb-1 block">ENLEM (LAT)</label>
                <input type="number" placeholder="38.1234" value={coord.lat} onChange={(e) => setCoord(c => ({ ...c, lat: e.target.value }))}
                  className="input-themed rounded-xl px-3 py-2 text-xs w-full" aria-label="Enlem" />
              </div>
              <div>
                <label className="text-[10px] text-secondary font-bold mb-1 block">BOYLAM (LNG)</label>
                <input type="number" placeholder="27.1234" value={coord.lng} onChange={(e) => setCoord(c => ({ ...c, lng: e.target.value }))}
                  className="input-themed rounded-xl px-3 py-2 text-xs w-full" aria-label="Boylam" />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button 
                onClick={resolveAddress} 
                disabled={resolving || (!coord.name && !coord.address)}
                className="px-3 py-2 card-border card-bg text-[10px] font-bold rounded-xl flex items-center gap-1.5 hover:bg-white/5 transition-all text-secondary disabled:opacity-30"
              >
                {resolving ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                {resolving ? 'BULUNUYOR...' : 'ADRESTEN KONUM BUL'}
              </button>
              
              <button onClick={handleCoordAdd} disabled={!coord.name || !coord.lat || !coord.lng} className="flex-1 px-3 py-2 btn-primary text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/20 disabled:opacity-40" aria-label="Durak Olarak Ekle">
                <Plus size={14} /> EKLE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
