import { io, Socket } from 'socket.io-client';
import { getToken } from './api';

let socket: Socket | null = null;

const SOCKET_URL = (() => {
  const envBase = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (envBase) return envBase.replace(/\/api\/?$/, '');
  
  if (typeof window !== 'undefined') {
    return `http://${window.location.hostname}:5000`;
  }
  return 'http://localhost:5000';
})();

/** Return (and lazily create) the singleton Socket.IO client. */
export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
}

/** Connect with the current auth token. Call this after login. */
export function connectSocket(): Socket {
  const s = getSocket();
  // Always refresh the auth token before connecting/reconnecting
  s.auth = { token: getToken() ?? '' };
  if (!s.connected) s.connect();
  return s;
}

/** Disconnect and destroy the singleton (call on logout). */
export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}
