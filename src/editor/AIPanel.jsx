import { useState, useRef } from 'react';
import { Sparkles, Loader2, Send, Wand2, MessageSquare, Lightbulb, MapPin } from 'lucide-react';
import { nanoid } from 'nanoid';

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`;

async function callGemini(prompt, signal) {
  const apiKey = window.__gemini_api_key || '';
  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    signal,
  });
  if (!res.ok) {
    if (res.status === 429) throw new Error('Çok hızlı işlem yapıyorsunuz. Lütfen biraz bekleyip tekrar deneyin.');
    throw new Error('Yapay zeka yanıt veremedi.');
  }
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

const BTN_CLS = 'w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl card-bg card-border text-primary text-sm font-medium hover:opacity-80 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100';

export function AIPanel({ itinerary, activeDay, routeName, onUpdateItinerary, onAddStops, toast }) {
  const [optimizing, setOptimizing] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [proposing, setProposing] = useState(false);
  const [preferenceText, setPreferenceText] = useState('');
  const [suggestions, setSuggestions] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const abortRef = useRef(null);

  const dayItems = itinerary.filter((i) => i.day === activeDay).sort((a, b) => a.order - b.order);
  const hasStops = dayItems.length > 0;

  // ── 1. Optimize route ────────────────────────────────────────────────────
  const handleOptimize = async () => {
    if (!hasStops) return;
    setOptimizing(true);
    abortRef.current = new AbortController();
    try {
      const payload = dayItems.map(({ id, name, lat, lng, duration, isAccommodation }) => ({ id, name, lat, lng, duration, isAccommodation }));
      const prompt = `Aşağıdaki JSON dizisindeki lokasyonları coğrafi olarak en verimli sıraya diz (Gezgin Satıcı problemi / minimum toplam mesafe). Konaklama (isAccommodation: true) olan durakları günün SONUNA koy. YALNIZCA aynı id'lerle sıralanmış JSON dizisi döndür. Başka hiçbir şey yazma: ${JSON.stringify(payload)}`;
      const text = await callGemini(prompt, abortRef.current.signal);
      const match = text.match(/\[[\s\S]*\]/);
      if (!match) throw new Error('JSON parse error');
      const sorted = JSON.parse(match[0]);
      const reordered = itinerary.map((item) => {
        if (item.day !== activeDay) return item;
        const idx = sorted.findIndex((s) => s.id === item.id);
        return { ...item, order: idx >= 0 ? idx : item.order };
      });
      onUpdateItinerary(reordered);
      toast.success('Rota optimize edildi! 🎯');
    } catch (e) {
      if (e.name !== 'AbortError') toast.error(e.message || 'Optimizasyon başarısız.');
    } finally {
      setOptimizing(false);
    }
  };

  // ── 2. Get suggestions ───────────────────────────────────────────────────
  const handleSuggest = async () => {
    setSuggesting(true);
    setSuggestions('');
    abortRef.current = new AbortController();
    try {
      const allStops = itinerary.map((i) => `Gün ${i.day}: ${i.name} (${i.duration} dk)`).join('\n');
      const prompt = `Rota adı: "${routeName}"\nDuraklar:\n${allStops}\n\nBu rota için şunları incele ve Türkçe yanıt ver: potansiyel sorunlar, atlanan önemli yerler, daha iyi zaman dağılımı ve yerel ipuçları. Madde madde yaz, kalın başlıklar kullan.`;
      const text = await callGemini(prompt, abortRef.current.signal);
      setSuggestions(text);
    } catch (e) {
      if (e.name !== 'AbortError') toast.error(e.message || 'Öneri alınamadı.');
    } finally {
      setSuggesting(false);
    }
  };

  // ── 3. Propose empty day route ───────────────────────────────────────────
  const handlePropose = async () => {
    if (!preferenceText.trim() || hasStops) return;
    setProposing(true);
    abortRef.current = new AbortController();
    try {
      const prompt = `Bir turist için ${activeDay}. gün planı hazırla. Tercihler: "${preferenceText}". En fazla 5 durak öner. YALNIZCA JSON döndür:\n[{"name":"Yer Adı","lat":0.0,"lng":0.0,"duration":60,"isAccommodation":false}]`;
      const text = await callGemini(prompt, abortRef.current.signal);
      const match = text.match(/\[[\s\S]*\]/);
      if (!match) throw new Error('JSON parse error');
      const stops = JSON.parse(match[0]);
      const withIds = stops.slice(0, 5).map((s, i) => ({ ...s, id: nanoid(8), day: activeDay, order: i, notes: '' }));
      onAddStops(withIds);
      toast.success(`${withIds.length} durak eklendi! 🗺️`);
      setPreferenceText('');
    } catch (e) {
      if (e.name !== 'AbortError') toast.error(e.message || 'Öneri alınamadı.');
    } finally {
      setProposing(false);
    }
  };

  // ── 4. Chat ──────────────────────────────────────────────────────────────
  const handleChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg = { role: 'user', text: chatInput };
    const history = [...chatMessages, userMsg].slice(-6);
    setChatMessages(history);
    setChatInput('');
    setChatLoading(true);
    abortRef.current = new AbortController();
    try {
      const context = `Rota: "${routeName}". Duraklar: ${itinerary.map(i => i.name).join(', ')}.`;
      const conv = history.map((m) => `${m.role === 'user' ? 'Kullanıcı' : 'Asistan'}: ${m.text}`).join('\n');
      const prompt = `${context}\n\nSohbet:\n${conv}\n\nAsistan (Türkçe yanıtla):`;
      const text = await callGemini(prompt, abortRef.current.signal);
      setChatMessages((prev) => [...prev, { role: 'assistant', text }]);
    } catch (e) {
      if (e.name !== 'AbortError') toast.error(e.message || 'AI yanıt veremedi.');
    } finally {
      setChatLoading(false);
    }
  };

  const renderSuggestions = (text) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return <p key={i} className="font-semibold text-primary mt-3 first:mt-0 text-sm">{line.replace(/\*\*/g, '')}</p>;
      }
      if (line.startsWith('* ') || line.startsWith('- ')) {
        return <p key={i} className="text-secondary text-xs pl-3 leading-relaxed">{line.slice(2)}</p>;
      }
      return line.trim() ? <p key={i} className="text-secondary text-xs leading-relaxed">{line}</p> : null;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles size={18} className="text-sky-400" />
        <h3 className="font-bold text-primary">AI Asistan</h3>
      </div>

      {/* 1. Optimize */}
      <div className="rounded-[2rem] card-border card-bg p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Wand2 size={14} className="text-blue-500" />
          <h4 className="text-sm font-semibold text-primary">Rotayı Optimize Et</h4>
        </div>
        <p className="text-xs text-muted">Aktif günün duraklarını coğrafi olarak en verimli sıraya dizer.</p>
        <button onClick={handleOptimize} disabled={optimizing || !hasStops} className={BTN_CLS} aria-label="Rotayı optimize et">
          {optimizing ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} className="text-blue-400" />}
          {optimizing ? 'Optimize ediliyor...' : 'Otomatik Sırala'}
        </button>
      </div>

      {/* 2. Suggestions */}
      <div className="rounded-[2rem] card-border card-bg p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Lightbulb size={14} className="text-amber-500" />
          <h4 className="text-sm font-semibold text-primary">Rota Önerileri Al</h4>
        </div>
        <button onClick={handleSuggest} disabled={suggesting || itinerary.length === 0} className={BTN_CLS} aria-label="Rota önerileri al">
          {suggesting ? <Loader2 size={14} className="animate-spin" /> : <Lightbulb size={14} className="text-amber-400" />}
          {suggesting ? 'Analiz ediliyor...' : 'Öneri Al'}
        </button>
        {suggestions && (
          <div className="mt-1 space-y-1 max-h-48 overflow-y-auto pr-1">
            {renderSuggestions(suggestions)}
          </div>
        )}
      </div>

      {/* 3. Empty day propose */}
      {!hasStops && (
        <div className="rounded-[2rem] border border-sky-500/30 bg-sky-500/10 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-sky-500" />
            <h4 className="text-sm font-semibold text-primary">Güne Rota Öner</h4>
          </div>
          <p className="text-xs text-muted">Bu gün için tercihlerine göre duraklar önersin.</p>
          <input
            type="text"
            placeholder="örn: tarihi yerler, deniz manzarası..."
            value={preferenceText}
            onChange={(e) => setPreferenceText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handlePropose()}
            className="w-full input-themed rounded-2xl px-3 py-2 text-xs placeholder-zinc-500"
            aria-label="Gün tercihleri"
          />
          <button onClick={handlePropose} disabled={proposing || !preferenceText.trim()} className={BTN_CLS} aria-label="Günü planla">
            {proposing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} className="text-sky-400" />}
            {proposing ? 'Planlanıyor...' : 'Günü Planla'}
          </button>
        </div>
      )}

      {/* 4. Chat */}
      <div className="rounded-[2rem] card-border card-bg p-4 space-y-3">
        <div className="flex items-center gap-2">
          <MessageSquare size={14} className="text-emerald-500" />
          <h4 className="text-sm font-semibold text-primary">AI Sohbet</h4>
        </div>
        {chatMessages.length > 0 && (
          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {chatMessages.map((m, i) => (
              <div key={i} className={`text-xs leading-relaxed rounded-xl p-2 ${m.role === 'user' ? 'bg-blue-500/10 text-blue-500 font-medium text-right ml-4' : 'card-border card-bg border text-secondary mr-4'}`}>
                {m.text}
              </div>
            ))}
            {chatLoading && <div className="text-xs text-muted italic">Yanıt bekleniyor...</div>}
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Rota hakkında bir şey sor..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleChat()}
            disabled={chatLoading}
            className="flex-1 input-themed rounded-2xl px-3 py-2 text-xs placeholder-zinc-500 disabled:opacity-40"
            aria-label="AI sohbet mesajı"
          />
          <button onClick={handleChat} disabled={chatLoading || !chatInput.trim()} className="p-2.5 btn-primary disabled:opacity-40 rounded-2xl" aria-label="Mesaj gönder">
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
