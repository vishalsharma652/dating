const jwt = require('jsonwebtoken');
const env = require('../config/env');

// userId (string) → Set<socketId>
const userSockets = new Map();

function setupCallSignaling(io) {
  // ── Socket.IO auth middleware ─────────────────────────────────
  io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      (socket.handshake.headers?.authorization || '').replace('Bearer ', '');

    if (!token) return next(new Error('Unauthorized: no token'));

    try {
      const decoded = jwt.verify(token, env.jwtSecret);
      socket.userId = String(decoded.id);
      next();
    } catch {
      next(new Error('Unauthorized: invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    console.log(`[Socket] ✅ User ${userId} connected → ${socket.id}`);

    // Track sockets per user (multi-tab support)
    if (!userSockets.has(userId)) userSockets.set(userId, new Set());
    userSockets.get(userId).add(socket.id);

    // Each user joins their own room
    socket.join(`user:${userId}`);

    /** Emit to a specific user (all their open tabs/devices) */
    const toUser = (targetId, event, data) =>
      io.to(`user:${String(targetId)}`).emit(event, data);

    // ── INITIATE call ─────────────────────────────────────────
    // Caller → server → callee
    socket.on('call:initiate', ({ calleeId, callType, callerName, callerPhoto }) => {
      console.log(`[Call] ${userId} → ${calleeId} (${callType})`);
      toUser(calleeId, 'call:incoming', {
        callerId: userId,
        callerName: callerName || 'Unknown',
        callerPhoto: callerPhoto || null,
        callType,
      });
    });

    // ── ACCEPT call ───────────────────────────────────────────
    // Callee accepted → notify caller
    socket.on('call:accept', ({ callerId }) => {
      console.log(`[Call] ${userId} accepted call from ${callerId}`);
      toUser(callerId, 'call:accepted', { calleeId: userId });
    });

    // ── REJECT call ───────────────────────────────────────────
    socket.on('call:reject', ({ callerId }) => {
      console.log(`[Call] ${userId} rejected call from ${callerId}`);
      toUser(callerId, 'call:rejected', { calleeId: userId });
    });

    // ── END call ──────────────────────────────────────────────
    socket.on('call:end', ({ peerId }) => {
      console.log(`[Call] ${userId} ended call with ${peerId}`);
      toUser(peerId, 'call:ended', { by: userId });
    });

    // ── WebRTC SDP Offer ──────────────────────────────────────
    socket.on('call:offer', ({ peerId, offer }) => {
      toUser(peerId, 'call:offer', { from: userId, offer });
    });

    // ── WebRTC SDP Answer ─────────────────────────────────────
    socket.on('call:answer', ({ peerId, answer }) => {
      toUser(peerId, 'call:answer', { from: userId, answer });
    });

    // ── ICE Candidate ─────────────────────────────────────────
    socket.on('call:ice-candidate', ({ peerId, candidate }) => {
      toUser(peerId, 'call:ice-candidate', { from: userId, candidate });
    });

    // ── Disconnect ────────────────────────────────────────────
    socket.on('disconnect', () => {
      console.log(`[Socket] ❌ User ${userId} disconnected → ${socket.id}`);
      userSockets.get(userId)?.delete(socket.id);
      if (userSockets.get(userId)?.size === 0) userSockets.delete(userId);
    });
  });
}

module.exports = { setupCallSignaling };
