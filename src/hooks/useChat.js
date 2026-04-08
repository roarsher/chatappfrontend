 import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import api from '../utils/api';

export const useChat = (selectedUserId) => {
  const { socketRef, socketVersion } = useSocket();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const [pagination, setPagination] = useState(null);
  const typingTimeoutRef = useRef(null);

  const loadMessages = useCallback(async (page = 1) => {
    if (!selectedUserId) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/chat/${selectedUserId}?page=${page}&limit=50`);
      if (page === 1) setMessages(data.messages);
      else setMessages((prev) => [...data.messages, ...prev]);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedUserId]);

  useEffect(() => {
    if (selectedUserId) {
      setMessages([]);
      loadMessages(1);
    }
  }, [selectedUserId, loadMessages]);

  // Re-subscribe to socket events whenever socket reconnects
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const addMessage = (message) => {
      const sid = String(message.sender?._id || message.sender);
      const rid = String(message.receiver?._id || message.receiver);
      const isRelevant = selectedUserId && (sid === selectedUserId || rid === selectedUserId);
      if (isRelevant) {
        setMessages((prev) => {
          if (prev.find((m) => m._id === message._id)) return prev;
          return [...prev, message];
        });
        socket.emit('markRead', { senderId: sid });
      }
    };

    const handleTyping = ({ userId, isTyping }) => {
      if (userId === selectedUserId) {
        setTypingUsers((prev) => ({ ...prev, [userId]: isTyping }));
      }
    };

    const handleMessagesRead = () => {
      setMessages((prev) => prev.map((m) => ({ ...m, isRead: true })));
    };

    socket.on('newMessage', addMessage);
    socket.on('messageSent', addMessage);
    socket.on('userTyping', handleTyping);
    socket.on('messagesRead', handleMessagesRead);

    return () => {
      socket.off('newMessage', addMessage);
      socket.off('messageSent', addMessage);
      socket.off('userTyping', handleTyping);
      socket.off('messagesRead', handleMessagesRead);
    };
  }, [socketVersion, selectedUserId]); // eslint-disable-line react-hooks/exhaustive-deps

  const sendMessage = useCallback(async (content) => {
    if (!content.trim() || !selectedUserId) return;
    const socket = socketRef.current;
    if (!socket) return;
    setSending(true);
    socket.emit('sendMessage', { receiverId: selectedUserId, content }, () => setSending(false));
  }, [socketRef, selectedUserId]);

  const addLocalMessage = useCallback((message) => {
    setMessages((prev) => {
      if (prev.find((m) => m._id === message._id)) return prev;
      return [...prev, message];
    });
  }, []);

  const emitTyping = useCallback((isTyping) => {
    const socket = socketRef.current;
    if (!socket || !selectedUserId) return;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socket.emit('typing', { receiverId: selectedUserId, isTyping });
    if (isTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing', { receiverId: selectedUserId, isTyping: false });
      }, 3000);
    }
  }, [socketRef, selectedUserId]);

  const isTyping = selectedUserId ? !!typingUsers[selectedUserId] : false;

  return {
    messages,
    loading,
    sending,
    isTyping,
    pagination,
    sendMessage,
    emitTyping,
    addLocalMessage,
    loadMore: () => loadMessages((pagination?.current || 1) + 1),
  };
};