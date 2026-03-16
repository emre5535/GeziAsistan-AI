# Akıllı# Gezi Asistanı AI - Implementation Plan

## User Review Required
> [!IMPORTANT]
> **Firestore Kuralları (Security Rules)** güncellemesi gerekecektir. Kullanıcıların paylaşılan rotaları okuyabilmesi için Firestore kurallarınızda `routes` koleksiyonuna sadece kendi dokümanları için değil, giriş yapmış tüm kullanıcılar için okuma (read) izni vermeniz gerekir.
> Örnek kural: `allow read: if request.auth != null;`

A full-stack React + Firebase + Gemini AI "Smart Travel Assistant" web app, built from scratch in the `c:\Users\Emmi\Documents\Gezi-Asistanı-AI` workspace.

## Proposed Changes

### Authentication ("Beni Hatırla")
- `src/hooks/useAuth.js`: `signIn` fonksiyonuna `rememberMe` parametresi eklenecek. Giriş yapılmadan önce Firebase'in `setPersistence` (browserLocalPersistence / browserSessionPersistence) fonksiyonu çağrılacak.
- `src/screens/LoginScreen.jsx`: Oturum açma butonunun üstüne Apple tasarım stiliyle uyumlu bir "Beni Hatırla" (Remember me) checkbox/switch eklenecek.

### Route Sharing (Gezi Paylaşımı)
- `src/screens/EditorScreen.jsx`: Paylaş (Share) butonuna tıklandığında üretilen URL içine rotanın sahibini belirten `owner` parametresi eklenecek. Örn: `?route=XYZ&owner=ABC`.
- `src/App.jsx`:
  - Uygulama yüklendiğinde ve kullanıcı giriş yaptığında URL'de `route` ve `owner` parametreleri kontrol edilecek.
  - Eğer `owner` mevcut kullanıcının id'sinden farklıysa, Firestore'dan belirtilen rota (`users/owner/routes/routeId`) doğrudan okunacak.
  - Kullanıcıya paylaşılan rotayı hesabına kopyalamak isteyip istemediği sorulan Apple stili şık bir modal gösterilecek. Kabul edilirse yeni rota olarak hesabına kaydedilip editörde açılacak.

### Design (Apple Glass)
- Tüm yeni eklenen UI elemanları (Checkbox, Modal) için `card-bg`, `card-border`, `backdrop-blur-3xl` gibi halihazırda oluşturduğumuz Premium Apple tasarım değişkenleri kullanılacak.

### Project Scaffolding

#### [NEW] Project root (Vite + React + Tailwind)
- `npx create-vite@latest ./ --template react` to scaffold the project
- Install: `tailwindcss`, `postcss`, `autoprefixer`, `firebase`, `lucide-react`, `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, `nanoid`
- Configure `tailwind.config.js` with extended config for `backdrop-blur-3xl`, `rounded-[2rem]`, etc.

---

### Core Source Files

#### [NEW] src/App.jsx — Single file, modular internal structure

Internal sections (as per spec §11):

**Section 1 — Constants & Config**
- Read `window.__firebase_config`, `window.__gemini_api_key`, `window.__app_id`
- Show error screen if any are missing

**Section 2 — Utility Functions**
- `haversineKm(lat1, lng1, lat2, lng2)` — Haversine formula
- `roadDistanceKm(...)` — ×1.35 curvature factor
- `travelTimeMinutes(...)` — ×1.15 buffer
- `calculateTimeline(dayItems, startTimeStr)` — full timeline with arrivalTime/departureTime
- `minToTime(n)` — converts minutes to `HH:MM`
- Firebase error code → Turkish message mapper

**Section 3 — Firebase Services**
- `initializeApp`, `getAuth`, `getFirestore`
- Firestore path: `artifacts/${APP_ID}/users/${uid}/routes`

**Section 4 — Custom Hooks**
- `useAuth()` — Firebase auth state listener
- `useRoutes(uid)` — Firestore `onSnapshot` for route list, w/ cleanup
- `useSaveStatus()` — idle/saving/saved/error state with auto-reset
- `useToast()` — stack-based toast state
- `useUndoRedo(initial)` — history stack (max 20), Ctrl+Z/Y keyboard shortcuts

**Section 5 — UI Components**
- `<AmbientBackground />` — 4 fixed blur circles (blue-500/30, cyan-400/20, zinc-700/20, sky-300/15)
- `<Toast />` — sağ alt köşe, 4 tip, auto-dismiss 3s, X button
- `<Skeleton />` — pulse placeholder
- `<ConfirmDialog />` — inline onay (no external modal)
- `<ErrorBoundary />` — class component, full-screen error card

**Section 6 — Screen Components**
- `<LoginScreen />` — glassmorphism card, Google sign-in, loading, error codes in Turkish
- `<DashboardScreen />` — route grid, search, empty state, inline new-route card, copy/delete
- `<EditorScreen />` — header, stats strip, left+right columns, mobile bottom tabs

**Section 7 — Editor Sub-Components**
- `<DayTabs />` — horizontal scroll, add/delete day, long-press context menu
- `<StopCard />` — full feature set: drag handle, map preview iframe, times, duration select+custom, notes accordion, accommodation toggle, trash
- `<Connector />` — animated SVG dashed line, distance + travel time info
- `<SmartSearch />` — debounced Gemini search (800ms, useRef cleanup), dropdown, coordinate input
- `<AIPanel />` — optimize, suggestions, empty-day route, chat (last 6 messages)

**Section 8 — `<App />`**
- Routes between login/dashboard/editor using `view` state
- URL query param `?route={routeId}` deep linking on load

#### [NEW] src/index.css
- Tailwind directives
- Print media query for PDF export
- Custom scrollbar styles

#### [NEW] index.html
- `window.__firebase_config`, `window.__gemini_api_key`, `window.__app_id` placeholder script block
- Google Fonts (Inter)

---

## Verification Plan

### Automated (Dev Server)
```bash
cd "c:\Users\Emmi\Documents\Gezi-Asistanı-AI"
npm run dev
```
Then use browser subagent to verify each screen.

### Manual Browser Verification
1. **Login screen** renders with ambient blur, Google sign-in button, app logo
2. **Dashboard** shows empty state with illustration + "İlk rotanı oluştur!" 
3. **New route inline card** opens without `prompt()`, validates empty name
4. **Route editor** opens with header stats strip, day tabs, smart search
5. **AI Panel** is visible on desktop right column, tab on mobile
6. **Print CSS** applies correctly via browser print preview
