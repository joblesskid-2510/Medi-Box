import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getUsersByRole, saveAppointment, getAppointmentsByDoctor, updateAppointment, deleteAppointment, generateId } from '../../utils/db';
import { Calendar, Clock, User, Plus, X, CheckCircle, Trash2, AlertCircle, Video, FileText } from 'lucide-react';

const TIMES = [];
for (let h = 8; h <= 20; h++) {
    for (let m = 0; m < 60; m += 30) {
        const hr = h > 12 ? h - 12 : h === 0 ? 12 : h;
        const period = h >= 12 ? 'PM' : 'AM';
        TIMES.push({ value: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`, label: `${hr}:${String(m).padStart(2, '0')} ${period}` });
    }
}

export default function Appointments() {
    const { currentUser } = useAuth();
    const [appointments, setAppointments] = useState([]);
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [form, setForm] = useState({ patientId: '', date: '', time: '', type: 'checkup', notes: '' });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => { fetchData(); }, []);

    async function fetchData() {
        try {
            const [appts, pts] = await Promise.all([
                getAppointmentsByDoctor(currentUser.id),
                getUsersByRole('patient'),
            ]);
            setAppointments(appts.sort((a, b) => {
                const da = `${a.date}T${a.time}`, db2 = `${b.date}T${b.time}`;
                return da > db2 ? 1 : -1;
            }));
            setPatients(pts);
        } catch (err) { console.error('Error:', err); }
        setLoading(false);
    }

    const toast = (msg) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 4000); };

    const handleSave = async () => {
        if (!form.patientId || !form.date || !form.time) { setError('Patient, date, and time are required'); return; }
        setSaving(true); setError('');
        try {
            const patient = patients.find(p => p.id === form.patientId);
            const appt = {
                id: generateId(),
                doctorId: currentUser.id,
                doctorName: currentUser.name,
                patientId: form.patientId,
                patientName: patient?.name || 'Unknown',
                date: form.date,
                time: form.time,
                type: form.type,
                notes: form.notes,
                status: 'scheduled',
                createdAt: Date.now(),
            };
            await saveAppointment(appt);
            setAppointments(prev => [...prev, appt].sort((a, b) => `${a.date}T${a.time}` > `${b.date}T${b.time}` ? 1 : -1));
            setShowAdd(false);
            setForm({ patientId: '', date: '', time: '', type: 'checkup', notes: '' });
            toast(`✅ Appointment booked!`);
        } catch (err) { setError(err.message); }
        setSaving(false);
    };

    const handleComplete = async (id) => {
        await updateAppointment(id, { status: 'completed' });
        setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'completed' } : a));
        toast('✅ Marked complete');
    };

    const handleDelete = async (id) => {
        await deleteAppointment(id);
        setAppointments(prev => prev.filter(a => a.id !== id));
        toast('✅ Appointment removed');
    };

    const formatDate = (d) => {
        const date = new Date(d + 'T00:00:00');
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };

    const formatTime = (t) => {
        const [h, m] = t.split(':').map(Number);
        return `${h > 12 ? h - 12 : h === 0 ? 12 : h}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
    };

    const today = new Date().toISOString().split('T')[0];
    const upcoming = appointments.filter(a => a.date >= today && a.status === 'scheduled');
    const past = appointments.filter(a => a.date < today || a.status === 'completed');

    if (loading) return <div className="loading-screen"><div className="spinner" /><p>Loading appointments...</p></div>;

    const typeConfig = {
        checkup: { emoji: '🩺', label: 'Check-up', color: 'var(--primary)' },
        followup: { emoji: '📋', label: 'Follow-up', color: 'var(--accent)' },
        video: { emoji: '📹', label: 'Video Call', color: 'var(--success)' },
        emergency: { emoji: '🚨', label: 'Emergency', color: '#ef4444' },
    };

    return (
        <div className="page">
            <style>{`
                .appt-card { transition: all 0.3s ease; }
                .appt-card:hover { transform: translateY(-2px); }
                .success-toast { animation: toast-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); }
                @keyframes toast-in { 0% { transform: translateY(-20px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
            `}</style>

            {/* Header */}
            <div className="page-header animate-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h1>📅 Appointments</h1>
                    <p>Schedule and manage patient appointments</p>
                </div>
                <button onClick={() => setShowAdd(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }}>
                    <Plus size={18} /> Book Appointment
                </button>
            </div>

            {successMsg && (
                <div className="success-toast" style={{
                    padding: '14px 20px', borderRadius: 'var(--radius-md)',
                    background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
                    color: 'var(--success)', fontSize: '0.9rem', fontWeight: 600, marginBottom: '24px',
                }}>{successMsg}</div>
            )}

            {/* Stats */}
            <div className="grid-3" style={{ marginBottom: '32px' }}>
                {[
                    { icon: Calendar, label: 'Upcoming', value: upcoming.length, color: 'var(--primary)' },
                    { icon: CheckCircle, label: 'Completed', value: past.length, color: 'var(--success)' },
                    { icon: User, label: 'Patients', value: patients.length, color: 'var(--accent)' },
                ].map((s, i) => (
                    <div key={i} className="glass stat-card glass-hover animate-slide-up" style={{ animationDelay: `${i * 0.1}s`, opacity: 0 }}>
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

            {/* Upcoming Appointments */}
            <div className="glass animate-in" style={{ padding: '24px', marginBottom: '24px' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontSize: '1rem', fontWeight: 700 }}>
                    <Calendar size={18} style={{ color: 'var(--primary)' }} /> Upcoming Appointments
                    <span style={{
                        marginLeft: 'auto', fontSize: '0.75rem', fontWeight: 600, padding: '4px 12px',
                        borderRadius: 'var(--radius-full)', background: 'rgba(0,212,255,0.08)', color: 'var(--primary)',
                    }}>{upcoming.length}</span>
                </h3>

                {upcoming.length === 0 ? (
                    <div className="empty-state">
                        <Calendar size={48} /><h3>No upcoming appointments</h3>
                        <p>Book a new appointment using the button above.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {upcoming.map((a, i) => {
                            const tc = typeConfig[a.type] || typeConfig.checkup;
                            return (
                                <div key={a.id} className="glass-light appt-card animate-slide-up" style={{
                                    padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px',
                                    borderLeft: `3px solid ${tc.color}`,
                                    animationDelay: `${0.1 + i * 0.05}s`, opacity: 0,
                                }}>
                                    <span style={{ fontSize: '1.8rem' }}>{tc.emoji}</span>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            {a.patientName}
                                            <span style={{
                                                fontSize: '0.65rem', padding: '2px 8px', borderRadius: 'var(--radius-full)',
                                                background: `${tc.color}15`, border: `1px solid ${tc.color}30`,
                                                color: tc.color, fontWeight: 700, textTransform: 'uppercase',
                                            }}>{tc.label}</span>
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '12px', marginTop: '4px' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Calendar size={12} /> {formatDate(a.date)}
                                            </span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Clock size={12} /> {formatTime(a.time)}
                                            </span>
                                        </div>
                                        {a.notes && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px', fontStyle: 'italic' }}>📝 {a.notes}</div>}
                                    </div>
                                    <button onClick={() => handleComplete(a.id)} className="btn btn-ghost" style={{ fontSize: '0.78rem', padding: '6px 12px', color: 'var(--success)' }}>
                                        <CheckCircle size={14} /> Complete
                                    </button>
                                    <button onClick={() => handleDelete(a.id)} className="btn btn-icon btn-ghost" style={{ color: '#ef4444', opacity: 0.6 }}>
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Past/Completed */}
            {past.length > 0 && (
                <div className="glass animate-in" style={{ padding: '24px' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontSize: '1rem', fontWeight: 700 }}>
                        <CheckCircle size={18} style={{ color: 'var(--success)' }} /> Past Appointments
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {past.slice(0, 10).map(a => (
                            <div key={a.id} className="glass-light" style={{
                                padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px',
                                opacity: 0.7,
                            }}>
                                <span>✅</span>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{a.patientName}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatDate(a.date)} at {formatTime(a.time)}</div>
                                </div>
                                <span className="badge badge-verified" style={{ fontSize: '0.7rem' }}>completed</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Add Modal */}
            {showAdd && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 200,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(3, 7, 18, 0.85)', backdropFilter: 'blur(8px)', padding: '24px',
                }} onClick={() => setShowAdd(false)}>
                    <div className="glass animate-in" style={{ width: '100%', maxWidth: '480px', padding: '32px' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Calendar size={20} style={{ color: 'var(--primary)' }} /> Book Appointment
                            </h2>
                            <button onClick={() => setShowAdd(false)} className="btn btn-icon btn-ghost"><X size={18} /></button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                                    <User size={14} /> Patient
                                </label>
                                <select className="input" value={form.patientId} onChange={e => setForm({ ...form, patientId: e.target.value })}
                                    style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)' }}>
                                    <option value="">Select patient...</option>
                                    {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                                        <Calendar size={14} /> Date
                                    </label>
                                    <input type="date" className="input" value={form.date} min={today}
                                        onChange={e => setForm({ ...form, date: e.target.value })}
                                        style={{ colorScheme: 'dark' }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                                        <Clock size={14} /> Time
                                    </label>
                                    <select className="input" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })}
                                        style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)' }}>
                                        <option value="">Select time...</option>
                                        {TIMES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Type</label>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    {Object.entries(typeConfig).map(([key, cfg]) => (
                                        <button key={key} onClick={() => setForm({ ...form, type: key })}
                                            className={`btn ${form.type === key ? 'btn-primary' : 'btn-ghost'}`}
                                            style={{ fontSize: '0.8rem', padding: '8px 14px' }}>
                                            {cfg.emoji} {cfg.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                                    <FileText size={14} /> Notes (optional)
                                </label>
                                <textarea className="input" placeholder="Additional notes..." rows={2}
                                    value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                                    style={{ resize: 'vertical', minHeight: '60px' }} />
                            </div>
                        </div>

                        {error && (
                            <div style={{ marginTop: '16px', padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <AlertCircle size={16} /> {error}
                            </div>
                        )}

                        <button onClick={handleSave} className="btn btn-primary" disabled={saving} style={{ width: '100%', marginTop: '20px', padding: '14px' }}>
                            {saving ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Booking...</> : <><Calendar size={16} /> Book Appointment</>}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
