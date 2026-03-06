import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { LayoutDashboard, Users, BookOpen, LogOut, CheckCircle, Clock, XCircle, FileText, Bell, Settings, Activity } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import './AdminDashboard.css';
import logo from './assets/logo.png';
import UserManagement from './UserManagement';
import CourseManagement from './CourseManagement';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('Dashboard');
    const [stats, setStats] = useState({
        totalMembers: 0,
        published: 0,
        avgCompletion: 0
    });
    const [recentAssignments, setRecentAssignments] = useState([]);

    const location = useLocation();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate('/');
            return;
        }

        // Handle tab navigation from other pages
        if (location.state?.activeTab) {
            setActiveTab(location.state.activeTab);
            // Clear state to prevent stuck tab on refresh (optional but good practice)
            window.history.replaceState({}, document.title);
        }

        fetchDashboardData();
    }, [location.state]);

    const fetchDashboardData = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(
                "http://localhost:8080/admin/dashboard/summary",
                { headers: { Authorization: `Bearer ${token}` } }
            );

            console.log("Fetched Admin Dashboard Summary:", response.data);
            setStats({
                totalMembers: response.data.totalMembersCount,
                published: response.data.publishedCount,
                avgCompletion: response.data.averageCompletionRate
            });
            setRecentAssignments(response.data.recentAssignments);
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        navigate('/');
    };

    // Chart Data
    const data = [
        { name: 'Total Members', value: Number(stats.totalMembers || 0), color: '#6366F1' },  // Indigo
        { name: 'Total Courses', value: Number(stats.published || 0), color: '#10B981' }, // Green
        { name: 'Avg Completion', value: Number(stats.avgCompletion || 0), color: '#F59E0B' }     // Amber
    ];

    const onPieClick = (data, index) => {
        if (!data) return;
        const type = data.name || (data.payload && data.payload.name);
        if (type === "Total Members") setActiveTab('User Management');
        if (type === "Total Courses") setActiveTab('Course Management');
    };

    const menuItems = [
        { name: 'Dashboard', icon: LayoutDashboard },
        { name: 'User Management', icon: Users },
        { name: 'Course Management', icon: BookOpen },
        { name: 'Notifications', icon: Bell },
        { name: 'Settings', icon: Settings }
    ];

    return (
        <div className="dashboard-container">
            {/* Sidebar */}
            <div className="sidebar">
                <div className="sidebar-header">
                    <img src={logo} alt="ORYFOLKS" style={{ height: '40px', width: 'auto' }} />
                </div>
                <nav className="sidebar-nav">
                    {menuItems.map((item) => (
                        <button
                            key={item.name}
                            className={`nav-item ${activeTab === item.name ? 'active' : ''}`}
                            onClick={() => setActiveTab(item.name)}
                        >
                            <item.icon size={20} />
                            <span>{item.name}</span>
                        </button>
                    ))}
                </nav>
            </div>

            {/* Main Content */}
            <div className="main-content">
                <header className="dashboard-header">
                    <h1>Welcome, Admin!</h1>
                    <div className="header-actions">
                        <button className="icon-button" onClick={handleLogout} title="Logout">
                            <LogOut size={20} />
                        </button>
                    </div>
                </header>

                <div className="content">
                    {activeTab === 'Dashboard' && (
                        <>
                            {/* Stats Overview */}
                            <div className="stats-grid">
                                <div className="stat-card assigned" onClick={() => setActiveTab('User Management')}>
                                    <div className="stat-icon">
                                        <Users size={24} />
                                    </div>
                                    <div className="stat-info">
                                        <div className="stat-value">{stats.totalMembers}</div>
                                        <div className="stat-label">Total Members</div>
                                    </div>
                                </div>
                                <div className="stat-card published" onClick={() => setActiveTab('Course Management')}>
                                    <div className="stat-icon">
                                        <BookOpen size={24} />
                                    </div>
                                    <div className="stat-info">
                                        <div className="stat-value">{stats.published}</div>
                                        <div className="stat-label">Total Courses</div>
                                    </div>
                                </div>
                                <div className="stat-card unassigned">
                                    <div className="stat-icon">
                                        <Activity size={24} />
                                    </div>
                                    <div className="stat-info">
                                        <div className="stat-value">{stats.avgCompletion}%</div>
                                        <div className="stat-label">Average Completion</div>
                                    </div>
                                </div>
                            </div>

                            <div className="bottom-grid">
                                {/* Recently Assigned Courses */}
                                <div className="card">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                        <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>Recently Assigned Courses</h2>
                                        {recentAssignments.length >= 6 && (
                                            <button
                                                style={{ background: 'none', border: 'none', color: '#6366F1', cursor: 'pointer', fontWeight: '600', display: 'inline-flex', alignItems: 'center', fontSize: '14px' }}
                                                onClick={() => navigate('/admin/recent-assignments')}
                                            >
                                                View All
                                            </button>
                                        )}
                                    </div>
                                    <div className="admin-table-container">
                                        <table className="admin-table">
                                            <thead>
                                                <tr>
                                                    <th>Course ID</th>
                                                    <th>Course Name</th>
                                                    <th>Employee Name</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {recentAssignments.length > 0 ? (
                                                    recentAssignments.slice(0, 6).map((assignment, index) => (
                                                        <tr key={`${assignment.courseId}-${index}`}>
                                                            <td>#{assignment.courseId}</td>
                                                            <td style={{ fontWeight: '500', color: '#6366F1' }}>{assignment.courseName}</td>
                                                            <td>{assignment.employeeName}</td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="3" style={{ padding: '20px', textAlign: 'center', color: '#9CA3AF' }}>No recent assignments</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Chart */}
                                <div className="card">
                                    <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>Course Overview</h2>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <div style={{ width: '100%', height: '250px' }}>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={data}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={70}
                                                        outerRadius={100}
                                                        paddingAngle={5}
                                                        dataKey="value"
                                                        onClick={onPieClick}
                                                        cursor="pointer"
                                                        label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                                                            const RADIAN = Math.PI / 180;
                                                            const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                                            const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                                            const y = cy + radius * Math.sin(-midAngle * RADIAN);

                                                            return data[index].value > 0 ? (
                                                                <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontWeight="bold">
                                                                    {data[index].value}
                                                                </text>
                                                            ) : null;
                                                        }}
                                                        labelLine={false}
                                                    >
                                                        {data.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                                        ))}
                                                    </Pie>
                                                    <RechartsTooltip />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div style={{ width: '100%', marginTop: '16px' }}>
                                            {data.map((item, index) => (
                                                <div key={index} style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    padding: '12px 0',
                                                    borderBottom: index !== data.length - 1 ? '1px solid #E5E7EB' : 'none'
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <div style={{
                                                            width: '12px',
                                                            height: '12px',
                                                            borderRadius: '2px',
                                                            backgroundColor: item.color
                                                        }} />
                                                        <span style={{ color: '#4B5563', fontSize: '14px' }}>{item.name}</span>
                                                    </div>
                                                    <span style={{ fontWeight: '600', color: '#111827' }}>{item.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'User Management' && <UserManagement onBack={() => setActiveTab('Dashboard')} />}
                    {activeTab === 'Course Management' && <CourseManagement onBack={() => setActiveTab('Dashboard')} />}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
