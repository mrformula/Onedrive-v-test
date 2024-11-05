import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            console.log('Checking auth status...');
            const response = await fetch('/api/auth/check');
            console.log('Auth check response:', response);

            const data = await response.json();
            console.log('Auth check data:', data);

            if (data.authenticated) {
                setUser(data.user);
                setIsAuthenticated(true);
                console.log('User is authenticated:', data.user);
            } else {
                console.log('User is not authenticated');
                window.location.href = '/login';
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            window.location.href = '/login';
        } finally {
            setLoading(false);
        }
    };

    const login = () => {
        console.log('Redirecting to Google login...');
        window.location.href = '/auth/google';
    };

    const logout = async () => {
        try {
            await fetch('/api/auth/logout');
            setUser(null);
            setIsAuthenticated(false);
            window.location.href = '/login';
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    console.log('Auth context state:', { user, isAuthenticated, loading });

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, loading, login, logout }}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);