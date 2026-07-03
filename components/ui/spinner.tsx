export function Spinner({ className = "" }: { className?: string }) {
  return (
    <div className={`inline-flex h-9 w-9 items-center justify-center ${className}`}>
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-transparent border-t-pink-500 border-r-purple-500" />
    </div>
  );
}
