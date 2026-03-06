import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ allowedRoles }) => {
    const token = localStorage.getItem('token');

    if (!token) {
        return <Navigate to="/" replace />;
    }

    try {
        // Decode JWT payload manually to avoid extra dependencies if not needed, 
        // but consistently with LoginPage
        const payload = JSON.parse(atob(token.split('.')[1]));
        const userRole = payload.role.replace('ROLE_', '');

        if (allowedRoles.includes(userRole)) {
            return <Outlet />;
        } else {
            // Redirect to appropriate dashboard based on role
            if (userRole === 'ADMIN') {
                return <Navigate to="/admin" replace />;
            } else if (userRole === 'MANAGER') {
                return <Navigate to="/manager" replace />;
            } else if (userRole === 'EMPLOYEE') {
                return <Navigate to="/employee" replace />;
            } else {
                return <Navigate to="/" replace />;
            }
        }
    } catch (error) {
        console.error("Invalid token:", error);
        localStorage.removeItem('token');
        return <Navigate to="/" replace />;
    }
};

export default ProtectedRoute;
