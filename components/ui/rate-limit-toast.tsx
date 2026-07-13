'use client';

import { useEffect, useState, useCallback } from 'react';
import { AlertTriangle, X, Clock } from 'lucide-react';

interface RateLimitState {
  visible: boolean;
  message: string;
  retryAfter: number; // seconds remaining
}

/**
 * Global rate-limit toast.
 * Listens for the 'app:rate-limited' CustomEvent dispatched by api.ts
 * and shows an animated banner with a live countdown.
 */
export function RateLimitToast() {
  const [state, setState] = useState<RateLimitState>({
    visible: false,
    message: '',
    retryAfter: 0,
  });

  const dismiss = useCallback(() => {
    setState((s) => ({ ...s, visible: false }));
  }, []);

  // Listen for rate-limit events fired by the API client
  useEffect(() => {
    const handler = (e: Event) => {
      const { message, retryAfter } = (e as CustomEvent).detail as { message: string; retryAfter: number };
      setState({ visible: true, message, retryAfter });
    };
    window.addEventListener('app:rate-limited', handler);
    return () => window.removeEventListener('app:rate-limited', handler);
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!state.visible || state.retryAfter <= 0) return;
    const id = setInterval(() => {
      setState((s) => {
        if (s.retryAfter <= 1) {
          clearInterval(id);
          return { ...s, visible: false, retryAfter: 0 };
        }
        return { ...s, retryAfter: s.retryAfter - 1 };
      });
    }, 1000);
    return () => clearInterval(id);
  }, [state.visible, state.retryAfter]);

  if (!state.visible) return null;

  const mins = Math.floor(state.retryAfter / 60);
  const secs = state.retryAfter % 60;
  const countdown = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-full max-w-md px-4 animate-in slide-in-from-top-4 fade-in duration-300"
    >
      <div className="flex items-start gap-3 rounded-2xl border border-amber-300/40 bg-amber-50 dark:bg-amber-950/90 dark:border-amber-700/40 shadow-[0_8px_32px_rgba(0,0,0,0.18)] backdrop-blur-md px-5 py-4">
        {/* Icon */}
        <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center mt-0.5">
          <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-amber-900 dark:text-amber-100 text-sm leading-snug">
            Too Many Requests
          </p>
          <p className="text-amber-700 dark:text-amber-300 text-sm mt-0.5 leading-relaxed">
            {state.message}
          </p>
          {state.retryAfter > 0 && (
            <div className="flex items-center gap-1.5 mt-2">
              <Clock size={13} className="text-amber-500 dark:text-amber-400 flex-shrink-0" />
              <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                Retry in <span className="font-bold tabular-nums">{countdown}</span>
              </span>
            </div>
          )}
        </div>

        {/* Dismiss */}
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-amber-500 hover:text-amber-700 dark:hover:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors mt-0.5"
        >
          <X size={15} />
        </button>
      </div>

      {/* Progress bar that shrinks as countdown ticks */}
      {state.retryAfter > 0 && (
        <div className="mt-1.5 h-1 rounded-full bg-amber-100 dark:bg-amber-900/40 overflow-hidden mx-1">
          <div
            className="h-full bg-amber-400 dark:bg-amber-500 rounded-full transition-all duration-1000 ease-linear"
            style={{ width: `${Math.min((state.retryAfter / 60) * 100, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}
