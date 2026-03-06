import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { ArrowLeft, Clock, Calendar, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import './EmployeeDashboard.css'; // Reusing dashboard styles
import logo from './assets/logo.png';

const MyLearning = () => {
    const navigate = useNavigate();
    const [assignedCourses, setAssignedCourses] = useState([]);
    const [enrollmentHistory, setEnrollmentHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [username, setUsername] = useState('');
    const [activeTab, setActiveTab] = useState('assigned');
    const token = localStorage.getItem('token');

    useEffect(() => {
        if (!token) {
            navigate('/');
            return;
        }
        try {
            const decoded = jwtDecode(token);
            setUsername(decoded.sub);
        } catch (error) {
            console.error('Invalid JWT Token');
            navigate('/');
        }

        fetchData();
    }, [token, navigate]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [myCoursesRes, historyRes] = await Promise.all([
                axios.get('http://localhost:8080/employee/courses/my', {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                axios.get('http://localhost:8080/employee/enrollments/history', {
                    headers: { Authorization: `Bearer ${token}` },
                })
            ]);

            setAssignedCourses(myCoursesRes.data);
            console.log('My Assigned Courses:', myCoursesRes.data); // Debugging
            setEnrollmentHistory(historyRes.data);
        } catch (error) {
            console.error('Error fetching learning data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'APPROVED':
                return <span className="status-badge success"><CheckCircle size={14} /> Approved</span>;
            case 'REJECTED':
                return <span className="status-badge error"><XCircle size={14} /> Rejected</span>;
            case 'PENDING':
                return <span className="status-badge warning"><Clock size={14} /> Pending</span>;
            default:
                return <span className="status-badge">{status}</span>;
        }
    };

    const formatDate = (dateArray) => {
        if (!dateArray) return 'N/A';
        // Handle array format [yyyy, mm, dd, hh, mm, ss]
        if (Array.isArray(dateArray)) {
            return new Date(dateArray[0], dateArray[1] - 1, dateArray[2]).toLocaleDateString();
        }
        return new Date(dateArray).toLocaleDateString();
    };

    if (loading) {
        return <div className="loading-container">Loading your learning path...</div>;
    }

    return (
        <div className="employee-dashboard-wrapper">
            {/* Navbar */}
            <nav className="employee-navbar">
                <div className="employee-logo" onClick={() => navigate('/employee')} style={{ cursor: 'pointer' }}>
                    <img src={logo} alt="Oryfolks" />
                </div>
                <button className="back-btn" onClick={() => navigate('/employee')} style={{
                    background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: '0.5rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <ArrowLeft size={24} />
                </button>
            </nav>

            <div className="employee-main-content">
                <h1 className="page-title" style={{ marginBottom: '2rem', color: '#1e293b' }}>My Learning</h1>

                {/* Tab Buttons */}
                <div className="employee-tabs-container" style={{ marginBottom: '2rem' }}>
                    <button
                        className={`employee-tab-button ${activeTab === 'assigned' ? 'active' : ''}`}
                        onClick={() => setActiveTab('assigned')}
                    >
                        Assigned Courses
                    </button>
                    <button
                        className={`employee-tab-button ${activeTab === 'enrolled' ? 'active' : ''}`}
                        onClick={() => setActiveTab('enrolled')}
                    >
                        Enrollment Course
                    </button>
                </div>

                {/* Assigned Courses Section */}
                {activeTab === 'assigned' && (
                    <section className="learning-section">
                        {assignedCourses.filter(c => c.enrollmentType !== 'SELF_ENROLLMENT').length > 0 ? (
                            <div className="employee-courses-card-wrapper" style={{ background: 'transparent', border: 'none', boxShadow: 'none', padding: 0 }}>
                                <div className="employee-horizontal-section">
                                    <h2 className="employee-section-title" style={{ color: '#1e293b' }}>Assigned Courses</h2>
                                    <div className="employee-horizontal-scroll">
                                        {assignedCourses.filter(c => c.enrollmentType !== 'SELF_ENROLLMENT').map(course => (
                                            <div key={course.id} className="employee-course-card" onClick={() => navigate(`/course/${course.id}`, { state: { from: '/employee/my-learning' } })}>
                                                <div className="employee-course-image-container">
                                                    <img src={course.thumbnailUrl} alt={course.title} className="employee-course-image" />
                                                    {/* Progress Badge */}
                                                    <div className={`employee-progress-badge ${course.progress === 100 ? 'completed' : ''}`}>
                                                        {course.progress === 100 ? 'Completed' : `${course.progress}%`}
                                                    </div>
                                                </div>
                                                <div className="employee-course-content">
                                                    <h3 className="employee-course-title">{course.title}</h3>
                                                    <div className="employee-course-meta">
                                                        <div className="meta-item">
                                                            <span className="course-duration">Duration: {course.duration}</span>
                                                        </div>
                                                        <div className="meta-item">
                                                            <span className="course-category">Category: {course.category}</span>
                                                        </div>
                                                        {course.deadline && (
                                                            <div className="meta-item">
                                                                <span className="course-deadline" style={{ color: '#ef4444', fontWeight: '600', fontSize: '12px' }}>
                                                                    Due: {formatDate(course.deadline)}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="empty-state">You haven't been assigned any courses yet.</p>
                        )}
                    </section>
                )}

                {/* Enrolled Courses (History) Section */}
                {activeTab === 'enrolled' && (
                    <section className="learning-section">
                        {/* Display Active Self-Enrolled Courses first */}
                        <div className="employee-courses-card-wrapper" style={{ background: 'transparent', border: 'none', boxShadow: 'none', padding: 0, marginBottom: '2rem' }}>
                            <div className="employee-horizontal-section">
                                <h2 className="employee-section-title" style={{ color: '#1e293b' }}>Active Enrollments</h2>
                                {assignedCourses.filter(c => c.enrollmentType === 'SELF_ENROLLMENT').length > 0 ? (
                                    <div className="employee-horizontal-scroll">
                                        {assignedCourses.filter(c => c.enrollmentType === 'SELF_ENROLLMENT').map(course => (
                                            <div key={course.id} className="employee-course-card" onClick={() => navigate(`/course/${course.id}`, { state: { from: '/employee/my-learning' } })}>
                                                <div className="employee-course-image-container">
                                                    <img src={course.thumbnailUrl} alt={course.title} className="employee-course-image" />
                                                    {/* Progress Badge */}
                                                    <div className={`employee-progress-badge ${course.progress === 100 ? 'completed' : ''}`}>
                                                        {course.progress === 100 ? 'Completed' : `${course.progress}%`}
                                                    </div>
                                                </div>
                                                <div className="employee-course-content">
                                                    <h3 className="employee-course-title">{course.title}</h3>
                                                    <div className="employee-course-meta">
                                                        <div className="meta-item">
                                                            <span className="course-duration">Duration: {course.duration}</span>
                                                        </div>
                                                        <div className="meta-item">
                                                            <span className="course-category">Category: {course.category}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="empty-state" style={{ paddingLeft: '0.5rem' }}>No active self-enrolled courses.</p>
                                )}
                            </div>
                        </div>

                        {/* Enrollment History */}
                        <h2 className="employee-section-title" style={{ color: '#1e293b', borderLeft: '4px solid #64748b' }}>Enrollment History</h2>
                        {enrollmentHistory.length > 0 ? (
                            <div className="employee-courses-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '2rem' }}>
                                {enrollmentHistory.map(course => (
                                    <div key={course.id} className="employee-course-card" style={{ cursor: 'default' }}>
                                        <div className="employee-course-image-container">
                                            <img src={course.thumbnailUrl || 'https://via.placeholder.com/300x160?text=No+Image'} alt={course.courseName} className="employee-course-image" />
                                            <div className="employee-progress-badge" style={{
                                                backgroundColor: course.status === 'APPROVED' ? '#22c55e' : course.status === 'REJECTED' ? '#ef4444' : '#f59e0b',
                                                color: 'white',
                                                fontSize: '11px',
                                                fontWeight: '700',
                                                padding: '4px 10px',
                                                borderRadius: '20px',
                                                display: 'inline-block',
                                                bottom: 'auto',
                                                top: '8px',
                                                right: '8px'
                                            }}>
                                                {course.status}
                                            </div>
                                        </div>
                                        <div className="employee-course-content">
                                            <h3 className="employee-course-title">{course.courseName}</h3>
                                            <div className="employee-course-meta">
                                                <div className="meta-item">
                                                    <span className="course-duration">Duration: {course.duration}</span>
                                                </div>
                                                <div className="meta-item">
                                                    <span className="course-category">Category: {course.category || 'General'}</span>
                                                </div>
                                                <div className="meta-item">
                                                    {course.status !== 'PENDING' && course.responseDate && (
                                                        <span className="course-deadline" style={{ color: '#059669', fontSize: '12px', fontWeight: '500' }}>
                                                            {course.status === 'APPROVED' ? 'Approved on: ' : 'Rejected on: '}
                                                            {formatDate(course.responseDate)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="empty-state">No enrollment history found.</p>
                        )}
                    </section>
                )}
            </div>

            <footer className="employee-footer">
                <div className="footer-bottom">
                    <p>© 2026 Oryfolks LMS. Inspired by the world's best learning platforms.</p>
                </div>
            </footer>
        </div>
    );
};

export default MyLearning;
