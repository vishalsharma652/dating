import { Spinner } from "./spinner";

interface LoaderProps {
  loading?: boolean;
  fullscreen?: boolean;
  text?: string;
  className?: string;
}

export function Loader({ loading = true, fullscreen = false, text = "Loading...", className = "" }: LoaderProps) {
  if (!loading) return null;

  if (fullscreen) {
    return (
      <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0f0f1a]/85 backdrop-blur-md transition-all duration-300 ${className}`}>
        <div className="relative flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-200">
          {/* Glowing pulse ring */}
          <div className="absolute -inset-6 rounded-full bg-pink-500/10 blur-2xl animate-pulse"></div>
          
          {/* Premium spin loader */}
          <Spinner size="lg" className="shadow-[0_0_30px_rgba(236,72,153,0.3)] !h-16 !w-16" />
          
          <div className="mt-4 flex flex-col items-center">
            <span className="text-xs font-bold uppercase tracking-[0.25em] bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent animate-pulse">
              Saathika
            </span>
            <span className="mt-2 text-xs text-zinc-400 tracking-wide">
              {text}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center p-8 gap-3 animate-in fade-in duration-200 ${className}`}>
      <Spinner size="md" />
      {text && <span className="text-xs text-zinc-400 tracking-wide">{text}</span>}
    </div>
  );
}
