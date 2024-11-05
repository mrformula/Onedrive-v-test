import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import TorrentForm from './TorrentForm';
import DownloadQueue from './DownloadQueue';
import DriveStatus from './DriveStatus';
import DownloadHistory from './DownloadHistory';

function Dashboard() {
    const { user, isAuthenticated, logout } = useAuth();
    const { isDarkMode, toggleDarkMode } = useTheme();
    const [driveInfo, setDriveInfo] = useState(null);
    const [queueStatus, setQueueStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        const fetchData = async () => {
            try {
                // Fetch drive info
                const driveResponse = await fetch('/api/drive/info');
                if (!driveResponse.ok) {
                    throw new Error('Failed to fetch drive info');
                }
                const driveData = await driveResponse.json();
                setDriveInfo(driveData);

                // Start polling queue status
                const pollQueue = async () => {
                    try {
                        const queueResponse = await fetch('/api/downloads/queue');
                        if (!queueResponse.ok) {
                            throw new Error('Failed to fetch queue status');
                        }
                        const queueData = await queueResponse.json();
                        setQueueStatus(queueData);
                    } catch (err) {
                        console.error('Queue polling error:', err);
                    }
                };

                // Poll every 3 seconds
                pollQueue();
                const interval = setInterval(pollQueue, 3000);
                return () => clearInterval(interval);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [isAuthenticated, navigate]);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    if (loading) {
        return (
            <div className="loading">
                <div className="loading-spinner"></div>
                <div>Loading dashboard...</div>
            </div>
        );
    }

    return (
        <div className={`dashboard ${isDarkMode ? 'dark-mode' : ''}`}>
            <header>
                <div className="user-info">
                    {user?.picture && (
                        <img src={user.picture} alt="Profile" className="avatar" />
                    )}
                    <span className="username">{user?.name}</span>
                </div>
                <div className="actions">
                    <button onClick={toggleDarkMode} className="theme-toggle">
                        <i className={`bi bi-${isDarkMode ? 'sun' : 'moon'}`}></i>
                    </button>
                    <button onClick={handleLogout} className="logout-btn">
                        <i className="bi bi-box-arrow-right"></i>
                        Logout
                    </button>
                </div>
            </header>

            <main>
                {error ? (
                    <div className="error-message">{error}</div>
                ) : (
                    <>
                        <DriveStatus info={driveInfo} />
                        <TorrentForm />
                        <DownloadQueue status={queueStatus} />
                        <DownloadHistory />
                    </>
                )}
            </main>
        </div>
    );
}

export default Dashboard; 