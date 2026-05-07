import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from './assets/logo.png';
import './LoginPage.css';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
            setError('Please enter a valid email address');
            return;
        }

        if (!email.toLowerCase().endsWith('@oryfolks.com')) {
            setError('Email must end with @oryfolks.com');
            return;
        }

        setIsLoading(true);
        setError('');
        setMessage('');

        try {
            const response = await fetch('http://localhost:8080/auth/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: email.trim() })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to send reset link');
            }

            setMessage(data.message || 'If an account with that email exists, a reset link has been sent.');
        } catch (err) {
            setError(err.message || 'An error occurred while processing your request.');
        } finally {
            setIsLoading(false);
        }
    };

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
                    <h1 className="form-title">Forgot Password</h1>
                    <p className="form-subtitle">
                        Enter your email address below and we'll send you a link to reset your password.
                    </p>

                    <form onSubmit={handleSubmit}>
                        <div className="input-group">
                            <label>Email address</label>
                            <input
                                type="email"
                                className={`form-input ${error ? 'error' : ''}`}
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    setError('');
                                    setMessage('');
                                }}
                                required
                                placeholder="name@oryfolks.com"
                            />
                            {error && <span className="error-message">{error}</span>}
                            {message && <span className="success-message" style={{ color: '#059669', fontSize: '13px', marginTop: '8px', display: 'block', fontWeight: '500' }}>{message}</span>}
                        </div>

                        <button type="submit" className="submit-btn" disabled={isLoading}>
                            {isLoading ? 'Sending Link...' : 'Send Reset Link'}
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
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
