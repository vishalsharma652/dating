import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * WhatsApp-style last seen presence indicator
 * Returns "Online now", "Last seen today at 10:30 AM", "Last seen yesterday at 9:15 PM", etc.
 */
export function formatLastSeen(
  online?: boolean | number | string,
  lastSeenAt?: string | Date | null
): string {
  const isOnline = Boolean(
    online === true ||
    online === 1 ||
    online === '1' ||
    online === 'true' ||
    online === 'Online' ||
    online === 'online'
  );

  if (isOnline) {
    return 'Online now';
  }

  if (!lastSeenAt) {
    return 'Offline';
  }

  const date = new Date(lastSeenAt);
  if (isNaN(date.getTime())) {
    return 'Offline';
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 0) {
    return 'Last seen just now';
  }

  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);

  if (diffSec < 60) {
    return 'Last seen just now';
  }

  if (diffMin < 60) {
    return `Last seen ${diffMin}m ago`;
  }

  const formatTime = (d: Date) => {
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    return `Last seen today at ${formatTime(date)}`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) {
    return `Last seen yesterday at ${formatTime(date)}`;
  }

  const isSameYear = date.getFullYear() === now.getFullYear();
  if (isSameYear) {
    const monthName = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return `Last seen ${monthName} at ${formatTime(date)}`;
  }

  const fullDate = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  return `Last seen ${fullDate} at ${formatTime(date)}`;
}

/**
 * Compact short last seen string for cards and badges
 * Returns "Online", "5m ago", "2h ago", "10 Mar", etc.
 */
export function formatLastSeenShort(
  online?: boolean | number | string,
  lastSeenAt?: string | Date | null
): string {
  const isOnline = Boolean(
    online === true ||
    online === 1 ||
    online === '1' ||
    online === 'true' ||
    online === 'Online' ||
    online === 'online'
  );

  if (isOnline) {
    return 'Online';
  }

  if (!lastSeenAt) {
    return 'Offline';
  }

  const date = new Date(lastSeenAt);
  if (isNaN(date.getTime())) {
    return 'Offline';
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 0) return 'Just now';

  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `${diffMin || 1}m ago`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;

  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}d ago`;

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * Format message created_at timestamp to local 12-hour time (e.g. 10:30 AM)
 */
export function formatMessageTime(
  createdAt?: string | Date | null,
  fallbackTimestamp?: string
): string {
  if (!createdAt) return fallbackTimestamp || '';
  const date = new Date(createdAt);
  if (isNaN(date.getTime())) return fallbackTimestamp || '';
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
}

