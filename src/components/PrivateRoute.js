 import React from 'react';
 import { Navigate, useLocation } from 'react-router-dom';
 import { useAuth } from '../context/AuthContext';
 
 // ─── Generic loader shown while session is being verified ─────────────────────
 const FullPageLoader = () => (
   <div style={{
     display: 'flex', alignItems: 'center', justifyContent: 'center',
     height: '100vh', background: '#0a0a0f', color: '#7c6aff',
     fontFamily: "'JetBrains Mono', monospace", fontSize: '14px', letterSpacing: '2px'
   }}>
     <div style={{ textAlign: 'center' }}>
       <div className="loader-ring" />
       <p style={{ marginTop: 16, opacity: 0.6 }}>VERIFYING SESSION…</p>
     </div>
   </div>
 );
 
 // ─── PrivateRoute: Protects pages that require authentication ─────────────────
 export const PrivateRoute = ({ children }) => {
   const { user, loading } = useAuth();
   const location = useLocation();
 
   if (loading) return <FullPageLoader />;
 
   if (!user) {
     // Preserve intended destination for redirect after login
     return <Navigate to="/login" state={{ from: location }} replace />;
   }
 
   return children;
 };
 
 // ─── AdminRoute: Additional role check on top of auth ─────────────────────────
 export const AdminRoute = ({ children }) => {
   const { user, loading } = useAuth();
   const location = useLocation();
 
   if (loading) return <FullPageLoader />;
   if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
   if (user.role !== 'admin') return <Navigate to="/chat" replace />;
 
   return children;
 };
 
 // ─── PublicRoute: Redirects logged-in users away from login/register ──────────
 export const PublicRoute = ({ children }) => {
   const { user, loading } = useAuth();
 
   if (loading) return <FullPageLoader />;
   if (user) return <Navigate to="/chat" replace />;
 
   return children;
 };
 