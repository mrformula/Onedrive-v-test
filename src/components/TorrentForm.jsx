import React, { useState } from 'react';

function TorrentForm({ onSubmit }) {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/download', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    magnetLink: input,
                }),
            });

            if (!response.ok) {
                throw new Error(await response.text());
            }

            const data = await response.json();
            setInput('');
            onSubmit(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="torrent-form">
            <h2>Add New Download</h2>
            <form onSubmit={handleSubmit}>
                <div className="input-group">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Enter magnet link or paste torrent file..."
                        disabled={isLoading}
                    />
                    <button type="submit" disabled={isLoading || !input}>
                        {isLoading ? (
                            <i className="bi bi-arrow-repeat spinning"></i>
                        ) : (
                            <i className="bi bi-plus-lg"></i>
                        )}
                        Add to Queue
                    </button>
                </div>
                {error && <div className="error-message">{error}</div>}
            </form>
        </div>
    );
}

export default TorrentForm; 