import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const ProtectedRoute = ({ allowedRoles }) => {
    const token = localStorage.getItem('token');

    if (!token) {
        return <Navigate to="/" replace />;
    }

    try {
        let payload;
        try {
            payload = jwtDecode(token);
        } catch (e) {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            payload = JSON.parse(window.atob(base64));
        }

        const rawRole = payload.role || payload.roles || '';
        const userRole = (typeof rawRole === 'string' ? rawRole : (Array.isArray(rawRole) ? rawRole[0] : '')).replace('ROLE_', '');

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
