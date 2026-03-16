import { nanoid } from 'nanoid';

export const getSampleRoute = () => {
  return {
    id: `local-sample-${Date.now()}`,
    name: "İzmir - Denizli Rota Planı",
    startDate: "16.03.2026",
    startTime: "08:00",
    dayDates: { 1: "16.03.2026", 2: "17.03.2026", 3: "18.03.2026", 4: "19.03.2026" },
    dayStartTimes: { 1: "08:00", 2: "08:00", 3: "08:00", 4: "08:00" },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    itinerary: [
      { id: nanoid(8), day: 1, order: 0, name: "İzmir (Başlangıç)", lat: 38.4237, lng: 27.1428, duration: 0, isAccommodation: false, notes: "Sadece Geçiş" },
      { id: nanoid(8), day: 1, order: 1, name: "Sardes Antik Kenti (Salihli)", lat: 38.4883, lng: 28.0403, duration: 60, isAccommodation: false, notes: "Gezilecek" },
      { id: nanoid(8), day: 1, order: 2, name: "Tarihi Buldan Evleri", lat: 38.0475, lng: 28.8318, duration: 90, isAccommodation: false, notes: "Gezilecek" },
      { id: nanoid(8), day: 1, order: 3, name: "Hierapolis Antik Kenti", lat: 37.9254, lng: 29.1260, duration: 120, isAccommodation: false, notes: "Gezilecek" },
      { id: nanoid(8), day: 1, order: 4, name: "Pamukkale Travertenleri", lat: 37.9238, lng: 29.1186, duration: 120, isAccommodation: false, notes: "Gezilecek" },
      { id: nanoid(8), day: 1, order: 5, name: "Karahayıt Kırmızı Su (Konaklama)", lat: 37.9497, lng: 29.1023, duration: 0, isAccommodation: true, notes: "Sadece Geçiş" },

      { id: nanoid(8), day: 2, order: 0, name: "Laodikeia Antik Kenti", lat: 37.8385, lng: 29.1089, duration: 90, isAccommodation: false, notes: "Gezilecek" },
      { id: nanoid(8), day: 2, order: 1, name: "Kaleiçi Çarşısı (Merkez)", lat: 37.7818, lng: 29.0886, duration: 60, isAccommodation: false, notes: "Gezilecek" },
      { id: nanoid(8), day: 2, order: 2, name: "Denizli Teleferik & Bağbaşı Yaylası", lat: 37.7126, lng: 29.0984, duration: 0, isAccommodation: false, notes: "Sadece Geçiş" },
      { id: nanoid(8), day: 2, order: 3, name: "Denizli Seyir Tepesi", lat: 37.7479, lng: 29.1350, duration: 90, isAccommodation: false, notes: "Gezilecek" },
      { id: nanoid(8), day: 2, order: 4, name: "Denizli Merkez (Konaklama)", lat: 37.7765, lng: 29.0864, duration: 0, isAccommodation: true, notes: "Sadece Geçiş" },

      { id: nanoid(8), day: 3, order: 0, name: "Kaklık Mağarası", lat: 37.8631, lng: 29.3853, duration: 60, isAccommodation: false, notes: "Gezilecek" },
      { id: nanoid(8), day: 3, order: 1, name: "Honaz Dağı Milli Parkı", lat: 37.7167, lng: 29.3000, duration: 90, isAccommodation: false, notes: "Gezilecek" },
      { id: nanoid(8), day: 3, order: 2, name: "Serinhisar (Leblebi Molası)", lat: 37.5857, lng: 29.2642, duration: 45, isAccommodation: false, notes: "Gezilecek" },
      { id: nanoid(8), day: 3, order: 3, name: "Keloğlan Mağarası (Dodurgalar)", lat: 37.4069, lng: 29.4792, duration: 60, isAccommodation: false, notes: "Gezilecek" },
      { id: nanoid(8), day: 3, order: 4, name: "Tavas Merkez (Konaklama)", lat: 37.5707, lng: 29.0634, duration: 0, isAccommodation: true, notes: "Sadece Geçiş" },

      { id: nanoid(8), day: 4, order: 0, name: "Afrodisias Antik Kenti", lat: 37.7089, lng: 28.7183, duration: 0, isAccommodation: false, notes: "Sadece Geçiş" },
      { id: nanoid(8), day: 4, order: 1, name: "Nysa Antik Kenti (Sultanhisar)", lat: 37.9009, lng: 28.1404, duration: 90, isAccommodation: false, notes: "Gezilecek" },
      { id: nanoid(8), day: 4, order: 2, name: "Şirince Köyü", lat: 37.9431, lng: 27.3672, duration: 120, isAccommodation: false, notes: "Gezilecek" },
      { id: nanoid(8), day: 4, order: 3, name: "İzmir (Dönüş)", lat: 38.4237, lng: 27.1428, duration: 0, isAccommodation: false, notes: "Sadece Geçiş" }
    ]
  };
};
