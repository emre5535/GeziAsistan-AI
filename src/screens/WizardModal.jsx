import { useState, useRef } from 'react';
import { Sparkles, MapPin, CalendarDays, Loader2, X, Plus, ChevronRight, Check } from 'lucide-react';
import { nanoid } from 'nanoid';

const INPUT_CLS = 'input-themed rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all w-full';

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent`;

export function WizardModal({ onClose, onComplete }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef(null);

  // Step 1
  const [routeName, setRouteName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Step 2
  const [accommodations, setAccommodations] = useState('');

  // Step 3
  const [placesText, setPlacesText] = useState('');

  const generateRoute = async () => {
    if (!routeName.trim() || !startDate || !endDate || !placesText.trim()) return;
    setLoading(true);

    abortRef.current = new AbortController();
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || window.__gemini_api_key || '';
      
      // Calculate days
      const sDate = new Date(startDate);
      const eDate = new Date(endDate);
      const diffTime = Math.abs(eDate - sDate);
      const daysCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      const prompt = `Görevin: Gezgin bir turist için ${daysCount} günlük mantıklı bir rota planı oluşturmak. YALNIZCA geçerli bir JSON formatında yanıt ver. Markdown veya açıklama KULLANMA.
      Planda olması istenen yerler: ${placesText}
      Varsa konaklanacak yerler: ${accommodations || 'Belirtilmedi'}
      
      Çıktı tam olarak bu şemada olmalı:
      {
        "name": "${routeName}",
        "startDate": "${startDate}",
        "dayCount": ${daysCount},
        "itinerary": [
          {
            "name": "Mekan Adı",
            "lat": 38.0,
            "lng": 27.0,
            "duration": 60,
            "isAccommodation": false,
            "notes": "Neden burası seçildi?",
            "day": 1,
            "order": 0
          }
        ]
      }`;

      const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) throw new Error('API Hatası');

      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('JSON çıkarılamadı');
      
      const result = JSON.parse(match[0]);
      
      // Construct final object
      const finalItinerary = result.itinerary.map(item => ({
        id: nanoid(8),
        ...item
      }));

      onComplete({
        name: routeName,
        startDate: sDate.toISOString(),
        itinerary: finalItinerary
      });

    } catch (e) {
      if (e.name !== 'AbortError') {
        alert('Rota oluşturulamadı. Lütfen tekrar deneyin.');
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={!loading ? onClose : undefined}></div>

      {/* Modal Card */}
      <div className="relative w-full max-w-lg card-bg card-border rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b card-border flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-2 text-primary font-bold">
            <Sparkles size={18} className="text-blue-500" />
            AI Rota Sihirbazı
          </div>
          <button onClick={onClose} disabled={loading} className="icon-btn p-1.5 rounded-xl disabled:opacity-50">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <h3 className="text-lg font-semibold text-primary">Rotanızı Tanımlayın</h3>
              <p className="text-sm text-secondary">Nereye gideceksiniz ve seyahatiniz hangi tarihler arasında olacak?</p>
              
              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-xs text-secondary font-medium mb-1 block">Rota Adı</label>
                  <input type="text" value={routeName} onChange={(e) => setRouteName(e.target.value)} className={INPUT_CLS} placeholder="Örn: Hafta Sonu Kapadokya Turu" autoFocus />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-secondary font-medium mb-1 block">Başlangıç</label>
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={INPUT_CLS} />
                  </div>
                  <div>
                    <label className="text-xs text-secondary font-medium mb-1 block">Bitiş</label>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={INPUT_CLS} min={startDate} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <h3 className="text-lg font-semibold text-primary">Konaklama Planı</h3>
              <p className="text-sm text-secondary">Hangi otellerde kalacaksınız? Eğer belirli değilse boş bırakabilirsiniz. AI sizin için güzergahı buna göre ayarlayacaktır.</p>
              
              <div className="space-y-3 pt-2">
                <textarea
                  value={accommodations}
                  onChange={(e) => setAccommodations(e.target.value)}
                  className={`${INPUT_CLS} min-h-[120px] resize-none`}
                  placeholder="Örn: İlk 2 gün Merkez Otel'de kalacağız, son gün Alaçatı Resort..."
                  autoFocus
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <h3 className="text-lg font-semibold text-primary">Gezilecek Yerler</h3>
              <p className="text-sm text-secondary">Haritada işaretlediğiniz veya gitmek istediğiniz yerleri virgülle ayırarak yazın.</p>
              
              <div className="space-y-3 pt-2">
                <textarea
                  value={placesText}
                  onChange={(e) => setPlacesText(e.target.value)}
                  className={`${INPUT_CLS} min-h-[150px] resize-none`}
                  placeholder="Örn: Efes Antik Kenti, Şirince, Kuşadası Milli Park, Kadınlar Denizi..."
                  autoFocus
                />
              </div>

              {loading && (
                <div className="absolute inset-0 z-10 bg-black/40 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
                  <Loader2 size={32} className="text-blue-500 animate-spin mb-4" />
                  <p className="text-primary font-bold text-lg mb-1">Rota Oluşturuluyor</p>
                  <p className="text-secondary text-sm max-w-xs focus:ring-0">Yapay zeka verdiğiniz noktaları analiz ediyor ve en verimli güzergahı hesaplıyor. Bu işlem 10-15 saniye sürebilir...</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t card-border flex items-center justify-between bg-black/10">
          {/* Progress dots */}
          <div className="flex gap-1.5 ml-2">
            {[1, 2, 3].map(i => (
              <div key={i} className={`w-2 h-2 rounded-full transition-all ${step === i ? 'bg-blue-500 w-4' : 'bg-zinc-600'}`}></div>
            ))}
          </div>

          <div className="flex gap-2">
            {step > 1 && (
              <button onClick={() => setStep(step - 1)} disabled={loading} className="px-4 py-2 icon-btn rounded-xl font-medium text-sm disabled:opacity-50">
                Geri
              </button>
            )}
            
            {step < 3 ? (
              <button 
                onClick={() => setStep(step + 1)} 
                disabled={step === 1 && (!routeName || !startDate || !endDate)}
                className="px-5 py-2 btn-primary rounded-xl font-medium text-sm flex items-center gap-1 disabled:opacity-40"
              >
                İleri <ChevronRight size={16} />
              </button>
            ) : (
              <button 
                onClick={generateRoute} 
                disabled={loading || !placesText.trim()}
                className="px-5 py-2 btn-primary bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-40"
              >
                {!loading ? <><Sparkles size={16} /> Rotayı Çiz</> : 'Hesaplanıyor...'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
