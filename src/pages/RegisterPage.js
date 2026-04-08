 import React, { useState } from 'react';
 import { Link, useNavigate } from 'react-router-dom';
 import { useAuth } from '../context/AuthContext';
 
 export default function RegisterPage() {
   const { register } = useAuth();
   const navigate = useNavigate();
 
   const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
   const [error, setError] = useState('');
   const [loading, setLoading] = useState(false);
 
   const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
 
   const validate = () => {
     if (form.username.length < 3) return 'Username must be at least 3 characters.';
     if (!/^\S+@\S+\.\S+$/.test(form.email)) return 'Enter a valid email address.';
     if (form.password.length < 8) return 'Password must be at least 8 characters.';
     if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password))
       return 'Password must contain uppercase, lowercase and a number.';
     if (form.password !== form.confirm) return 'Passwords do not match.';
     return null;
   };
 
   const handleSubmit = async (e) => {
     e.preventDefault();
     setError('');
     const validationError = validate();
     if (validationError) return setError(validationError);
 
     setLoading(true);
     try {
       await register(form.username, form.email, form.password);
       navigate('/chat', { replace: true });
     } catch (err) {
       setError(err.response?.data?.message || 'Registration failed. Please try again.');
     } finally {
       setLoading(false);
     }
   };
 
   return (
     <div className="auth-page">
       <div className="auth-card">
         <div className="auth-brand">
           <div className="auth-brand-icon">⚡</div>
           <h1>JOIN NEXUS</h1>
           <p>Create your secure account</p>
         </div>
 
         {error && <div className="error-banner">{error}</div>}
 
         <form onSubmit={handleSubmit} noValidate>
           <div className="form-group">
             <label className="form-label">Username</label>
             <input
               className="form-input"
               name="username"
               value={form.username}
               onChange={handleChange}
               placeholder="cooluser_42"
               autoComplete="username"
               required
             />
           </div>
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
           <div className="form-group">
             <label className="form-label">Password</label>
             <input
               className="form-input"
               type="password"
               name="password"
               value={form.password}
               onChange={handleChange}
               placeholder="Min 8 chars, upper + lower + number"
               autoComplete="new-password"
               required
             />
           </div>
           <div className="form-group" style={{ marginBottom: 28 }}>
             <label className="form-label">Confirm Password</label>
             <input
               className="form-input"
               type="password"
               name="confirm"
               value={form.confirm}
               onChange={handleChange}
               placeholder="••••••••"
               autoComplete="new-password"
               required
             />
           </div>
 
           <button className="btn btn-primary" type="submit" disabled={loading}>
             {loading ? 'Creating account…' : 'Create Account →'}
           </button>
         </form>
 
         <div className="auth-footer">
           Already have an account?{' '}
           <Link to="/login">Sign in</Link>
         </div>
       </div>
     </div>
   );
 }
 