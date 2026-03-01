import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getUsers, getMedicineLogs, getAppSettings, updateAppSettings } from '../../utils/db';
import { Users, Pill, CheckCircle, Clock, Shield, BarChart3, Activity, XCircle, Brain, Zap } from 'lucide-react';

export default function AdminDashboard() {
    const { currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mlEnabled, setMlEnabled] = useState(false);
    const [mlToggling, setMlToggling] = useState(false);

    useEffect(() => {
        async function fetchData() {
            try {
                const [allUsers, allLogs, settings] = await Promise.all([
                    getUsers(),
                    getMedicineLogs(),
                    getAppSettings(),
                ]);
                setUsers(allUsers);
                setLogs(allLogs);
                setMlEnabled(settings.mlPillDetection || false);
            } catch (err) {
                console.error('Error loading admin data:', err);
            }
            setLoading(false);
        }
        fetchData();
    }, []);

    const handleMlToggle = async () => {
        setMlToggling(true);
        const newValue = !mlEnabled;
        try {
            await updateAppSettings({ mlPillDetection: newValue });
            setMlEnabled(newValue);
        } catch (err) {
            console.error('Failed to update ML setting:', err);
        }
        setMlToggling(false);
    };

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="spinner" />
                <p>Loading admin panel...</p>
            </div>
        );
    }

    const verified = logs.filter(l => l.status === 'verified').length;
    const pending = logs.filter(l => l.status === 'pending').length;
    const rejected = logs.filter(l => l.status === 'rejected').length;
    const patients = users.filter(u => u.role === 'patient');
    const doctors = users.filter(u => u.role === 'doctor');
    const caretakers = users.filter(u => u.role === 'caretaker');

    return (
        <div className="page">
            {/* Toggle switch styles */}
            <style>{`
                .ml-toggle-track {
                    width: 56px; height: 30px;
                    border-radius: 15px;
                    background: rgba(255,255,255,0.08);
                    border: 2px solid rgba(255,255,255,0.12);
                    position: relative;
                    cursor: pointer;
                    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                    flex-shrink: 0;
                }
                .ml-toggle-track.active {
                    background: rgba(16,185,129,0.2);
                    border-color: rgba(16,185,129,0.5);
                    box-shadow: 0 0 20px rgba(16,185,129,0.3);
                }
                .ml-toggle-track.toggling {
                    opacity: 0.6;
                    pointer-events: none;
                }
                .ml-toggle-thumb {
                    width: 22px; height: 22px;
                    border-radius: 50%;
                    background: var(--text-muted);
                    position: absolute;
                    top: 2px; left: 3px;
                    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                .ml-toggle-track.active .ml-toggle-thumb {
                    left: 27px;
                    background: var(--success);
                    box-shadow: 0 0 10px rgba(16,185,129,0.6);
                }
                .ml-card-glow {
                    transition: all 0.5s ease;
                }
                .ml-card-glow.active {
                    border-color: rgba(16,185,129,0.3) !important;
                    box-shadow: 0 0 30px rgba(16,185,129,0.08);
                }
                @keyframes pulse-brain {
                    0%, 100% { transform: scale(1); opacity: 0.8; }
                    50% { transform: scale(1.1); opacity: 1; }
                }
            `}</style>

            <div className="page-header animate-in">
                <h1>🛡️ Admin Dashboard</h1>
                <p>System overview and management</p>
            </div>

            {/* Stats */}
            <div className="grid-4" style={{ marginBottom: '32px' }}>
                {[
                    { icon: Users, label: 'Total Users', value: users.length, color: 'var(--primary)' },
                    { icon: Pill, label: 'Total Intakes', value: logs.length, color: 'var(--accent)' },
                    { icon: CheckCircle, label: 'Verified', value: verified, color: 'var(--success)' },
                    { icon: Clock, label: 'Pending', value: pending, color: 'var(--warning)' },
                ].map((s, i) => (
                    <div key={i} className="glass stat-card glass-hover animate-slide-up" style={{
                        animationDelay: `${i * 0.1}s`, opacity: 0,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <s.icon size={18} style={{ color: s.color }} />
                            <span className="stat-label">{s.label}</span>
                        </div>
                        <span className="stat-value" style={{
                            background: `linear-gradient(135deg, ${s.color}, var(--text-primary))`,
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                        }}>{s.value}</span>
                    </div>
                ))}
            </div>

            {/* AI & ML Settings */}
            <div className={`glass animate-in ml-card-glow ${mlEnabled ? 'active' : ''}`} style={{
                padding: '28px', marginBottom: '32px',
                borderLeft: `3px solid ${mlEnabled ? 'var(--success)' : 'rgba(255,255,255,0.1)'}`,
                transition: 'border-color 0.5s ease',
            }}>
                <h3 style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    marginBottom: '20px', fontSize: '1.05rem', fontWeight: 700,
                }}>
                    <Brain size={20} style={{
                        color: mlEnabled ? 'var(--success)' : 'var(--text-muted)',
                        animation: mlEnabled ? 'pulse-brain 2s ease-in-out infinite' : 'none',
                        transition: 'color 0.5s ease',
                    }} />
                    AI & ML Settings
                    <span style={{
                        fontSize: '0.65rem', fontWeight: 700, marginLeft: 'auto',
                        padding: '4px 12px', borderRadius: 'var(--radius-full)',
                        background: mlEnabled ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${mlEnabled ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.1)'}`,
                        color: mlEnabled ? 'var(--success)' : 'var(--text-muted)',
                        letterSpacing: '0.08em', textTransform: 'uppercase',
                        transition: 'all 0.5s ease',
                    }}>
                        {mlEnabled ? '● ENABLED' : '○ DISABLED'}
                    </span>
                </h3>

                <div className="glass-light" style={{
                    padding: '20px 24px',
                    display: 'flex', alignItems: 'center', gap: '20px',
                }}>
                    <div style={{
                        width: '48px', height: '48px', borderRadius: 'var(--radius-md)',
                        background: mlEnabled ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.03)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.5s ease',
                        flexShrink: 0,
                    }}>
                        <Zap size={24} style={{
                            color: mlEnabled ? 'var(--success)' : 'var(--text-muted)',
                            transition: 'color 0.5s ease',
                        }} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{
                            fontWeight: 700, fontSize: '0.95rem', marginBottom: '4px',
                        }}>
                            ML Pill Detection Model
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                            {mlEnabled ? (
                                <>AI model is <strong style={{ color: 'var(--success)' }}>actively analyzing</strong> video clips to verify pill intake. Patients must show pill consumption on camera for automatic detection.</>
                            ) : (
                                <>AI model is <strong style={{ color: 'var(--text-muted)' }}>turned off</strong>. Medicine intake clips will be saved without automatic ML verification. Manual review by doctors is still required.</>
                            )}
                        </div>
                    </div>
                    <div
                        className={`ml-toggle-track ${mlEnabled ? 'active' : ''} ${mlToggling ? 'toggling' : ''}`}
                        onClick={handleMlToggle}
                        title={mlEnabled ? 'Click to disable ML detection' : 'Click to enable ML detection'}
                    >
                        <div className="ml-toggle-thumb" />
                    </div>
                </div>
            </div>

            {/* Users by Role + System Health */}
            <div className="grid-2" style={{ marginBottom: '32px' }}>
                <div className="glass animate-in" style={{ padding: '24px' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '1rem', fontWeight: 700 }}>
                        <Users size={18} style={{ color: 'var(--primary)' }} /> Users by Role
                    </h3>
                    {[
                        { emoji: '😷', label: 'Patients', count: patients.length },
                        { emoji: '👩‍⚕️', label: 'Doctors', count: doctors.length },
                        { emoji: '🧑‍🤝‍🧑', label: 'Caretakers', count: caretakers.length },
                    ].map((r, i) => (
                        <div key={i} className="glass-light" style={{
                            padding: '14px 16px',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            marginBottom: '8px',
                        }}>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <span>{r.emoji}</span>
                                <span style={{ fontWeight: 600 }}>{r.label}</span>
                            </div>
                            <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{r.count}</span>
                        </div>
                    ))}
                </div>

                <div className="glass animate-in" style={{ padding: '24px' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '1rem', fontWeight: 700 }}>
                        <BarChart3 size={18} style={{ color: 'var(--primary)' }} /> System Health
                    </h3>
                    {[
                        { label: 'Face Recognition', status: 'ACTIVE', color: 'var(--success)' },
                        { label: 'Video Recording', status: 'ACTIVE', color: 'var(--success)' },
                        { label: 'ML Pill Detection', status: mlEnabled ? 'ACTIVE' : 'OFF', color: mlEnabled ? 'var(--success)' : 'var(--text-muted)' },
                        { label: 'Review System', status: 'ACTIVE', color: 'var(--success)' },
                        { label: 'Database', status: 'FIREBASE', color: 'var(--primary)' },
                    ].map((h, i) => (
                        <div key={i} className="glass-light" style={{
                            padding: '14px 16px',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            marginBottom: '8px',
                        }}>
                            <span style={{ fontWeight: 500 }}>{h.label}</span>
                            <span style={{ color: h.color, fontWeight: 700, fontSize: '0.8rem' }}>{h.status}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* All Registered Users */}
            <div className="glass animate-in" style={{ padding: '24px', marginBottom: '32px' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '1rem', fontWeight: 700 }}>
                    <Shield size={18} style={{ color: 'var(--warning)' }} /> All Registered Users
                </h3>
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Joined</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id}>
                                    <td style={{ fontWeight: 600 }}>
                                        <span style={{ marginRight: '8px' }}>{user.avatar || '👤'}</span>{user.name}
                                    </td>
                                    <td>{user.email}</td>
                                    <td>
                                        <span className={`badge badge-${user.role === 'admin' ? 'verified' : user.role === 'doctor' ? 'pending' : 'default'}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td style={{ color: 'var(--text-muted)' }}>
                                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* All Logs */}
            <div className="glass animate-in" style={{ padding: '24px' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '1rem', fontWeight: 700 }}>
                    <Activity size={18} style={{ color: 'var(--accent)' }} /> All Medicine Logs
                </h3>
                {logs.length === 0 ? (
                    <div className="empty-state">
                        <Pill size={48} />
                        <h3>No logs yet</h3>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {logs.map(log => (
                            <div key={log.id} className="glass-light" style={{
                                padding: '14px 16px',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            }}>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{log.patientName}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        {log.medicineName || 'Medicine Dose'} • {new Date(log.timestamp).toLocaleString()}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {log.reviewedBy && (
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>by {log.reviewedBy}</span>
                                    )}
                                    <span className={`badge badge-${log.status === 'rejected' ? 'missed' : log.status}`}>
                                        {log.status === 'verified' && <CheckCircle size={12} />}
                                        {log.status === 'pending' && <Clock size={12} />}
                                        {log.status === 'rejected' && <XCircle size={12} />}
                                        {log.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
