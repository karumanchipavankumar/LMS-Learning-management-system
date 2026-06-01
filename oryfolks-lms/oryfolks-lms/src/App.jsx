import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

// Lazy load page components for code-splitting and improved page navigation performance
const LoginPage = lazy(() => import('./LoginPage'));
const ForgotPassword = lazy(() => import('./ForgotPassword'));
const ResetPassword = lazy(() => import('./ResetPassword'));
const AdminDashboard = lazy(() => import('./AdminDashboard'));
const EmployeeDashboard = lazy(() => import('./EmployeeDashboard'));
const CoursePlayer = lazy(() => import('./CoursePlayer'));
const EmployeeProfile = lazy(() => import('./EmployeeProfile'));
const AddUser = lazy(() => import('./AddUser'));
const AddCourse = lazy(() => import('./AddCourse'));
const ManagerDashboard = lazy(() => import('./ManagerDashboard'));
const AllAssignedCourses = lazy(() => import('./AllAssignedCourses'));
const PendingCourses = lazy(() => import('./PendingCourses'));
const RecentAssignments = lazy(() => import('./RecentAssignments'));
const MyLearning = lazy(() => import('./MyLearning'));

const LoadingFallback = () => (
    <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        width: '100vw',
        backgroundColor: '#f8fafc',
        fontFamily: 'system-ui, sans-serif'
    }}>
        <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #e2e8f0',
            borderTopColor: '#f97316',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
        }}></div>
        <style>{`
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `}</style>
    </div>
);

function App() {
    return (
        <Router>
            <Suspense fallback={<LoadingFallback />}>
                <Routes>
                    <Route path="/" element={<LoginPage />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />

                    {/* Admin Routes */}
                    <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                        <Route path="/admin" element={<AdminDashboard />} />
                        <Route path="/admin/notifications" element={<AdminDashboard activeTabDefault="Notifications" />} />
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
            </Suspense>
        </Router>
    );
}

export default App;
