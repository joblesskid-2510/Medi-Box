import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import PatientDashboard from './pages/patient/Dashboard';
import TakeMedicine from './pages/patient/TakeMedicine';
import PatientHistory from './pages/patient/History';
import PatientVitals from './pages/patient/Vitals';
import DoctorDashboard from './pages/doctor/Dashboard';
import DoctorPatients from './pages/doctor/Patients';
import DoctorAppointments from './pages/doctor/Appointments';
import AdminDashboard from './pages/admin/Dashboard';
import AdminBackend from './pages/admin/Backend';
import VideoCall from './pages/VideoCall';
import Chatbot from './pages/Chatbot';

function AppRoutes() {
    const { currentUser } = useAuth();

    return (
        <Routes>
            {/* Public */}
            <Route path="/" element={currentUser ? <Navigate to={`/${currentUser.role}`} replace /> : <Landing />} />
            <Route path="/login" element={currentUser ? <Navigate to={`/${currentUser.role}`} replace /> : <Login />} />
            <Route path="/register" element={currentUser ? <Navigate to={`/${currentUser.role}`} replace /> : <Register />} />

            {/* Patient */}
            <Route path="/patient" element={
                <ProtectedRoute allowedRoles={['patient']}>
                    <PatientDashboard />
                </ProtectedRoute>
            } />
            <Route path="/patient/take-medicine" element={
                <ProtectedRoute allowedRoles={['patient']}>
                    <TakeMedicine />
                </ProtectedRoute>
            } />
            <Route path="/patient/history" element={
                <ProtectedRoute allowedRoles={['patient']}>
                    <PatientHistory />
                </ProtectedRoute>
            } />
            <Route path="/patient/video-call" element={
                <ProtectedRoute allowedRoles={['patient']}>
                    <VideoCall />
                </ProtectedRoute>
            } />
            <Route path="/patient/chatbot" element={
                <ProtectedRoute allowedRoles={['patient']}>
                    <Chatbot />
                </ProtectedRoute>
            } />
            <Route path="/patient/vitals" element={
                <ProtectedRoute allowedRoles={['patient']}>
                    <PatientVitals />
                </ProtectedRoute>
            } />

            {/* Doctor */}
            <Route path="/doctor" element={
                <ProtectedRoute allowedRoles={['doctor']}>
                    <DoctorDashboard />
                </ProtectedRoute>
            } />
            <Route path="/doctor/review" element={
                <ProtectedRoute allowedRoles={['doctor']}>
                    <DoctorDashboard />
                </ProtectedRoute>
            } />
            <Route path="/doctor/patients" element={
                <ProtectedRoute allowedRoles={['doctor']}>
                    <DoctorPatients />
                </ProtectedRoute>
            } />
            <Route path="/doctor/appointments" element={
                <ProtectedRoute allowedRoles={['doctor']}>
                    <DoctorAppointments />
                </ProtectedRoute>
            } />
            <Route path="/doctor/video-call" element={
                <ProtectedRoute allowedRoles={['doctor']}>
                    <VideoCall />
                </ProtectedRoute>
            } />

            {/* Caretaker — reuses doctor dashboard */}
            <Route path="/caretaker" element={
                <ProtectedRoute allowedRoles={['caretaker']}>
                    <DoctorDashboard />
                </ProtectedRoute>
            } />
            <Route path="/caretaker/review" element={
                <ProtectedRoute allowedRoles={['caretaker']}>
                    <DoctorDashboard />
                </ProtectedRoute>
            } />

            {/* Admin */}
            <Route path="/admin" element={
                <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
                <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                </ProtectedRoute>
            } />
            <Route path="/admin/logs" element={
                <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                </ProtectedRoute>
            } />
            <Route path="/admin/backend" element={
                <ProtectedRoute allowedRoles={['admin']}>
                    <AdminBackend />
                </ProtectedRoute>
            } />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default function App() {
    return (
        <>
            <div className="app-bg" />
            <Navbar />
            <AppRoutes />
        </>
    );
}
