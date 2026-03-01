import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react';

const roleTabs = [
    { key: 'patient', label: 'Patient', emoji: '😷', color: 'var(--primary)' },
    { key: 'doctor', label: 'Doctor', emoji: '👩‍⚕️', color: 'var(--success)' },
    { key: 'caretaker', label: 'Caretaker', emoji: '🧑‍🤝‍🧑', color: 'var(--accent)' },
    { key: 'admin', label: 'Admin', emoji: '🛡️', color: 'var(--warning)' },
];

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [activeRole, setActiveRole] = useState('patient');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const result = await login(email, password);
        if (result.success) {
            navigate(`/${result.user.role}`);
        } else {
            setError(result.error);
        }
        setLoading(false);
    };

    const fillDemo = (role) => {
        const demos = {
            doctor: { email: 'doctor@medibox.com', password: 'doctor123' },
            caretaker: { email: 'caretaker@medibox.com', password: 'care123' },
            admin: { email: 'admin@medibox.com', password: 'admin123' },
        };
        if (demos[role]) {
            setEmail(demos[role].email);
            setPassword(demos[role].password);
            setActiveRole(role);
        }
    };

    return (
        <div style={{
            minHeight: 'calc(100vh - 64px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
        }}>
            <div className="glass animate-in" style={{
                width: '100%',
                maxWidth: '460px',
                padding: '40px',
            }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <span style={{ fontSize: '3rem', display: 'block', marginBottom: '12px' }}>💊</span>
                    <h1 style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '1.5rem',
                        fontWeight: 700,
                        marginBottom: '8px',
                    }}>Welcome Back</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Sign in to your MediBox account
                    </p>
                </div>

                {/* Role Tabs */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '4px',
                    padding: '4px',
                    background: 'var(--bg-surface)',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '24px',
                }}>
                    {roleTabs.map(tab => (
                        <button key={tab.key} onClick={() => { setActiveRole(tab.key); fillDemo(tab.key); }} style={{
                            padding: '10px 4px',
                            borderRadius: 'var(--radius-sm)',
                            background: activeRole === tab.key ? `${tab.color}20` : 'transparent',
                            border: activeRole === tab.key ? `1px solid ${tab.color}40` : '1px solid transparent',
                            color: activeRole === tab.key ? tab.color : 'var(--text-muted)',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all var(--transition-fast)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '4px',
                        }}>
                            <span style={{ fontSize: '1.2rem' }}>{tab.emoji}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Error */}
                {error && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px',
                        borderRadius: 'var(--radius-md)',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: 'var(--danger)',
                        fontSize: '0.85rem',
                        marginBottom: '16px',
                    }}>
                        <AlertCircle size={16} /> {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="input-group">
                        <label><Mail size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} />Email</label>
                        <input
                            type="email"
                            className="input"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="your@email.com"
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label><Lock size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} />Password</label>
                        <input
                            type="password"
                            className="input"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary btn-lg" style={{ marginTop: '8px' }} disabled={loading}>
                        <LogIn size={18} /> {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <div style={{
                    textAlign: 'center',
                    marginTop: '24px',
                    color: 'var(--text-muted)',
                    fontSize: '0.85rem',
                }}>
                    Don't have an account?{' '}
                    <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>Register here</Link>
                </div>
            </div>
        </div>
    );
}
