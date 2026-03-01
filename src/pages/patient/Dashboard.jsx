import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getLogsByPatient, getFaceDescriptor, getPrescriptionsByPatient, getAppointmentsByPatient, createAlert, generateId } from '../../utils/db';
import { Pill, Clock, CheckCircle, AlertTriangle, BarChart3, Activity, Calendar, Flame, PhoneCall, MessageCircle, Heart as HeartIcon } from 'lucide-react';

// ─── Circular Progress Ring ─────────────────────
function ComplianceRing({ percentage, size = 120, stroke = 10 }) {
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;
    const color = percentage >= 80 ? '#22c55e' : percentage >= 50 ? '#eab308' : '#ef4444';

    return (
        <div style={{ position: 'relative', width: size, height: size }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
                    stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
                    stroke={color} strokeWidth={stroke}
                    strokeDasharray={circumference} strokeDashoffset={offset}
                    strokeLinecap="round"
                    style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 1s ease' }}
                />
            </svg>
            <div style={{
                position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
            }}>
                <span style={{ fontSize: '1.6rem', fontWeight: 800, color }}>{percentage}%</span>
                <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 600 }}>COMPLIANCE</span>
            </div>
        </div>
    );
}

// ─── Mini Bar Chart (daily intakes) ────────────
function DailyBars({ logs }) {
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayStr = date.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0);
        const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
        const dayEnd = dayStart + 86400000;
        const count = logs.filter(l => l.timestamp >= dayStart && l.timestamp < dayEnd).length;
        days.push({ day: dayStr, count });
    }
    const maxCount = Math.max(1, ...days.map(d => d.count));

    return (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: 60 }}>
            {days.map((d, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flex: 1 }}>
                    <div style={{
                        width: '100%', maxWidth: 20,
                        height: Math.max(4, (d.count / maxCount) * 44),
                        borderRadius: '4px 4px 2px 2px',
                        background: d.count > 0
                            ? 'linear-gradient(180deg, var(--primary), var(--accent))'
                            : 'rgba(255,255,255,0.06)',
                        transition: 'height 0.5s ease',
                    }} />
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 600 }}>{d.day}</span>
                </div>
            ))}
        </div>
    );
}

export default function PatientDashboard() {
    const { currentUser } = useAuth();
    const [logs, setLogs] = useState([]);
    const [faceEnrolled, setFaceEnrolled] = useState(true);
    const [prescriptions, setPrescriptions] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sosActive, setSosActive] = useState(false);
    const [sosSent, setSosSent] = useState(false);

    useEffect(() => {
        if (!currentUser) return;
        async function fetchData() {
            try {
                const [patientLogs, descriptor, rx, appts] = await Promise.all([
                    getLogsByPatient(currentUser.id),
                    getFaceDescriptor(currentUser.id),
                    getPrescriptionsByPatient(currentUser.id).catch(() => []),
                    getAppointmentsByPatient(currentUser.id).catch(() => []),
                ]);
                setLogs(patientLogs);
                setFaceEnrolled(!!descriptor);
                setPrescriptions(rx);
                setAppointments(appts.filter(a => a.status !== 'completed'));
            } catch (err) {
                console.error('Error loading dashboard:', err);
            }
            setLoading(false);
        }
        fetchData();
    }, [currentUser]);

    const handleSOS = async () => {
        setSosActive(true);
        try {
            await createAlert({
                id: generateId(),
                patientId: currentUser.id,
                patientName: currentUser.name,
                doctorId: currentUser.assignedDoctor || 'all',
                type: 'sos',
                message: `🚨 Emergency SOS from ${currentUser.name}`,
                status: 'active',
                timestamp: Date.now(),
            });
            setSosSent(true);
            setTimeout(() => { setSosActive(false); setSosSent(false); }, 5000);
        } catch (err) {
            console.error(err);
            setSosActive(false);
        }
    };

    if (loading) return <div className="loading-screen"><div className="spinner" /><p>Loading dashboard...</p></div>;

    const total = logs.length;
    const verified = logs.filter(l => l.status === 'verified').length;
    const pending = logs.filter(l => l.status === 'pending').length;
    const complianceRate = total > 0 ? Math.round((verified / total) * 100) : 0;

    // Streak calculation
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
        const dayEnd = dayStart + 86400000;
        const hasLog = logs.some(l => l.timestamp >= dayStart && l.timestamp < dayEnd);
        if (hasLog) streak++;
        else break;
    }

    // Next medicine time
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    let nextMedicine = null;
    for (const rx of prescriptions) {
        for (const t of (rx.times || [])) {
            const [h, m] = t.split(':').map(Number);
            const medMinutes = h * 60 + m;
            if (medMinutes > currentMinutes) {
                if (!nextMedicine || medMinutes < nextMedicine.minutes) {
                    nextMedicine = { name: rx.medicineName, time: t, minutes: medMinutes };
                }
            }
        }
    }

    const formatTime = (t) => {
        const [h, m] = t.split(':').map(Number);
        const ampm = h >= 12 ? 'PM' : 'AM';
        return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${ampm}`;
    };

    return (
        <div className="page">
            <style>{`
                .sos-btn { animation: sos-pulse 1.5s ease-in-out infinite; }
                @keyframes sos-pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); } 50% { box-shadow: 0 0 0 16px rgba(239,68,68,0); } }
                .reminder-glow { animation: glow 2s ease-in-out infinite alternate; }
                @keyframes glow { 0% { box-shadow: 0 0 8px rgba(0,212,255,0.1); } 100% { box-shadow: 0 0 16px rgba(0,212,255,0.2); } }
            `}</style>

            <div className="page-header animate-in">
                <h1>Welcome back, {currentUser?.name?.split(' ')[0]} 👋</h1>
                <p>Your medicine tracking dashboard</p>
            </div>

            {/* Face enrollment warning */}
            {!faceEnrolled && (
                <div className="glass animate-in" style={{
                    padding: '20px 24px', marginBottom: '24px',
                    display: 'flex', alignItems: 'center', gap: '12px',
                    borderLeft: '4px solid var(--warning)',
                }}>
                    <AlertTriangle size={20} style={{ color: 'var(--warning)', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, marginBottom: '4px' }}>Face not enrolled</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            You need to enroll your face before you can take medicine. Ask your doctor to re-enroll.
                        </div>
                    </div>
                </div>
            )}

            {/* Stats */}
            <div className="grid-4" style={{ marginBottom: '24px' }}>
                {[
                    { icon: Pill, label: 'Total Intakes', value: total, color: 'var(--primary)' },
                    { icon: CheckCircle, label: 'Verified', value: verified, color: 'var(--success)' },
                    { icon: Clock, label: 'Pending Review', value: pending, color: 'var(--warning)' },
                    { icon: Flame, label: 'Day Streak', value: `${streak}🔥`, color: '#f97316' },
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

            {/* Compliance + Daily Chart */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div className="glass animate-in" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <ComplianceRing percentage={complianceRate} />
                    <div>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '8px' }}>
                            <BarChart3 size={16} style={{ color: 'var(--primary)' }} /> Weekly Compliance
                        </h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                            {complianceRate >= 80 ? '🎉 Excellent adherence! Keep it up!' :
                                complianceRate >= 50 ? '⚡ Good progress, try to stay on schedule.' :
                                    '💪 Let\'s work on improving your routine.'}
                        </p>
                    </div>
                </div>

                <div className="glass animate-in" style={{ padding: '24px' }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        📊 Daily Intake (7 days)
                    </h3>
                    <DailyBars logs={logs} />
                </div>
            </div>

            {/* Next Medicine + Quick Action */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                {/* Next Medicine Reminder */}
                <div className="glass reminder-glow animate-in" style={{
                    padding: '24px', borderLeft: '4px solid var(--primary)',
                }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        🔔 Next Medicine
                    </h3>
                    {nextMedicine ? (
                        <div>
                            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '4px' }}>
                                {formatTime(nextMedicine.time)}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                💊 {nextMedicine.name}
                            </div>
                        </div>
                    ) : prescriptions.length > 0 ? (
                        <div style={{ color: 'var(--success)', fontSize: '0.9rem' }}>
                            ✅ All medicines taken for today!
                        </div>
                    ) : (
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            No medicines prescribed yet.
                        </div>
                    )}
                </div>

                {/* Quick Action */}
                <div className="glass glass-hover animate-in" style={{ padding: '24px', textAlign: 'center' }}>
                    <span style={{ fontSize: '2.4rem', display: 'block', marginBottom: '12px' }}>💊</span>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '6px' }}>Time to take medicine?</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '0.8rem' }}>
                        Verified intake with face recognition
                    </p>
                    <Link to="/patient/take-medicine" className="btn btn-primary"
                        style={{ pointerEvents: faceEnrolled ? 'auto' : 'none', opacity: faceEnrolled ? 1 : 0.5, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <Pill size={16} /> Take Medicine Now
                    </Link>
                </div>
            </div>

            {/* Medicine Schedule */}
            {prescriptions.length > 0 && (
                <div className="glass animate-in" style={{ padding: '24px', marginBottom: '24px' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '1rem', fontWeight: 700 }}>
                        💊 Your Medicine Schedule
                        <span style={{ marginLeft: 'auto', fontSize: '0.75rem', fontWeight: 600, padding: '4px 12px', borderRadius: 'var(--radius-full)', background: 'rgba(255,171,0,0.08)', color: 'var(--warning)' }}>
                            {prescriptions.length} medicine{prescriptions.length > 1 ? 's' : ''}
                        </span>
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {prescriptions.map(rx => (
                            <div key={rx.id} className="glass-light" style={{
                                padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '14px',
                                borderLeft: '3px solid var(--warning)',
                            }}>
                                <span style={{ fontSize: '1.2rem' }}>💊</span>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{rx.medicineName}</div>
                                    {rx.dosage && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{rx.dosage}</div>}
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {(rx.times || []).map(t => (
                                        <span key={t} style={{
                                            padding: '4px 10px', borderRadius: 'var(--radius-full)',
                                            background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.15)',
                                            fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)',
                                            display: 'flex', alignItems: 'center', gap: '4px',
                                        }}>
                                            <Clock size={11} /> {formatTime(t)}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Upcoming Appointments */}
            {appointments.length > 0 && (
                <div className="glass animate-in" style={{ padding: '24px', marginBottom: '24px' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '1rem', fontWeight: 700 }}>
                        <Calendar size={18} style={{ color: 'var(--accent)' }} /> Upcoming Appointments
                        <span style={{ marginLeft: 'auto', fontSize: '0.75rem', fontWeight: 600, padding: '4px 12px', borderRadius: 'var(--radius-full)', background: 'rgba(0,212,255,0.08)', color: 'var(--primary)' }}>
                            {appointments.length}
                        </span>
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {appointments.slice(0, 3).map(apt => {
                            const typeEmoji = { 'check-up': '🩺', 'follow-up': '📋', 'video-call': '📹', 'emergency': '🚨' }[apt.type] || '📅';
                            return (
                                <div key={apt.id} className="glass-light" style={{
                                    padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px',
                                    borderLeft: `3px solid var(--accent)`,
                                }}>
                                    <span style={{ fontSize: '1.3rem' }}>{typeEmoji}</span>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                                            {apt.type?.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                        </div>
                                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                            Dr. {apt.doctorName || 'Your Doctor'} • {apt.notes || 'No notes'}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent)' }}>
                                            {new Date(apt.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{apt.time}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Quick Links */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
                <Link to="/patient/video-call" className="glass glass-hover" style={{
                    padding: '20px', textAlign: 'center', textDecoration: 'none', color: 'inherit',
                }}>
                    <PhoneCall size={24} style={{ color: 'var(--primary)', marginBottom: '8px' }} />
                    <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>Video Call</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Talk to doctor</div>
                </Link>
                <Link to="/patient/chatbot" className="glass glass-hover" style={{
                    padding: '20px', textAlign: 'center', textDecoration: 'none', color: 'inherit',
                }}>
                    <MessageCircle size={24} style={{ color: '#8b5cf6', marginBottom: '8px' }} />
                    <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>MediBot</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Health questions</div>
                </Link>
                <Link to="/patient/vitals" className="glass glass-hover" style={{
                    padding: '20px', textAlign: 'center', textDecoration: 'none', color: 'inherit',
                }}>
                    <HeartIcon size={24} style={{ color: '#ef4444', marginBottom: '8px' }} />
                    <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>Vitals</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Track health</div>
                </Link>
            </div>

            {/* Recent Activity */}
            <div className="glass animate-in" style={{ padding: '24px' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', fontWeight: 700, marginBottom: '16px' }}>
                    <Activity size={18} style={{ color: 'var(--primary)' }} /> Recent Activity
                </h3>
                {logs.length === 0 ? (
                    <div className="empty-state" style={{ padding: '32px' }}>
                        <Pill size={48} style={{ opacity: 0.3 }} />
                        <h3>No records yet</h3>
                        <p style={{ fontSize: '0.85rem' }}>Take your first medicine to see activity here</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {logs.slice(0, 5).map(log => (
                            <div key={log.id} className="glass-light" style={{
                                padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{ fontSize: '1.3rem' }}>💊</span>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{log.medicineName || 'Medicine Dose'}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                            {new Date(log.timestamp).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                                <span className={`badge badge-${log.status}`}>
                                    {log.status === 'verified' && <CheckCircle size={12} />}
                                    {log.status === 'pending' && <Clock size={12} />}
                                    {log.status}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Emergency SOS Button */}
            <button
                onClick={handleSOS}
                disabled={sosActive}
                className={sosActive ? '' : 'sos-btn'}
                style={{
                    position: 'fixed', bottom: '32px', right: '32px', zIndex: 100,
                    width: '64px', height: '64px', borderRadius: '50%',
                    background: sosSent ? 'var(--success)' : 'linear-gradient(135deg, #ef4444, #dc2626)',
                    border: 'none', cursor: sosActive ? 'default' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: sosSent ? '1.3rem' : '0.7rem', fontWeight: 800, color: '#fff',
                    boxShadow: '0 4px 20px rgba(239,68,68,0.4)',
                    transition: 'all 0.3s ease',
                }}
            >
                {sosSent ? '✓' : 'SOS'}
            </button>
        </div>
    );
}
