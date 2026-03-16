import { nanoid } from 'nanoid';

export const getSampleRoute = () => {
  return {
    id: `local-sample-${Date.now()}`,
    name: "İzmir - Denizli Rota Planı",
    startDate: "19.03.2026",
    startTime: "08:00",
    dayDates: { 1: "19.03.2026", 2: "20.03.2026", 3: "21.03.2026" },
    dayStartTimes: { 1: "08:00", 2: "09:00", 3: "09:00" },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    itinerary: [
      { id: nanoid(8), day: 1, order: 0, name: "İzmir (Başlangıç)", lat: 38.4237, lng: 27.1428, duration: 0, isAccommodation: false, notes: "İzmir'den hareket" },
      { id: nanoid(8), day: 1, order: 1, name: "Sardes Antik Kenti (Salihli)", lat: 38.4883, lng: 28.0403, duration: 60, isAccommodation: false, notes: "Tarihi Lidya başkenti" },
      { id: nanoid(8), day: 1, order: 2, name: "Tarihi Buldan Evleri", lat: 38.0475, lng: 28.8318, duration: 90, isAccommodation: false, notes: "Geleneksel mimari ve dokuma kültürü" },
      { id: nanoid(8), day: 1, order: 3, name: "Çıbıkoğlu Apart (Konaklama)", lat: 37.9155, lng: 29.1171, duration: 0, isAccommodation: true, notes: "Otele yerleşme ve dinlenme" },

      { id: nanoid(8), day: 2, order: 0, name: "Çıbıkoğlu Apart (Başlangıç)", lat: 37.9155, lng: 29.1171, duration: 0, isAccommodation: false, notes: "2. Güne başlama" },
      { id: nanoid(8), day: 2, order: 1, name: "Pamukkale Travertenleri", lat: 37.9238, lng: 29.1186, duration: 120, isAccommodation: false, notes: "Beyaz cennet gezisi" },
      { id: nanoid(8), day: 2, order: 2, name: "Hierapolis Antik Kenti", lat: 37.9254, lng: 29.1260, duration: 120, isAccommodation: false, notes: "Antik tiyatro ve termal havuz" },
      { id: nanoid(8), day: 2, order: 3, name: "Laodikeia Antik Kenti", lat: 37.8385, lng: 29.1089, duration: 90, isAccommodation: false, notes: "İncil'de adı geçen 7 kiliseden biri" },
      { id: nanoid(8), day: 2, order: 4, name: "Çıbıkoğlu Apart (Konaklama)", lat: 37.9155, lng: 29.1171, duration: 0, isAccommodation: true, notes: "Otele dönüş" },

      { id: nanoid(8), day: 3, order: 0, name: "Çıbıkoğlu Apart (Başlangıç)", lat: 37.9155, lng: 29.1171, duration: 0, isAccommodation: false, notes: "Dönüş yolu başlangıcı" },
      { id: nanoid(8), day: 3, order: 1, name: "Kaklık Mağarası", lat: 37.8631, lng: 29.3853, duration: 60, isAccommodation: false, notes: "Yeraltındaki küçük Pamukkale" },
      { id: nanoid(8), day: 3, order: 2, name: "Şirince Köyü", lat: 37.9431, lng: 27.3672, duration: 120, isAccommodation: false, notes: "Tarihi köy gezisi ve şarap tadımı" },
      { id: nanoid(8), day: 3, order: 3, name: "İzmir (Bitiş)", lat: 38.4237, lng: 27.1428, duration: 0, isAccommodation: false, notes: "Eve dönüş" }
    ]
  };
};
