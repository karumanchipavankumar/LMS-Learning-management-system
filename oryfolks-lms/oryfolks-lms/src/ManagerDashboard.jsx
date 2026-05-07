import React, { createContext, useState, useEffect, useContext } from 'react';
import { Routes, Route, NavLink, useNavigate, useParams, Outlet } from 'react-router-dom';
import {
    LayoutDashboard, Users, BookOpen, Clock,
    ArrowLeft, Bell, Settings, LogOut, CheckCircle, Search, FileText,
    Mail, Activity, Trash2, User
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import './ManagerDashboard.css';
import './CourseManagement.css'; // Import shared styles for pill search
import logo from './assets/logo.png';
import ManagerProfile from './ManagerProfile';

// --- Data Context ---

const DataContext = createContext();

export const useData = () => useContext(DataContext);

const DataProvider = ({ children }) => {

    // Initial dummy data for team members
    const [teamMembers, setTeamMembers] = useState([]);

    const fetchEmployees = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get("http://localhost:8080/manager/my-team", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTeamMembers(response.data);
        } catch (err) {
            console.error("Error fetching employees", err);
        }
    };

    const [managerProfile, setManagerProfile] = useState(null);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get("http://localhost:8080/manager/profile", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setManagerProfile(response.data);
        } catch (err) {
            console.error("Error fetching manager profile", err);
        }
    };

    useEffect(() => {
        fetchEmployees();
        fetchProfile();
    }, []);


    // Initial dummy data for available courses

    // Available courses from backend
    const [courses, setCourses] = useState([]);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const token = localStorage.getItem("token");
                // console.log("Token:", token);
                const response = await fetch("http://localhost:8080/manager/courses", {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error("Failed to fetch courses");
                }

                const data = await response.json();
                // console.log("Courses from backend:", data);
                setCourses(data);

            } catch (error) {
                console.error("Error fetching courses:", error);
            }
        };

        fetchCourses();
    }, []);


    /* -------- ASSIGN COURSE LOGIC (BACKEND SYNC) -------- */
    const assignCourseToMembers = async (courseId, selectedMemberIds, customDeadline) => {
        try {
            const token = localStorage.getItem("token");
            const requestBody = {
                courseId: parseInt(courseId),
                employeeIds: selectedMemberIds,
                deadline: customDeadline
            };

            const response = await axios.post("http://localhost:8080/manager/assign-course", requestBody, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            });

            if (response.status === 200) {
                alert("Course assigned successfully!");
                fetchEmployees(); // Refresh team data to show new assignments
            }
        } catch (error) {
            console.error("Error assigning course:", error);
            alert("Failed to assign course. Please try again.");
        }
    };

    return (
        <DataContext.Provider value={{ teamMembers, courses, assignCourseToMembers, fetchEmployees, managerProfile }}>
            {children}
        </DataContext.Provider>
    );
};
// --- Components ---

const Sidebar = () => {
    // Note: Paths are relative to the parent route /manager
    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '.', end: true },
        { icon: Users, label: 'My Team', path: 'my-team' },
        { icon: BookOpen, label: 'Assign Courses', path: 'course-management' },
        { icon: CheckCircle, label: 'Course Enrollment', path: 'enrollments' },
        { icon: FileText, label: 'Reports', path: 'reports' },
    ];

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <img src={logo} alt="ORYFOLKS" style={{ height: '40px', width: 'auto' }} />
            </div>

            <nav className="sidebar-nav">
                <ul>
                    {menuItems.map((item, index) => (
                        <li key={index}>
                            <NavLink
                                to={item.path}
                                end={item.end}
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
    const navigate = useNavigate();
    const { managerProfile } = useData();
    
    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate('/');
    };

    const firstName = managerProfile?.firstName || "Manager";

    return (
        <header className="app-header">
            <div>
                <h1 className="header-title">Welcome, {firstName}!</h1>
            </div>
            <div className="header-actions">
                <button className="icon-btn" onClick={() => navigate('/manager/profile')} title="Profile">
                    <User size={24} />
                </button>
                <button className="icon-btn" onClick={handleLogout} title="Logout">
                    <LogOut size={24} />
                </button>
            </div>
        </header>
    );
};

const StatsCard = ({ icon: Icon, label, value, type, onClick }) => {
    return (
        <div className={`stat-card ${type}`} onClick={onClick}>
            <div className="stat-icon">
                <Icon size={24} />
            </div>
            <div className="stat-info">
                <div className="stat-value">{value}</div>
                <div className="stat-label">{label}</div>
            </div>
        </div>
    );
};

const TeamChart = () => {
    const { teamMembers } = useData();

    let completed = 0;
    let inProgress = 0;
    let notStarted = 0;

    teamMembers.forEach(member => {
        member.assignedCourses?.forEach(course => {
            if (course.progress === 100) {
                completed++;
            } else if (course.progress === 0) {
                notStarted++;
            } else {
                inProgress++;
            }
        });
    });

    const data = [
        { name: 'Completed', value: completed, color: '#22c55e' },
        { name: 'In Progress', value: inProgress, color: '#facc15' },
        { name: 'Not Started', value: notStarted, color: '#f87171' },
    ];

    const totalCourses = completed + inProgress + notStarted;

    const CustomLegend = () => (
        <div className="chart-legend">
            {data.map((entry, index) => (
                <div key={index} className="legend-item">
                    <div className="legend-info">
                        <div
                            className="legend-dot"
                            style={{ backgroundColor: entry.color }}
                        ></div>
                        <span>{entry.name}</span>
                    </div>
                    <span>{entry.value}</span>
                </div>
            ))}
        </div>
    );

    if (totalCourses === 0) {
        return (
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Team Overview</h3>
                </div>
                <div style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>
                    No course data available.
                </div>
            </div>
        );
    }

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
                                outerRadius={85}
                                dataKey="value"
                                startAngle={90}
                                endAngle={-270}
                            >
                                {data.map((entry, index) => (
                                    <Cell
                                        key={index}
                                        fill={entry.color}
                                        stroke="none"
                                    />
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
    const navigate = useNavigate();

    // Flatten assigned courses from all team members to create an assigned list
    const allAssigned = teamMembers.flatMap(member =>
        member.assignedCourses.map(course => ({
            id: course.courseId,
            courseName: course.courseName,
            employeeName: member.name,
            progress: course.progress,
            status: course.status
        }))
    );

    const recentCourses = allAssigned.slice(0, 6); // Adjusted to 6 for optimal space utilization

    const getStatusClass = (status) => {
        if (!status) return 'not-started';
        const s = status.toLowerCase().replace('_', '-');
        return s; // will return 'not-started', 'in-progress', 'completed'
    };

    const formatStatus = (status) => {
        if (!status) return 'Not_Started';
        if (status === 'IN_PROGRESS') return 'In Progress';
        if (status === 'COMPLETED') return 'Completed';
        if (status === 'NOT_STARTED') return 'Not_Started';
        return status.replace(/_/g, ' ');
    };

    return (
        <div className="card">
            <div className="card-header">
                <h3 className="card-title">Active courses</h3>
                {allAssigned.length > 6 && (
                    <button
                        className="btn-link"
                        onClick={() => navigate('assigned-courses')}
                        style={{ fontSize: '0.875rem', color: 'var(--primary-color)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                    >
                        View All
                    </button>
                )}
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
                                            {formatStatus(item.status)}
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

const AllAssignedCourses = () => {
    const { teamMembers } = useData();
    const navigate = useNavigate();

    const allAssigned = teamMembers.flatMap(member =>
        member.assignedCourses.map(course => ({
            id: course.courseId,
            courseName: course.courseName,
            employeeName: member.name,
            progress: course.progress,
            status: course.status
        }))
    );

    const [searchTerm, setSearchTerm] = useState('');

    const getStatusClass = (status) => {
        if (!status) return 'not-started';
        const s = status.toLowerCase().replace('_', '-');
        return s;
    };

    const formatStatus = (status) => {
        if (!status) return 'Not_Started';
        if (status === 'IN_PROGRESS') return 'In Progress';
        if (status === 'COMPLETED') return 'Completed';
        if (status === 'NOT_STARTED') return 'Not_Started';
        return status.replace(/_/g, ' ');
    };

    const filteredAssigned = allAssigned.filter(item =>
        item.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.employeeName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="course-management-container">
            <div className="header-with-arrow">
                <ArrowLeft
                    className="back-arrow-icon"
                    onClick={() => navigate('/manager')}
                />
                <h3 className="card-title" style={{ marginBottom: 0 }}>All Active courses</h3>
            </div>

            <div className="team-filter-bar" style={{ justifyContent: 'center' }}>
                <div className="cm-search-container">
                    <input
                        type="text"
                        className="cm-search-input"
                        placeholder="Search by course or employee"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Search className="cm-search-icon" size={20} />
                </div>
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
                        {filteredAssigned.length > 0 ? (
                            filteredAssigned.map((item, index) => (
                                <tr key={`${item.id}-${index}`}>
                                    <td>{index + 1}</td>
                                    <td style={{ fontWeight: 500 }}>{item.courseName}</td>
                                    <td>{item.employeeName}</td>
                                    <td>
                                        <span className={`status-badge ${getStatusClass(item.status)}`}>
                                            {formatStatus(item.status)}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                                    No courses found matching "{searchTerm}"
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const ActiveCoursesPage = () => {
    const { teamMembers } = useData();
    const navigate = useNavigate();

    // Group courses from all team members to get unique ones
    const activeCoursesMap = new Map();

    teamMembers.forEach(member => {
        if (member.assignedCourses) {
            member.assignedCourses.forEach(course => {
                const courseId = course.courseId || course.id;
                if (!activeCoursesMap.has(courseId)) {
                    activeCoursesMap.set(courseId, {
                        id: courseId,
                        name: course.courseName || course.title,
                        category: course.category || "General",
                        users: new Set([member.id])
                    });
                } else {
                    const existing = activeCoursesMap.get(courseId);
                    existing.users.add(member.id);
                }
            });
        }
    });

    const activeCoursesList = Array.from(activeCoursesMap.values());

    return (
        <div className="course-management-container">
            <div className="header-with-arrow">
                <ArrowLeft
                    className="back-arrow-icon"
                    onClick={() => navigate('/manager')}
                />
                <h3 className="card-title" style={{ marginBottom: 0 }}>Active Courses</h3>
            </div>

            <div className="table-container" style={{ marginTop: '1.5rem' }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>S. No</th>
                            <th>Course ID</th>
                            <th>Course Name</th>
                            <th>Category</th>
                            <th style={{ textAlign: 'center' }}>Number of People</th>
                            <th style={{ textAlign: 'center' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {activeCoursesList.length > 0 ? (
                            activeCoursesList.map((course, index) => (
                                <tr key={course.id}>
                                    <td>{index + 1}</td>
                                    <td>#{course.id}</td>
                                    <td style={{ fontWeight: 500, color: '#1f2937' }}>{course.name}</td>
                                    <td>
                                        <span className="category-badge">
                                            {course.category}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'center', fontWeight: 600, color: '#4b5563' }}>{course.users.size}</td>
                                    <td style={{ textAlign: 'center' }}>
                                        <button
                                            className="btn-reminder"
                                            style={{
                                                backgroundColor: '#f97316',
                                                color: 'white',
                                                padding: '6px 16px',
                                                borderRadius: '4px',
                                                fontSize: '13px',
                                                fontWeight: 600,
                                                border: 'none',
                                                cursor: 'pointer',
                                                transition: 'background-color 0.2s'
                                            }}
                                            onClick={() => navigate(`/manager/course-management/${course.id}`)}
                                            onMouseEnter={(e) => e.target.style.backgroundColor = '#ea580c'}
                                            onMouseLeave={(e) => e.target.style.backgroundColor = '#f97316'}
                                        >
                                            Assign
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                                    No active courses found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const InactiveCoursesPage = () => {
    const { teamMembers, courses } = useData();
    const navigate = useNavigate();

    // Get set of assigned course IDs
    const assignedCourseIds = new Set();
    teamMembers.forEach(member => {
        if (member.assignedCourses) {
            member.assignedCourses.forEach(course => {
                assignedCourseIds.add(course.courseId || course.id);
            });
        }
    });

    // Filter courses that are NOT in the assigned set
    const inactiveCourses = courses.filter(course => !assignedCourseIds.has(course.id));

    return (
        <div className="course-management-container">
            <div className="header-with-arrow">
                <ArrowLeft
                    className="back-arrow-icon"
                    onClick={() => navigate('/manager')}
                />
                <h3 className="card-title" style={{ marginBottom: 0 }}>Inactive Courses</h3>
            </div>

            <div className="table-container" style={{ marginTop: '1.5rem' }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>S. No</th>
                            <th>Course ID</th>
                            <th>Course Name</th>
                            <th>Category</th>
                            <th style={{ textAlign: 'center' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {inactiveCourses.length > 0 ? (
                            inactiveCourses.map((course, index) => (
                                <tr key={course.id}>
                                    <td>{index + 1}</td>
                                    <td>#{course.id}</td>
                                    <td style={{ fontWeight: 500, color: '#1f2937' }}>{course.title}</td>
                                    <td>
                                        <span className="category-badge">
                                            {course.category || "General"}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <button
                                            className="btn-reminder"
                                            style={{
                                                backgroundColor: '#f97316',
                                                color: 'white',
                                                padding: '6px 16px',
                                                borderRadius: '4px',
                                                fontSize: '13px',
                                                fontWeight: 600,
                                                border: 'none',
                                                cursor: 'pointer',
                                                transition: 'background-color 0.2s'
                                            }}
                                            onClick={() => navigate(`/manager/course-management/${course.id}`)}
                                            onMouseEnter={(e) => e.target.style.backgroundColor = '#ea580c'}
                                            onMouseLeave={(e) => e.target.style.backgroundColor = '#f97316'}
                                        >
                                            Assign
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                                    No inactive courses found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const ManagerLayout = () => {
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
    const navigate = useNavigate();
    const { teamMembers, courses } = useData();

    // ✅ Total Members
    const totalMembers = teamMembers.length;

    // ✅ Assigned Courses (Unique courses assigned to team members)
    const assignedCoursesCount = new Set(
        teamMembers.flatMap(member => (member.assignedCourses || []).map(c => c.courseId))
    ).size;

    // ✅ Un Assigned Courses (Courses available but not assigned to team)
    const unassignedCoursesCount = courses.length - assignedCoursesCount;

    return (
        <>
            {/* Stats Row */}
            <div className="stats-grid">
                <StatsCard
                    icon={Users}
                    label="Team Members"
                    value={totalMembers}
                    colorClass="bg-blue"
                    type="assigned"
                    onClick={() => navigate('my-team')}
                />

                <StatsCard
                    icon={CheckCircle}
                    label="Active courses"
                    value={assignedCoursesCount}
                    colorClass="bg-green"
                    type="published"
                    onClick={() => navigate('active-courses')}
                />

                <StatsCard
                    icon={Clock}
                    label="Inactive courses"
                    value={unassignedCoursesCount}
                    colorClass="bg-amber"
                    type="unassigned"
                    onClick={() => navigate('inactive-courses')}
                />
            </div>

            {/* Content Row */}
            <div className="dashboard-grid">
                <div className="grid-main">
                    <CourseTable />
                </div>

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
    const [searchTerm, setSearchTerm] = useState('');

    // Filter members based on search term
    const filteredMembers = teamMembers.filter(member => {
        const fullSearch = searchTerm.toLowerCase();
        const name = (member.name || "").toLowerCase();
        const email = (member.email || "").toLowerCase();
        return name.includes(fullSearch) || email.includes(fullSearch);
    });

    // Helper to calculate average progress
    const calculateProgress = (courses) => {
        if (!courses || courses.length === 0) return 0;
        const totalProgress = courses.reduce((sum, course) => sum + course.progress, 0);
        return Math.round(totalProgress / courses.length);
    };

    // Using stroke colors for SVG circles
    const getStrokeColor = (progress) => {
        if (progress === 100) return '#22c55e';
        if (progress >= 40) return '#facc15';
        return '#f87171';
    }

    // Inline style helper for text colors if needed, or mapping to classes
    const getProgressTextColor = (progress) => {
        if (progress === 100) return 'var(--success-color)';
        if (progress >= 40) return 'var(--warning-color)';
        return 'var(--danger-color)';
    }

    return (
        <div className="user-management-container">
            <div className="team-header" style={{ padding: '0.8rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e5e7eb', marginBottom: '1.5rem' }}>
                <div>
                    <h1 className="team-title" style={{ fontSize: '1.25rem', marginBottom: '0.1rem' }}>My Team</h1>
                    <p className="team-subtitle" style={{ fontSize: '0.75rem', margin: 0 }}>
                        Manage and monitor your team member's progress, assignments, and performance.
                    </p>
                </div>

                <div className="cm-search-container" style={{ maxWidth: '300px', width: '100%', marginBottom: 0 }}>
                    <input
                        type="text"
                        className="cm-search-input"
                        placeholder="Search team members..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ padding: '8px 40px 8px 16px', fontSize: '13px' }}
                    />
                    <Search className="cm-search-icon" size={17} style={{ right: '12px' }} />
                </div>
            </div>

            <div className="table-container">
                <table className="team-table">
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
                        {filteredMembers.map((member, index) => {
                            const progress = calculateProgress(member.assignedCourses);
                            const courseCount = member.assignedCourses.length;
                            const radius = 18;
                            const circumference = 2 * Math.PI * radius;
                            const strokeDashoffset = circumference - (progress / 100) * circumference;

                            return (
                                <tr
                                    key={member.id}
                                    onClick={() => navigate(`${member.id}`)}
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
                        {filteredMembers.length === 0 && (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                                    No team members found matching your search.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const TeamMemberDetails = () => {
    const { memberId } = useParams();
    const navigate = useNavigate();
    const { teamMembers, fetchEmployees } = useData();
    const [searchTerm, setSearchTerm] = useState('');

    const memberDetails = teamMembers.find(m => m.id === parseInt(memberId));

    if (!memberDetails) {
        return <div>Member not found</div>;
    }

    const assignedCourses = memberDetails.assignedCourses || [];

    const filteredCourses = assignedCourses.filter(course =>
        (course.courseName || course.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (course.category || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

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

    const handleSendReminder = async (course) => {
        if (course.reminderSent) {
            alert("Mail already sent!");
            return;
        }

        try {
            const token = localStorage.getItem("token");
            await axios.post("http://localhost:8080/manager/send-reminder", {
                courseId: course.courseId,
                employeeIds: [memberDetails.id]
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("Reminder email sent successfully!");
            // Refresh team data to update the reminderSent flag locally
            if (fetchEmployees) fetchEmployees();
        } catch (error) {
            console.error("Failed to send reminder", error);
            alert("Failed to send reminder email. Please try again.");
        }
    };

    return (
        <div className="user-management-container">
            <div className="header-with-arrow" style={{ padding: '1rem 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e5e7eb', marginBottom: '1rem' }}>
                <div className="team-title-section" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ArrowLeft
                        className="team-back-btn"
                        onClick={() => navigate('/manager/my-team')}
                    />
                    <div>
                        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0rem' }}>{memberDetails.name}</h2>
                        <p style={{ color: '#6b7280', margin: 0, fontSize: '0.8rem' }}>{memberDetails.email}</p>
                    </div>
                </div>

                <div className="cm-search-container" style={{ maxWidth: '280px', width: '100%', marginBottom: 0 }}>
                    <input
                        type="text"
                        className="cm-search-input"
                        placeholder="Search assigned courses..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ padding: '8px 40px 8px 16px', fontSize: '13px' }}
                    />
                    <Search className="cm-search-icon" size={16} style={{ right: '12px' }} />
                </div>
            </div>

            <div className="employee-courses-container">
                {filteredCourses.length > 0 ? (
                    filteredCourses.map((course) => (
                        <div key={course.id || course.courseId} className="employee-course-card">
                            <div className="employee-course-image-container">
                                <img
                                    src={course.thumbnailUrl || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60"}
                                    alt={course.courseName || course.title}
                                    className="employee-course-image"
                                />
                                <div className={`employee-progress-badge ${course.progress === 100 ? 'completed' : ''}`}>
                                    {course.progress === 100 ? 'Completed' : `${course.progress}%`}
                                </div>
                            </div>

                            <div className="employee-course-content">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                    <h3 className="employee-course-title" style={{ margin: 0, fontSize: '14px', flex: 1 }}>
                                        {course.courseName || course.title}
                                    </h3>
                                    <div className="employee-course-meta-item" style={{ fontSize: '10px', color: '#94a3b8', whiteSpace: 'nowrap', marginLeft: '8px' }}>
                                        <Clock size={12} />
                                        <span>{course.duration || "N/A"}</span>
                                    </div>
                                </div>

                                <div className="employee-course-meta">
                                    <div style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '4px' }}>
                                        Category: {course.category || "General"}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        {course.enrollmentType === 'SELF_ENROLLMENT' ? (
                                            <>
                                                <span style={{ color: '#22c55e', fontSize: '11px', fontWeight: 600 }}>
                                                    {course.progress === 100 ? 'Enrollment completed' : 'Enrolled'}
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                {course.progress === 100 ? (
                                                    <span style={{ color: '#22c55e', fontSize: '11px', fontWeight: 600 }}>Assignment completed</span>
                                                ) : (
                                                    <>
                                                        <span style={{ color: '#ef4444', fontSize: '11px', fontWeight: 600 }}>Assigned</span>
                                                        <span style={{ color: '#9CA3AF', fontSize: '11px' }}>• Due: {course.deadline}</span>
                                                    </>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="employee-course-footer">
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                                        <button
                                            onClick={() => handleSendReminder(course)}
                                            className="btn-reminder"
                                            title={course.reminderSent ? "Reminder already sent" : "Send Reminder"}
                                            style={{
                                                width: '100%',
                                                padding: '6px 0',
                                                backgroundColor: course.reminderSent ? '#94a3b8' : '#f97316',
                                                color: '#ffffff',
                                                border: 'none',
                                                borderRadius: '4px',
                                                fontSize: '11px',
                                                fontWeight: 600,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '6px',
                                                cursor: course.reminderSent ? 'default' : 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            <Mail size={13} />
                                            <span>{course.reminderSent ? 'Sent' : 'Email'}</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                        No courses found matching "{searchTerm}"
                    </div>
                )}
            </div>
        </div>
    );
};

const CourseManagement = () => {
    const { courses } = useData();
    const navigate = useNavigate();

    const [searchTerm, setSearchTerm] = useState('');

    const filteredCourses = courses.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="user-management-container">
            <div className="team-header" style={{ padding: '0.8rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e5e7eb', marginBottom: '1.5rem' }}>
                <div>
                    <h1 className="team-title" style={{ fontSize: '1.25rem', marginBottom: '0.1rem' }}>Assign Courses</h1>
                    <p className="team-subtitle" style={{ fontSize: '0.75rem', margin: 0 }}>
                        Browse and assign available courses to your team members.
                    </p>
                </div>

                <div className="cm-search-container" style={{ maxWidth: '300px', width: '100%', marginBottom: 0 }}>
                    <input
                        type="text"
                        className="cm-search-input"
                        placeholder="Search courses..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ padding: '8px 40px 8px 16px', fontSize: '13px' }}
                    />
                    <Search className="cm-search-icon" size={17} style={{ right: '12px' }} />
                </div>
            </div>

            <div className="table-container">
                <table className="team-table">
                    <thead>
                        <tr>
                            <th>S.No</th>
                            <th>Course ID</th>
                            <th>Course Name</th>
                            <th>Category</th>
                            <th style={{ textAlign: 'center' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCourses.length > 0 ? (
                            filteredCourses.map((course, index) => (
                                <tr key={course.id}>
                                    <td>{index + 1}</td>
                                    <td>{course.id}</td>
                                    <td style={{ fontWeight: 500, color: '#1f2937' }}>{course.title}</td>
                                    <td>
                                        <span className="category-badge">
                                            {course.category || "General"}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <button
                                            onClick={() => navigate(`${course.id}`)}
                                            className="btn-reminder"
                                            style={{ backgroundColor: '#f97316', color: 'white', padding: '6px 16px', borderRadius: '4px', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer' }}
                                        >
                                            Assign
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                                    No courses found matching "{searchTerm}"
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const CourseAssignment = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const { courses, teamMembers, fetchEmployees } = useData();
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [assignmentDeadline, setAssignmentDeadline] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const [memberSearchTerm, setMemberSearchTerm] = useState('');

    const course = courses.find(c => c.id === parseInt(courseId));

    if (!course) return <div style={{ padding: '2rem', textAlign: 'center' }}>Course not found</div>;

    const filteredMembers = teamMembers.filter(member =>
        member.name.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(memberSearchTerm.toLowerCase())
    );

    const toggleMemberSelection = (memberId) => {
        setSelectedMembers(prev =>
            prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId]
        );
    };

    const isMemberAssigned = (member) => {
        const targetId = parseInt(courseId);
        return member.assignedCourses?.some(c => (c.id === targetId) || (c.courseId === targetId));
    };

    const handleAssign = async () => {
        if (selectedMembers.length === 0) {
            alert("Please select at least one team member.");
            return;
        }
        if (!assignmentDeadline) {
            alert("Please select an assignment deadline.");
            return;
        }

        const selectedDate = new Date(assignmentDeadline);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (selectedDate <= today) {
            alert("Please select a future date for the deadline.");
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const response = await fetch("http://localhost:8080/manager/assign-course", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    courseId: parseInt(courseId),
                    employeeIds: selectedMembers,
                    deadline: assignmentDeadline
                })
            });
            if (!response.ok) throw new Error("Assignment failed");

            // Refresh data globally to reflect new assignments
            if (fetchEmployees) fetchEmployees();

            setIsSuccess(true);
            setTimeout(() => navigate("/manager/course-management"), 1500);
        } catch (err) {
            console.error(err);
            alert("Failed to assign course");
        }
    };

    const handleUnassign = async (memberId) => {
        if (!window.confirm("Are you sure you want to unassign this course?")) return;
        try {
            const token = localStorage.getItem("token");
            const response = await fetch("http://localhost:8080/manager/unassign-course", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    courseId: parseInt(courseId),
                    employeeIds: [memberId]
                })
            });
            if (!response.ok) throw new Error("Unassign failed");

            // Refresh data globally
            if (fetchEmployees) fetchEmployees();
            alert("Course unassigned successfully");
        } catch (err) {
            console.error(err);
            alert("Failed to unassign course");
        }
    };

    if (isSuccess) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', textAlign: 'center' }}>
                <div style={{ width: '4rem', height: '4rem', backgroundColor: '#dcfce7', borderRadius: '9999px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                    <CheckCircle size={32} color="#166534" />
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937', marginBottom: '0.5rem' }}>Assignment Successful!</h2>
                <p style={{ color: '#6b7280' }}>Course has been assigned to {selectedMembers.length} members.</p>
            </div>
        );
    }

    return (
        <div className="user-management-container" style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div className="team-header" style={{ padding: '0.8rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e5e7eb', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ArrowLeft className="team-back-btn" onClick={() => navigate('/manager/course-management')} />
                    <div>
                        <h1 className="team-title" style={{ fontSize: '1.25rem', marginBottom: '0.1rem' }}>Assign: {course.title}</h1>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span className="category-badge">{course.category || "General"}</span>
                            <span style={{ fontSize: '11px', color: '#6b7280' }}>• {course.duration || "N/A"}</span>
                        </div>
                    </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <label className="form-label" style={{ marginBottom: 0, whiteSpace: 'nowrap' }}>Due Date:</label>
                    <input
                        type="date"
                        value={assignmentDeadline}
                        onChange={(e) => setAssignmentDeadline(e.target.value)}
                        className="form-input"
                        style={{ padding: '6px 12px', fontSize: '13px', width: '160px' }}
                        required
                    />
                </div>
            </div>

            <div style={{ padding: '0 1.5rem 1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div className="cm-search-container" style={{ maxWidth: '300px', margin: 0 }}>
                        <input
                            type="text"
                            className="cm-search-input"
                            placeholder="Search team members..."
                            value={memberSearchTerm}
                            onChange={(e) => setMemberSearchTerm(e.target.value)}
                            style={{ padding: '8px 40px 8px 16px', fontSize: '13px' }}
                        />
                        <Search className="cm-search-icon" size={16} style={{ right: '12px' }} />
                    </div>
                    <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>
                        {selectedMembers.length} Members Selected
                    </div>
                </div>

                <div className="table-container" style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                    <table className="team-table">
                        <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                            <tr>
                                <th style={{ width: '50px' }}>S.No</th>
                                <th>Team Member</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'center', width: '80px' }}>Select</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredMembers.length > 0 ? (
                                filteredMembers.map((member, index) => {
                                    const alreadyAssigned = isMemberAssigned(member);
                                    const isSelected = selectedMembers.includes(member.id);
                                    return (
                                        <tr
                                            key={member.id}
                                            onClick={() => !alreadyAssigned && toggleMemberSelection(member.id)}
                                            style={{
                                                cursor: alreadyAssigned ? 'not-allowed' : 'pointer',
                                                backgroundColor: isSelected ? '#f8fafc' : 'transparent',
                                                opacity: alreadyAssigned ? 0.6 : 1
                                            }}
                                        >
                                            <td>{index + 1}</td>
                                            <td>
                                                <div style={{ fontWeight: 500, color: '#1f2937' }}>{member.name}</div>
                                                <div style={{ fontSize: '12px', color: '#6b7280' }}>{member.email}</div>
                                            </td>
                                            <td>
                                                {alreadyAssigned ? (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#9ca3af', fontSize: '12px' }}>
                                                        <Clock size={12} />
                                                        <span>Already Assigned</span>
                                                    </div>
                                                ) : (
                                                    <span style={{ color: '#22c55e', fontSize: '12px', fontWeight: 500 }}>Available</span>
                                                )}
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                {alreadyAssigned ? (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleUnassign(member.id);
                                                        }}
                                                        style={{
                                                            background: 'none',
                                                            border: 'none',
                                                            cursor: 'pointer',
                                                            color: '#ef4444',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            padding: '4px',
                                                            borderRadius: '4px',
                                                            transition: 'background-color 0.2s'
                                                        }}
                                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
                                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                        title="Unassign Course"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                ) : (
                                                    <div style={{
                                                        width: '18px',
                                                        height: '18px',
                                                        border: `2px solid ${isSelected ? '#f97316' : '#d1d5db'}`,
                                                        borderRadius: '4px',
                                                        margin: '0 auto',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        backgroundColor: isSelected ? '#f97316' : 'white',
                                                        transition: 'all 0.2s'
                                                    }}>
                                                        {isSelected && <CheckCircle size={12} color="white" />}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>No members found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                        onClick={handleAssign}
                        disabled={selectedMembers.length === 0 || !assignmentDeadline}
                        style={{
                            backgroundColor: (selectedMembers.length === 0 || !assignmentDeadline) ? '#fdba74' : '#f97316',
                            color: 'white',
                            padding: '10px 24px',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: 600,
                            border: 'none',
                            cursor: (selectedMembers.length === 0 || !assignmentDeadline) ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.2s'
                        }}
                    >
                        <Users size={18} />
                        Confirm Assignment
                    </button>
                </div>
            </div>
        </div>
    );
};


const CourseEnrollments = () => {
    const [enrollments, setEnrollments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('PENDING');

    const formatDate = (dateValue) => {
        if (!dateValue) return '-';
        if (Array.isArray(dateValue)) {
            // Spring Boot LocalDateTime often comes as [yyyy, mm, dd, hh, mm]
            const [year, month, day] = dateValue;
            return new Date(year, month - 1, day).toLocaleDateString();
        }
        return new Date(dateValue).toLocaleDateString();
    };

    const fetchEnrollments = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8080/manager/enrollments?status=${filterStatus}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setEnrollments(data);
            }
        } catch (error) {
            console.error("Error fetching enrollments:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEnrollments();
    }, [filterStatus]);

    const handleAction = async (id, action) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8080/manager/enrollments/${id}/${action}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                // Refresh list
                fetchEnrollments();
            } else {
                alert(`Failed to ${action} enrollment`);
            }
        } catch (error) {
            console.error(`Error ${action}ing enrollment:`, error);
        }
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;

    return (
        <div className="user-management-container">
            <div className="team-header" style={{ padding: '0.8rem 1.5rem', borderBottom: '1px solid #e5e7eb', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 className="team-title" style={{ fontSize: '1.25rem', marginBottom: '0.1rem' }}>Course Enrollment Requests</h1>
                        <p className="team-subtitle" style={{ fontSize: '0.75rem', margin: 0 }}>
                            Manage course enrollment requests from employees.
                        </p>
                    </div>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: '1px solid #d1d5db',
                            fontSize: '14px',
                            outline: 'none'
                        }}
                    >
                        <option value="PENDING">Pending</option>
                        <option value="APPROVED">Approved</option>
                        <option value="REJECTED">Rejected</option>
                        <option value="ALL">All</option>
                    </select>
                </div>
            </div>

            <div className="table-container">
                <table className="team-table">
                    <thead>
                        <tr>
                            <th>S.No</th>
                            <th>Course ID</th>
                            <th>Course Name</th>
                            <th>Category</th>
                            <th>Employee Name</th>
                            <th>Request Date</th>
                            <th>Action Date</th>
                            <th style={{ textAlign: 'center' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {enrollments.length > 0 ? (
                            enrollments.map((enrollment, index) => (
                                <tr key={enrollment.id}>
                                    <td>{index + 1}</td>
                                    <td>{enrollment.courseId}</td>
                                    <td style={{ fontWeight: 500, color: '#1f2937' }}>{enrollment.courseName}</td>
                                    <td><span className="category-badge">{enrollment.category}</span></td>
                                    <td style={{ color: '#4b5563' }}>{enrollment.employeeName}</td>
                                    <td style={{ fontSize: '12px' }}>{formatDate(enrollment.requestDate)}</td>
                                    <td style={{ fontSize: '12px' }}>
                                        {formatDate(enrollment.responseDate)}
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        {enrollment.status === 'PENDING' ? (
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                <button
                                                    onClick={() => handleAction(enrollment.id, 'approve')}
                                                    style={{
                                                        backgroundColor: '#22c55e',
                                                        color: 'white',
                                                        border: 'none',
                                                        padding: '6px 12px',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer',
                                                        fontSize: '12px',
                                                        fontWeight: 600
                                                    }}
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleAction(enrollment.id, 'reject')}
                                                    style={{
                                                        backgroundColor: '#ef4444',
                                                        color: 'white',
                                                        border: 'none',
                                                        padding: '6px 12px',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer',
                                                        fontSize: '12px',
                                                        fontWeight: 600
                                                    }}
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        ) : (
                                            <span style={{
                                                padding: '4px 10px',
                                                borderRadius: '20px',
                                                fontSize: '12px',
                                                fontWeight: '700',
                                                backgroundColor: enrollment.status === 'APPROVED' ? '#dcfce7' : '#fee2e2',
                                                color: enrollment.status === 'APPROVED' ? '#166534' : '#991b1b'
                                            }}>
                                                {enrollment.status}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                                    No pending enrollment requests.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


// --- Main App Component ---

function ManagerDashboard() {
    return (
        <DataProvider>
            <Routes>
                <Route path="/" element={<ManagerLayout />}>
                    <Route index element={<DashboardHome />} />
                    <Route path="my-team" element={<MyTeam />} />
                    <Route path="my-team/:memberId" element={<TeamMemberDetails />} />
                    <Route path="active-courses" element={<ActiveCoursesPage />} />
                    <Route path="inactive-courses" element={<InactiveCoursesPage />} />
                    <Route path="assigned-courses" element={<AllAssignedCourses />} />
                    <Route path="course-management" element={<CourseManagement />} />
                    <Route path="course-management/:courseId" element={<CourseAssignment />} />
                    <Route path="enrollments" element={<CourseEnrollments />} />
                    <Route path="reports" element={<PlaceholderPage title="Reports" />} />
                    <Route path="settings" element={<PlaceholderPage title="Settings" />} />
                </Route>
                <Route path="profile" element={<ManagerProfile />} />
            </Routes>
        </DataProvider>
    );
}

const PlaceholderPage = ({ title }) => (
    <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #f3f4f6', marginTop: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937', marginBottom: '1rem' }}>{title}</h1>
        <p style={{ fontSize: '1.1rem', color: '#6b7280' }}>Welcome manager</p>
    </div>
);

export default ManagerDashboard;
