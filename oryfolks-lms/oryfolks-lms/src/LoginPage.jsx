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
            newErrors.login = loginType === 'ADMIN' ? 'Email is required' : 'Username is required';
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

            /* ===============================
               ROLE VALIDATION LOGIC (FIXED)
            ================================ */

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

            /* ===============================
               ROLE-BASED NAVIGATION
            ================================ */
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
        <div className="login-page-wrapper">
            <div className="container">

                <div className="header">
                    <img src={logo} alt="ORYFOLKS Logo" className="logo" />
                    <h1 className="main-title">Learning Management System</h1>
                    <p className="subtitle">Corporate Learning Platform</p>
                </div>

                <div className="login-card">
                    <div className="welcome-section">
                        <h2 className="welcome-title">Welcome Back</h2>
                        <p className="welcome-text">Sign in to continue</p>
                    </div>

                    {/* LOGIN TYPE SELECT */}
                    <div className="login-type">
                        <label>
                            <input
                                type="radio"
                                value="EMPLOYEE"
                                checked={loginType === 'EMPLOYEE'}
                                onChange={() => setLoginType('EMPLOYEE')}
                            />
                            Employee
                        </label>

                        <label style={{ marginLeft: '20px' }}>
                            <input
                                type="radio"
                                value="ADMIN"
                                checked={loginType === 'ADMIN'}
                                onChange={() => setLoginType('ADMIN')}
                            />
                            Admin
                        </label>
                    </div>

                    <form className="form" onSubmit={handleSubmit}>

                        {/* USERNAME / EMAIL */}
                        <input
                            type={loginType === 'ADMIN' ? 'email' : 'text'}
                            placeholder={
                                loginType === 'ADMIN'
                                    ? 'Admin Email Address'
                                    : 'Employee Username'
                            }
                            className={`input-field ${errors.login || errors.username ? 'error' : ''}`}
                            value={loginValue}
                            onChange={(e) => {
                                setLoginValue(e.target.value);
                                setErrors(prev => ({ ...prev, login: '', username: '' }));
                            }}
                        />
                        {(errors.login || errors.username) && <div className="error-text">{errors.login || errors.username}</div>}

                        {/* PASSWORD */}
                        <input
                            type="password"
                            placeholder="Password"
                            className={`input-field ${errors.password ? 'error' : ''}`}
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setErrors(prev => ({ ...prev, password: '' }));
                            }}
                        />
                        {errors.password && <div className="error-text">{errors.password}</div>}

                        <div className="remember-forgot">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    className="checkbox-input"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                />
                                Remember me
                            </label>
                        </div>

                        <div className="button-container">
                            <button type="submit" className="signin-button">
                                Sign in
                            </button>
                        </div>
                    </form>
                </div>

                <div className="footer-links">
                    <a href="#" className="footer-link">Privacy Policy</a>
                    <a href="#" className="footer-link">Terms & Services</a>
                    <a href="#" className="footer-link">Support</a>
                </div>

            </div>
        </div>
    );
};

export default LoginPage;
