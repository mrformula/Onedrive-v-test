import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import TorrentForm from './TorrentForm';
import DownloadQueue from './DownloadQueue';

function Dashboard() {
    const { user, isAuthenticated } = useAuth();
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
        fetchDriveInfo();
        // Start polling queue status
        const interval = setInterval(fetchQueueStatus, 3000);
        return () => clearInterval(interval);
    }, [isAuthenticated, navigate]);

    const fetchDriveInfo = async () => {
        try {
            const response = await fetch('/api/drive/info');
            if (!response.ok) {
                if (response.status === 401) {
                    navigate('/login');
                    return;
                }
                throw new Error(`Failed to fetch drive info: ${response.status}`);
            }
            const data = await response.json();
            setDriveInfo(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchQueueStatus = async () => {
        try {
            const response = await fetch('/api/queue/status');
            if (response.ok) {
                const data = await response.json();
                setQueueStatus(data);
            }
        } catch (error) {
            console.error('Error fetching queue status:', error);
        }
    };

    const handleTorrentAdded = () => {
        fetchQueueStatus(); // Refresh queue immediately after adding
    };

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
                    <div className="loading">Loading drive info...</div>
                ) : error ? (
                    <div className="error-message">{error}</div>
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
                        <TorrentForm onSuccess={handleTorrentAdded} />
                        <DownloadQueue status={queueStatus} />
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