import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';

const ProtectedRoute = ({ children, requiredRole = null, allowedRoles = [] }) => {
    const { isAuthenticated, user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
            </div>
        );
    }

    if (!isAuthenticated()) {
        return <Navigate to="/login" replace />;
    }

    // Allow admin override, otherwise enforce allowedRoles/requiredRole
    const roleAllowed =
        user?.isAdmin ||
        (allowedRoles.length === 0 && !requiredRole) ||
        (allowedRoles.length > 0 && allowedRoles.includes(user?.role)) ||
        (requiredRole && user?.role === requiredRole);

    if (!roleAllowed) {
        return <Navigate to="/dashboard/admin" replace />;
    }

    return children;
};

export default ProtectedRoute;
