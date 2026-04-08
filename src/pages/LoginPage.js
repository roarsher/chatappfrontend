 import React, { useState } from 'react';
 import { Link, useNavigate, useLocation } from 'react-router-dom';
 import { useAuth } from '../context/AuthContext';
 
 export default function LoginPage() {
   const { login } = useAuth();
   const navigate = useNavigate();
   const location = useLocation();
   const from = location.state?.from?.pathname || '/chat';
   const expired = new URLSearchParams(location.search).get('expired');
 
   const [form, setForm] = useState({ email: '', password: '' });
   const [error, setError] = useState(expired ? 'Your session expired. Please log in again.' : '');
   const [loading, setLoading] = useState(false);
 
   const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
 
   const handleSubmit = async (e) => {
     e.preventDefault();
     setError('');
     setLoading(true);
     try {
       await login(form.email, form.password);
       navigate(from, { replace: true });
     } catch (err) {
       setError(err.response?.data?.message || 'Login failed. Please try again.');
     } finally {
       setLoading(false);
     }
   };
 
   return (
     <div className="auth-page">
       <div className="auth-card">
         <div className="auth-brand">
           <div className="auth-brand-icon">⚡</div>
           <h1>NEXUS CHAT</h1>
           <p>Secure · Real-time · Encrypted</p>
         </div>
 
         {error && <div className="error-banner">{error}</div>}
 
         <form onSubmit={handleSubmit} noValidate>
           <div className="form-group">
             <label className="form-label">Email Address</label>
             <input
               className="form-input"
               type="email"
               name="email"
               value={form.email}
               onChange={handleChange}
               placeholder="you@example.com"
               autoComplete="email"
               required
             />
           </div>
 
           <div className="form-group" style={{ marginBottom: 28 }}>
             <label className="form-label">Password</label>
             <input
               className="form-input"
               type="password"
               name="password"
               value={form.password}
               onChange={handleChange}
               placeholder="••••••••"
               autoComplete="current-password"
               required
             />
           </div>
 
           <button className="btn btn-primary" type="submit" disabled={loading}>
             {loading ? 'Authenticating…' : 'Sign In →'}
           </button>
         </form>
 
         <div className="auth-footer">
           No account?{' '}
           <Link to="/register">Create one</Link>
         </div>
       </div>
     </div>
   );
 }
 