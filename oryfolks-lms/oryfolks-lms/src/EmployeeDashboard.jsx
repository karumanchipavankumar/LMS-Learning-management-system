import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { Search, CheckCircle, Clock } from 'lucide-react';
import './EmployeeDashboard.css';
import logo from './assets/logo.png';

const EmployeeDashboard = () => {
    const navigate = useNavigate();

    const [username, setUsername] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState(''); // New state for last name
    const [assignedCourses, setAssignedCourses] = useState([]);
    const [allCourses, setAllCourses] = useState([]);
    const [enrollmentHistory, setEnrollmentHistory] = useState([]);
    const [activeTab, setActiveTab] = useState('all'); // 'all' or 'assigned'
    const [loading, setLoading] = useState(true);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState(''); // New state for search terms

    const token = localStorage.getItem('token');

    useEffect(() => {
        if (token) {
            try {
                const decoded = jwtDecode(token);
                setUsername(decoded.sub); // Keep username for fallback
            } catch (error) {
                console.error('Invalid JWT Token');
            }
        }

        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch profile and courses in parallel
            const [myCoursesRes, allCoursesRes, profileRes, historyRes] = await Promise.all([
                axios.get('http://localhost:8080/employee/courses/my', {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                axios.get('http://localhost:8080/employee/courses/all', {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                axios.get('http://localhost:8080/employee/profile', {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                axios.get('http://localhost:8080/employee/enrollments/history', {
                    headers: { Authorization: `Bearer ${token}` },
                })
            ]);

            setAssignedCourses(myCoursesRes.data);
            setAllCourses(allCoursesRes.data);
            setEnrollmentHistory(historyRes.data);

            // Set first name and last name
            if (profileRes.data) {
                setFirstName(profileRes.data.firstName || username);
                setLastName(profileRes.data.lastName || '');
            }

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    // ... existing handleLogout and CourseCard ...

    // ... skipping unchanged parts ...

    const formatDate = (dateArray) => {
        if (!dateArray) return 'N/A';
        // Handle array format [yyyy, mm, dd, hh, mm, ss]
        if (Array.isArray(dateArray)) {
            return new Date(dateArray[0], dateArray[1] - 1, dateArray[2]).toLocaleDateString();
        }
        return new Date(dateArray).toLocaleDateString();
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/');
    };

    // --- Enrollment Logic ---
    const [showEnrollModal, setShowEnrollModal] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [enrollmentStatus, setEnrollmentStatus] = useState(null); // null, 'loading', 'success', 'error'

    const handleCourseClick = (course) => {
        // If course is assigned or pending, navigate to player (or show message)
        // Check if assigned in assignedCourses
        const isAssigned = assignedCourses.some(c => c.id === course.id);

        if (isAssigned) {
            navigate(`/course/${course.id}`, { state: { from: '/employee' } });
        } else {
            // Open enrollment modal
            setSelectedCourse(course);
            setEnrollmentStatus(null);
            setShowEnrollModal(true);
        }
    };

    const handleEnroll = async () => {
        if (!selectedCourse) return;
        setEnrollmentStatus('loading');
        try {
            await axios.post(`http://localhost:8080/employee/enroll/${selectedCourse.id}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setEnrollmentStatus('success');
            // Optionally refresh data to update status if needed
        } catch (error) {
            console.error("Enrollment error:", error);
            setEnrollmentStatus('error');
        }
    };

    const EnrollmentModal = () => {
        if (!showEnrollModal || !selectedCourse) return null;

        return (
            <div className="modal-overlay">
                <div className="modal-content">
                    <div className="modal-header-image">
                        {selectedCourse.thumbnailUrl ? (
                            <img src={selectedCourse.thumbnailUrl} alt={selectedCourse.title} />
                        ) : (
                            <div className="modal-header-placeholder"></div>
                        )}
                        <button className="modal-close-btn" onClick={() => setShowEnrollModal(false)}>×</button>
                    </div>

                    <div className="modal-body">
                        <div className="modal-title-section">
                            <h2 className="modal-course-title">{selectedCourse.title}</h2>
                            <div className="modal-meta-row">
                                <span className="category-badge">{selectedCourse.category}</span>
                                <span className="modal-meta-item"><Clock size={14} /> {selectedCourse.duration}</span>
                            </div>
                        </div>

                        <p className="modal-description">{selectedCourse.description}</p>

                        {enrollmentStatus === 'success' ? (
                            <div className="success-message">
                                <CheckCircle size={48} color="#22c55e" />
                                <p style={{ fontSize: '1.rem', color: '#1e293b' }}>Enrollment request sent successfully!</p>
                                <p style={{ fontSize: '0.9rem', color: '#64748b' }}>Your manager will review it shortly.</p>
                                <button className="modal-btn secondary" onClick={() => setShowEnrollModal(false)}>Close</button>
                            </div>
                        ) : (
                            <div className="modal-footer-actions">
                                <button className="modal-btn secondary" onClick={() => setShowEnrollModal(false)}>Cancel</button>
                                <button
                                    className="modal-btn primary"
                                    onClick={handleEnroll}
                                    disabled={enrollmentStatus === 'loading'}
                                >
                                    {enrollmentStatus === 'loading' ? 'Sending Request...' : 'Enroll Now'}
                                </button>
                            </div>
                        )}
                        {enrollmentStatus === 'error' && (
                            <p className="error-message">Failed to send request. It might already be pending.</p>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const CourseCard = ({ course }) => {
        // Check if course is already assigned
        const isAssigned = assignedCourses.some(c => c.id === course.id);

        // ... (renderStars function remains same)
        const renderStars = (rating) => {
            const stars = [];
            const fullStars = Math.floor(rating || 0);
            const hasHalfStar = (rating || 0) % 1 >= 0.5;

            for (let i = 1; i <= 5; i++) {
                if (i <= fullStars) {
                    stars.push(<span key={i} className="star full">★</span>);
                } else if (i === fullStars + 1 && hasHalfStar) {
                    stars.push(<span key={i} className="star half">★</span>);
                } else {
                    stars.push(<span key={i} className="star empty">★</span>);
                }
            }
            return stars;
        };

        return (
            <div
                className="employee-course-card"
                onClick={() => handleCourseClick(course)}
            >
                {/* ... rest of card content ... */}
                <div className="employee-course-image-container">
                    <img
                        src={course.thumbnailUrl}
                        alt={course.title}
                        className="employee-course-image"
                    />

                    {/* Progress Badge (Assigned Tab) */}
                    {activeTab === 'assigned' && (
                        <div className={`employee-progress-badge ${course.progress === 100 ? 'completed' : ''}`}>
                            {course.progress === 100 ? 'Completed' : `${course.progress}%`}
                        </div>
                    )}

                    {/* Badge Logic for All Courses Tab */}
                    {activeTab === 'all' && (
                        (() => {
                            // 1. Check if Active (in assignedCourses)
                            const activeCourse = assignedCourses.find(c => c.id === course.id);
                            if (activeCourse) {
                                if (activeCourse.enrollmentType === 'SELF_ENROLLMENT') {
                                    return (
                                        <div style={{
                                            position: 'absolute',
                                            top: '8px',
                                            right: '8px',
                                            backgroundColor: '#22c55e',
                                            color: 'white',
                                            padding: '4px 10px',
                                            borderRadius: '20px',
                                            fontSize: '11px',
                                            fontWeight: '600',
                                            zIndex: 10,
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                        }}>
                                            Enrolled
                                        </div>
                                    );
                                } else {
                                    return (
                                        <div style={{
                                            position: 'absolute',
                                            top: '8px',
                                            right: '8px',
                                            backgroundColor: '#f97316',
                                            color: 'white',
                                            padding: '4px 10px',
                                            borderRadius: '20px',
                                            fontSize: '11px',
                                            fontWeight: '600',
                                            zIndex: 10,
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                        }}>
                                            Assigned
                                        </div>
                                    );
                                }
                            }

                            // 2. Check if Pending (in enrollmentHistory)
                            // Note: enrollmentHistory items have 'courseId' matching course.id
                            const pendingEnrollment = enrollmentHistory.find(e => e.courseId === course.id && e.status === 'PENDING');
                            if (pendingEnrollment) {
                                return (
                                    <div style={{
                                        position: 'absolute',
                                        top: '8px',
                                        right: '8px',
                                        backgroundColor: '#eab308', // Yellow-500
                                        color: 'white',
                                        padding: '4px 10px',
                                        borderRadius: '20px',
                                        fontSize: '11px',
                                        fontWeight: '600',
                                        zIndex: 10,
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                    }}>
                                        Pending
                                    </div>
                                );
                            }

                            return null;
                        })()
                    )}
                </div>

                <div className="employee-course-content">
                    <h3 className="employee-course-title">
                        {course.title}
                    </h3>

                    <div className="employee-course-meta">
                        {/* ... meta items ... */}
                        <div className="meta-item">
                            <span className="course-duration">
                                Duration: {course.duration}
                            </span>
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

                    {activeTab !== 'assigned' && (
                        <div className="course-rating-section">
                            <div className="stars-container">
                                {renderStars(course.rating || 0)}
                            </div>
                            <span className="rating-value">({course.rating ? course.rating.toFixed(1) : '0'})</span>
                        </div>
                    )}
                </div>
            </div>
        );
    };


    const getInitials = () => {
        if (firstName && lastName) {
            return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
        }
        if (firstName) {
            return firstName.substring(0, 2).toUpperCase();
        }
        return (username || 'U').substring(0, 2).toUpperCase();
    };

    const displayedCourses = activeTab === 'assigned'
        ? assignedCourses.filter(c => c.enrollmentType !== 'SELF_ENROLLMENT')
        : allCourses;

    const filteredCourses = displayedCourses.filter(course =>
        course.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="employee-dashboard-wrapper">

            {/* Navbar */}
            <nav className="employee-navbar">
                <div className="employee-logo">
                    <img
                        src={logo}
                        alt="Oryfolks"
                        style={{ height: '40px', cursor: 'pointer' }}
                        onClick={() => navigate('/employee/dashboard')}
                    />
                </div>

                <div className="employee-search-container">
                    <div className="employee-search-wrapper">
                        <Search className="employee-search-icon" size={18} />
                        <input
                            type="text"
                            placeholder="Search your courses..."
                            className="employee-search-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div
                    className="employee-nav-actions"
                    onMouseLeave={() => setIsProfileMenuOpen(false)}
                >
                    {/* Navigation Label */}
                    <span
                        className="employee-nav-label"
                        style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#1e293b',
                            marginRight: '0.5rem',
                            cursor: 'pointer'
                        }}
                        onClick={() => navigate('/employee/my-learning')}
                    >
                        My Learning
                    </span>

                    <button
                        className="employee-profile-button"
                        onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    >
                        {getInitials()}
                    </button>

                    <div
                        className={`employee-profile-menu ${isProfileMenuOpen ? 'active' : ''
                            }`}
                    >
                        <button
                            className="employee-profile-menu-item"
                            onClick={() => navigate('/employee/profile')}
                        >
                            Profile
                        </button>

                        <button
                            className="employee-profile-menu-item"
                            onClick={handleLogout}
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="employee-main-content">

                {/* Welcome Banner Section */}
                <div className="employee-welcome-banner">
                    <div className="employee-banner-content">
                        <div className="employee-banner-text">
                            <h1 className="employee-banner-title">
                                Welcome{firstName ? `, ${firstName}` : (loading ? '!' : `, ${username}!`)}
                            </h1>
                            <p className="employee-banner-subtitle">
                                Continue your learning journey and level up your skills today.
                            </p>
                        </div>
                        <button
                            className="employee-banner-btn"
                            onClick={() => {
                                setActiveTab('all');
                                setSearchTerm('');
                            }}
                        >
                            Explore Courses
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="employee-tabs">
                    <button
                        className={`employee-tab-button ${activeTab === 'all' ? 'active' : ''}`}
                        onClick={() => setActiveTab('all')}
                    >
                        All Courses
                    </button>
                    <button
                        className={`employee-tab-button ${activeTab === 'assigned' ? 'active' : ''}`}
                        onClick={() => setActiveTab('assigned')}
                    >
                        Assigned Courses
                    </button>
                </div>

                {/* Courses Section */
                    activeTab === 'assigned' ? (
                        <div className="employee-courses-card-wrapper" style={{ background: 'transparent', border: 'none', boxShadow: 'none', padding: 0 }}>
                            <div className="employee-courses-container">
                                {filteredCourses.length > 0 ? (
                                    filteredCourses.map((course) => (
                                        <CourseCard
                                            key={course.id}
                                            course={course}
                                        />
                                    ))
                                ) : (
                                    <div style={{ padding: '40px', textAlign: 'center', color: '#cbd5e1' }}>
                                        No courses found matching your search.
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="employee-courses-card-wrapper" style={{ background: 'transparent', border: 'none', boxShadow: 'none', padding: 0 }}>

                            {/* 1. Assigned Courses Row */}
                            {/* Helper to split array into chunks */}
                            {(() => {
                                const chunkArray = (arr, size) => {
                                    const chunks = [];
                                    for (let i = 0; i < arr.length; i += size) {
                                        chunks.push(arr.slice(i, i + size));
                                    }
                                    return chunks;
                                };

                                // 1. Assigned Courses Row
                                const managerAssigned = assignedCourses.filter(c =>
                                    c.enrollmentType !== 'SELF_ENROLLMENT' &&
                                    (c.title?.toLowerCase().includes(searchTerm.toLowerCase()) || c.category?.toLowerCase().includes(searchTerm.toLowerCase()))
                                );

                                // 2. Enrolled & Pending Row
                                const selfEnrolled = assignedCourses.filter(c => c.enrollmentType === 'SELF_ENROLLMENT');
                                const pendingIds = enrollmentHistory.filter(e => e.status === 'PENDING').map(e => e.courseId);
                                const pendingCourses = allCourses.filter(c => pendingIds.includes(c.id));
                                const enrolledAndPending = [...selfEnrolled, ...pendingCourses];
                                const filteredEnrolledAndPending = enrolledAndPending.filter(c =>
                                    c.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    c.category?.toLowerCase().includes(searchTerm.toLowerCase())
                                );

                                // 3. Explore Row
                                const assignedIds = assignedCourses.map(c => c.id);
                                const pendingIdsAll = enrollmentHistory.filter(e => e.status === 'PENDING').map(e => e.courseId);
                                const excludeIds = [...assignedIds, ...pendingIdsAll];
                                const exploreCourses = allCourses.filter(c => !excludeIds.includes(c.id));
                                const filteredExplore = exploreCourses.filter(course =>
                                    course.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    course.category?.toLowerCase().includes(searchTerm.toLowerCase())
                                );

                                return (
                                    <>
                                        {/* Render Assigned Section */}
                                        {managerAssigned.length > 0 && (
                                            <div className="employee-horizontal-section">
                                                <h2 className="employee-section-title" style={{ color: '#1e293b' }}>Assigned to You</h2>
                                                {chunkArray(managerAssigned, 8).map((chunk, idx) => (
                                                    <div key={`assigned-row-${idx}`} className="employee-horizontal-scroll" style={{ marginBottom: idx < chunkArray(managerAssigned, 8).length - 1 ? '1.5rem' : 0 }}>
                                                        {chunk.map(course => (
                                                            <CourseCard key={course.id} course={course} />
                                                        ))}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Render Enrolled Section */}
                                        {filteredEnrolledAndPending.length > 0 && (
                                            <div className="employee-horizontal-section">
                                                <h2 className="employee-section-title" style={{ color: '#1e293b' }}>Your Enrollments & Requests</h2>
                                                {chunkArray(filteredEnrolledAndPending, 8).map((chunk, idx) => (
                                                    <div key={`enrolled-row-${idx}`} className="employee-horizontal-scroll" style={{ marginBottom: idx < chunkArray(filteredEnrolledAndPending, 8).length - 1 ? '1.5rem' : 0 }}>
                                                        {chunk.map(course => (
                                                            <CourseCard key={course.id} course={course} />
                                                        ))}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Render Explore Section */}
                                        <div className="employee-horizontal-section">
                                            <h2 className="employee-section-title" style={{ color: '#1e293b' }}>Explore More Courses</h2>
                                            {filteredExplore.length > 0 ? (
                                                chunkArray(filteredExplore, 8).map((chunk, idx) => (
                                                    <div key={`explore-row-${idx}`} className="employee-horizontal-scroll" style={{ marginBottom: idx < chunkArray(filteredExplore, 8).length - 1 ? '1.5rem' : 0 }}>
                                                        {chunk.map(course => (
                                                            <CourseCard key={course.id} course={course} />
                                                        ))}
                                                    </div>
                                                ))
                                            ) : (
                                                <div style={{ color: '#64748b', padding: '1rem' }}>No other courses available.</div>
                                            )}
                                        </div>
                                    </>
                                );
                            })()}

                        </div>
                    )}
            </div>

            {/* Premium Footer Section */}
            <footer className="employee-footer">
                <div className="employee-footer-content">
                    <div className="footer-brand-section">
                        <div className="footer-logo">
                            <img src={logo} alt="Oryfolks" />
                        </div>

                        <p className="footer-tagline">
                            Empowering your growth through continuous learning. Join thousands of professionals mastering new skills every day.
                        </p>
                    </div>

                    <div className="footer-links-grid">
                        <div className="footer-links-column">
                            <h3>Learning Resources</h3>
                            <button className="footer-link-btn">Help Center</button>
                            <button className="footer-link-btn">Contact Support</button>
                        </div>
                        <div className="footer-links-column">
                            <h3>Company</h3>
                            <button className="footer-link-btn">About Us</button>
                            <button className="footer-link-btn">Terms of Service</button>
                        </div>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>© 2026 Oryfolks LMS. Inspired by the world's best learning platforms.</p>
                </div>
            </footer>

            {/* Enrollment Modal */}
            <EnrollmentModal />
        </div>
    );
};

export default EmployeeDashboard;
