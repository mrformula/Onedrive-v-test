import React from 'react';
import { useAuth } from '../contexts/AuthContext';

function Login() {
    const { login } = useAuth();

    return (
        <div className="login-container">
            <div className="login-box">
                <h1>Torrent to Drive</h1>
                <p>Download torrents directly to your Google Drive</p>
                <button onClick={login} className="google-login-btn">
                    <i className="bi bi-google"></i>
                    Login with Google
                </button>
            </div>
        </div>
    );
}

export default Login; 