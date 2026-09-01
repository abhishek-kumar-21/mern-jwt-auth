import React, { createContext, useContext, useState, useEffect } from 'react';

const API = 'http://localhost:3001/api';
const AuthContext = createContext(null);

/** Hook — use anywhere inside the app to get auth state */
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
    const [user, setUser]         = useState(null);
    const [loading, setLoading]   = useState(true); // true while checking token on load

    // ── On mount: restore session from localStorage token ──────────────────
    useEffect(() => {
        const token = localStorage.getItem('token');
        console.log('[AuthContext] Mount, token from storage:', token);
        if (!token || token === 'undefined') {
            setLoading(false);
            return;
        }

        fetch(`${API}/me`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(res => {
                console.log('[AuthContext] /me response status:', res.status);
                if (!res.ok) throw new Error('invalid');
                return res.json();
            })
            .then(data => {
                console.log('[AuthContext] /me success, user:', data.user);
                setUser(data.user);
            })
            .catch((err) => {
                console.error('[AuthContext] /me error:', err);
                localStorage.removeItem('token');
            })
            .finally(() => setLoading(false));
    }, []);

    const login = (userData, token) => {
        localStorage.setItem('token', token);
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
