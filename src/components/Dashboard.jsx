import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import DriveStatus from './DriveStatus';
import TorrentForm from './TorrentForm';
import DownloadQueue from './DownloadQueue';
import DownloadHistory from './DownloadHistory';

function Dashboard() {
    const { user, isAuthenticated } = useAuth();
    const { isDarkMode, toggleDarkMode } = useTheme();
    const navigate = useNavigate();
    const [driveInfo, setDriveInfo] = useState(null);
    const [queueStatus, setQueueStatus] = useState(null);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
        } else {
            fetchDriveInfo();
            const interval = setInterval(fetchQueueStatus, 5000);
            return () => clearInterval(interval);
        }
    }, [isAuthenticated]);

    const fetchDriveInfo = async () => {
        try {
            const response = await fetch('/api/drive/info');
            const data = await response.json();
            setDriveInfo(data);
        } catch (error) {
            console.error('Error fetching drive info:', error);
        }
    };

    const fetchQueueStatus = async () => {
        try {
            const response = await fetch('/api/queue-status');
            const data = await response.json();
            setQueueStatus(data);
        } catch (error) {
            console.error('Error fetching queue status:', error);
        }
    };

    if (!isAuthenticated) return null;

    return (
        <div className={`dashboard ${isDarkMode ? 'dark-mode' : ''}`}>
            <header className="dashboard-header">
                <h1>Torrent to Drive</h1>
                <div className="user-controls">
                    <button onClick={toggleDarkMode} className="theme-toggle">
                        <i className={`bi bi-${isDarkMode ? 'sun' : 'moon'}`}></i>
                    </button>
                    <div className="user-info">
                        <img src={user.picture} alt={user.name} />
                        <span>{user.email}</span>
                    </div>
                </div>
            </header>

            <main className="dashboard-content">
                <DriveStatus info={driveInfo} />
                <TorrentForm onSubmit={fetchQueueStatus} />
                <DownloadQueue status={queueStatus} />
                <DownloadHistory />
            </main>
        </div>
    );
}

export default Dashboard; 