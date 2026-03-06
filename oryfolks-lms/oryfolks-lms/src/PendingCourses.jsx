import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft } from 'lucide-react';
import './CourseManagement.css'; // Reusing styles

const PendingCourses = () => {
    const navigate = useNavigate();
    const [assignments, setAssignments] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate('/');
            return;
        }
        fetchAssignments();
    }, []);

    const fetchAssignments = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(
                "http://localhost:8080/admin/pending-courses",
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setAssignments(response.data);
        } catch (error) {
            console.error("Error fetching pending courses", error);
            if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                navigate('/');
            }
        }
    };

    const handleDeleteCourse = async (id) => {
        if (!window.confirm("Are you sure you want to delete this course?")) return;
        try {
            const token = localStorage.getItem("token");
            await axios.delete(
                `http://localhost:8080/admin/courses/${id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchAssignments(); // refresh list
        } catch (error) {
            console.error("Delete failed", error);
        }
    };

    // Filter assignments based on search term
    const filteredAssignments = assignments.filter(a =>
        a.courseName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="standalone-page-layout">
            <div className="course-management-container">
                <div className="header-with-arrow">
                    <ArrowLeft
                        className="back-arrow-icon"
                        onClick={() => navigate('/admin')}
                    />
                    <h1 className="cm-header-title" style={{ marginBottom: 0 }}>Un Assigned Courses</h1>
                </div>

                <div className="cm-toolbar">
                    <div className="cm-search-container">
                        <input
                            type="text"
                            className="cm-search-input"
                            placeholder="Search by Course Name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <svg className="cm-search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>

                <div className="cm-table-container">
                    <table className="cm-table">
                        <thead>
                            <tr>
                                <th>Course ID</th>
                                <th>Course Name</th>
                                <th>Created Date</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAssignments.length > 0 ? (
                                filteredAssignments.map((a) => (
                                    <tr key={a.courseId}>
                                        <td style={{ color: '#9CA3AF' }}>#{a.courseId}</td>
                                        <td className="cm-course-name">{a.courseName}</td>
                                        <td style={{ color: '#4B5563' }}>
                                            {a.createdDate ? new Date(a.createdDate).toLocaleDateString() : 'N/A'}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <svg
                                                    style={{ width: '20px', height: '20px', cursor: 'pointer', color: '#EF4444' }}
                                                    onClick={() => handleDeleteCourse(a.courseId)}
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
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" style={{ textAlign: "center", padding: "20px" }}>
                                        No Un Assigned Courses Found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default PendingCourses;
