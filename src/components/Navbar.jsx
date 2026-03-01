import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Pill, LayoutDashboard, Video, Clock, Users, Activity, Home, Server, UserPlus, Calendar, MessageCircle, PhoneCall, HeartPulse } from 'lucide-react';

const roleNavItems = {
    patient: [
        { path: '/patient', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/patient/take-medicine', icon: Pill, label: 'Take Medicine' },
        { path: '/patient/history', icon: Clock, label: 'History' },
        { path: '/patient/vitals', icon: HeartPulse, label: 'Vitals' },
        { path: '/patient/video-call', icon: PhoneCall, label: 'Video Call' },
        { path: '/patient/chatbot', icon: MessageCircle, label: 'MediBot' },
    ],
    doctor: [
        { path: '/doctor', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/doctor/review', icon: Video, label: 'Review Clips' },
        { path: '/doctor/patients', icon: UserPlus, label: 'Patients' },
        { path: '/doctor/appointments', icon: Calendar, label: 'Appointments' },
        { path: '/doctor/video-call', icon: PhoneCall, label: 'Video Call' },
    ],
    caretaker: [
        { path: '/caretaker', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/caretaker/review', icon: Video, label: 'Review Clips' },
    ],
    admin: [
        { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/admin/users', icon: Users, label: 'Users' },
        { path: '/admin/logs', icon: Activity, label: 'Logs' },
        { path: '/admin/backend', icon: Server, label: 'Backend' },
    ],
};

const roleColors = {
    patient: 'var(--primary)',
    doctor: 'var(--success)',
    caretaker: 'var(--accent)',
    admin: 'var(--warning)',
};

export default function Navbar() {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const navItems = currentUser ? roleNavItems[currentUser.role] || [] : [];

    return (
        <nav className="navbar glass" style={{
            position: 'sticky',
            top: 0,
            zIndex: 100,
            padding: '0 24px',
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderRadius: 0,
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            borderBottom: '1px solid var(--border-glass)',
        }}>
            {/* Logo */}
            <Link to={currentUser ? `/${currentUser.role}` : '/'} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                textDecoration: 'none',
            }}>
                <span style={{ fontSize: '1.6rem' }}>💊</span>
                <span style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                }}>MEDIBOX</span>
            </Link>

            {/* Nav Links */}
            {currentUser && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                }}>
                    {navItems.map(item => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link key={item.path} to={item.path} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 14px',
                                borderRadius: 'var(--radius-md)',
                                fontSize: '0.85rem',
                                fontWeight: 500,
                                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                                background: isActive ? 'var(--primary-soft)' : 'transparent',
                                borderBottom: isActive ? `2px solid ${roleColors[currentUser.role]}` : '2px solid transparent',
                                transition: 'all var(--transition-fast)',
                                textDecoration: 'none',
                            }}>
                                <item.icon size={16} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            )}

            {/* Right Section */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {currentUser ? (
                    <>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '6px 12px',
                            borderRadius: 'var(--radius-full)',
                            background: 'var(--bg-glass-light)',
                            border: '1px solid var(--border-glass)',
                        }}>
                            <span style={{ fontSize: '1.2rem' }}>{currentUser.avatar}</span>
                            <div style={{ lineHeight: 1.2 }}>
                                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>{currentUser.name}</div>
                                <div style={{
                                    fontSize: '0.65rem',
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.08em',
                                    color: roleColors[currentUser.role],
                                }}>{currentUser.role}</div>
                            </div>
                        </div>
                        <button onClick={handleLogout} className="btn btn-ghost btn-sm" style={{ gap: '6px' }}>
                            <LogOut size={14} />
                            <span>Logout</span>
                        </button>
                    </>
                ) : (
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <Link to="/login" className="btn btn-ghost btn-sm">Login</Link>
                        <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
                    </div>
                )}
            </div>
        </nav>
    );
}
