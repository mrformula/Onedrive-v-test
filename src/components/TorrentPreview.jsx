import React, { useState, useEffect } from 'react';
import { formatBytes } from '../utils/format';

function TorrentPreview({ magnetLink }) {
    const [info, setInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (magnetLink) {
            fetchTorrentInfo();
        }
    }, [magnetLink]);

    const fetchTorrentInfo = async () => {
        try {
            const response = await fetch('/api/torrent/info', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ magnetLink }),
            });

            if (!response.ok) {
                throw new Error('Failed to fetch torrent info');
            }

            const data = await response.json();
            setInfo(data);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    if (!magnetLink) return null;
    if (loading) return <div className="loading">Loading torrent info...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="torrent-preview">
            <h3>{info.name}</h3>
            <div className="info-grid">
                <div className="info-item">
                    <span className="label">Size:</span>
                    <span className="value">{formatBytes(info.size)}</span>
                </div>
                <div className="info-item">
                    <span className="label">Files:</span>
                    <span className="value">{info.files.length}</span>
                </div>
                <div className="info-item">
                    <span className="label">Type:</span>
                    <span className="value">{info.files[0].type}</span>
                </div>
            </div>

            <div className="file-list">
                {info.files.map((file, index) => (
                    <div key={index} className="file-item">
                        <i className="bi bi-file-earmark"></i>
                        <span className="filename">{file.name}</span>
                        <span className="filesize">{formatBytes(file.size)}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default TorrentPreview; 