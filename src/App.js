 import React from 'react';
 import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
 import { AuthProvider } from './context/AuthContext';
 import { SocketProvider } from './context/SocketContext';
 import { PrivateRoute, PublicRoute, AdminRoute } from './components/PrivateRoute';
 import LoginPage from './pages/LoginPage';
 import RegisterPage from './pages/RegisterPage';
 import ChatPage from './pages/ChatPage';
 import './App.css';
 
 function App() {
   return (
     <AuthProvider>
       <SocketProvider>
         <Router>
           <Routes>
             <Route path="/" element={<Navigate to="/chat" replace />} />
 
             <Route path="/login" element={
               <PublicRoute><LoginPage /></PublicRoute>
             } />
 
             <Route path="/register" element={
               <PublicRoute><RegisterPage /></PublicRoute>
             } />
 
             <Route path="/chat" element={
               <PrivateRoute><ChatPage /></PrivateRoute>
             } />
 
             <Route path="/chat/:userId" element={
               <PrivateRoute><ChatPage /></PrivateRoute>
             } />
 
             <Route path="*" element={<Navigate to="/chat" replace />} />
           </Routes>
         </Router>
       </SocketProvider>
     </AuthProvider>
   );
 }
 
 export default App;
 