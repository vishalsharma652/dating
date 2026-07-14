interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-4',
  };

  return (
    <div 
      className={`inline-block animate-spin rounded-full border-zinc-200/20 dark:border-zinc-800/30 border-t-pink-500 border-r-purple-500 ${sizeClasses[size]} ${className}`} 
      style={{ borderStyle: 'solid' }}
    />
  );
}
