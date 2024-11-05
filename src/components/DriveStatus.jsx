import React from 'react';
import { formatBytes } from '../utils/format';

function DriveStatus({ info }) {
    if (!info) return null;

    const usedPercentage = (info.used / info.total) * 100;
    const freePercentage = (info.free / info.total) * 100;

    return (
        <div className="drive-status">
            <h2>Google Drive Status</h2>
            <div className="storage-bar">
                <div
                    className="used-space"
                    style={{ width: `${usedPercentage}%` }}
                />
                <div
                    className="free-space"
                    style={{ width: `${freePercentage}%` }}
                />
            </div>
            <div className="storage-info">
                <div className="info-item">
                    <span className="label">Total Space:</span>
                    <span className="value">{formatBytes(info.total)}</span>
                </div>
                <div className="info-item">
                    <span className="label">Used Space:</span>
                    <span className="value">{formatBytes(info.used)}</span>
                </div>
                <div className="info-item">
                    <span className="label">Free Space:</span>
                    <span className="value">{formatBytes(info.free)}</span>
                </div>
            </div>
        </div>
    );
}

export default DriveStatus; 