import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Search } from 'lucide-react';
import './CourseManagement.css'; // Reusing styles for consistency

const RecentAssignments = () => {
    const navigate = useNavigate();
    const [assignments, setAssignments] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

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
                "http://localhost:8080/admin/dashboard/recent-assignments",
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setAssignments(response.data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching recent assignments", error);
            if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                navigate('/');
            }
            setLoading(false);
        }
    };

    const filteredAssignments = assignments.filter(a =>
        a.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.employeeName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#6366F1' }}>Loading...</div>;
    }

    return (
        <div className="standalone-page-layout">
            <div className="course-management-container">
                <div className="header-with-arrow">
                    <ArrowLeft
                        className="back-arrow-icon"
                        onClick={() => navigate('/admin')}
                    />
                    <h1 className="cm-header-title" style={{ marginBottom: 0 }}>All Recent Assignments</h1>
                </div>

                <div className="cm-toolbar">
                    <div className="cm-search-container">
                        <input
                            type="text"
                            className="cm-search-input"
                            placeholder="Search by Course or Employee..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Search className="cm-search-icon" size={18} />
                    </div>
                </div>

                <div className="cm-table-container">
                    <table className="cm-table">
                        <thead>
                            <tr>
                                <th>Course ID</th>
                                <th>Course Name</th>
                                <th>Employee Name</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAssignments.length > 0 ? (
                                filteredAssignments.map((a, index) => (
                                    <tr key={`${a.courseId}-${index}`}>
                                        <td style={{ color: '#9CA3AF' }}>#{a.courseId}</td>
                                        <td className="cm-course-name" style={{ fontWeight: '600' }}>{a.courseName}</td>
                                        <td>{a.employeeName}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="3" style={{ textAlign: "center", padding: "20px", color: '#9CA3AF' }}>
                                        No recent assignments found matching your search.
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

export default RecentAssignments;
