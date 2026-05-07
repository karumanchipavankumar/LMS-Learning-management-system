import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './EmployeeProfile.css';

const ManagerProfile = () => {
    const navigate = useNavigate();
    const [profile, setProfile] = useState({
        firstName: '',
        lastName: '',
        email: '',
        mobile: '',
        dob: '',
        user: { username: '', role: '' }
    });
    const [errors, setErrors] = useState({});
    const [isEditing, setIsEditing] = useState(false);
    const [originalProfile, setOriginalProfile] = useState({});
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('profile');

    const [passwords, setPasswords] = useState({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
    });
    const [passwordError, setPasswordError] = useState('');
    const [passwordMessage, setPasswordMessage] = useState('');
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/');
                return;
            }

            try {
                const response = await axios.get('http://localhost:8080/manager/profile', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setProfile(response.data);
                setOriginalProfile(response.data);
            } catch (error) {
                console.error("Error fetching profile:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [navigate]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        if (name === "mobile") {
            const onlyNums = value.replace(/[^0-9]/g, '');
            if (onlyNums.length <= 10) {
                setProfile(prev => ({ ...prev, [name]: onlyNums }));
                if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
            }
            return;
        }

        setProfile(prev => ({
            ...prev,
            [name]: value
        }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const validateForm = () => {
        const newErrors = {};
        if (!profile.firstName?.trim()) newErrors.firstName = "First name is required";
        else if (!/^[A-Za-z]+$/.test(profile.firstName)) newErrors.firstName = "Only alphabets allowed";

        if (!profile.lastName?.trim()) newErrors.lastName = "Last name is required";
        else if (!/^[A-Za-z]+$/.test(profile.lastName)) newErrors.lastName = "Only alphabets allowed";

        if (!profile.mobile?.trim()) newErrors.mobile = "Mobile number is required";
        else if (!/^\d{10}$/.test(profile.mobile)) newErrors.mobile = "Exactly 10 digits required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleEditToggle = () => {
        if (isEditing) {
            // Cancel edit - revert changes
            setProfile(originalProfile);
        }
        setIsEditing(!isEditing);
    };

    const handleSave = async () => {
        if (!validateForm()) return;

        const token = localStorage.getItem('token');
        try {
            await axios.put('http://localhost:8080/manager/profile', profile, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setOriginalProfile(profile);
            setIsEditing(false);
            alert("Profile updated successfully!");
        } catch (error) {
            console.error("Error updating profile:", error);
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                alert("Failed to update profile.");
            }
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordMessage('');

        if (passwords.newPassword.length < 6) {
            setPasswordError('New password must be at least 6 characters long.');
            return;
        }

        if (passwords.newPassword !== passwords.confirmNewPassword) {
            setPasswordError('New passwords do not match.');
            return;
        }

        const token = localStorage.getItem('token');
        try {
            const response = await axios.post('http://localhost:8080/manager/change-password', {
                currentPassword: passwords.currentPassword,
                newPassword: passwords.newPassword
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            setPasswordMessage(response.data.message || 'Password successfully updated.');
            setPasswords({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
            setIsChangingPassword(false);
            setTimeout(() => setPasswordMessage(''), 3000);
        } catch (error) {
            console.error("Error changing password:", error);
            setPasswordError(error.response?.data?.error || 'Failed to change password.');
        }
    };

    const getInitials = () => {
        if (profile.firstName && profile.lastName) {
            return (profile.firstName.charAt(0) + profile.lastName.charAt(0)).toUpperCase();
        }
        if (profile.firstName) {
            return profile.firstName.substring(0, 2).toUpperCase();
        }
        return (profile.user?.username || 'U').substring(0, 2).toUpperCase();
    };

    if (loading) {
        return (
            <div className="profile-loading-overlay">
                <div className="profile-loading-spinner"></div>
                <h3 className="profile-loading-text">Loading Profile</h3>
            </div>
        );
    }

    return (
        <div className="profile-page-wrapper">
            <div className="profile-container">
                {/* Left Sidebar */}
                <aside className="profile-sidebar">
                    <div className="profile-user-info">
                        <div className="profile-avatar-large">
                            {getInitials()}
                        </div>
                        <div className="profile-user-name">{profile.firstName} {profile.lastName}</div>
                        <div className="profile-user-email">{profile.email}</div>
                    </div>

                    <nav className="profile-nav">
                        <button className={`profile-nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span>Profile</span>
                        </button>
                        <button className={`profile-nav-item ${activeTab === 'security' ? 'active' : ''}`} onClick={() => setActiveTab('security')}>
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <span>Account Security</span>
                        </button>
                        <button className="profile-nav-item">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            <span>Notifications</span>
                        </button>
                        <button className="profile-nav-item" onClick={() => {
                            localStorage.removeItem('token');
                            navigate('/');
                        }} style={{ marginTop: 'auto' }}>
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span>Log out</span>
                        </button>
                    </nav>
                </aside>

                {/* Right Content */}
                <main className="profile-content-card">
                    <div className="profile-header-banner">
                        <div className="header-banner-left">
                            <button
                                className="back-arrow-btn"
                                onClick={() => navigate('/manager')}
                                aria-label="Go back"
                            >
                                <svg
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <line x1="19" y1="12" x2="5" y2="12"></line>
                                    <polyline points="12 19 5 12 12 5"></polyline>
                                </svg>
                            </button>
                            <h2>{activeTab === 'profile' ? 'My Profile' : 'Account Security'}</h2>
                        </div>
                    </div>

                    {activeTab === 'profile' && (
                        <>

                    <div className="profile-avatar-upload-container">
                        <div className="profile-cam-avatar">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="32" height="32">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                    </div>

                    <div className="profile-form-grid">
                        <div className="form-group">
                            <label className="form-label">First name</label>
                            <input type="text" className="form-input" name="firstName" value={profile.firstName || ''} readOnly={!isEditing} onChange={handleInputChange} />
                            {errors.firstName && <div className="error-text">{errors.firstName}</div>}
                        </div>
                        <div className="form-group">
                            <label className="form-label">Last Name</label>
                            <input type="text" className="form-input" name="lastName" value={profile.lastName || ''} readOnly={!isEditing} onChange={handleInputChange} />
                            {errors.lastName && <div className="error-text">{errors.lastName}</div>}
                        </div>
                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <input type="email" className="form-input" name="email" value={profile.email || ''} readOnly style={{ backgroundColor: '#e9ecef', cursor: 'not-allowed' }} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Mobile Number</label>
                            <input
                                type="tel"
                                className={`form-input ${errors.mobile ? 'error' : ''}`}
                                name="mobile"
                                value={profile.mobile || ''}
                                readOnly={!isEditing}
                                onChange={handleInputChange}
                                maxLength={10}
                            />
                            {errors.mobile && <div className="error-text">{errors.mobile}</div>}
                        </div>
                        <div className="form-group">
                            <label className="form-label">Date of Birth</label>
                            <input type="date" className="form-input" name="dob" value={profile.dob || ''} readOnly={!isEditing} onChange={handleInputChange} />
                        </div>
                    </div>

                    <div className="profile-actions">
                        {!isEditing ? (
                            <button className="profile-action-btn" onClick={handleEditToggle}>
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                                Edit profile
                            </button>
                        ) : (
                            <>
                                <button className="profile-action-btn" onClick={handleEditToggle} style={{ backgroundColor: '#dc3545', borderColor: '#dc3545', color: 'white', marginRight: '10px' }}>
                                    Cancel
                                </button>
                                <button className="profile-action-btn" onClick={handleSave}>
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                    </svg>
                                    Save
                                </button>
                            </>
                        )}
                    </div>
                    </>
                    )}

                    {activeTab === 'security' && (
                        <div style={{ padding: '40px', maxWidth: '500px', margin: '0 auto' }}>
                            <p style={{ color: '#64748b', marginBottom: '25px', fontSize: '15px', lineHeight: '1.5' }}>
                                Update your password below to secure your account. We recommend using a strong password that you don't use elsewhere.
                            </p>
                            {passwordMessage && <div style={{ color: '#047857', backgroundColor: '#ecfdf5', border: '1px solid #10b981', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', fontWeight: '500' }}>{passwordMessage}</div>}
                            <form onSubmit={handlePasswordChange}>
                                <div className="form-group" style={{ marginBottom: '20px' }}>
                                    <label className="form-label">Current Password</label>
                                    <input 
                                        type="password" 
                                        className="form-input" 
                                        value={passwords.currentPassword} 
                                        onChange={(e) => setPasswords({...passwords, currentPassword: e.target.value})} 
                                        required 
                                        style={{ backgroundColor: '#f8fafc' }}
                                    />
                                </div>
                                <div className="form-group" style={{ marginBottom: '20px' }}>
                                    <label className="form-label">New Password</label>
                                    <input 
                                        type="password" 
                                        className="form-input" 
                                        value={passwords.newPassword} 
                                        onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})} 
                                        required 
                                        style={{ backgroundColor: '#f8fafc' }}
                                    />
                                </div>
                                <div className="form-group" style={{ marginBottom: '25px' }}>
                                    <label className="form-label">Confirm New Password</label>
                                    <input 
                                        type="password" 
                                        className="form-input" 
                                        value={passwords.confirmNewPassword} 
                                        onChange={(e) => setPasswords({...passwords, confirmNewPassword: e.target.value})} 
                                        required 
                                        style={{ backgroundColor: '#f8fafc' }}
                                    />
                                </div>
                                
                                {passwordError && <div className="error-text" style={{ marginBottom: '20px', backgroundColor: '#fef2f2', color: '#b91c1c', padding: '10px', borderRadius: '8px', border: '1px solid #f87171' }}>{passwordError}</div>}
                                
                                <div>
                                    <button type="submit" className="profile-action-btn" style={{ backgroundColor: '#4f46e5', color: 'white', width: '100%', justifyContent: 'center', padding: '12px', fontSize: '15px' }}>
                                        Update Password
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default ManagerProfile;
