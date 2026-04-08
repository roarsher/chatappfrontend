 import React, { useEffect, useRef } from 'react';
 import { useAuth } from '../context/AuthContext';
 import { format, isToday, isYesterday, isSameDay } from 'date-fns';
 import MediaMessage from './MediaMessage';
 
 const formatTime = (date) => format(new Date(date), 'HH:mm');
 const formatDateLabel = (date) => {
   const d = new Date(date);
   if (isToday(d)) return 'Today';
   if (isYesterday(d)) return 'Yesterday';
   return format(d, 'MMMM d, yyyy');
 };
 
 const DateDivider = ({ date }) => (
   <div className="date-divider">
     <span className="date-divider-text">{formatDateLabel(date)}</span>
   </div>
 );
 
 export default function MessageList({ messages, loading, isTyping, selectedUser }) {
   const { user: me } = useAuth();
   const bottomRef = useRef(null);
   const prevLengthRef = useRef(0);
 
   useEffect(() => {
     if (messages.length !== prevLengthRef.current) {
       bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
       prevLengthRef.current = messages.length;
     }
   }, [messages]);
 
   useEffect(() => {
     bottomRef.current?.scrollIntoView();
   }, [selectedUser?._id]);
 
   if (loading) {
     return (
       <div className="messages-area" style={{ alignItems: 'center', justifyContent: 'center' }}>
         <div className="loader-ring" />
       </div>
     );
   }
 
   const grouped = [];
   let lastDate = null;
   messages.forEach((msg, i) => {
     const msgDate = new Date(msg.createdAt);
     if (!lastDate || !isSameDay(lastDate, msgDate)) {
       grouped.push({ type: 'divider', date: msgDate, key: `divider-${i}` });
       lastDate = msgDate;
     }
     grouped.push({ type: 'message', msg, key: msg._id });
   });
 
   const getSenderId = (msg) => msg.sender?._id || msg.sender;
 
   return (
     <>
       <div className="messages-area">
         {messages.length === 0 && (
           <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--text-muted)', height: '100%' }}>
             <div style={{ fontSize: 40 }}>💬</div>
             <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 1 }}>No messages yet. Say hello!</p>
           </div>
         )}
 
         {grouped.map((item) => {
           if (item.type === 'divider') return <DateDivider key={item.key} date={item.date} />;
           const msg = item.msg;
           const isSent = getSenderId(msg) === me._id;
           const isDeleted = msg.isDeleted;
           const isMedia = ['image', 'video', 'file'].includes(msg.type);
 
           return (
             <div key={item.key}>
               <div className={`message-row ${isSent ? 'sent' : 'received'}`}>
                 {isDeleted ? (
                   <div className="message-bubble deleted">🚫 This message was deleted.</div>
                 ) : isMedia ? (
                   <MediaMessage message={msg} isSent={isSent} />
                 ) : (
                   <div className={`message-bubble ${isSent ? 'sent' : 'received'}`}>
                     {msg.content}
                   </div>
                 )}
               </div>
               <div
                 className="message-meta"
                 style={{ justifyContent: isSent ? 'flex-end' : 'flex-start', paddingRight: isSent ? 4 : 0, paddingLeft: isSent ? 0 : 4 }}
               >
                 <span>{formatTime(msg.createdAt)}</span>
                 {isSent && <span className="read-indicator">{msg.isRead ? '✓✓' : '✓'}</span>}
               </div>
             </div>
           );
         })}
         <div ref={bottomRef} />
       </div>
 
       <div className="typing-indicator">
         {isTyping && (
           <>
             <div className="typing-dots"><span /><span /><span /></div>
             <span>{selectedUser?.username} is typing…</span>
           </>
         )}
       </div>
     </>
   );
 }
 