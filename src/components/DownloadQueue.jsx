import React from 'react';
import { formatBytes } from '../utils/format';

function DownloadQueue({ status }) {
    if (!status) return null;

    const { activeDownload, queuedItems } = status;

    return (
        <div className="download-queue">
            <h2>Active Downloads</h2>

            {activeDownload ? (
                <div className="active-download">
                    <div className="download-item">
                        <div className="file-info">
                            <span className="filename">{activeDownload.fileName || 'Downloading...'}</span>
                            {activeDownload.fileSize && (
                                <span className="filesize">{formatBytes(activeDownload.fileSize)}</span>
                            )}
                        </div>
                        <div className="progress-wrapper">
                            <div className="progress-bar">
                                <div
                                    className="progress"
                                    style={{ width: `${activeDownload.progress || 0}%` }}
                                />
                            </div>
                            <div className="progress-info">
                                <span>{(activeDownload.progress || 0).toFixed(1)}%</span>
                                {activeDownload.downloadSpeed && (
                                    <span>{formatBytes(activeDownload.downloadSpeed)}/s</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="no-downloads">No active downloads</div>
            )}

            {queuedItems && queuedItems.length > 0 && (
                <div className="queued-downloads">
                    <h3>Queue ({queuedItems.length})</h3>
                    {queuedItems.map((item, index) => (
                        <div key={index} className="queue-item">
                            <div className="queue-info">
                                <span className="position">#{index + 1}</span>
                                <span className="filename">{item.fileName || 'Queued item'}</span>
                            </div>
                            <span className={`status ${item.status}`}>
                                {item.status}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default DownloadQueue; 