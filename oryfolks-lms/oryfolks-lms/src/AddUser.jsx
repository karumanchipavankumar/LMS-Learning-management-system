import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft } from 'lucide-react';
import './AddUser.css';

const AddUser = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        mobile: '',
        gender: '',
        dob: '',
        username: 'auto_generated_user',
        role: 'EMPLOYEE',
        employeeId: '',
        password: '',
        confirmPassword: '',
        sendWelcomeEmail: true
    });

    const [errors, setErrors] = useState({});

    const validateForm = () => {
        const newErrors = {};

        if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
        else if (!/^[A-Za-z]+$/.test(formData.firstName)) newErrors.firstName = "Only alphabets allowed";
        else if (formData.firstName.length < 2 || formData.firstName.length > 30) newErrors.firstName = "Must be 2-30 characters";

        if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
        else if (!/^[A-Za-z]+$/.test(formData.lastName)) newErrors.lastName = "Only alphabets allowed";
        else if (formData.lastName.length < 2 || formData.lastName.length > 30) newErrors.lastName = "Must be 2-30 characters";

        if (!formData.email.trim()) newErrors.email = "Email is required";
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Invalid email format";

        if (!formData.mobile.trim()) newErrors.mobile = "Mobile number is required";
        else if (!/^\d{10}$/.test(formData.mobile)) newErrors.mobile = "Exactly 10 digits required";

        if (!formData.gender) newErrors.gender = "Gender is required";
        if (!formData.role) newErrors.role = "Role is required";

        if (!formData.password) newErrors.password = "Password is required";
        else if (formData.password.length < 8) newErrors.password = "Minimum 8 characters";
        else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(formData.password)) {
            newErrors.password = "Must include uppercase, lowercase, number, and special character";
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (name === "mobile") {
            const onlyNums = value.replace(/[^0-9]/g, '');
            if (onlyNums.length <= 10) {
                setFormData(prev => ({ ...prev, [name]: onlyNums }));
                if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
            }
            return;
        }

        // auto-generate username from email
        if (name === "email") {
            setFormData(prev => ({
                ...prev,
                email: value,
                username: value ? value.split("@")[0] : "auto_generated_user"
            }));
            return;
        }

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleSave = async () => {
        if (!validateForm()) return;

        try {
            const token = localStorage.getItem("token");

            const response = await axios.post(
                "http://localhost:8080/admin/add-user",
                {
                    username: formData.username,
                    password: formData.password,
                    confirmPassword: formData.confirmPassword,
                    role: formData.role,

                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    email: formData.email,
                    mobile: formData.mobile,
                    gender: formData.gender,
                    dob: formData.dob,
                    employeeId: formData.employeeId,
                    sendWelcomeEmail: formData.sendWelcomeEmail
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                }
            );

            alert("User created successfully");
            navigate('/admin');

        } catch (error) {
            console.error(error);
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                alert(error.response?.data?.error || "Failed to create user");
            }
        }
    };

    const handleReset = () => {
        setFormData({
            firstName: '',
            lastName: '',
            email: '',
            mobile: '',
            gender: '',
            dob: '',
            username: 'auto_generated_user',
            role: 'EMPLOYEE',
            employeeId: '',
            password: '',
            confirmPassword: '',
            sendWelcomeEmail: true
        });
    };

    return (
        <div className="add-user-page-wrapper">
            <div className="user-management-container" style={{ maxWidth: '1000px', margin: '0 auto', padding: '0' }}>
                <div className="add-user-header">
                    <ArrowLeft
                        className="back-arrow-icon"
                        onClick={() => navigate('/admin', { state: { activeTab: 'User Management' } })}
                    />
                    <div className="add-user-title">Add New User</div>
                </div>

                <div className="add-user-form">

                    {/* Profile Section */}
                    <div className="profile-upload-section">
                        <div className="avatar-preview">
                            <svg fill="currentColor" viewBox="0 0 24 24" width="40" height="40">
                                <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                        <label className="upload-label-text">
                            Upload Photo
                            <input type="file" style={{ display: 'none' }} />
                        </label>
                    </div>

                    {/* Personal Information */}
                    <div className="form-section">
                        <div className="section-title">Personal Information</div>

                        <div className="form-row">
                            <div className="form-col">
                                <label className="add-user-label">First Name</label>
                                <input
                                    type="text"
                                    className="add-user-input"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                />
                                {errors.firstName && <div className="error-text">{errors.firstName}</div>}
                            </div>

                            <div className="form-col">
                                <label className="add-user-label">Last Name</label>
                                <input
                                    type="text"
                                    className="add-user-input"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                />
                                {errors.lastName && <div className="error-text">{errors.lastName}</div>}
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-col">
                                <label className="add-user-label">Email Address</label>
                                <input
                                    type="email"
                                    className="add-user-input"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                                {errors.email && <div className="error-text">{errors.email}</div>}
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-col">
                                <label className="add-user-label">Mobile Number</label>
                                <input
                                    type="tel"
                                    className={`add-user-input ${errors.mobile ? 'error' : ''}`}
                                    name="mobile"
                                    value={formData.mobile}
                                    onChange={handleChange}
                                    maxLength={10}
                                />
                                {errors.mobile && <div className="error-text">{errors.mobile}</div>}
                            </div>

                            <div className="form-col">
                                <label className="add-user-label">Gender</label>
                                <select
                                    className="add-user-select"
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleChange}
                                >
                                    <option value="">Select Gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                                {errors.gender && <div className="error-text">{errors.gender}</div>}
                            </div>
                        </div>

                        {/* ✅ Date of Birth (STYLING PRESERVED) */}
                        <div className="form-row">
                            <div className="form-col">
                                <label className="add-user-label">Date of Birth</label>
                                <input
                                    type="date"
                                    className="add-user-input"
                                    name="dob"
                                    value={formData.dob}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Account Information */}
                    <div className="form-section">
                        <div className="section-title">Account Information</div>

                        <div className="form-row">
                            <div className="form-col">
                                <label className="add-user-label">Username</label>
                                <input
                                    type="text"
                                    className="add-user-input"
                                    value={formData.username}
                                    disabled
                                />
                            </div>

                            <div className="form-col">
                                <label className="add-user-label">Role</label>
                                <select
                                    className="add-user-select"
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                >
                                    <option value="EMPLOYEE">Employee</option>
                                    <option value="ADMIN">Admin</option>
                                    <option value="MANAGER">Manager</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Organization Details */}
                    <div className="form-section">
                        <div className="section-title">Organization Details</div>

                        <div className="form-row">
                            <div className="form-col">
                                <label className="add-user-label">Employee ID</label>
                                <input
                                    type="text"
                                    className="add-user-input"
                                    name="employeeId"
                                    value={formData.employeeId}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Login & Security */}
                    <div className="form-section">
                        <div className="section-title">Login & Security</div>

                        <div className="form-row">
                            <div className="form-col">
                                <label className="add-user-label">Password</label>
                                <input
                                    type="password"
                                    className="add-user-input"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                />
                                {errors.password && <div className="error-text">{errors.password}</div>}
                            </div>

                            <div className="form-col">
                                <label className="add-user-label">Confirm Password</label>
                                <input
                                    type="password"
                                    className="add-user-input"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                />
                                {errors.confirmPassword && <div className="error-text">{errors.confirmPassword}</div>}
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="checkbox-group">
                                <input
                                    type="checkbox"
                                    className="checkbox-input"
                                    id="welcomeEmail"
                                    name="sendWelcomeEmail"
                                    checked={formData.sendWelcomeEmail}
                                    onChange={handleChange}
                                />
                                <label htmlFor="welcomeEmail" className="add-user-label">
                                    Send Welcome Email
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Footer Buttons */}
                    <div className="form-footer">
                        <button className="btn btn-secondary" onClick={() => navigate('/admin')}>
                            Cancel
                        </button>
                        <button className="btn btn-danger" onClick={handleReset}>
                            Reset Form
                        </button>
                        <button className="btn btn-primary" onClick={handleSave}>
                            Save & Create
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default AddUser;
