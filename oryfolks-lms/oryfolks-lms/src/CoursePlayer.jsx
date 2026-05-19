import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Confetti from 'react-confetti';
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
    const [showRatingPopup, setShowRatingPopup] = useState(false);

    const [rating, setRating] = useState(0);

    const [review, setReview] = useState('');

    // Celebration animation state
    const [showCelebration, setShowCelebration] = useState(false);
    // Success message card state
    const [showSuccessCard, setShowSuccessCard] = useState(false);
    // Smooth fade-out animation
    const [fadeOut, setFadeOut] = useState(false);

    // Store course reviews
    const [reviews, setReviews] = useState([]);

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

    // Fetch reviews after course loads
    useEffect(() => {

        // Only fetch if course exists
        if (course?.id) {

            fetchReviews();
        }

    }, [course]);

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

    const handleSubmitFeedback = async () => {

        // Rating mandatory validation
        if (!rating) {

            alert("Please select rating");

            return;
        }

        try {

            const decodedToken = JSON.parse(
                atob(token.split('.')[1])
            );

            console.log(decodedToken);

            // Get user id from token
            const userId =
                decodedToken.userId ||
                decodedToken.id ||
                decodedToken.employeeId;

            const response = await axios.post(

                `http://localhost:8080/employee/course-feedback/submit/${userId}`,

                {
                    courseId: course.id,
                    rating: parseFloat(rating),
                    review: review
                },

                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            // Refresh latest reviews instantly
            await fetchReviews();

            // Close feedback popup immediately
            setShowRatingPopup(false);

            // Start celebration effect
            setShowCelebration(true);

            // Show premium success card
            setShowSuccessCard(true);

            // Hide celebration after 4 sec
            setTimeout(() => {

                // Start fade-out animation
                setFadeOut(true);

            }, 2500);


            // Remove completely after fade animation
            setTimeout(() => {

                setShowCelebration(false);

                setShowSuccessCard(false);

                setFadeOut(false);

            }, 4000);

        } catch (error) {

            console.error(error);

            if (error.response?.data) {

                // Handle backend object response
                if (typeof error.response.data === 'object') {

                    setFeedbackMessage(
                        error.response.data.error ||
                        "Something went wrong"
                    );

                } else {

                    setFeedbackMessage(error.response.data);
                }

            } else {

                setFeedbackMessage(
                    "Failed to submit feedback"
                );
            }
        }
    };

    // Fetch all reviews of course
    const fetchReviews = async () => {

        // Stop execution if course is null
        // or course id is not available yet
        if (!course?.id) {

            return;
        }

        try {

            const response = await axios.get(

                `http://localhost:8080/employee/course-feedback/reviews/${course.id}`,

                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            // Store reviews in state
            setReviews(response.data);

        } catch (error) {

            console.error(
                "Failed to fetch reviews",
                error
            );
        }
    };

    const handleVideoEnded = async () => {

        // Complete final content automatically
        if (course.contents && course.contents.length > 0) {

            const lastItem =
                course.contents[course.contents.length - 1];

            // Mark last content completed
            if (!lastItem.completed) {

                markContentCompleted(lastItem.id);
            }
        }

        // Update overall course progress to 100%
        updateProgress(
            100,
            videoRef.current
                ? videoRef.current.duration
                : 0
        );

        try {

            // Decode JWT token
            const decodedToken = JSON.parse(
                atob(token.split('.')[1])
            );

            // Extract logged-in employee id
            const userId = decodedToken.userId;

            // API call:
            // check whether employee
            // already submitted rating
            const response = await axios.get(

                `http://localhost:8080/employee/course-feedback/has-rated/${course.id}/${userId}`,

                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const alreadyRated = response.data;

            // Open popup only if
            // employee did not rate earlier
            if (!alreadyRated) {

                setShowRatingPopup(true);
            }

        } catch (error) {

            console.error(
                "Failed to check rating status",
                error
            );
        }
    };

    const location = useLocation();
    const backPath = location.state?.from || '/employee';

    if (loading) return <div style={{ color: 'white', padding: '20px' }}>Loading course...</div>;
    if (!course) return <div style={{ color: 'white', padding: '20px' }}>Course not found.</div>;

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
                                {['Overview', 'Q&A', 'NOTES', 'watchlist', 'reviews'].map(tab => (
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
                                {/* Q&A */}

                                {activeTab === 'q&a' && (

                                    <div style={{ padding: '20px' }}>

                                        <p>Q&A section coming soon.</p>

                                    </div>
                                )}



                                {/* Notes */}

                                {activeTab === 'notes' && (

                                    <div style={{ padding: '20px' }}>

                                        <p>Notes section coming soon.</p>

                                    </div>
                                )}



                                {/* Watchlist */}

                                {activeTab === 'watchlist' && (

                                    <div style={{ padding: '20px' }}>

                                        <p>Watchlist section coming soon.</p>

                                    </div>
                                )}



                                {/* Reviews */}

                                {activeTab === 'reviews' && (

                                    <div className="reviews-container">

                                        <h3
                                            style={{
                                                marginBottom: '24px',
                                                fontSize: '22px',
                                                fontWeight: '700'
                                            }}
                                        >
                                            Student Feedback
                                        </h3>

                                        {reviews.length > 0 ? (

                                            reviews.map((review, index) => {

                                                /// Generate initials from username
                                                const initials = review.username
                                                    ? review.username
                                                        .split('.')
                                                        .map(name => name.charAt(0).toUpperCase())
                                                        .join('')
                                                    : '';

                                                return (

                                                    <div
                                                        key={index}
                                                        style={{
                                                            display: 'flex',

                                                            gap: '20px',

                                                            marginBottom: '32px',

                                                            paddingBottom: '24px',

                                                            borderBottom: '1px solid #E5E7EB',

                                                            // Better layout alignment
                                                            alignItems: 'flex-start',

                                                            // Prevent too much stretching
                                                            maxWidth: '900px'
                                                        }}
                                                    >

                                                        {/* Profile Circle */}

                                                        <div
                                                            style={{
                                                                width: '56px',
                                                                height: '56px',
                                                                borderRadius: '50%',
                                                                background: '#111827',
                                                                color: '#fff',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                fontWeight: '700',
                                                                fontSize: '18px',
                                                                flexShrink: 0
                                                            }}
                                                        >
                                                            {initials}
                                                        </div>

                                                        {/* Review Content */}

                                                        <div
                                                            style={{
                                                                flex: 1
                                                            }}
                                                        >

                                                            {/* Username */}

                                                            <h4
                                                                style={{
                                                                    marginBottom: '8px',
                                                                    fontSize: '18px',
                                                                    fontWeight: '700',
                                                                    color: '#111827'
                                                                }}
                                                            >
                                                                {review.username}
                                                            </h4>

                                                            {/* Rating + Date */}

                                                            <div
                                                                style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '12px',
                                                                    marginBottom: '12px'
                                                                }}
                                                            >

                                                                {/* Stars */}

                                                                <div
                                                                    style={{
                                                                        color: '#F59E0B',
                                                                        fontSize: '18px'
                                                                    }}
                                                                >
                                                                    {"★".repeat(Math.floor(review.rating))}
                                                                    {"☆".repeat(
                                                                        5 - Math.floor(review.rating)
                                                                    )}
                                                                </div>

                                                                {/* Date */}

                                                                <span
                                                                    style={{
                                                                        color: '#6B7280',
                                                                        fontSize: '14px'
                                                                    }}
                                                                >
                                                                    {
                                                                        new Date(
                                                                            review.createdDate
                                                                        ).toLocaleDateString()
                                                                    }
                                                                </span>
                                                            </div>

                                                            {/* Review */}

                                                            <p
                                                                style={{
                                                                    color: '#374151',

                                                                    lineHeight: '1.8',

                                                                    fontSize: '18px',

                                                                    marginTop: '8px',

                                                                    // Prevent overflow
                                                                    wordBreak: 'break-word',

                                                                    overflowWrap: 'break-word',

                                                                    whiteSpace: 'normal',

                                                                    // Better readability
                                                                    maxWidth: '750px'
                                                                }}
                                                            >
                                                                {
                                                                    review.review ||
                                                                    "No review comment"
                                                                }
                                                            </p>
                                                        </div>
                                                    </div>
                                                );
                                            })

                                        ) : (

                                            <p>No reviews available</p>
                                        )}
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
            {/* Rating Popup */}

            {
                showRatingPopup && (

                    <>

                        <div
                            style={{
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                background: 'rgba(0,0,0,0.5)',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                zIndex: 9999
                            }}
                        >

                            <div
                                style={{
                                    background: 'white',
                                    padding: '30px',
                                    borderRadius: '12px',
                                    width: '400px',
                                    maxWidth: '90%'
                                }}
                            >

                                <h2
                                    style={{
                                        marginBottom: '10px',
                                        color: '#111827'
                                    }}
                                >
                                    🎉 Course Completed!
                                </h2>

                                <p
                                    style={{
                                        color: '#6B7280',
                                        marginBottom: '20px'
                                    }}
                                >
                                    Please rate this course
                                </p>

                                {/* Rating */}

                                <label
                                    style={{
                                        fontWeight: '600',
                                        display: 'block',
                                        marginBottom: '8px'
                                    }}
                                >
                                    Rating *
                                </label>

                                <div
                                    style={{
                                        display: 'flex',
                                        gap: '8px',
                                        alignItems: 'center',
                                        marginTop: '12px'
                                    }}
                                >

                                    {
                                        [1, 2, 3, 4, 5].map((star) => (

                                            <div
                                                key={star}
                                                style={{
                                                    position: 'relative',
                                                    fontSize: '38px',
                                                    cursor: 'pointer',
                                                    color: '#D1D5DB'
                                                }}
                                            >

                                                {/* Left Half Star */}

                                                <span
                                                    onClick={() =>
                                                        setRating(star - 0.5)
                                                    }
                                                    style={{
                                                        position: 'absolute',
                                                        width: '50%',
                                                        overflow: 'hidden',
                                                        left: 0,
                                                        top: 0,
                                                        color:
                                                            rating >= star - 0.5
                                                                ? '#F59E0B'
                                                                : '#D1D5DB'
                                                    }}
                                                >
                                                    ★
                                                </span>

                                                {/* Full Star */}

                                                <span
                                                    onClick={() =>
                                                        setRating(star)
                                                    }
                                                    style={{
                                                        color:
                                                            rating >= star
                                                                ? '#F59E0B'
                                                                : '#D1D5DB'
                                                    }}
                                                >
                                                    ★
                                                </span>
                                            </div>
                                        ))
                                    }

                                    {/* Display selected value */}

                                    <span
                                        style={{
                                            marginLeft: '12px',
                                            fontSize: '18px',
                                            fontWeight: '600',
                                            color: '#111827'
                                        }}
                                    >
                                        {rating || 0}
                                    </span>
                                </div>

                                {/* Review */}

                                <label
                                    style={{
                                        fontWeight: '600',
                                        display: 'block',
                                        marginBottom: '8px'
                                    }}
                                >
                                    Review (Optional)
                                </label>

                                <textarea
                                    value={review}
                                    onChange={(e) =>
                                        setReview(e.target.value)
                                    }
                                    rows="4"
                                    placeholder="Write your review..."
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        border: '1px solid #D1D5DB',
                                        marginBottom: '20px',
                                        resize: 'vertical'
                                    }}
                                />

                                {/* Buttons */}

                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'flex-end',
                                        gap: '10px'
                                    }}
                                >

                                    <button
                                        onClick={() =>
                                            setShowRatingPopup(false)
                                        }
                                        style={{
                                            padding: '10px 16px',
                                            borderRadius: '8px',
                                            border: '1px solid #D1D5DB',
                                            background: 'white',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Skip
                                    </button>

                                    <button
                                        onClick={handleSubmitFeedback}
                                        style={{
                                            padding: '10px 16px',
                                            borderRadius: '8px',
                                            border: 'none',
                                            background: '#6366F1',
                                            color: 'white',
                                            cursor: 'pointer',
                                            fontWeight: '600'
                                        }}
                                    >
                                        Submit
                                    </button>

                                </div>

                            </div>

                        </div>
                    </>
                )
            }

            {/* Premium Success Celebration */}

            {
                showSuccessCard && (

                    <>

                        {/* Confetti */}

                        <Confetti

                            width={window.innerWidth}

                            height={window.innerHeight}

                            numberOfPieces={350}

                            recycle={false}

                            gravity={0.25}
                        />

                        {/* Success Card */}

                        <div
                            style={{
                                position: 'fixed',
                                top: '50%',
                                left: '50%',
                                opacity: fadeOut ? 0 : 1,

                                transform: fadeOut
                                    ? 'translate(-50%, -50%) scale(0.92)'
                                    : 'translate(-50%, -50%) scale(1)',

                                transition:
                                    'opacity 1.5s ease, transform 1.5s ease',

                                background: 'white',
                                padding: '40px',
                                borderRadius: '20px',
                                boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
                                zIndex: 10000,
                                textAlign: 'center',
                                minWidth: '350px'
                            }}
                        >

                            {/* Celebration Emoji */}

                            <div
                                style={{
                                    fontSize: '70px',
                                    marginBottom: '20px'
                                }}
                            >
                                🎉
                            </div>

                            {/* Success Title */}

                            <h2
                                style={{
                                    color: '#111827',
                                    marginBottom: '12px',
                                    fontSize: '28px'
                                }}
                            >
                                Feedback Submitted!
                            </h2>

                            {/* Subtitle */}

                            <p
                                style={{
                                    color: '#6B7280',
                                    fontSize: '16px',
                                    lineHeight: '1.6'
                                }}
                            >
                                Course feedback submitted successfully.
                                <br />
                                Thank you for sharing your experience.
                            </p>
                        </div>
                    </>
                )
            }
        </div>
    );
};

export default CoursePlayer;
