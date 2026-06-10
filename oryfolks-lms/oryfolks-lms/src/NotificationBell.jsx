import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from './apiConfig';
import './Notifications.css';

const NotificationBell = ({ dashboardType = 'employee' }) => {
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    const fetchUnreadCount = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE_URL}/notifications/unread-count`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUnreadCount(response.data.count);
        } catch (error) {
            console.error('Error fetching unread count', error);
        }
    };

    const fetchLatestNotifications = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE_URL}/notifications`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(response.data);
        } catch (error) {
            console.error('Error fetching latest notifications', error);
        }
    };

    useEffect(() => {
        fetchUnreadCount();
        const intervalId = setInterval(fetchUnreadCount, 5000); // Poll every 5 seconds for real-time responsiveness
        return () => clearInterval(intervalId);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleDropdown = () => {
        const newIsOpen = !isOpen;
        setIsOpen(newIsOpen);
        if (newIsOpen) {
            fetchLatestNotifications();
        }
    };

    const handleMarkAsRead = async (id, e) => {
        if (e) e.stopPropagation();
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API_BASE_URL}/notifications/${id}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
            fetchUnreadCount();
        } catch (error) {
            console.error('Error marking as read', error);
        }
    };

    const handleMarkAllAsRead = async (e) => {
        if (e) e.stopPropagation();
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API_BASE_URL}/notifications/read-all`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(notifications.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all as read', error);
        }
    };

    const handleDelete = async (id, e) => {
        if (e) e.stopPropagation();
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_BASE_URL}/notifications/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(notifications.filter(n => n.id !== id));
            fetchUnreadCount();
        } catch (error) {
            console.error('Error deleting notification', error);
        }
    };

    const viewAllClick = () => {
        setIsOpen(false);
        if (dashboardType === 'manager') {
            navigate('/manager/notifications');
        } else if (dashboardType === 'admin') {
            navigate('/admin', { state: { activeTab: 'Notifications' } });
        } else {
            navigate('/employee/profile?tab=notifications');
        }
    };

    const renderMessage = (message) => {
        if (!message) return "";
        // Handle asterisks *Course Name* or single quotes 'Course Name'
        const regex = /\*(.*?)\*|'(.*?)'/g;
        const parts = [];
        let lastIndex = 0;
        let match;

        while ((match = regex.exec(message)) !== null) {
            // Push text before match
            if (match.index > lastIndex) {
                parts.push(message.substring(lastIndex, match.index));
            }
            // Push highlighted match (it could be in group 1 or 2)
            const highlightedText = match[1] || match[2];
            parts.push(<span key={match.index} className="highlight-course">{highlightedText}</span>);
            lastIndex = regex.lastIndex;
        }

        // Push remaining text
        if (lastIndex < message.length) {
            parts.push(message.substring(lastIndex));
        }

        return parts.length > 0 ? parts : message;
    };

    const handleNotificationClick = (n) => {
        if (!n.read) handleMarkAsRead(n.id);
        setIsOpen(false);
    };

    return (
        <div className="notification-bell-container" ref={dropdownRef}>
            <div className="bell-icon" onClick={toggleDropdown}>
                🔔
                {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
            </div>

            {isOpen && (
                <div className="notification-dropdown">
                    <div className="notification-dropdown-header">
                        <h4>Notifications</h4>
                        {unreadCount > 0 && (
                            <button className="mark-all-read-btn" onClick={handleMarkAllAsRead}>
                                Mark all as read
                            </button>
                        )}
                    </div>
                    
                    <div className="notification-list">
                        {notifications.length === 0 ? (
                            <div className="empty-notifications" style={{ padding: '40px 20px' }}>
                                <div className="empty-notifications-icon" style={{ fontSize: '2rem' }}>🔔</div>
                                <p>No notifications available</p>
                            </div>
                        ) : (
                            notifications.map(n => (
                                <div 
                                    key={n.id} 
                                    className={`notification-item ${!n.read ? 'unread' : ''}`}
                                    onClick={() => handleNotificationClick(n)}
                                >
                                    <div className="notification-title">
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            {n.type === 'SYSTEM_ERROR' && '💥 '}
                                            {n.type === 'USER_CREATED' && '👤 '}
                                            {n.type === 'USER_DELETED' && '👤 '}
                                            {n.type === 'COURSE_CREATED' && '📚 '}
                                            {n.type === 'COURSE_DELETED' && '📚 '}
                                            {n.type === 'BULK_IMPORT_COMPLETED' && '✅ '}
                                            {n.type === 'BULK_UPLOAD_FAILED' && '⚠️ '}
                                            {n.type === 'SECURITY_ALERT' && '🚨 '}
                                            {n.type === 'DAILY_ENROLLMENT_SUMMARY' && '📊 '}
                                            {n.type === 'HIGH_ACTIVITY_ALERT' && '📈 '}
                                            {n.type === 'MANAGER_PENDING_APPROVAL' && '👤 '}
                                            {n.type === 'COURSE_ASSIGNED' && '📋 '}
                                            {n.type === 'DEADLINE_REMINDER' && '⏰ '}
                                            {n.type === 'ENROLLMENT_APPROVED' && '✅ '}
                                            {n.type === 'ENROLLMENT_REJECTED' && '❌ '}
                                            {n.type === 'ENROLLMENT_REQUEST_RECEIVED' && '📩 '}
                                            {n.type === 'COURSE_COMPLETION' && '🎓 '}
                                            {n.type === 'DEADLINE_MISSED' && '⚠️ '}
                                            {n.type === 'COURSE_ASSIGNMENT_CONFIRMATION' && '✅ '}
                                            {n.type === 'NEW_EMPLOYEE_ADDED' && '👥 '}
                                            {n.type === 'NEW_COURSE_ADDED' && '📚 '}
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
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    
                    <a href="#" className="view-all-link" onClick={(e) => { e.preventDefault(); viewAllClick(); }}>
                        View All Notifications
                    </a>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
