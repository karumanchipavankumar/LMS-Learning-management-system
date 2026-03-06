import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './LoginPage';
import AdminDashboard from './AdminDashboard';
import EmployeeDashboard from './EmployeeDashboard';
import CoursePlayer from './CoursePlayer';
import EmployeeProfile from './EmployeeProfile';
import AddUser from './AddUser';
import AddCourse from './AddCourse';
import ManagerDashboard from './ManagerDashboard';
import AllAssignedCourses from './AllAssignedCourses';
import PendingCourses from './PendingCourses';
import RecentAssignments from './RecentAssignments';
import MyLearning from './MyLearning';
import ProtectedRoute from './ProtectedRoute';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<LoginPage />} />

                {/* Admin Routes */}
                <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/admin/add-user" element={<AddUser />} />
                    <Route path="/admin/courses/add" element={<AddCourse />} />
                    <Route path="/admin/all-assigned-courses" element={<AllAssignedCourses />} />
                    <Route path="/admin/pending-courses" element={<PendingCourses />} />
                    <Route path="/admin/recent-assignments" element={<RecentAssignments />} />
                </Route>

                {/* Employee Routes */}
                <Route element={<ProtectedRoute allowedRoles={['EMPLOYEE']} />}>
                    <Route path="/employee" element={<EmployeeDashboard />} />
                    <Route path="/employee/my-learning" element={<MyLearning />} />
                    <Route path="/employee/profile" element={<EmployeeProfile />} />
                    <Route path="/course/:courseId" element={<CoursePlayer />} />
                </Route>

                {/* Manager Routes */}
                <Route element={<ProtectedRoute allowedRoles={['MANAGER']} />}>
                    <Route path="/manager/*" element={<ManagerDashboard />} />
                </Route>
            </Routes>
        </Router>
    );
}

export default App;
