//  import React, { useState, useEffect } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import UserList from '../components/UserList';
// import MessageList from '../components/MessageList';
// import MessageInput from '../components/MessageInput';
// import CallModal from '../components/CallModal';
// import { useChat } from '../hooks/useChat';
// import { useCall } from '../hooks/useCall';
// import { useSocket } from '../context/SocketContext';
// import { useAuth } from '../context/AuthContext';
// import api from '../utils/api';

// const ChatHeader = ({ user, isOnline, onAudioCall, onVideoCall }) => {
//   if (!user) return null;
//   return (
//     <div className="chat-header">
//       <div className="avatar">
//         {user.avatar
//           ? <img className="avatar-img" src={user.avatar} alt={user.username} />
//           : <div className="avatar-fallback" style={{ width: 40, height: 40, fontSize: 17 }}>
//               {user.username[0].toUpperCase()}
//             </div>
//         }
//         <span className={`online-dot ${isOnline ? 'online' : 'offline'}`} />
//       </div>

//       <div className="chat-header-info">
//         <div className="chat-header-name">{user.username}</div>
//         <div className={`chat-header-status ${isOnline ? 'online' : ''}`}>
//           {isOnline
//             ? '● Online'
//             : `Last seen ${user.lastSeen
//                 ? new Date(user.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
//                 : 'recently'}`}
//         </div>
//       </div>

//       <div className="chat-header-actions">
//         {/* Never disable the call buttons — let startCall handle the error gracefully */}
//         <button
//           className="call-action-btn"
//           onClick={onAudioCall}
//           title={isOnline ? 'Audio call' : 'User is offline — call anyway?'}
//         >
//           📞
//         </button>
//         <button
//           className="call-action-btn"
//           onClick={onVideoCall}
//           title={isOnline ? 'Video call' : 'User is offline — call anyway?'}
//         >
//           📹
//         </button>
//       </div>
//     </div>
//   );
// };

// const EmptyState = () => (
//   <div className="chat-empty">
//     <div className="chat-empty-icon">⚡</div>
//     <h2>Nexus Chat</h2>
//     <p>Select a user to start messaging</p>
//   </div>
// );

// export default function ChatPage() {
//   const { userId: paramUserId } = useParams();
//   const navigate = useNavigate();
//   const { isUserOnline, connected } = useSocket();
//   const { user: me } = useAuth();

//   const [selectedUser, setSelectedUser] = useState(null);
//   const [showOffline, setShowOffline] = useState(false);

//   const {
//     messages, loading, isTyping, sending,
//     sendMessage, emitTyping, addLocalMessage,
//   } = useChat(selectedUser?._id);

//   const {
//     callState, localStream, remoteStream,
//     isMuted, isCameraOff,
//     startCall, acceptCall, rejectCall, endCall,
//     toggleMute, toggleCamera,
//   } = useCall(me);

//   // Load user from URL param on first mount / navigation
//   useEffect(() => {
//     if (paramUserId && (!selectedUser || selectedUser._id !== paramUserId)) {
//       api.get(`/users/${paramUserId}`)
//         .then(({ data }) => setSelectedUser(data.user))
//         .catch(() => navigate('/chat', { replace: true }));
//     }
//   }, [paramUserId]); // eslint-disable-line

//   const handleSelectUser = (user) => {
//     setSelectedUser(user);
//     navigate(`/chat/${user._id}`, { replace: true });
//   };

//   useEffect(() => {
//     if (!connected) {
//       setShowOffline(true);
//     } else {
//       const t = setTimeout(() => setShowOffline(false), 2000);
//       return () => clearTimeout(t);
//     }
//   }, [connected]);

//   return (
//     <div className="chat-layout">
//       <UserList selectedUserId={selectedUser?._id} onSelectUser={handleSelectUser} />

//       <div className="chat-window">
//         {selectedUser ? (
//           <>
//             <ChatHeader
//               user={selectedUser}
//               isOnline={isUserOnline(selectedUser._id)}
//               onAudioCall={() => startCall(selectedUser, 'audio')}
//               onVideoCall={() => startCall(selectedUser, 'video')}
//             />
//             <MessageList
//               messages={messages}
//               loading={loading}
//               isTyping={isTyping}
//               selectedUser={selectedUser}
//             />
//             <MessageInput
//               onSend={sendMessage}
//               onTyping={emitTyping}
//               disabled={sending}
//               selectedUserId={selectedUser._id}
//               onMediaSent={addLocalMessage}
//             />
//           </>
//         ) : (
//           <EmptyState />
//         )}
//       </div>

//       {/* Call Modal — rendered globally so incoming calls work from any screen */}
//       <CallModal
//         callState={callState}
//         localStream={localStream}
//         remoteStream={remoteStream}
//         isMuted={isMuted}
//         isCameraOff={isCameraOff}
//         onAccept={acceptCall}
//         onReject={rejectCall}
//         onEnd={endCall}
//         onToggleMute={toggleMute}
//         onToggleCamera={toggleCamera}
//       />

//       {showOffline && (
//         <div className={`connection-status ${connected ? 'online' : 'offline'}`}>
//           <span>{connected ? '●' : '○'}</span>
//           {connected ? 'Reconnected' : 'Connection lost — reconnecting…'}
//         </div>
//       )}
//     </div>
//   );
// }

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import UserList from '../components/UserList';
import MessageList from '../components/MessageList';
import MessageInput from '../components/MessageInput';
import CallModal from '../components/CallModal';
import { useChat } from '../hooks/useChat';
import { useCall } from '../hooks/useCall';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

// ─── Detect mobile viewport ───────────────────────────────────────────────────
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
};

const ChatHeader = ({ user, isOnline, onAudioCall, onVideoCall, onBack }) => {
  if (!user) return null;
  return (
    <div className="chat-header">
      {/* Back arrow — mobile only */}
      <button className="btn-back" onClick={onBack} aria-label="Back to contacts">
        ←
      </button>

      <div className="avatar">
        {user.avatar
          ? <img className="avatar-img" src={user.avatar} alt={user.username} />
          : <div className="avatar-fallback" style={{ width: 40, height: 40, fontSize: 16 }}>
              {user.username[0].toUpperCase()}
            </div>
        }
        <span className={`online-dot ${isOnline ? 'online' : 'offline'}`} />
      </div>

      <div className="chat-header-info">
        <div className="chat-header-name">{user.username}</div>
        <div className={`chat-header-status ${isOnline ? 'online' : ''}`}>
          {isOnline
            ? '● Online'
            : `Last seen ${user.lastSeen
                ? new Date(user.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : 'recently'}`}
        </div>
      </div>

      <div className="chat-header-actions">
        <button className="call-action-btn" onClick={onAudioCall} title="Audio call">📞</button>
        <button className="call-action-btn" onClick={onVideoCall} title="Video call">📹</button>
      </div>
    </div>
  );
};

const EmptyState = () => (
  <div className="chat-empty">
    <div className="chat-empty-icon">⚡</div>
    <h2>Nexus Chat</h2>
    <p>Select a contact to start chatting</p>
  </div>
);

export default function ChatPage() {
  const { userId: paramUserId } = useParams();
  const navigate    = useNavigate();
  const isMobile    = useIsMobile();
  const { isUserOnline, connected } = useSocket();
  const { user: me } = useAuth();

  const [selectedUser,  setSelectedUser]  = useState(null);
  const [showOffline,   setShowOffline]   = useState(false);
  // On mobile: true = show sidebar, false = show chat pane
  const [showSidebar,   setShowSidebar]   = useState(true);

  const {
    messages, loading, isTyping, sending,
    sendMessage, emitTyping, addLocalMessage,
  } = useChat(selectedUser?._id);

  const {
    callState, localStream, remoteStream,
    isMuted, isCameraOff,
    startCall, acceptCall, rejectCall, endCall,
    toggleMute, toggleCamera,
  } = useCall(me);

  // Load user from URL param
  useEffect(() => {
    if (paramUserId && (!selectedUser || selectedUser._id !== paramUserId)) {
      api.get(`/users/${paramUserId}`)
        .then(({ data }) => {
          setSelectedUser(data.user);
          setShowSidebar(false); // Auto-switch to chat pane on mobile
        })
        .catch(() => navigate('/chat', { replace: true }));
    }
  }, [paramUserId]); // eslint-disable-line

  const handleSelectUser = useCallback((user) => {
    setSelectedUser(user);
    navigate(`/chat/${user._id}`, { replace: true });
    setShowSidebar(false); // On mobile: hide sidebar, show chat
  }, [navigate]);

  const handleBack = useCallback(() => {
    setShowSidebar(true); // Return to contact list on mobile
  }, []);

  useEffect(() => {
    if (!connected) {
      setShowOffline(true);
    } else {
      const t = setTimeout(() => setShowOffline(false), 2500);
      return () => clearTimeout(t);
    }
  }, [connected]);

  // On desktop: sidebar is always visible so showSidebar state doesn't matter
  const sidebarHidden = isMobile && !showSidebar;

  return (
    <div className="chat-layout">
      {/* Sidebar */}
      <div className={`sidebar ${sidebarHidden ? 'hidden-mobile' : ''}`}>
        <UserList
          selectedUserId={selectedUser?._id}
          onSelectUser={handleSelectUser}
        />
      </div>

      {/* Chat window — always rendered; on mobile shows when sidebar hidden */}
      <div className="chat-window">
        {selectedUser ? (
          <>
            <ChatHeader
              user={selectedUser}
              isOnline={isUserOnline(selectedUser._id)}
              onAudioCall={() => startCall(selectedUser, 'audio')}
              onVideoCall={() => startCall(selectedUser, 'video')}
              onBack={handleBack}
            />
            <MessageList
              messages={messages}
              loading={loading}
              isTyping={isTyping}
              selectedUser={selectedUser}
            />
            <MessageInput
              onSend={sendMessage}
              onTyping={emitTyping}
              disabled={sending}
              selectedUserId={selectedUser._id}
              onMediaSent={addLocalMessage}
            />
          </>
        ) : (
          // On desktop with no chat selected, show empty state
          !isMobile && <EmptyState />
        )}
      </div>

      <CallModal
        callState={callState}
        localStream={localStream}
        remoteStream={remoteStream}
        isMuted={isMuted}
        isCameraOff={isCameraOff}
        onAccept={acceptCall}
        onReject={rejectCall}
        onEnd={endCall}
        onToggleMute={toggleMute}
        onToggleCamera={toggleCamera}
      />

      {showOffline && (
        <div className={`connection-status ${connected ? 'online' : 'offline'}`}>
          <span>{connected ? '●' : '○'}</span>
          {connected ? 'Reconnected' : 'Connection lost…'}
        </div>
      )}
    </div>
  );
}