import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/" element={<Navigate to="/dashboard" />} />
                    </Routes>
                </BrowserRouter>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App; 