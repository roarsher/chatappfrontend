//  import React from "react";
// import ReactDOM from "react-dom/client";
// import App from "./App";
// import { AuthProvider } from "./context/AuthContext";

// ReactDOM.createRoot(document.getElementById("root")).render(
//   <AuthProvider>
//     <App />
//   </AuthProvider>
// );

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Global error boundary to prevent white screens
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error('App crashed:', error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center',
          justifyContent: 'center', flexDirection: 'column', gap: 16,
          background: '#05050a', color: '#e8e8f0',
          fontFamily: 'system-ui, sans-serif', padding: 24, textAlign: 'center'
        }}>
          <div style={{ fontSize: 48 }}>⚡</div>
          <h2 style={{ fontWeight: 700 }}>Something went wrong</h2>
          <p style={{ color: '#8888a8', fontSize: 14, maxWidth: 360 }}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: 8, padding: '10px 28px', borderRadius: 8,
              background: '#7c6aff', color: 'white', border: 'none',
              cursor: 'pointer', fontSize: 14, fontWeight: 600
            }}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);