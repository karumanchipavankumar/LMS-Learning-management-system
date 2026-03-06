import React, { createContext, useState, useEffect, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, NavLink, useNavigate, useParams } from 'react-router-dom';
import { LayoutDashboard, Users, BookOpen, FileText, Settings, UserCircle, Bell, Activity, Clock, ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import './index.css';

// --- Data Context ---

const DataContext = createContext();

export const useData = () => useContext(DataContext);

const DataProvider = ({ children }) => {
    // Initial dummy data for team members
    const [teamMembers, setTeamMembers] = useState([
        {
            id: 1,
            name: 'Pavan Kumar',
            email: 'pavan@example.com',
            assignedCourses: [
                { id: 101, title: 'React Fundamentals', progress: 100, deadline: '2023-12-01' },
                { id: 102, title: 'Advanced State', progress: 40, deadline: '2026-02-10' }
            ]
        },
        {
            id: 2,
            name: 'Lobesh Madiri',
            email: 'lobesh@example.com',
            assignedCourses: [
                { id: 201, title: 'Node.js Basics', progress: 0, deadline: '2026-03-20' },
                { id: 202, title: 'Express.js', progress: 10, deadline: '2026-04-01' }
            ]
        },
        {
            id: 3,
            name: 'Rahul Ravula',
            email: 'rahul@example.com',
            assignedCourses: [
                { id: 301, title: 'UI Design', progress: 85, deadline: '2026-02-28' }
            ]
        },
        {
            id: 4,
            name: 'Dinesh Reddy',
            email: 'dinesh@example.com',
            assignedCourses: []
        },
        {
            id: 5,
            name: 'Uday Kiran',
            email: 'uday@example.com',
            assignedCourses: [
                { id: 501, title: 'Full Stack', progress: 0, deadline: '2026-05-01' }
            ]
        },
        {
            id: 6,
            name: 'Rahul Vinay',
            email: 'rahul.v@example.com',
            assignedCourses: [
                { id: 601, title: 'Testing', progress: 60, deadline: '2026-03-10' }
            ]
        },
        {
            id: 7,
            name: 'Lakshmi Narayana',
            email: 'lakshmi@example.com',
            assignedCourses: []
        },
        {
            id: 8,
            name: 'Uma Mahesh',
            email: 'uma@example.com',
            assignedCourses: [
                { id: 801, title: 'DevOps', progress: 100, deadline: '2025-12-15' },
                { id: 802, title: 'AWS', progress: 90, deadline: '2026-01-20' }
            ]
        },
    ]);

    // Initial dummy data for available courses
    const [courses] = useState([
        { id: 201, title: 'Advanced React Patterns', duration: '4 Weeks', deadline: '2026-03-01' },
        { id: 202, title: 'Node.js Microservices', duration: '6 Weeks', deadline: '2026-03-15' },
        { id: 203, title: 'UI/UX Design Principles', duration: '3 Weeks', deadline: '2026-02-28' },
        { id: 204, title: 'Docker & Kubernetes', duration: '5 Weeks', deadline: '2026-04-10' },
        { id: 205, title: 'GraphQL API Development', duration: '4 Weeks', deadline: '2026-03-20' },
    ]);

    // Function to assign a course to multiple members
    const assignCourseToMembers = (courseId, selectedMemberIds, customDeadline) => {
        const courseToAssign = courses.find(c => c.id === parseInt(courseId));
        if (!courseToAssign) return;

        setTeamMembers(prevMembers => prevMembers.map(member => {
            if (selectedMemberIds.includes(member.id)) {
                // Check if already assigned
                const alreadyAssigned = member.assignedCourses.some(c => c.id === courseToAssign.id);
                if (alreadyAssigned) return member;

                return {
                    ...member,
                    assignedCourses: [
                        ...member.assignedCourses,
                        {
                            id: courseToAssign.id,
                            title: courseToAssign.title,
                            progress: 0,
                            deadline: customDeadline || courseToAssign.deadline
                        }
                    ]
                };
            }
            return member;
        }));
    };

    return (
        <DataContext.Provider value={{ teamMembers, courses, assignCourseToMembers }}>
            {children}
        </DataContext.Provider>
    );
};

// --- Components ---

const Sidebar = () => {
    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: Users, label: 'My Team', path: '/my-team' },
        { icon: BookOpen, label: 'Assign Courses', path: '/course-management' },
        { icon: FileText, label: 'Reports', path: '/reports' },
        { icon: Settings, label: 'Settings', path: '/settings' },
    ];

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <div className="user-avatar-placeholder">
                    <UserCircle size={24} color="white" />
                </div>
                <span className="sidebar-title">Manager</span>
            </div>

            <nav className="sidebar-nav">
                <ul>
                    {menuItems.map((item, index) => (
                        <li key={index}>
                            <NavLink
                                to={item.path}
                                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                            >
                                <item.icon size={20} />
                                <span>{item.label}</span>
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>
        </div>
    );
};

const Header = () => {
    return (
        <header className="app-header">
            <div>
                <h1 className="header-title">Welcome, Manager!</h1>
            </div>
            <div className="header-actions">
                <button className="icon-btn">
                    <Bell size={24} />
                </button>
                <div className="profile-circle">
                    <UserCircle size={32} color="#4b5563" />
                </div>
            </div>
        </header>
    );
};

const StatsCard = ({ icon: Icon, label, value, colorClass }) => {
    return (
        <div className="stats-card">
            <div className={`stats-icon-wrapper ${colorClass}`}>
                <Icon size={32} />
            </div>
            <div className="stats-content">
                <p>{label}</p>
                <h3>{value}</h3>
            </div>
        </div>
    );
};

const TeamChart = () => {
    const data = [
        { name: 'Completed', value: 180, color: '#22c55e' }, // Green
        { name: 'In Progress', value: 255, color: '#facc15' }, // Yellow
        { name: 'Not Started', value: 65, color: '#f87171' }, // Red
    ];

    const CustomLegend = () => (
        <div className="chart-legend">
            {data.map((entry, index) => (
                <div key={`legend-${index}`} className="legend-item">
                    <div className="legend-info">
                        <div className="legend-dot" style={{ backgroundColor: entry.color }}></div>
                        <span style={{ color: '#4b5563', fontWeight: 500 }}>{entry.name}</span>
                    </div>
                    <span style={{ fontWeight: 700, color: '#1f2937' }}>{entry.value}</span>
                </div>
            ))}
        </div>
    );

    return (
        <div className="card">
            <div className="card-header">
                <h3 className="card-title">Team Overview</h3>
            </div>
            <div className="chart-container-wrapper">
                <div className="chart-area">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={90}
                                paddingAngle={0}
                                dataKey="value"
                                startAngle={90}
                                endAngle={-270}
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <CustomLegend />
            </div>
        </div>
    );
};

const CourseTable = () => {
    const { teamMembers } = useData();

    // Flatten assigned courses from all team members to create a recent approvals list
    const recentCourses = teamMembers.flatMap(member =>
        member.assignedCourses.map(course => ({
            id: course.id,
            courseName: course.title,
            employeeName: member.name,
            progress: course.progress,
            status: course.progress > 0 ? 'Started' : 'Not Started'
        }))
    ).slice(0, 8); // Just take top 8 for display

    const getStatusClass = (status) => {
        if (status === 'Started') return 'started';
        return 'not-started';
    };

    return (
        <div className="card">
            <div className="card-header">
                <h3 className="card-title">Recent Course Approvals</h3>
            </div>
            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>S. No</th>
                            <th>Course Name</th>
                            <th>Employee</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recentCourses.length > 0 ? (
                            recentCourses.map((item, index) => (
                                <tr key={`${item.id}-${index}`}>
                                    <td>{index + 1}</td>
                                    <td style={{ fontWeight: 500 }}>{item.courseName}</td>
                                    <td>{item.employeeName}</td>
                                    <td>
                                        <span className={`status-badge ${getStatusClass(item.status)}`}>
                                            {item.status}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                                    No courses approved yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const Layout = () => {
    return (
        <div className="app-layout">
            <Sidebar />

            <div className="main-content">
                <Header />

                <main className="content-scrollable">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

// --- Pages ---

const DashboardHome = () => {
    return (
        <>
            {/* Stats Row */}
            <div className="stats-grid">
                <StatsCard
                    icon={Users}
                    label="Total Members"
                    value="9"
                    colorClass="bg-blue"
                />
                <StatsCard
                    icon={BookOpen}
                    label="Active Courses"
                    value="10"
                    colorClass="bg-green"
                />
                <StatsCard
                    icon={Activity}
                    label="Avg. Completion Rate"
                    value="5"
                    colorClass="bg-amber"
                />
                <StatsCard
                    icon={Clock}
                    label="Pending Approvals"
                    value="10"
                    colorClass="bg-red"
                />
            </div>

            {/* Content Row */}
            <div className="dashboard-grid">
                {/* Course Table */}
                <div className="grid-main">
                    <CourseTable />
                </div>

                {/* Team Chart */}
                <div className="grid-side">
                    <TeamChart />
                </div>
            </div>
        </>
    );
};

const MyTeam = () => {
    const navigate = useNavigate();
    const { teamMembers } = useData();

    // Helper to calculate average progress
    const calculateProgress = (courses) => {
        if (!courses || courses.length === 0) return 0;
        const totalProgress = courses.reduce((sum, course) => sum + course.progress, 0);
        return Math.round(totalProgress / courses.length);
    };

    // Helper to get progress color based on the dashboard logic
    const getProgressColorClass = (progress) => {
        if (progress === 100) return 'text-green';
        if (progress >= 40) return 'text-amber';
        return 'text-red';
    };

    // Inline style helper for text colors if needed, or mapping to classes
    const getProgressTextColor = (progress) => {
        if (progress === 100) return 'var(--success-color)';
        if (progress >= 40) return 'var(--warning-color)';
        return 'var(--danger-color)';
    }

    // Using stroke colors for SVG circles
    const getStrokeColor = (progress) => {
        if (progress === 100) return '#22c55e';
        if (progress >= 40) return '#facc15';
        return '#f87171';
    }

    return (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="team-grid-header">
                <h2 className="card-title">My Team</h2>
            </div>
            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>S. No</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th style={{ textAlign: 'center' }}>Number of Courses</th>
                            <th style={{ textAlign: 'center' }}>Progress</th>
                        </tr>
                    </thead>
                    <tbody>
                        {teamMembers.map((member, index) => {
                            const progress = calculateProgress(member.assignedCourses);
                            const courseCount = member.assignedCourses.length;
                            const radius = 18;
                            const circumference = 2 * Math.PI * radius;
                            const strokeDashoffset = circumference - (progress / 100) * circumference;

                            return (
                                <tr
                                    key={member.id}
                                    onClick={() => navigate(`/my-team/${member.id}`)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <td>{index + 1}</td>
                                    <td>
                                        <div style={{ fontWeight: 500, color: '#1f2937' }}>
                                            {member.name}
                                        </div>
                                    </td>
                                    <td>{member.email}</td>
                                    <td style={{ textAlign: 'center', fontWeight: 500 }}>{courseCount}</td>
                                    <td style={{ display: 'flex', justifyContent: 'center' }}>
                                        <div className="progress-ring-container">
                                            {/* Background Circle */}
                                            <svg width="48" height="48" style={{ transform: 'rotate(-90deg)' }}>
                                                <circle
                                                    cx="24"
                                                    cy="24"
                                                    r={radius}
                                                    stroke="#e5e7eb"
                                                    strokeWidth="4"
                                                    fill="none"
                                                />
                                                {/* Progress Circle */}
                                                <circle
                                                    cx="24"
                                                    cy="24"
                                                    r={radius}
                                                    stroke={getStrokeColor(progress)}
                                                    strokeWidth="4"
                                                    fill="none"
                                                    strokeDasharray={circumference}
                                                    strokeDashoffset={strokeDashoffset}
                                                    strokeLinecap="round"
                                                    style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                                                />
                                            </svg>
                                            <span className="progress-text" style={{ color: getProgressTextColor(progress) }}>
                                                {progress}%
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const TeamMemberDetails = () => {
    const { memberId } = useParams();
    const navigate = useNavigate();
    const { teamMembers } = useData();

    const memberDetails = teamMembers.find(m => m.id === parseInt(memberId));

    if (!memberDetails) {
        return <div>Member not found</div>;
    }

    const assignedCourses = memberDetails.assignedCourses || [];

    const getCourseStatus = (progress, deadline) => {
        if (progress === 100) return { label: 'Completed', className: 'completed' };

        const today = new Date();
        const deadlineDate = new Date(deadline);

        if (deadlineDate < today && progress < 100) return { label: 'Overdue', className: 'overdue' };

        const timeDiff = deadlineDate - today;
        const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

        if (daysDiff <= 3 && progress < 100) return { label: 'Deadline Near', className: 'near' };

        return { label: 'In Progress', className: 'progress' };
    };

    const handleSendReminder = (course) => {
        const subject = `Reminder: Course Deadline - ${course.title}`;
        const body = `Hi ${memberDetails.name},\n\nThis is a reminder regarding the course "${course.title}".\nDeadline: ${course.deadline}\nCurrent Progress: ${course.progress}%\n\nPlease ensure you complete it on time.\n\nBest regards,\nManager`;

        window.open(`mailto:${memberDetails.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <button
                onClick={() => navigate(-1)}
                className="btn-back"
            >
                <ArrowLeft size={20} />
                Back to Team
            </button>

            <div className="card">
                <div className="card-header" style={{ marginBottom: '0.5rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{memberDetails.name}</h2>
                </div>
                <p style={{ color: '#6b7280' }}>{memberDetails.email}</p>
            </div>

            <div className="card">
                <h3 className="card-title" style={{ marginBottom: '1.5rem' }}>Assigned Courses</h3>

                <div className="courses-grid">
                    {assignedCourses.map((course) => {
                        const status = getCourseStatus(course.progress, course.deadline);

                        return (
                            <div key={course.id} style={{
                                border: '1px solid #e5e7eb',
                                borderRadius: '0.75rem',
                                padding: '1.25rem',
                                backgroundColor: '#f9fafb',
                                display: 'flex',
                                flexDirection: 'column',
                                height: '100%'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                    <span className={`status-badge ${status.className}`}>
                                        {status.label}
                                    </span>
                                </div>

                                <h4 style={{ fontWeight: 600, fontSize: '1.125rem', marginBottom: '0.5rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{course.title}</h4>
                                <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Clock size={16} />
                                    Deadline: {course.deadline}
                                </div>

                                <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                                            <span>Progress</span>
                                            <span>{course.progress}%</span>
                                        </div>
                                        <div style={{ height: '0.5rem', backgroundColor: '#e5e7eb', borderRadius: '9999px', overflow: 'hidden' }}>
                                            <div
                                                style={{
                                                    height: '100%',
                                                    backgroundColor: course.progress === 100 ? '#22c55e' : '#3b82f6',
                                                    width: `${course.progress}%`
                                                }}
                                            ></div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleSendReminder(course)}
                                        className="btn btn-primary"
                                        style={{ width: '100%', justifyContent: 'center' }}
                                    >
                                        <Mail size={16} />
                                        <span>Send Reminder</span>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

const CourseManagement = () => {
    const { courses } = useData();
    const navigate = useNavigate();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937' }}>Assign Courses</h2>

            <div className="courses-grid">
                {courses.map((course) => (
                    <div
                        key={course.id}
                        onClick={() => navigate(`/course-management/${course.id}`)}
                        className="course-card"
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                            <div className="course-icon-box">
                                <BookOpen size={24} />
                            </div>
                        </div>

                        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1f2937', marginBottom: '0.5rem' }}>{course.title}</h3>

                        <div className="course-meta">
                            <Clock size={16} />
                            <span>Duration: {course.duration}</span>
                        </div>

                        <div className="course-action">
                            Manage Assignment &rarr;
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const CourseAssignment = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const { courses, teamMembers, assignCourseToMembers } = useData();
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [assignmentDeadline, setAssignmentDeadline] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    const course = courses.find(c => c.id === parseInt(courseId));

    if (!course) {
        return <div>Course not found</div>;
    }

    const toggleMemberSelection = (memberId) => {
        setSelectedMembers(prev =>
            prev.includes(memberId)
                ? prev.filter(id => id !== memberId)
                : [...prev, memberId]
        );
    };

    const handleAssign = () => {
        if (selectedMembers.length === 0 || !assignmentDeadline) return;

        assignCourseToMembers(courseId, selectedMembers, assignmentDeadline);

        setIsSuccess(true);
        setTimeout(() => {
            navigate('/course-management');
        }, 1500);
    };

    const isMemberAssigned = (member) => {
        return member.assignedCourses.some(c => c.id === parseInt(courseId));
    };

    if (isSuccess) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', textAlign: 'center' }}>
                <div style={{ width: '4rem', height: '4rem', backgroundColor: '#dcfce7', borderRadius: '9999px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                    <CheckCircle className="text-green-600" size={32} color="#166534" />
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937', marginBottom: '0.5rem' }}>Assignment Successful!</h2>
                <p style={{ color: '#6b7280' }}>Course has been assigned to selected members.</p>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '56rem', margin: '0 auto' }}>
            <button
                onClick={() => navigate('/course-management')}
                className="btn-back"
            >
                <ArrowLeft size={20} />
                Back to Courses
            </button>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid #f3f4f6', backgroundColor: '#f9fafb' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937' }}>{course.title}</h2>
                    <p style={{ color: '#6b7280', marginTop: '0.25rem' }}>Select team members to assign this course.</p>
                </div>

                <div style={{ padding: '1.5rem' }}>
                    <div className="form-group">
                        <label className="form-label">Assignment Deadline</label>
                        <input
                            type="date"
                            value={assignmentDeadline}
                            onChange={(e) => setAssignmentDeadline(e.target.value)}
                            className="form-input"
                            style={{ maxWidth: '300px' }}
                            required
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#374151', fontWeight: 500 }}>
                            <Users size={20} />
                            <span>Select Team Members</span>
                        </div>
                        <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                            {selectedMembers.length} selected
                        </span>
                    </div>

                    <div className="member-list">
                        {teamMembers.map((member) => {
                            const alreadyAssigned = isMemberAssigned(member);

                            return (
                                <div
                                    key={member.id}
                                    className={`member-item ${selectedMembers.includes(member.id) ? 'selected' : ''} ${alreadyAssigned ? 'disabled' : ''}`}
                                    onClick={() => !alreadyAssigned && toggleMemberSelection(member.id)}
                                >
                                    <div className="member-info">
                                        <div className="checkbox-custom">
                                            {selectedMembers.includes(member.id) && <CheckCircle size={14} />}
                                        </div>
                                        <div>
                                            <p style={{ fontWeight: 500, color: '#111827' }}>{member.name}</p>
                                            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>{member.email}</p>
                                        </div>
                                    </div>
                                    {alreadyAssigned && (
                                        <span className="status-badge assigned">
                                            Already Assigned
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div style={{ padding: '1.5rem', backgroundColor: '#f9fafb', borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                        onClick={handleAssign}
                        disabled={selectedMembers.length === 0 || !assignmentDeadline}
                        className="btn btn-primary"
                        style={{ opacity: (selectedMembers.length === 0 || !assignmentDeadline) ? 0.5 : 1 }}
                    >
                        Assign Selected Members
                    </button>
                </div>
            </div>
        </div>
    );
};

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);

    // Load saved email on mount
    useEffect(() => {
        const savedEmail = localStorage.getItem('savedEmail');
        if (savedEmail) {
            setEmail(savedEmail);
            setRememberMe(true);
        }
    }, []);

    // Handle form submission
    const handleSubmit = (e) => {
        e.preventDefault();

        // Save or remove email from local storage based on Remember Me
        if (rememberMe && email) {
            localStorage.setItem('savedEmail', email);
        } else {
            localStorage.removeItem('savedEmail');
        }

        console.log('Sign in attempt:', {
            email: email,
            password: password,
            rememberMe: rememberMe
        });

        alert(`Sign in attempt:\nEmail: ${email}\nRemember Me: ${rememberMe}`);
    };

    const handleForgotPassword = (e) => {
        e.preventDefault();
        alert('Password reset functionality would be implemented here.');
    };

    return (
        <div className="login-page-wrapper">
            <div className="container login-container">
                {/* Logo and Header */}
                <div className="header">
                    <div className="logo-placeholder">ORYFOLKS LOGO</div>
                    <h1 className="main-title">Learning Management System</h1>
                    <p className="subtitle">Corporate Learning Platform</p>
                </div>

                {/* Login Card */}
                <div className="login-card">
                    <div className="welcome-section">
                        <h2 className="welcome-title">Welcome Back</h2>
                        <p className="welcome-text">Sign in to continue your learning journey</p>
                    </div>

                    <form className="form" onSubmit={handleSubmit}>
                        {/* Email Input */}
                        <input
                            type="email"
                            placeholder="Email Address"
                            className="input-field"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />

                        {/* Password Input */}
                        <input
                            type="password"
                            placeholder="Password"
                            className="input-field"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />

                        {/* Remember Me and Forgot Password */}
                        <div className="remember-forgot">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    className="checkbox-input"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                />
                                Remember me
                            </label>
                            <a href="#" className="forgot-link" onClick={handleForgotPassword}>
                                Forgot password?
                            </a>
                        </div>

                        {/* Sign In Button */}
                        <div className="button-container">
                            <button type="submit" className="signin-button">
                                Sign in
                                <svg
                                    className="arrow-icon"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                                    ></path>
                                </svg>
                            </button>
                        </div>
                    </form>
                </div>

                {/* Footer Links */}
                <div className="footer-links">
                    <a href="#" className="footer-link">Privacy Policy</a>
                    <a href="#" className="footer-link">Terms & Services</a>
                    <a href="#" className="footer-link">Support</a>
                </div>
            </div>
        </div>
    );
};

// --- Main App Component ---

function App() {
    return (
        <DataProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/" element={<Layout />}>
                        <Route index element={<DashboardHome />} />
                        <Route path="my-team" element={<MyTeam />} />
                        <Route path="my-team/:memberId" element={<TeamMemberDetails />} />
                        <Route path="course-management" element={<CourseManagement />} />
                        <Route path="course-management/:courseId" element={<CourseAssignment />} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </DataProvider>
    );
}

export default ManagerDashboard;