 import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

// We import the memory token getter so the socket can authenticate
// even when the HTTP-only cookie is blocked cross-domain
let _getToken = null;
export const registerTokenGetter = (fn) => { _getToken = fn; };

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [connected, setConnected] = useState(false);
  const [socketVersion, setSocketVersion] = useState(0);

  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setConnected(false);
        setOnlineUsers([]);
        setSocketVersion((v) => v + 1);
      }
      return;
    }

    // Get token from memory if available (cross-domain fallback)
    const token = _getToken ? _getToken() : null;

    const socket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:5000', {
      withCredentials: true,
      auth: token ? { token } : {},   // Send token in handshake for socket auth
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ['websocket'],
    });

    socketRef.current = socket;
    setSocketVersion((v) => v + 1);

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      setConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
      setConnected(false);
    });

    socket.on('onlineUsers', (userIds) => {
      setOnlineUsers(userIds.map(String));
    });

    socket.on('userOnline', ({ userId }) => {
      setOnlineUsers((prev) => [...new Set([...prev, String(userId)])]);
    });

    socket.on('userOffline', ({ userId }) => {
      setOnlineUsers((prev) => prev.filter((id) => id !== String(userId)));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  const isUserOnline = (userId) => userId ? onlineUsers.includes(String(userId)) : false;

  return (
    <SocketContext.Provider value={{ socketRef, connected, onlineUsers, isUserOnline, socketVersion }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
};