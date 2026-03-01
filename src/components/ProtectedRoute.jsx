import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
    const { currentUser, loading } = useAuth();

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="spinner" />
                <p>Loading...</p>
            </div>
        );
    }

    if (!currentUser) return <Navigate to="/login" replace />;
    if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
        return <Navigate to={`/${currentUser.role}`} replace />;
    }

    return children;
}
