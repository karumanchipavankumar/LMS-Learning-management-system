import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft } from 'lucide-react';
import './CourseManagement.css'; // Reusing CourseManagement styles for table consistency

const AllAssignedCourses = () => {
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
                "http://localhost:8080/admin/assigned-courses",
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setAssignments(response.data);
        } catch (error) {
            console.error("Error fetching assigned courses", error);
            if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                navigate('/');
            }
        }
    };

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
                    <h1 className="cm-header-title" style={{ marginBottom: 0 }}>Assigned Courses</h1>
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
                                <th>No of Employees</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAssignments.length > 0 ? (
                                filteredAssignments.map((a) => (
                                    <tr key={a.courseId}>
                                        <td style={{ color: '#9CA3AF' }}>#{a.courseId}</td>
                                        <td className="cm-course-name">{a.courseName}</td>
                                        <td style={{ paddingLeft: '24px', fontWeight: '600', color: '#6366F1' }}>
                                            {a.assignedEmployeeCount}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="3" style={{ textAlign: "center", padding: "20px" }}>
                                        No Assigned Courses Found
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

export default AllAssignedCourses;
