import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from './apiConfig';
import './Notifications.css';

const NotificationsPage = ({ dashboardType = 'employee' }) => {
    const [notifications, setNotifications] = useState([]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [filter, setFilter] = useState('ALL'); // ALL, UNREAD, READ
    const [typeFilter, setTypeFilter] = useState('ALL'); // Filter by exact NotificationType
    const [selectedIds, setSelectedIds] = useState([]);
    const navigate = useNavigate();

    // Role-specific notification types for filtering
    const adminTypes = [
        'USER_CREATED',
        'USER_DELETED',
        'COURSE_CREATED',
        'COURSE_DELETED',
        'DAILY_ENROLLMENT_SUMMARY',
        'MANAGER_PENDING_APPROVAL'
    ];

    const managerTypes = [
        'ENROLLMENT_REQUEST_RECEIVED',
        'COURSE_COMPLETION',
        'DEADLINE_MISSED',
        'COURSE_ASSIGNMENT_CONFIRMATION',
        'NEW_EMPLOYEE_ADDED',
        'NEW_COURSE_ADDED',
        'DEADLINE_REMINDER'
    ];

    const employeeTypes = [
        'COURSE_ASSIGNED',
        'DEADLINE_REMINDER',
        'ENROLLMENT_APPROVED',
        'ENROLLMENT_REJECTED'
    ];

    const allowedTypes = dashboardType === 'admin' ? adminTypes
        : dashboardType === 'manager' ? managerTypes
        : employeeTypes;

    const notificationTypes = ['ALL', ...allowedTypes];

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE_URL}/notifications/all?page=${page}&size=10`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = response.data;
            if (data.totalPages === 0) {
                setNotifications([]);
                setTotalPages(0);
                if (page !== 0) {
                    setPage(0);
                }
            } else if (page >= data.totalPages) {
                setPage(data.totalPages - 1);
            } else {
                setNotifications(data.content);
                setTotalPages(data.totalPages);
            }
        } catch (error) {
            console.error('Error fetching notifications page', error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const intervalId = setInterval(fetchNotifications, 5000); // Poll every 5s for real-time updates
        return () => clearInterval(intervalId);
    }, [page]);

    const handleMarkAsRead = async (id, e) => {
        if (e) e.stopPropagation();
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API_BASE_URL}/notifications/${id}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
        } catch (error) {
            console.error('Error marking as read', error);
        }
    };

    const handleNotificationClick = (n) => {
        if (!n.read) {
            handleMarkAsRead(n.id);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API_BASE_URL}/notifications/read-all`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(notifications.map(n => ({ ...n, read: true })));
        } catch (error) {
            console.error('Error marking all as read', error);
        }
    };

    const handleDelete = async (id, e) => {
        if (e) e.stopPropagation();
        if (!window.confirm("Are you sure you want to delete this notification?")) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_BASE_URL}/notifications/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await fetchNotifications();
            setSelectedIds(selectedIds.filter(sid => sid !== id));
        } catch (error) {
            console.error('Error deleting notification', error);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} notifications?`)) return;
        
        try {
            const token = localStorage.getItem('token');
            await Promise.all(selectedIds.map(id => 
                axios.delete(`${API_BASE_URL}/notifications/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ));
            fetchNotifications();
            setSelectedIds([]);
        } catch (error) {
            console.error('Error in bulk delete', error);
        }
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(filteredNotifications.map(n => n.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(sid => sid !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const renderMessage = (message) => {
        if (!message) return "";
        const regex = /\*(.*?)\*|'(.*?)'/g;
        const parts = [];
        let lastIndex = 0;
        let match;

        while ((match = regex.exec(message)) !== null) {
            if (match.index > lastIndex) {
                parts.push(message.substring(lastIndex, match.index));
            }
            const highlightedText = match[1] || match[2];
            parts.push(<span key={match.index} className="highlight-course">{highlightedText}</span>);
            lastIndex = regex.lastIndex;
        }

        if (lastIndex < message.length) {
            parts.push(message.substring(lastIndex));
        }

        return parts.length > 0 ? parts : message;
    };

    const filteredNotifications = notifications.filter(n => {
        // Only show notification types allowed for this role
        if (!allowedTypes.includes(n.type)) return false;

        // Read/Unread filter
        if (filter === 'UNREAD' && n.read) return false;
        if (filter === 'READ' && !n.read) return false;
        
        // Type filter
        if (typeFilter !== 'ALL' && n.type !== typeFilter) return false;
        
        return true;
    });



    return (
        <div className="notifications-page">
            <div className="notifications-page-header">
                <h2>Notifications Dashboard</h2>
                <div className="header-actions">
                    <button className="mark-all-read-btn" onClick={handleMarkAllAsRead}>
                        Mark all as read
                    </button>
                    <button 
                        className="bulk-delete-btn" 
                        onClick={handleBulkDelete}
                        disabled={selectedIds.length === 0}
                    >
                        Delete Selected ({selectedIds.length})
                    </button>
                </div>
            </div>


            <div className="filters-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '12px' }}>
                <div className="filters" style={{ display: 'flex', gap: '8px', margin: 0 }}>
                    {['ALL', 'UNREAD', 'READ'].map(f => (
                        <button 
                            key={f}
                            className={`filter-btn ${filter === f ? 'active' : ''}`} 
                            onClick={() => { setFilter(f); setSelectedIds([]); }}
                        >
                            {f.charAt(0) + f.slice(1).toLowerCase()}
                        </button>
                    ))}
                </div>

                {/* Filter by Notification Type Dropdown */}
                <div className="type-filter-container" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: '#4b5563' }}>Filter by Event:</span>
                    <select
                        value={typeFilter}
                        onChange={(e) => { setTypeFilter(e.target.value); setSelectedIds([]); }}
                        style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: '1px solid #d1d5db',
                            fontSize: '13px',
                            backgroundColor: 'white',
                            outline: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        {notificationTypes.map(t => (
                            <option key={t} value={t}>
                                {t.replace(/_/g, ' ')}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {filteredNotifications.length > 0 && (
                <div className="select-all-container" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <input 
                        type="checkbox" 
                        onChange={handleSelectAll}
                        checked={selectedIds.length === filteredNotifications.length && filteredNotifications.length > 0}
                        style={{ cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '13px', color: '#4b5563', userSelect: 'none' }}>Select All on this page</span>
                </div>
            )}

            <div className="page-notification-list">
                {filteredNotifications.length === 0 ? (
                    <div className="empty-notifications">
                        <div className="empty-notifications-icon">🔔</div>
                        <p>No notifications match the selected criteria.</p>
                    </div>
                ) : (
                    filteredNotifications.map(n => (
                        <div key={n.id} className="notif-row" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div className="notif-checkbox">
                                <input 
                                    type="checkbox" 
                                    checked={selectedIds.includes(n.id)}
                                    onChange={() => handleSelectOne(n.id)}
                                    style={{ cursor: 'pointer' }}
                                />
                            </div>
                            <div 
                                className={`notification-item ${!n.read ? 'unread' : ''}`}
                                onClick={() => handleNotificationClick(n)}
                                style={{ cursor: 'pointer', flex: 1 }}
                            >
                                <div className="notification-title">
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {n.type === 'SYSTEM_ERROR' && '💥'}
                                        {n.type === 'USER_CREATED' && '👤'}
                                        {n.type === 'USER_DELETED' && '👤'}
                                        {n.type === 'COURSE_CREATED' && '📚'}
                                        {n.type === 'COURSE_DELETED' && '📚'}
                                        {n.type === 'BULK_IMPORT_COMPLETED' && '✅'}
                                        {n.type === 'BULK_UPLOAD_FAILED' && '⚠️'}
                                        {n.type === 'SECURITY_ALERT' && '🚨'}
                                        {n.type === 'DAILY_ENROLLMENT_SUMMARY' && '📊'}
                                        {n.type === 'HIGH_ACTIVITY_ALERT' && '📈'}
                                        {n.type === 'MANAGER_PENDING_APPROVAL' && '👤'}
                                        {n.type === 'COURSE_ASSIGNED' && '📋'}
                                        {n.type === 'DEADLINE_REMINDER' && '⏰'}
                                        {n.type === 'ENROLLMENT_APPROVED' && '✅'}
                                        {n.type === 'ENROLLMENT_REJECTED' && '❌'}
                                        {n.type === 'ENROLLMENT_REQUEST_RECEIVED' && '📩'}
                                        {n.type === 'COURSE_COMPLETION' && '🎓'}
                                        {n.type === 'DEADLINE_MISSED' && '⚠️'}
                                        {n.type === 'COURSE_ASSIGNMENT_CONFIRMATION' && '✅'}
                                        {n.type === 'NEW_EMPLOYEE_ADDED' && '👥'}
                                        {n.type === 'NEW_COURSE_ADDED' && '📚'}
                                        {n.title}
                                    </span>
                                    {!n.read && <span className="unread-dot"></span>}
                                </div>
                                <div className="notification-message">
                                    {renderMessage(n.message)}
                                </div>
                                <div className="notification-footer">
                                    <span className="notification-time">
                                        {new Date(n.createdAt).toLocaleString()}
                                    </span>
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        {!n.read && (
                                            <button 
                                                className="mark-all-read-btn" 
                                                style={{ padding: 0, fontSize: '12px', height: 'auto', background: 'none' }}
                                                onClick={(e) => handleMarkAsRead(n.id, e)}
                                            >
                                                Mark read
                                            </button>
                                        )}
                                        <button 
                                            className="delete-notif-btn" 
                                            onClick={(e) => handleDelete(n.id, e)}
                                            title="Delete notification"
                                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M3 6h18"></path>
                                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {totalPages > 0 && (
                <div className="pagination">
                    <button 
                        className="pagination-btn" 
                        disabled={page === 0 || totalPages <= 1} 
                        onClick={() => setPage(page - 1)}
                    >
                        Previous
                    </button>
                    <span>Page {page + 1} of {totalPages}</span>
                    <button 
                        className="pagination-btn" 
                        disabled={page === totalPages - 1 || totalPages <= 1} 
                        onClick={() => setPage(page + 1)}
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default NotificationsPage;
