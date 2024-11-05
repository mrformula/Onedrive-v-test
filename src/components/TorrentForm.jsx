import React, { useState } from 'react';

function TorrentForm() {
    const [magnetLink, setMagnetLink] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/torrent/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ magnetLink }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to add torrent');
            }

            setMagnetLink('');
            // Show success message
            alert('Torrent added successfully!');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="torrent-form">
            <h2>Add New Torrent</h2>
            <form onSubmit={handleSubmit}>
                <div className="input-group">
                    <input
                        type="text"
                        value={magnetLink}
                        onChange={(e) => setMagnetLink(e.target.value)}
                        placeholder="Paste magnet link here..."
                        disabled={loading}
                    />
                    <button type="submit" disabled={loading || !magnetLink}>
                        {loading ? (
                            <>
                                <i className="bi bi-arrow-repeat spinning"></i>
                                Adding...
                            </>
                        ) : (
                            <>
                                <i className="bi bi-plus-lg"></i>
                                Add Torrent
                            </>
                        )}
                    </button>
                </div>
                {error && (
                    <div className="error-message">
                        <i className="bi bi-exclamation-triangle"></i>
                        {error}
                    </div>
                )}
            </form>
        </div>
    );
}

export default TorrentForm; 