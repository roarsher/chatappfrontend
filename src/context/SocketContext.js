 import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  // Expose the ref itself so consumers always get the live socket instance
  const socketRef = useRef(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [connected, setConnected] = useState(false);
  // Bump this counter whenever the socket instance changes so hooks re-subscribe
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

    const socket = io(process.env.REACT_APP_SERVER_URL || 'https://chatappbackend-4bim.onrender.com', {
      withCredentials: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ['websocket'],
    });

    socketRef.current = socket;
    setSocketVersion((v) => v + 1); // Notify consumers a new socket is ready

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
      // Normalise to strings
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

  // Always compare as strings to avoid ObjectId vs string mismatch
  const isUserOnline = (userId) => userId ? onlineUsers.includes(String(userId)) : false;

  // Expose socketRef so consumers read the live instance, plus socketVersion
  // so they can re-run effects when the socket reconnects
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