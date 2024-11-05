import React, { useState, useEffect } from 'react';
import DriveStatus from './DriveStatus';
import TorrentForm from './TorrentForm';
import DownloadQueue from './DownloadQueue';
import { useAuth } from '../contexts/AuthContext';

function Dashboard() {
    const { user } = useAuth();
    const [driveInfo, setDriveInfo] = useState(null);
    const [queueStatus, setQueueStatus] = useState(null);

    useEffect(() => {
        fetchDriveInfo();
        fetchQueueStatus();
        const interval = setInterval(fetchQueueStatus, 5000);
        return () => clearInterval(interval);
    }, []);

    const fetchDriveInfo = async () => {
        try {
            const response = await fetch('/api/drive-info');
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

    return (
        <div className="dashboard">
            <header className="dashboard-header">
                <h1>Torrent to Drive</h1>
                <div className="user-info">
                    <img src={user.picture} alt={user.name} />
                    <span>{user.name}</span>
                </div>
            </header>

            <main className="dashboard-content">
                <DriveStatus info={driveInfo} />
                <TorrentForm onSubmit={handleTorrentSubmit} />
                <DownloadQueue status={queueStatus} />
            </main>
        </div>
    );
}

export default Dashboard; 