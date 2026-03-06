import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Trash2 } from 'lucide-react';
import './CourseManagement.css';

const CourseManagement = ({ onBack }) => {
    const navigate = useNavigate();
    const [courses, setCourses] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    const token = localStorage.getItem("token");

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            const response = await axios.get(
                "http://localhost:8080/admin/courses/all",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setCourses(response.data);
        } catch (error) {
            console.error("Error fetching courses:", error);
        }
    };

    const handleDelete = async (courseId, courseTitle) => {
        if (window.confirm(`Are you sure you want to delete the course "${courseTitle}"? This will also remove all assignments and enrollments.`)) {
            try {
                await axios.delete(`http://localhost:8080/admin/courses/${courseId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                alert("Course deleted successfully");
                setCourses(courses.filter(c => c.id !== courseId));
            } catch (error) {
                console.error("Error deleting course:", error);
                alert("Failed to delete course. Please try again.");
            }
        }
    };

    // Filter courses based on search term
    const filteredCourses = courses.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="course-management-container" style={{ position: 'relative' }}>
            <div className="header-with-arrow">
                <ArrowLeft
                    className="back-arrow-icon"
                    onClick={() => {
                        if (onBack) onBack();
                        else navigate('/admin');
                    }}
                />
                <h1 className="cm-header-title" style={{ marginBottom: 0 }}>Courses</h1>
            </div>

            <div className="cm-toolbar">
                <button
                    className="cm-new-course-btn"
                    onClick={() => navigate('/admin/courses/add')}
                >
                    + NEW COURSE
                </button>

                <div className="cm-search-container">
                    <input
                        type="text"
                        className="cm-search-input"
                        placeholder="Search Courses..."
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
                            <th>ID</th>
                            <th>Title</th>
                            <th>Created</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCourses.length > 0 ? (
                            filteredCourses.map((course) => (
                                <tr key={course.id}>
                                    <td style={{ color: '#9CA3AF' }}>
                                        {course.id}
                                    </td>

                                    <td className="cm-course-name">
                                        {course.title}
                                    </td>

                                    <td>
                                        {course.createdDate
                                            ? new Date(course.createdDate).toLocaleDateString()
                                            : "-"}
                                    </td>

                                    <td>
                                        <button
                                            className="cm-delete-btn"
                                            onClick={() => handleDelete(course.id, course.title)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: '#EF4444',
                                                cursor: 'pointer',
                                                padding: '5px'
                                            }}
                                            title="Delete Course"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" style={{ textAlign: "center", padding: "20px" }}>
                                    No Courses Found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CourseManagement;
