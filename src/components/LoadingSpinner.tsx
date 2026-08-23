export default function LoadingSpinner({ fullscreen = false, label = 'Memuat...' }: { fullscreen?: boolean; label?: string }) {
  const spinner = (
    <div className="flex flex-col items-center gap-3 text-slate-400">
      <div className="h-10 w-10 rounded-full border-2 border-cyan-400/30 border-t-cyan-400 animate-spin" />
      <p className="text-sm">{label}</p>
    </div>
  );
  if (fullscreen) {
    return <div className="min-h-screen w-full flex items-center justify-center bg-[#05070d]">{spinner}</div>;
  }
  return <div className="w-full py-16 flex items-center justify-center">{spinner}</div>;
}
