export function Skeleton({ className = '' }) {
  return (
    <div className={`skeleton-shimmer rounded-2xl bg-white/5 ${className}`} aria-hidden="true" />
  );
}

export function RouteSkeleton() {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5 space-y-3">
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

export function StopSkeleton() {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/5 p-4 space-y-2">
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

export function FullScreenLoader({ message = 'Yükleniyor...' }) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-zinc-950 z-50 gap-4">
      <div className="w-10 h-10 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      <p className="text-zinc-400 text-sm">{message}</p>
    </div>
  );
}
