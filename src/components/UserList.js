//  import React, { useEffect, useState, useCallback } from 'react';
//  import { useSocket } from '../context/SocketContext';
//  import { useAuth } from '../context/AuthContext';
//  import api from '../utils/api';
 
//  const Avatar = ({ user, size = '' }) => {
//    const initial = user?.username?.[0]?.toUpperCase() || '?';
//    return (
//      <div className={`avatar ${size}`}>
//        {user?.avatar
//          ? <img className="avatar-img" src={user.avatar} alt={user.username} />
//          : <div className="avatar-fallback">{initial}</div>
//        }
//      </div>
//    );
//  };
 
//  export { Avatar };
 
//  export default function UserList({ selectedUserId, onSelectUser }) {
//    const { user: me, logout } = useAuth();
//    const { isUserOnline } = useSocket();
//    const [users, setUsers] = useState([]);
//    const [conversations, setConversations] = useState({});
//    const [loading, setLoading] = useState(true);
 
//    const fetchUsers = useCallback(async () => {
//      try {
//        const [usersRes, convsRes] = await Promise.all([
//          api.get('/users'),
//          api.get('/chat/conversations'),
//        ]);
//        setUsers(usersRes.data.users);
 
//        // Build a map of userId -> unreadCount from conversations
//        const unreadMap = {};
//        convsRes.data.conversations.forEach((c) => {
//          if (c.participant) {
//            unreadMap[c.participant._id] = c.unreadCount || 0;
//          }
//        });
//        setConversations(unreadMap);
//      } catch (err) {
//        console.error('Failed to fetch users:', err);
//      } finally {
//        setLoading(false);
//      }
//    }, []);
 
//    useEffect(() => {
//      fetchUsers();
//      const interval = setInterval(fetchUsers, 30000); // Refresh every 30s
//      return () => clearInterval(interval);
//    }, [fetchUsers]);
 
//    const sortedUsers = [...users].sort((a, b) => {
//      const aOnline = isUserOnline(a._id);
//      const bOnline = isUserOnline(b._id);
//      if (aOnline !== bOnline) return bOnline ? 1 : -1;
//      return a.username.localeCompare(b.username);
//    });
 
//    return (
//      <div className="sidebar">
//        {/* Header */}
//        <div className="sidebar-header">
//          <div className="sidebar-brand">
//            <div className="sidebar-brand-icon">⚡</div>
//            <span className="sidebar-brand-name">Nexus</span>
//          </div>
//        </div>
 
//        {/* User list */}
//        <div className="sidebar-section-title">Direct Messages</div>
 
//        <div className="sidebar-user-list">
//          {loading ? (
//            <div style={{ padding: '20px', textAlign: 'center' }}>
//              <div className="loader-ring" style={{ width: 24, height: 24, borderWidth: 2 }} />
//            </div>
//          ) : sortedUsers.length === 0 ? (
//            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
//              No other users yet
//            </div>
//          ) : (
//            sortedUsers.map((u) => {
//              const online = isUserOnline(u._id);
//              const unread = conversations[u._id] || 0;
//              return (
//                <div
//                  key={u._id}
//                  className={`sidebar-user-item ${selectedUserId === u._id ? 'active' : ''}`}
//                  onClick={() => onSelectUser(u)}
//                >
//                  <div className="avatar">
//                    {u.avatar
//                      ? <img className="avatar-img" src={u.avatar} alt={u.username} />
//                      : <div className="avatar-fallback">{u.username[0].toUpperCase()}</div>
//                    }
//                    <span className={`online-dot ${online ? 'online' : 'offline'}`} />
//                  </div>
 
//                  <div className="user-info">
//                    <div className="user-name">{u.username}</div>
//                    <div className={`user-status ${online ? 'online' : ''}`}>
//                      {online ? '● Online' : 'Offline'}
//                    </div>
//                  </div>
 
//                  {unread > 0 && (
//                    <span className="unread-badge">{unread > 99 ? '99+' : unread}</span>
//                  )}
//                </div>
//              );
//            })
//          )}
//        </div>
 
//        {/* Profile footer */}
//        <div className="sidebar-profile">
//          <div className="avatar">
//            <div className="avatar-fallback" style={{ width: 36, height: 36, fontSize: 15 }}>
//              {me?.username?.[0]?.toUpperCase()}
//            </div>
//            <span className="online-dot online" />
//          </div>
//          <div className="sidebar-profile-info">
//            <div className="sidebar-profile-name">{me?.username}</div>
//            <div className="sidebar-profile-role">{me?.role}</div>
//          </div>
//          <button
//            className="btn-icon"
//            onClick={logout}
//            title="Log out"
//          >
//            ⏻
//          </button>
//        </div>
//      </div>
//    );
//  }
 

import React, { useEffect, useState, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function UserList({ selectedUserId, onSelectUser }) {
  const { user: me, logout } = useAuth();
  const { isUserOnline } = useSocket();
  const [users, setUsers] = useState([]);
  const [conversations, setConversations] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    try {
      const [usersRes, convsRes] = await Promise.all([
        api.get('/users'),
        api.get('/chat/conversations'),
      ]);
      setUsers(usersRes.data.users);

      const unreadMap = {};
      convsRes.data.conversations.forEach((c) => {
        if (c.participant) unreadMap[c.participant._id] = c.unreadCount || 0;
      });
      setConversations(unreadMap);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    const interval = setInterval(fetchUsers, 30000);
    return () => clearInterval(interval);
  }, [fetchUsers]);

  const sortedUsers = [...users].sort((a, b) => {
    const aOnline = isUserOnline(a._id);
    const bOnline = isUserOnline(b._id);
    if (aOnline !== bOnline) return bOnline ? 1 : -1;
    return a.username.localeCompare(b.username);
  });

  // ── UserList renders ONLY its inner content — no sidebar wrapper ──────────
  // The outer .sidebar div is owned by ChatPage so it can control
  // the hidden-mobile class without a double-nesting problem.
  return (
    <>
      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">⚡</div>
          <span className="sidebar-brand-name">Nexus</span>
        </div>
      </div>

      {/* Section label */}
      <div className="sidebar-section-title">Direct Messages</div>

      {/* Scrollable user list */}
      <div className="sidebar-user-list">
        {loading ? (
          <div style={{ padding: '24px', textAlign: 'center' }}>
            <div className="loader-ring" style={{ width: 24, height: 24, borderWidth: 2 }} />
          </div>
        ) : sortedUsers.length === 0 ? (
          <div style={{
            padding: '24px', textAlign: 'center',
            color: 'var(--text-muted)', fontSize: 12,
            fontFamily: 'var(--font-mono)',
          }}>
            No other users yet
          </div>
        ) : (
          sortedUsers.map((u) => {
            const online = isUserOnline(u._id);
            const unread = conversations[u._id] || 0;
            return (
              <div
                key={u._id}
                className={`sidebar-user-item ${selectedUserId === u._id ? 'active' : ''}`}
                onClick={() => onSelectUser(u)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && onSelectUser(u)}
              >
                <div className="avatar">
                  {u.avatar
                    ? <img className="avatar-img" src={u.avatar} alt={u.username} />
                    : <div className="avatar-fallback">{u.username[0].toUpperCase()}</div>
                  }
                  <span className={`online-dot ${online ? 'online' : 'offline'}`} />
                </div>

                <div className="user-info">
                  <div className="user-name">{u.username}</div>
                  <div className={`user-status ${online ? 'online' : ''}`}>
                    {online ? '● Online' : 'Offline'}
                  </div>
                </div>

                {unread > 0 && (
                  <span className="unread-badge">{unread > 99 ? '99+' : unread}</span>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Profile footer */}
      <div className="sidebar-profile">
        <div className="avatar">
          <div className="avatar-fallback" style={{ width: 38, height: 38, fontSize: 15 }}>
            {me?.username?.[0]?.toUpperCase()}
          </div>
          <span className="online-dot online" />
        </div>
        <div className="sidebar-profile-info">
          <div className="sidebar-profile-name">{me?.username}</div>
          <div className="sidebar-profile-role">{me?.role}</div>
        </div>
        <button className="btn-icon" onClick={logout} title="Log out">⏻</button>
      </div>
    </>
  );
}