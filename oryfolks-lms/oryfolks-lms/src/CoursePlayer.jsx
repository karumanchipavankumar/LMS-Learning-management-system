import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import axios from 'axios'; // Import axios
import './CoursePlayer.css';
import logo from './assets/logo.png';

const CoursePlayer = () => {
    const navigate = useNavigate();
    const { courseId } = useParams();
    const [activeTab, setActiveTab] = useState('overview');
    const [expandedSections, setExpandedSections] = useState({ 1: true });
    // const [progress, setProgress] = useState(65); // derived from course if needed
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [showProgressPopup, setShowProgressPopup] = useState(false);

    const markingCompletedRef = useRef(new Set());
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const videoRef = useRef(null);
    const [resumeTimeSet, setResumeTimeSet] = useState(false);

    // Strict Tracking Refs
    const furthestWatchedTime = useRef(0);
    const lastTimeRef = useRef(0);

    const token = localStorage.getItem('token');

    useEffect(() => {
        const fetchCourse = async () => {
            try {
                const response = await axios.get(`http://localhost:8080/employee/courses/${courseId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setCourse(response.data);
            } catch (error) {
                console.error("Error fetching course:", error);
            } finally {
                setLoading(false);
            }
        };

        if (token && courseId) {
            fetchCourse();
        }
    }, [courseId, token]);

    // Resume video logic
    useEffect(() => {
        if (course && videoRef.current && !resumeTimeSet) {
            const initialTime = course.lastWatchedTimestamp || 0;
            videoRef.current.currentTime = initialTime;
            setResumeTimeSet(true);

            // Determine maximum permitted scrub point based on completed modules
            let startOfUncompleted = 0;
            if (course.contents && course.contents.length > 0) {
                let foundUncompleted = false;
                for (let i = 0; i < course.contents.length; i++) {
                    if (!course.contents[i].completed) {
                        startOfUncompleted = course.contents[i].timestamp;
                        foundUncompleted = true;
                        break;
                    }
                }
                // If all completed, allow full access
                if (!foundUncompleted) {
                    startOfUncompleted = videoRef.current.duration || 999999;
                }
            }

            furthestWatchedTime.current = Math.max(initialTime, startOfUncompleted);
            lastTimeRef.current = initialTime;
        }
    }, [course, resumeTimeSet]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/');
    };

    const toggleProfileMenu = (e) => {
        e.stopPropagation();
        setIsProfileMenuOpen(!isProfileMenuOpen);
    };

    // Close profile menu when clicking outside
    React.useEffect(() => {
        const handleClickOutside = () => {
            if (isProfileMenuOpen) {
                setIsProfileMenuOpen(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [isProfileMenuOpen]);

    const toggleSection = (id) => {
        setExpandedSections(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const updateProgress = async (newProgress, currentTime) => {
        // LOCK PROGRESS: If course is already 100% completed, DO NOT update or downgrade it.
        if (course.progress === 100) {
            return;
        }

        try {
            await axios.post(`http://localhost:8080/employee/courses/${courseId}/progress`, null, {
                params: {
                    progress: newProgress,
                    lastWatchedTimestamp: currentTime
                },
                headers: { Authorization: `Bearer ${token}` }
            });
            // Update local state immediately for instant feedback
            setCourse(prev => ({
                ...prev,
                progress: newProgress,
                lastWatchedTimestamp: currentTime
            }));
        } catch (error) {
            console.error("Error updating progress:", error);
        }
    };

    const seekContent = (content) => {
        if (videoRef.current) {
            videoRef.current.currentTime = content.timestamp;
            videoRef.current.play();
        }
    };

    const markContentCompleted = async (contentId) => {
        if (!contentId || markingCompletedRef.current.has(contentId)) {
            return;
        }

        markingCompletedRef.current.add(contentId);

        try {
            await axios.post(`http://localhost:8080/employee/courses/content/${contentId}/complete`, null, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Update local state
            setCourse(prev => ({
                ...prev,
                contents: prev.contents.map(c =>
                    c.id === contentId ? { ...c, completed: true } : c
                )
            }));
        } catch (error) {
            console.error("Error marking content as completed:", error);
            // Optionally remove from ref to allow retry, but usually if it fails once it will fail again
            markingCompletedRef.current.delete(contentId);
        }
    };

    const handleTimeUpdate = (e) => {
        const video = e.target;
        if (video.duration) {
            let currentProgress = Math.round((video.currentTime / video.duration) * 100);

            // TRACKING FURTHEST CONTIGUOUS TIME
            if (video.currentTime <= furthestWatchedTime.current + 1.5) {
                furthestWatchedTime.current = Math.max(furthestWatchedTime.current, video.currentTime);
            }
            lastTimeRef.current = video.currentTime;

            // Strict Capping: Preclude 100% course progress if they scrubbed to the end
            if (currentProgress >= 100) {
                if (furthestWatchedTime.current < video.duration - 1.0) {
                    currentProgress = 99;
                }
            }

            // Existing progress update logic
            const now = Date.now();
            if (!video.lastUpdate || now - video.lastUpdate > 5000 || currentProgress === 100) {
                video.lastUpdate = now;
                updateProgress(currentProgress, video.currentTime);
            }

            // Segment completion logic
            if (course.contents && course.contents.length > 0) {
                course.contents.forEach((item, index) => {
                    if (item.completed) return;

                    const nextItem = course.contents[index + 1];
                    const endTime = nextItem ? nextItem.timestamp : video.duration;

                    // STRICT REQUIREMENTS:
                    // 1. Preceding modules must be completed locally OR this is the 1st module.
                    const isEligible = index === 0 || course.contents[index - 1].completed;

                    // 2. The user has naturally watched up to the end of THIS module without jumping forward.
                    const hasWatchedToEnd = furthestWatchedTime.current >= (endTime - 0.5);

                    if (isEligible && hasWatchedToEnd) {
                        markContentCompleted(item.id);
                    }
                });
            }
        }
    };

    const handleVideoEnded = () => {
        let isFullyCompleted = true;

        if (course.contents && course.contents.length > 0) {
            const lastItem = course.contents[course.contents.length - 1];
            const isEligible = course.contents.length === 1 || course.contents[course.contents.length - 2].completed;
            const hasWatchedToEnd = furthestWatchedTime.current >= (videoRef.current ? videoRef.current.duration - 1.0 : 0);

            if (!lastItem.completed) {
                if (isEligible && hasWatchedToEnd) {
                    markContentCompleted(lastItem.id);
                } else {
                    isFullyCompleted = false; // Failed strict tracking
                }
            } else {
                // If the last module is legitimately already completed, the user already finished the course previously.
            }
        } else {
            if (furthestWatchedTime.current < (videoRef.current ? videoRef.current.duration - 1.0 : 0)) {
                isFullyCompleted = false;
            }
        }

        if (isFullyCompleted) {
            updateProgress(100, videoRef.current ? videoRef.current.duration : 0);
        } else {
            updateProgress(99, videoRef.current ? videoRef.current.currentTime : 0);
        }
    };

    if (loading) return <div style={{ color: 'white', padding: '20px' }}>Loading course...</div>;
    if (!course) return <div style={{ color: 'white', padding: '20px' }}>Course not found.</div>;

    const location = useLocation();
    const backPath = location.state?.from || '/employee';

    return (
        <div className="course-player-container" onClick={() => setShowProgressPopup(false)}>
            {/* Header */}
            <header className="cp-header">
                <div className="cp-header-left" style={{ display: 'flex', alignItems: 'center', margin: 0, gap: '12px' }}>
                    <div
                        onClick={() => navigate(backPath)}
                        style={{
                            position: 'static',
                            transform: 'none',
                            flexShrink: 0,
                            color: '#1F2937',
                            cursor: 'pointer',
                            padding: '8px',
                            borderRadius: '50%',
                            transition: 'background 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        title="Go Back"
                    >
                        <svg fill="currentColor" viewBox="0 0 24 24" width="24" height="24">
                            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                        </svg>
                    </div>
                    <h1 className="cp-course-title" style={{ margin: '0 0 0 12px', fontSize: '20px', lineHeight: '24px' }}>{course.title}</h1>
                </div>
                <div className="cp-header-right">
                    <div style={{ position: 'relative' }}>
                        <button
                            className={`cp-progress-btn ${course.progress === 100 ? 'completed' : ''}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowProgressPopup(!showProgressPopup);
                            }}
                        >
                            <span>{course.progress === 100 ? 'Completed' : 'Progress'}</span>
                        </button>

                        {/* Progress Popup */}
                        {showProgressPopup && (
                            <div className="cp-progress-popup" onClick={(e) => e.stopPropagation()}>
                                <div className="cp-popup-arrow"></div>
                                <div className="cp-popup-content">
                                    <span className="cp-popup-percent">{course.progress || 0}%</span>
                                    <span className="cp-popup-label">Course Completed</span>
                                    <div className="cp-popup-bar-container">
                                        <div
                                            className="cp-popup-bar-fill"
                                            style={{ width: `${course.progress || 0}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="cp-profile-container">
                        <div
                            className="cp-profile-circle"
                            onClick={toggleProfileMenu}
                        >
                            P
                        </div>
                        {isProfileMenuOpen && (
                            <div className="cp-profile-dropdown" onClick={(e) => e.stopPropagation()}>
                                <div
                                    className="cp-dropdown-item"
                                    onClick={() => {
                                        navigate('/employee/profile');
                                        setIsProfileMenuOpen(false);
                                    }}
                                >
                                    <svg className="cp-dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="12" cy="7" r="4"></circle>
                                    </svg>
                                    <span>My Profile</span>
                                </div>
                                <div
                                    className="cp-dropdown-item"
                                    onClick={() => {
                                        handleLogout();
                                        setIsProfileMenuOpen(false);
                                    }}
                                >
                                    <svg className="cp-dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                        <polyline points="16 17 21 12 16 7"></polyline>
                                        <line x1="21" y1="12" x2="9" y2="12"></line>
                                    </svg>
                                    <span>Logout</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="cp-main-grid">
                {/* Left Column - Video and Content */}
                <div className="cp-left-col">
                    {/* Video Container - Fixed at top */}
                    <div className="cp-video-container">
                        {course.videoUrl ? (
                            <video
                                ref={videoRef}
                                src={course.videoUrl}
                                controls
                                controlsList="nodownload"
                                onContextMenu={(e) => e.preventDefault()}
                                autoPlay
                                onTimeUpdate={handleTimeUpdate}
                                onEnded={handleVideoEnded}
                                className="cp-video-player"
                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            >
                                Your browser does not support the video tag.
                            </video>
                        ) : (
                            <div className="cp-placeholder-video">
                                <h2 style={{ marginTop: '16px' }}>No video available</h2>
                            </div>
                        )}
                    </div>

                    {/* Scrollable Content Section */}
                    <div className="cp-content-section">
                        <div className="cp-content-scrollable">
                            {/* Tabs */}
                            <div className="cp-tabs-bar">
                                {['Overview', 'Q&A', 'NOTES', 'watchlist'].map(tab => (
                                    <button
                                        key={tab}
                                        className={`cp-tab ${activeTab === tab.toLowerCase() ? 'active' : ''}`}
                                        onClick={() => setActiveTab(tab.toLowerCase())}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>

                            {/* Tab Content */}
                            <div className="cp-tab-content">
                                {activeTab === 'overview' && (
                                    <div className="overview-content">
                                        <h3 style={{ fontSize: '16px', marginBottom: '8px', color: '#1F2937' }}>Description</h3>
                                        <p style={{ color: '#4B5563', lineHeight: '1.5', marginBottom: '16px' }}>
                                            {course.description || "No description available."}
                                        </p>
                                    </div>
                                )}
                                {activeTab !== 'overview' && (
                                    <div style={{ padding: '20px', color: '#6B7280' }}>
                                        <p>Content for {activeTab} will be displayed here.</p>
                                        <div style={{ height: '600px' }}></div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Sidebar */}
                <aside className="cp-sidebar">
                    <div className="cp-sidebar-header">Course Content</div>
                    <div className="cp-sidebar-content">
                        {course.contents && course.contents.length > 0 ? (
                            <div className="cp-lesson-list">
                                {course.contents.map((item, index) => (
                                    <div
                                        key={index}
                                        className={`cp-lesson-item ${item.completed ? 'completed' : ''}`}
                                        onClick={() => seekContent(item)}
                                        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                                    >
                                        <div className="cp-checkbox" style={{ marginRight: '12px', flexShrink: 0 }}>
                                            {item.completed && (
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" style={{ width: '12px', height: '12px', color: 'white' }}>
                                                    <polyline points="20 6 9 17 4 12"></polyline>
                                                </svg>
                                            )}
                                        </div>
                                        <div className="cp-lesson-info">
                                            <div className="cp-lesson-title">
                                                {item.title}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ padding: '20px', color: '#94a3b8', textAlign: 'center' }}>
                                <p>No course contents available.</p>
                            </div>
                        )}
                    </div>
                </aside>
            </main>
        </div>
    );
};

export default CoursePlayer;
