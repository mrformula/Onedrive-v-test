import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

function Dashboard() {
    const { user } = useAuth();
    const { isDarkMode, toggleDarkMode } = useTheme();

    return (
        <div className={`dashboard ${isDarkMode ? 'dark-mode' : ''}`}>
            <header className="dashboard-header">
                <h1>Torrent to Drive</h1>
                <div className="user-controls">
                    <button onClick={toggleDarkMode} className="theme-toggle">
                        <i className={`bi bi-${isDarkMode ? 'sun' : 'moon'}`}></i>
                    </button>
                    {user && (
                        <div className="user-info">
                            <span>{user.email}</span>
                        </div>
                    )}
                </div>
            </header>

            <main className="dashboard-content">
                <h2>Welcome to Torrent to Drive</h2>
                <p>Coming soon...</p>
            </main>
        </div>
    );
}

export default Dashboard; 