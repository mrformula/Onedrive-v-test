import React, { useState, useEffect } from 'react';
import { formatBytes } from '../utils/format';

function DownloadHistory() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const response = await fetch('/api/downloads/history');
            const data = await response.json();
            setHistory(data);
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading">Loading history...</div>;

    return (
        <div className="download-history">
            <h2>Download History</h2>
            <div className="history-list">
                {history.map((item) => (
                    <div key={item._id} className="history-item">
                        <div className="file-info">
                            <i className="bi bi-file-earmark"></i>
                            <span className="filename">{item.fileName}</span>
                            <span className="filesize">{formatBytes(item.fileSize)}</span>
                        </div>
                        <div className="status-info">
                            <span className={`status ${item.status}`}>{item.status}</span>
                            <span className="date">
                                {new Date(item.completedAt || item.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                        {item.directLink && (
                            <a href={item.directLink} className="direct-link" target="_blank" rel="noopener noreferrer">
                                <i className="bi bi-download"></i> Download
                            </a>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default DownloadHistory; 