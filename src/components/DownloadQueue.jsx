import React from 'react';
import { formatBytes, formatTime } from '../utils/format';

function DownloadQueue({ status }) {
    if (!status) return null;

    const { activeDownload, queuedItems } = status;

    return (
        <div className="download-queue">
            <h2>Download Queue</h2>

            {activeDownload && (
                <div className="active-download">
                    <h3>Current Download</h3>
                    <div className="download-item">
                        <div className="file-info">
                            <i className="bi bi-file-earmark"></i>
                            <span className="filename">{activeDownload.fileName}</span>
                        </div>
                        <div className="progress-bar">
                            <div
                                className="progress"
                                style={{ width: `${activeDownload.progress}%` }}
                            />
                        </div>
                        <div className="status-info">
                            <span className="progress-text">
                                {activeDownload.progress.toFixed(1)}%
                            </span>
                            <span className="speed">
                                {formatBytes(activeDownload.downloadSpeed)}/s
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {queuedItems.length > 0 && (
                <div className="queued-downloads">
                    <h3>Queue ({queuedItems.length})</h3>
                    {queuedItems.map((item, index) => (
                        <div key={index} className="queue-item">
                            <span className="position">#{index + 1}</span>
                            <span className="filename">{item.fileName}</span>
                            <span className="status">{item.status}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default DownloadQueue; 