import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft } from 'lucide-react';
import './UserManagement.css';
import './CourseManagement.css'; // Import shared styles for pill search

const UserManagement = ({ onBack }) => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    const token = localStorage.getItem("token");

    // ✅ Fetch Users From Backend
    const fetchUsers = async () => {
        try {
            const response = await axios.get(
                "http://localhost:8080/admin/users",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            setUsers(response.data);
        } catch (error) {
            console.error("Error fetching users", error);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // ✅ DELETE User
    const handleDeleteUser = async (id, firstName, lastName) => {
        const userName = `${firstName} ${lastName}`.trim() || 'this user';
        if (window.confirm(`Are you sure you want to delete "${userName}"? This will permanently remove all their associated data.`)) {
            try {
                await axios.delete(
                    `http://localhost:8080/admin/users/${id}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                fetchUsers(); // refresh list
            } catch (error) {
                console.error("Delete failed", error);
                alert("Failed to delete user. Please try again.");
            }
        }
    };

    // Filter users based on search term and exclude ADMIN role
    const filteredUsers = users.filter(user => {
        if (user.role?.toUpperCase() === 'ADMIN') return false;

        const fullSearch = searchTerm.toLowerCase();
        const firstName = user.firstName?.toLowerCase() || '';
        const lastName = user.lastName?.toLowerCase() || '';
        const email = user.email?.toLowerCase() || '';
        return firstName.includes(fullSearch) || lastName.includes(fullSearch) || email.includes(fullSearch);
    });

    return (
        <div className="user-management-container" style={{ position: 'relative' }}>
            <div className="header-with-arrow">
                <ArrowLeft
                    className="back-arrow-icon"
                    onClick={() => {
                        if (onBack) onBack();
                        else navigate('/admin');
                    }}
                />
                <h1 className="um-title" style={{ marginBottom: 0 }}>User Management</h1>
            </div>
            <p className="um-subtitle" style={{ textAlign: 'center', marginBottom: '24px' }}>
                Manage all users in one place. Control access, assign roles, and monitor activity across your platform.
            </p>

            <div className="um-filter-bar" style={{ justifyContent: 'center' }}>
                <div className="cm-search-container">
                    <input
                        type="text"
                        className="cm-search-input"
                        placeholder="Search Users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <svg className="cm-search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>

                <div className="um-actions">
                    <button className="um-add-btn" onClick={() => navigate('/admin/add-user')}>
                        Add User
                    </button>
                </div>
            </div>

            <div className="um-table-container">
                <table className="um-table">
                    <thead>
                        <tr>
                            <th>S.No</th>
                            <th>Full Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map((user, index) => (
                            <tr key={user.id}>
                                <td>{index + 1}</td>
                                <td>
                                    <div className="um-user-cell">
                                        <span>{user.firstName} {user.lastName}</span>
                                    </div>
                                </td>
                                <td>{user.email}</td>
                                <td>
                                    <span className={`role-badge ${user.role?.toLowerCase()}`}>
                                        {user.role}
                                    </span>
                                </td>

                                <td>
                                    <div className="um-action-cell">
                                        <svg
                                            className="um-action-icon delete"
                                            onClick={() => handleDeleteUser(user.id, user.firstName, user.lastName)}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UserManagement;
