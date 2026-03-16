export function AmbientBackground() {
  return (
    <div className="ambient-bg fixed inset-0 pointer-events-none overflow-hidden -z-10" aria-hidden="true">
      <div className="absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full bg-blue-500/40 blur-[140px]" />
      <div className="absolute top-1/2 -right-60 w-[600px] h-[600px] rounded-full bg-cyan-400/25 blur-[140px]" />
      <div className="absolute -bottom-60 left-1/3 w-[650px] h-[650px] rounded-full bg-zinc-700/30 blur-[120px]" />
      <div className="absolute top-1/4 left-1/2 w-[500px] h-[500px] rounded-full bg-sky-300/20 blur-[120px]" />
    </div>
  );
}
