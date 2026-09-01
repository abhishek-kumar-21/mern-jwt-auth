import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginForm  from './components/loginForm';
import SignupForm from './components/signupForm';
import Dashboard  from './components/Dashboard';
import ForgotPassword from './components/ForgotPassword';
import './App.css';

/** Shows a spinner while the token is being verified on first load */
function Loading() {
    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
            <p style={{ color: '#6b7280', fontSize: 15 }}>Loading…</p>
        </div>
    );
}

/** Redirects to /dashboard if already logged in */
function GuestRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading) return <Loading />;
    return user ? <Navigate to="/dashboard" replace /> : children;
}

/** Redirects to /login if NOT logged in */
function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading) return <Loading />;
    return user ? children : <Navigate to="/login" replace />;
}

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    {/* Public routes — redirect to /dashboard if already logged in */}
                    <Route path="/login"  element={<GuestRoute><LoginForm /></GuestRoute>} />
                    <Route path="/signup" element={<GuestRoute><SignupForm /></GuestRoute>} />
                    <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />

                    {/* Protected route — redirect to /login if not logged in */}
                    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

                    {/* Default redirect */}
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
