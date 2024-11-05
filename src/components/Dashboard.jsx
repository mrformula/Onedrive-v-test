import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
    const { user, isAuthenticated } = useAuth();
    const { isDarkMode, toggleDarkMode } = useTheme();
    const [driveInfo, setDriveInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    console.log('Dashboard render:', { user, isAuthenticated, loading, error });

    useEffect(() => {
        if (!isAuthenticated) {
            console.log('Not authenticated, redirecting to login');
            navigate('/login');
            return;
        }
        fetchDriveInfo();
    }, [isAuthenticated, navigate]);

    const fetchDriveInfo = async () => {
        try {
            console.log('Fetching drive info...');
            const response = await fetch('/api/drive/info');
            console.log('Drive info response:', response);

            if (!response.ok) {
                if (response.status === 401) {
                    console.log('Unauthorized, redirecting to login');
                    navigate('/login');
                    return;
                }
                throw new Error(`Failed to fetch drive info: ${response.status}`);
            }

            const data = await response.json();
            console.log('Drive info data:', data);
            setDriveInfo(data);
        } catch (err) {
            console.error('Error fetching drive info:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    console.log('Render state:', { loading, error, driveInfo, user });

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
                {loading ? (
                    <div className="loading">
                        <div className="loading-spinner"></div>
                        <p>Loading drive info...</p>
                    </div>
                ) : error ? (
                    <div className="error-message">
                        <i className="bi bi-exclamation-triangle"></i>
                        <p>{error}</p>
                        <button onClick={fetchDriveInfo}>Retry</button>
                    </div>
                ) : (
                    <>
                        {driveInfo && (
                            <div className="drive-status">
                                <h2>Storage Status</h2>
                                <div className="storage-bar">
                                    <div
                                        className="used-space"
                                        style={{
                                            width: `${(driveInfo.used / driveInfo.total) * 100}%`
                                        }}
                                    />
                                </div>
                                <div className="storage-info">
                                    <div className="info-item">
                                        <span>Total Space:</span>
                                        <strong>{formatBytes(driveInfo.total)}</strong>
                                    </div>
                                    <div className="info-item">
                                        <span>Used Space:</span>
                                        <strong>{formatBytes(driveInfo.used)}</strong>
                                    </div>
                                    <div className="info-item">
                                        <span>Free Space:</span>
                                        <strong>{formatBytes(driveInfo.free)}</strong>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="add-torrent-section">
                            <h2>Add New Download</h2>
                            <p>Coming soon...</p>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}

// Helper function for formatting bytes
const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default Dashboard; 