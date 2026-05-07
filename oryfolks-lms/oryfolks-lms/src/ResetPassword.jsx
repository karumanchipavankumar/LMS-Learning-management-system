import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from './assets/logo.png';
import './LoginPage.css';

const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [token, setToken] = useState(null);
    
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const urlToken = queryParams.get('token');
        console.log("ResetPassword: Token from URL:", urlToken);
        if (urlToken) {
            setToken(urlToken);
            // Hide token from search bar for security/cleanliness
            window.history.replaceState({}, document.title, window.location.pathname);
        } else {
            setToken(false);
            setError('Invalid or missing reset token. Please request a new link.');
        }
    }, [location]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!token) {
            setError('Invalid or missing reset token.');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setIsLoading(true);
        setError('');
        setMessage('');

        try {
            const response = await fetch('http://localhost:8080/auth/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ token, newPassword: password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Failed to reset password');
            }

            setMessage('Password successfully reset. Redirecting to login...');
            setTimeout(() => navigate('/'), 3000);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Show a loading state or the form
    return (
        <div className="login-container">
            {/* Left Panel with Logo and LMS Heading */}
            <div className="login-left-panel">
                <div className="logo-container">
                    <img src={logo} alt="OryFolks Logo" className="logo" />
                </div>
                <div className="lms-text-container">
                    <h1 className="lms-main-heading">
                        <span>LMS -</span>
                        <span>Learning Management System</span>
                    </h1>
                    <div className="lms-underline"></div>
                </div>
            </div>

            {/* Right Panel with Form */}
            <div className="login-right-panel">
                <div className="form-wrapper">
                    <h1 className="form-title">Reset Password</h1>
                    <p className="form-subtitle">
                        Please enter your new password below to regain access to your account.
                    </p>

                    {token === null ? (
                        <p style={{ color: '#64748b' }}>Verifying reset token...</p>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <div className="input-group">
                                <label>New Password</label>
                                <input
                                    type="password"
                                    className={`form-input ${error ? 'error' : ''}`}
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        setError('');
                                    }}
                                    required
                                    placeholder="••••••••"
                                    autoComplete="new-password"
                                />
                            </div>

                            <div className="input-group">
                                <label>Confirm New Password</label>
                                <input
                                    type="password"
                                    className={`form-input ${error ? 'error' : ''}`}
                                    value={confirmPassword}
                                    onChange={(e) => {
                                        setConfirmPassword(e.target.value);
                                        setError('');
                                    }}
                                    required
                                    placeholder="••••••••"
                                    autoComplete="new-password"
                                />
                                {error && <span className="error-message">{error}</span>}
                                {message && <span style={{ color: '#059669', fontSize: '14px', marginTop: '12px', display: 'block', fontWeight: '600' }}>{message}</span>}
                            </div>

                            <button type="submit" className="submit-btn" disabled={isLoading || !token}>
                                {isLoading ? 'Updating...' : 'Update Password'}
                            </button>

                            <div style={{ textAlign: 'center', marginTop: '25px' }}>
                                <button 
                                    type="button" 
                                    className="forgot-password-btn"
                                    onClick={() => navigate('/')}
                                    style={{ color: '#6366f1' }}
                                >
                                    ← Back to Login
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
