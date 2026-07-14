export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0f0f1a]/95 backdrop-blur-md transition-all duration-300">
      <div className="relative flex flex-col items-center gap-4">
        {/* Outer glowing pulsing orb */}
        <div className="absolute -inset-6 rounded-full bg-[#6c5ce7]/10 blur-2xl animate-pulse"></div>
        
        {/* Inner premium spinning ring */}
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-white/5 border-t-[#6c5ce7] shadow-[0_0_30px_rgba(108,92,231,0.4)]"></div>
        
        {/* Glowing branding label */}
        <div className="mt-4 flex flex-col items-center">
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#6c5ce7] animate-pulse">
            Saathika
          </span>
          <span className="mt-2 text-xs text-[#a1a1aa] tracking-wide">
            Loading premium experience...
          </span>
        </div>
      </div>
    </div>
  );
}
