import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from './assets/logo.png';
import './LoginPage.css';

const LoginPage = () => {
    const [loginType, setLoginType] = useState('EMPLOYEE'); // ADMIN | EMPLOYEE
    const [loginValue, setLoginValue] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [errors, setErrors] = useState({});
    const navigate = useNavigate();

    const validateForm = () => {
        const newErrors = {};
        if (!loginValue.trim()) {
            newErrors.login = loginType === 'ADMIN' ? 'Email is required' : 'Username/Email is required';
        } else if (loginType === 'ADMIN' && !/\S+@\S+\.\S+/.test(loginValue)) {
            newErrors.login = 'Invalid email format';
        }
        if (!password) newErrors.password = 'Password is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            const response = await fetch('http://localhost:8080/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: loginValue, // always send as username
                    password: password
                })
            });

            if (!response.ok) {
                if (response.status === 400) {
                    const errorData = await response.json();
                    if (errorData.errors) {
                        setErrors(errorData.errors);
                        return;
                    }
                }
                throw new Error('Invalid credentials');
            }

            const data = await response.json();
            const token = data.token;

            localStorage.setItem('token', token);

            // Decode JWT
            const payload = JSON.parse(atob(token.split('.')[1]));
            const role = payload.role.replace('ROLE_', '');

            // Admin login → ONLY admin allowed
            if (loginType === 'ADMIN' && role !== 'ADMIN') {
                localStorage.removeItem('token');
                alert('Please login using Admin option');
                return;
            }

            // Employee login → Employee OR Manager allowed
            if (loginType === 'EMPLOYEE' && !['EMPLOYEE', 'MANAGER'].includes(role)) {
                localStorage.removeItem('token');
                alert('Invalid role for Employee login');
                return;
            }

            switch (role) {
                case 'ADMIN':
                    navigate('/admin');
                    break;
                case 'MANAGER':
                    navigate('/manager');
                    break;
                default:
                    navigate('/employee');
            }

        } catch (error) {
            console.error(error);
            alert('Login failed: ' + error.message);
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
                    <h1 className="form-title">Account Login</h1>
                    <p className="form-subtitle">
                        If you are already a member you can login with your email address and password.
                    </p>

                    <div className="login-type-toggle">
                        <label className="radio-label">
                            <input
                                type="radio"
                                value="EMPLOYEE"
                                checked={loginType === 'EMPLOYEE'}
                                onChange={() => setLoginType('EMPLOYEE')}
                            />
                            <span>Employee</span>
                        </label>
                        <label className="radio-label">
                            <input
                                type="radio"
                                value="ADMIN"
                                checked={loginType === 'ADMIN'}
                                onChange={() => setLoginType('ADMIN')}
                            />
                            <span>Admin</span>
                        </label>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="input-group">
                            <label>Email address</label>
                            <input
                                type={loginType === 'ADMIN' ? 'email' : 'text'}
                                className={`form-input ${errors.login ? 'error' : ''}`}
                                value={loginValue}
                                onChange={(e) => {
                                    setLoginValue(e.target.value);
                                    setErrors(prev => ({ ...prev, login: '' }));
                                }}
                            />
                            {errors.login && <span className="error-message">{errors.login}</span>}
                        </div>

                        <div className="input-group">
                            <label>Password</label>
                            <input
                                type="password"
                                className={`form-input ${errors.password ? 'error' : ''}`}
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    setErrors(prev => ({ ...prev, password: '' }));
                                }}
                            />
                            {errors.password && <span className="error-message">{errors.password}</span>}
                        </div>

                        <div className="form-actions">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                />
                                <span>Remember me</span>
                            </label>
                            <button 
                                type="button" 
                                className="forgot-password-btn"
                                onClick={() => navigate('/forgot-password')}
                            >
                                Forgot Password?
                            </button>
                        </div>

                        <button type="submit" className="submit-btn">
                            Login
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
