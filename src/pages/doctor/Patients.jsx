import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getUsersByRole, saveUser, updateUser, generateId, savePrescription, getPrescriptionsByPatient, deletePrescription, saveFaceDescriptor } from '../../utils/db';
import FaceCapture from '../../components/FaceCapture';
import {
    UserPlus, Users, Heart, Link2, CheckCircle, AlertCircle,
    Mail, Lock, User, X, Search, Shield, Pill, Clock, Trash2, Plus, Scan
} from 'lucide-react';

// ═════════════════════════════════════════════════
// Clock Time Picker Component
// ═════════════════════════════════════════════════
function ClockTimePicker({ value, onChange, onClose }) {
    const [mode, setMode] = useState('hour'); // 'hour' or 'minute'
    const [hour, setHour] = useState(() => {
        if (value) { const [h] = value.split(':'); return parseInt(h); }
        return 9;
    });
    const [minute, setMinute] = useState(() => {
        if (value) { const [, m] = value.split(':'); return parseInt(m); }
        return 0;
    });
    const [period, setPeriod] = useState(() => {
        if (value) { const [h] = value.split(':'); return parseInt(h) >= 12 ? 'PM' : 'AM'; }
        return 'AM';
    });
    const clockRef = useRef(null);
    const [dragging, setDragging] = useState(false);

    const display12h = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;

    const getAngleFromEvent = (e) => {
        const rect = clockRef.current.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const angle = Math.atan2(clientY - cy, clientX - cx) * (180 / Math.PI) + 90;
        return angle < 0 ? angle + 360 : angle;
    };

    const handleClockInteraction = (e) => {
        const angle = getAngleFromEvent(e);
        if (mode === 'hour') {
            let h = Math.round(angle / 30) % 12;
            if (h === 0) h = 12;
            const hour24 = period === 'PM' ? (h === 12 ? 12 : h + 12) : (h === 12 ? 0 : h);
            setHour(hour24);
        } else {
            let m = Math.round(angle / 6) % 60;
            setMinute(m);
        }
    };

    const handleMouseDown = (e) => {
        setDragging(true);
        handleClockInteraction(e);
    };

    const handleMouseMove = (e) => {
        if (!dragging) return;
        handleClockInteraction(e);
    };

    const handleMouseUp = () => {
        if (dragging && mode === 'hour') {
            setDragging(false);
            setMode('minute');
        } else {
            setDragging(false);
        }
    };

    useEffect(() => {
        if (dragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            window.addEventListener('touchmove', handleMouseMove);
            window.addEventListener('touchend', handleMouseUp);
            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
                window.removeEventListener('touchmove', handleMouseMove);
                window.removeEventListener('touchend', handleMouseUp);
            };
        }
    }, [dragging, mode]);

    const handleConfirm = () => {
        const h = String(hour).padStart(2, '0');
        const m = String(minute).padStart(2, '0');
        onChange(`${h}:${m}`);
    };

    const togglePeriod = (p) => {
        setPeriod(p);
        if (p === 'AM' && hour >= 12) setHour(hour - 12);
        else if (p === 'PM' && hour < 12) setHour(hour + 12);
    };

    // Compute hand angle
    const handAngle = mode === 'hour'
        ? ((display12h % 12) * 30) - 90
        : (minute * 6) - 90;

    const radius = 100;
    const numbers = mode === 'hour'
        ? Array.from({ length: 12 }, (_, i) => i + 1)
        : [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <style>{`
                .clock-number {
                    position: absolute; width: 36px; height: 36px;
                    display: flex; align-items: center; justify-content: center;
                    border-radius: 50%; font-size: 0.85rem; font-weight: 600;
                    cursor: pointer; transition: all 0.2s ease;
                    color: var(--text-secondary); z-index: 2;
                }
                .clock-number:hover { background: rgba(0,212,255,0.1); color: var(--text-primary); }
                .clock-number.active {
                    background: var(--primary) !important; color: #000 !important;
                    font-weight: 800; box-shadow: 0 0 15px rgba(0,212,255,0.4);
                }
                .period-btn {
                    padding: 8px 18px; border-radius: var(--radius-md); border: 1px solid rgba(255,255,255,0.1);
                    background: none; color: var(--text-muted); font-weight: 700; font-size: 0.85rem;
                    cursor: pointer; transition: all 0.3s ease;
                }
                .period-btn.active {
                    background: var(--primary); color: #000; border-color: var(--primary);
                    box-shadow: 0 0 12px rgba(0,212,255,0.3);
                }
            `}</style>

            {/* Time display */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span onClick={() => setMode('hour')} style={{
                    fontSize: '2.5rem', fontWeight: 800, cursor: 'pointer',
                    color: mode === 'hour' ? 'var(--primary)' : 'var(--text-muted)',
                    transition: 'color 0.3s',
                    fontFamily: 'var(--font-display)',
                }}>
                    {String(display12h).padStart(2, '0')}
                </span>
                <span style={{ fontSize: '2.5rem', fontWeight: 300, color: 'var(--text-muted)' }}>:</span>
                <span onClick={() => setMode('minute')} style={{
                    fontSize: '2.5rem', fontWeight: 800, cursor: 'pointer',
                    color: mode === 'minute' ? 'var(--primary)' : 'var(--text-muted)',
                    transition: 'color 0.3s',
                    fontFamily: 'var(--font-display)',
                }}>
                    {String(minute).padStart(2, '0')}
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginLeft: '12px' }}>
                    <button className={`period-btn ${period === 'AM' ? 'active' : ''}`}
                        onClick={() => togglePeriod('AM')}>AM</button>
                    <button className={`period-btn ${period === 'PM' ? 'active' : ''}`}
                        onClick={() => togglePeriod('PM')}>PM</button>
                </div>
            </div>

            {/* Clock face */}
            <div ref={clockRef}
                onMouseDown={handleMouseDown}
                onTouchStart={handleMouseDown}
                style={{
                    width: '240px', height: '240px', borderRadius: '50%',
                    background: 'rgba(255,255,255,0.03)',
                    border: '2px solid rgba(255,255,255,0.08)',
                    position: 'relative', cursor: 'pointer',
                    boxShadow: 'inset 0 0 30px rgba(0,0,0,0.3)',
                }}>
                {/* Center dot */}
                <div style={{
                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: 'var(--primary)', zIndex: 3,
                }} />

                {/* Hand */}
                <div style={{
                    position: 'absolute', top: '50%', left: '50%',
                    width: `${radius - 18}px`, height: '2px',
                    background: 'var(--primary)', transformOrigin: '0 50%',
                    transform: `rotate(${handAngle}deg)`,
                    transition: dragging ? 'none' : 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    zIndex: 1, borderRadius: '2px',
                    boxShadow: '0 0 8px rgba(0,212,255,0.3)',
                }} />

                {/* Numbers */}
                {numbers.map((n, i) => {
                    const angle = (i * (360 / numbers.length)) - 90;
                    const rad = (angle * Math.PI) / 180;
                    const x = 120 + radius * Math.cos(rad) - 18;
                    const y = 120 + radius * Math.sin(rad) - 18;
                    const isActive = mode === 'hour' ? display12h === n : minute === n;

                    return (
                        <div key={n}
                            className={`clock-number ${isActive ? 'active' : ''}`}
                            style={{ left: `${x}px`, top: `${y}px` }}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (mode === 'hour') {
                                    const h24 = period === 'PM' ? (n === 12 ? 12 : n + 12) : (n === 12 ? 0 : n);
                                    setHour(h24);
                                    setTimeout(() => setMode('minute'), 300);
                                } else {
                                    setMinute(n);
                                }
                            }}
                        >
                            {mode === 'minute' ? String(n).padStart(2, '0') : n}
                        </div>
                    );
                })}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                <button onClick={onClose} className="btn btn-ghost" style={{ flex: 1, padding: '12px' }}>
                    Cancel
                </button>
                <button onClick={handleConfirm} className="btn btn-primary" style={{ flex: 1, padding: '12px' }}>
                    <CheckCircle size={16} /> Confirm
                </button>
            </div>
        </div>
    );
}

// ═════════════════════════════════════════════════
// Add Medicine Modal
// ═════════════════════════════════════════════════
function AddMedicineModal({ patient, onClose, onSaved, doctorName }) {
    const [name, setName] = useState('');
    const [dosage, setDosage] = useState('');
    const [times, setTimes] = useState([]);
    const [showClock, setShowClock] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const addTime = (time) => {
        if (!times.includes(time)) {
            setTimes(prev => [...prev, time].sort());
        }
        setShowClock(false);
    };

    const removeTime = (t) => setTimes(prev => prev.filter(x => x !== t));

    const formatTime = (t) => {
        const [h, m] = t.split(':').map(Number);
        const period = h >= 12 ? 'PM' : 'AM';
        const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
        return `${h12}:${String(m).padStart(2, '0')} ${period}`;
    };

    const handleSave = async () => {
        if (!name.trim()) { setError('Medicine name is required'); return; }
        if (times.length === 0) { setError('Add at least one time'); return; }
        setSaving(true);
        try {
            const prescription = {
                id: generateId(),
                patientId: patient.id,
                patientName: patient.name,
                medicineName: name.trim(),
                dosage: dosage.trim(),
                times,
                prescribedBy: doctorName,
                createdAt: Date.now(),
            };
            await savePrescription(prescription);
            onSaved(prescription);
        } catch (err) {
            setError(err.message || 'Failed to save');
        }
        setSaving(false);
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 200,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(3, 7, 18, 0.85)', backdropFilter: 'blur(8px)',
            padding: '24px',
        }} onClick={onClose}>
            <div className="glass animate-in" style={{
                width: '100%', maxWidth: '520px', padding: '32px',
                maxHeight: '90vh', overflowY: 'auto',
            }} onClick={e => e.stopPropagation()}>
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginBottom: '24px',
                }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Pill size={20} style={{ color: 'var(--accent)' }} /> Prescribe Medicine
                    </h2>
                    <button onClick={onClose} className="btn btn-icon btn-ghost"><X size={18} /></button>
                </div>

                {/* Patient badge */}
                <div className="glass-light" style={{
                    padding: '12px 16px', marginBottom: '20px',
                    display: 'flex', alignItems: 'center', gap: '10px',
                }}>
                    <span style={{ fontSize: '1.3rem' }}>😷</span>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{patient.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{patient.email}</div>
                    </div>
                </div>

                {!showClock ? (
                    <>
                        {/* Medicine name */}
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{
                                fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)',
                                display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px',
                            }}>
                                <Pill size={14} /> Medicine Name
                            </label>
                            <input type="text" className="input" placeholder="e.g. Paracetamol 500mg"
                                value={name} onChange={e => setName(e.target.value)} />
                        </div>

                        {/* Dosage */}
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{
                                fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)',
                                display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px',
                            }}>
                                <Plus size={14} /> Dosage / Instructions
                            </label>
                            <input type="text" className="input" placeholder="e.g. 1 tablet after meals"
                                value={dosage} onChange={e => setDosage(e.target.value)} />
                        </div>

                        {/* Scheduled times */}
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{
                                fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)',
                                display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px',
                            }}>
                                <Clock size={14} /> Scheduled Times
                            </label>

                            {times.length > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                                    {times.map(t => (
                                        <div key={t} style={{
                                            display: 'flex', alignItems: 'center', gap: '6px',
                                            padding: '8px 14px', borderRadius: 'var(--radius-full)',
                                            background: 'rgba(0,212,255,0.08)',
                                            border: '1px solid rgba(0,212,255,0.2)',
                                            fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)',
                                        }}>
                                            <Clock size={13} />
                                            {formatTime(t)}
                                            <X size={13} onClick={() => removeTime(t)}
                                                style={{ cursor: 'pointer', opacity: 0.6 }} />
                                        </div>
                                    ))}
                                </div>
                            )}

                            <button onClick={() => setShowClock(true)} className="btn btn-ghost" style={{
                                width: '100%', padding: '14px', border: '2px dashed rgba(255,255,255,0.1)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                fontSize: '0.85rem', color: 'var(--primary)',
                            }}>
                                <Plus size={16} /> Add Time
                            </button>
                        </div>

                        {error && (
                            <div style={{
                                padding: '10px 14px', borderRadius: 'var(--radius-md)',
                                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                                color: '#ef4444', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px',
                                marginBottom: '16px',
                            }}>
                                <AlertCircle size={16} /> {error}
                            </div>
                        )}

                        <button onClick={handleSave} className="btn btn-primary" disabled={saving}
                            style={{ width: '100%', padding: '14px' }}>
                            {saving ? (
                                <><div className="spinner" style={{ width: 16, height: 16 }} /> Saving...</>
                            ) : (
                                <><Pill size={16} /> Prescribe Medicine</>
                            )}
                        </button>
                    </>
                ) : (
                    <ClockTimePicker
                        value={null}
                        onChange={(time) => addTime(time)}
                        onClose={() => setShowClock(false)}
                    />
                )}
            </div>
        </div>
    );
}

// ═════════════════════════════════════════════════
// Register Patient Modal
// ═════════════════════════════════════════════════
function RegisterPatientModal({ onClose, onSuccess, doctorName }) {
    const [form, setForm] = useState({ name: '', email: '', password: '' });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name || !form.email || !form.password) { setError('All fields are required'); return; }
        if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
        setSaving(true);
        setError('');

        try {
            const uid = generateId();
            const patient = {
                id: uid,
                name: form.name,
                email: form.email,
                password: form.password,
                role: 'patient',
                avatar: '😷',
                createdAt: Date.now(),
                registeredBy: doctorName,
            };
            await saveUser(patient);
            onSuccess(patient);
        } catch (err) {
            setError(err.message || 'Failed to register patient');
        }
        setSaving(false);
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 200,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(3, 7, 18, 0.85)', backdropFilter: 'blur(8px)', padding: '24px',
        }} onClick={onClose}>
            <div className="glass animate-in" style={{
                width: '100%', maxWidth: '480px', padding: '32px',
            }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <UserPlus size={20} style={{ color: 'var(--primary)' }} /> Register New Patient
                    </h2>
                    <button onClick={onClose} className="btn btn-icon btn-ghost"><X size={18} /></button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                                <User size={14} /> Full Name
                            </label>
                            <input type="text" className="input" placeholder="Patient's full name"
                                value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                                <Mail size={14} /> Email
                            </label>
                            <input type="email" className="input" placeholder="patient@email.com"
                                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                                <Lock size={14} /> Password
                            </label>
                            <input type="password" className="input" placeholder="Min 6 characters"
                                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                        </div>
                    </div>
                    {error && (
                        <div style={{ marginTop: '16px', padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <AlertCircle size={16} /> {error}
                        </div>
                    )}
                    <button type="submit" className="btn btn-primary" disabled={saving} style={{ width: '100%', marginTop: '20px', padding: '14px' }}>
                        {saving ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Registering...</> : <><UserPlus size={16} /> Register Patient</>}
                    </button>
                </form>
            </div>
        </div>
    );
}

// ═════════════════════════════════════════════════
// Assign Caretaker Modal
// ═════════════════════════════════════════════════
function AssignCaretakerModal({ patient, caretakers, onClose, onAssign }) {
    const [selectedId, setSelectedId] = useState(patient.assignedCaretaker || '');
    const [search, setSearch] = useState('');
    const [saving, setSaving] = useState(false);

    const filtered = caretakers.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase())
    );

    const handleAssign = async () => {
        if (!selectedId) return;
        setSaving(true);
        try {
            const caretaker = caretakers.find(c => c.id === selectedId);
            await updateUser(patient.id, {
                assignedCaretaker: selectedId,
                assignedCaretakerName: caretaker?.name || '',
            });
            onAssign(patient.id, selectedId, caretaker?.name);
        } catch (err) { console.error('Failed to assign caretaker:', err); }
        setSaving(false);
    };

    const handleRemove = async () => {
        setSaving(true);
        try {
            await updateUser(patient.id, { assignedCaretaker: '', assignedCaretakerName: '' });
            onAssign(patient.id, '', '');
        } catch (err) { console.error('Failed to remove caretaker:', err); }
        setSaving(false);
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 200,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(3, 7, 18, 0.85)', backdropFilter: 'blur(8px)', padding: '24px',
        }} onClick={onClose}>
            <div className="glass animate-in" style={{
                width: '100%', maxWidth: '480px', padding: '32px',
            }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Link2 size={20} style={{ color: 'var(--accent)' }} /> Assign Caretaker
                    </h2>
                    <button onClick={onClose} className="btn btn-icon btn-ghost"><X size={18} /></button>
                </div>

                <div className="glass-light" style={{ padding: '14px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '1.5rem' }}>😷</span>
                    <div>
                        <div style={{ fontWeight: 700 }}>{patient.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{patient.email}</div>
                    </div>
                </div>

                {patient.assignedCaretakerName && (
                    <div style={{
                        padding: '12px 16px', marginBottom: '16px', borderRadius: 'var(--radius-md)',
                        background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                            <CheckCircle size={14} style={{ color: 'var(--success)' }} />
                            <span>Currently: <strong>{patient.assignedCaretakerName}</strong></span>
                        </div>
                        <button onClick={handleRemove} disabled={saving} className="btn btn-ghost"
                            style={{ fontSize: '0.75rem', padding: '4px 10px', color: '#ef4444' }}>Remove</button>
                    </div>
                )}

                <div style={{ position: 'relative', marginBottom: '12px' }}>
                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input type="text" className="input" placeholder="Search caretakers..."
                        value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '36px' }} />
                </div>

                <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
                    {filtered.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            {caretakers.length === 0 ? 'No caretakers registered yet' : 'No matches found'}
                        </div>
                    ) : (
                        filtered.map(c => (
                            <div key={c.id} onClick={() => setSelectedId(c.id)} className="glass-light" style={{
                                padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer',
                                borderLeft: selectedId === c.id ? '3px solid var(--accent)' : '3px solid transparent',
                                background: selectedId === c.id ? 'rgba(0,212,255,0.05)' : undefined,
                                transition: 'all 0.2s ease',
                            }}>
                                <span style={{ fontSize: '1.2rem' }}>🧑‍🤝‍🧑</span>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{c.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.email}</div>
                                </div>
                                {selectedId === c.id && <CheckCircle size={18} style={{ color: 'var(--accent)' }} />}
                            </div>
                        ))
                    )}
                </div>

                <button onClick={handleAssign} className="btn btn-primary" disabled={!selectedId || saving}
                    style={{ width: '100%', padding: '14px' }}>
                    {saving ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Saving...</> : <><Link2 size={16} /> Assign Caretaker</>}
                </button>
            </div>
        </div>
    );
}

// ═════════════════════════════════════════════════
// Main Page
// ═════════════════════════════════════════════════
export default function DoctorPatients() {
    const { currentUser } = useAuth();
    const [patients, setPatients] = useState([]);
    const [caretakers, setCaretakers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showRegister, setShowRegister] = useState(false);
    const [assignPatient, setAssignPatient] = useState(null);
    const [medicinePatient, setMedicinePatient] = useState(null);
    const [enrollPatient, setEnrollPatient] = useState(null);
    const [successMsg, setSuccessMsg] = useState('');
    const [expandedPatient, setExpandedPatient] = useState(null);
    const [prescriptions, setPrescriptions] = useState({});

    useEffect(() => { fetchData(); }, []);

    async function fetchData() {
        try {
            const [p, c] = await Promise.all([
                getUsersByRole('patient'),
                getUsersByRole('caretaker'),
            ]);
            setPatients(p);
            setCaretakers(c);

            // Load prescriptions for all patients
            const rxMap = {};
            for (const pt of p) {
                const rx = await getPrescriptionsByPatient(pt.id);
                if (rx.length > 0) rxMap[pt.id] = rx;
            }
            setPrescriptions(rxMap);
        } catch (err) {
            console.error('Error loading patients:', err);
        }
        setLoading(false);
    }

    const toast = (msg) => {
        setSuccessMsg(msg);
        setTimeout(() => setSuccessMsg(''), 4000);
    };

    const handleRegistered = (patient) => {
        setPatients(prev => [patient, ...prev]);
        setShowRegister(false);
        toast(`✅ ${patient.name} registered successfully!`);
    };

    const handleAssigned = (patientId, caretakerId, caretakerName) => {
        setPatients(prev => prev.map(p =>
            p.id === patientId ? { ...p, assignedCaretaker: caretakerId, assignedCaretakerName: caretakerName } : p
        ));
        setAssignPatient(null);
        toast(caretakerName ? `✅ Caretaker assigned!` : `✅ Caretaker removed.`);
    };

    const handleMedicineSaved = (prescription) => {
        setPrescriptions(prev => ({
            ...prev,
            [prescription.patientId]: [...(prev[prescription.patientId] || []), prescription],
        }));
        setMedicinePatient(null);
        toast(`✅ ${prescription.medicineName} prescribed!`);
    };

    const handleDeletePrescription = async (rxId, patientId) => {
        try {
            await deletePrescription(rxId);
            setPrescriptions(prev => ({
                ...prev,
                [patientId]: (prev[patientId] || []).filter(r => r.id !== rxId),
            }));
            toast(`✅ Prescription removed.`);
        } catch (err) {
            console.error('Failed to delete:', err);
        }
    };

    const formatTime = (t) => {
        const [h, m] = t.split(':').map(Number);
        const period = h >= 12 ? 'PM' : 'AM';
        const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
        return `${h12}:${String(m).padStart(2, '0')} ${period}`;
    };

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="spinner" /><p>Loading patients...</p>
            </div>
        );
    }

    return (
        <div className="page">
            <style>{`
                .patient-row { transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
                .patient-row:hover { transform: translateX(4px); background: rgba(255,255,255,0.04) !important; }
                .success-toast { animation: toast-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); }
                @keyframes toast-in { 0% { transform: translateY(-20px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
                .rx-list { animation: fade-expand 0.3s ease; }
                @keyframes fade-expand { 0% { opacity: 0; max-height: 0; } 100% { opacity: 1; max-height: 600px; } }
            `}</style>

            {/* Header */}
            <div className="page-header animate-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h1>👥 Patient Management</h1>
                    <p>Register patients, prescribe medicines, and assign caretakers</p>
                </div>
                <button onClick={() => setShowRegister(true)} className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }}>
                    <UserPlus size={18} /> Register Patient
                </button>
            </div>

            {/* Success toast */}
            {successMsg && (
                <div className="success-toast" style={{
                    padding: '14px 20px', borderRadius: 'var(--radius-md)',
                    background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
                    color: 'var(--success)', fontSize: '0.9rem', fontWeight: 600, marginBottom: '24px',
                }}>{successMsg}</div>
            )}

            {/* Stats */}
            <div className="grid-4" style={{ marginBottom: '32px' }}>
                {[
                    { icon: Users, label: 'Total Patients', value: patients.length, color: 'var(--primary)' },
                    { icon: Heart, label: 'Caretakers', value: caretakers.length, color: 'var(--accent)' },
                    { icon: Pill, label: 'Prescriptions', value: Object.values(prescriptions).flat().length, color: 'var(--warning)' },
                    { icon: Link2, label: 'Assigned', value: patients.filter(p => p.assignedCaretaker).length, color: 'var(--success)' },
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

            {/* Patients list */}
            <div className="glass animate-in" style={{ padding: '24px' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontSize: '1rem', fontWeight: 700 }}>
                    <Shield size={18} style={{ color: 'var(--primary)' }} /> Registered Patients
                    <span style={{
                        marginLeft: 'auto', fontSize: '0.75rem', fontWeight: 600, padding: '4px 12px',
                        borderRadius: 'var(--radius-full)', background: 'rgba(0,212,255,0.08)', color: 'var(--primary)',
                    }}>{patients.length} patients</span>
                </h3>

                {patients.length === 0 ? (
                    <div className="empty-state">
                        <Users size={48} /><h3>No patients yet</h3>
                        <p>Register your first patient using the button above.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {patients.map((p, i) => {
                            const patientRx = prescriptions[p.id] || [];
                            const isExpanded = expandedPatient === p.id;

                            return (
                                <div key={p.id}>
                                    <div className="glass-light patient-row animate-slide-up" style={{
                                        padding: '16px 20px',
                                        display: 'flex', alignItems: 'center', gap: '16px',
                                        animationDelay: `${0.1 + i * 0.05}s`, opacity: 0,
                                        cursor: 'pointer',
                                        borderLeft: isExpanded ? '3px solid var(--primary)' : '3px solid transparent',
                                    }} onClick={() => setExpandedPatient(isExpanded ? null : p.id)}>
                                        <span style={{ fontSize: '1.5rem' }}>😷</span>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {p.name}
                                                {patientRx.length > 0 && (
                                                    <span style={{
                                                        fontSize: '0.65rem', padding: '2px 8px', borderRadius: 'var(--radius-full)',
                                                        background: 'rgba(255,171,0,0.1)', border: '1px solid rgba(255,171,0,0.2)',
                                                        color: 'var(--warning)', fontWeight: 700,
                                                    }}>
                                                        {patientRx.length} medicine{patientRx.length > 1 ? 's' : ''}
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                                <span>{p.email}</span>
                                                {p.registeredBy && <span>• Registered by {p.registeredBy}</span>}
                                            </div>
                                        </div>

                                        {p.assignedCaretakerName ? (
                                            <div style={{
                                                display: 'flex', alignItems: 'center', gap: '6px',
                                                padding: '6px 14px', borderRadius: 'var(--radius-full)',
                                                background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
                                                fontSize: '0.8rem', fontWeight: 600, color: 'var(--success)',
                                            }}>
                                                <Heart size={13} /> {p.assignedCaretakerName}
                                            </div>
                                        ) : (
                                            <span style={{
                                                padding: '6px 14px', borderRadius: 'var(--radius-full)',
                                                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                                                fontSize: '0.75rem', color: 'var(--text-muted)',
                                            }}>No caretaker</span>
                                        )}

                                        <button onClick={(e) => { e.stopPropagation(); setEnrollPatient(p); }}
                                            className="btn btn-ghost" style={{ fontSize: '0.8rem', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Scan size={14} /> Re-enroll
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); setMedicinePatient(p); }}
                                            className="btn btn-ghost" style={{ fontSize: '0.8rem', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Pill size={14} /> Add Rx
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); setAssignPatient(p); }}
                                            className="btn btn-ghost" style={{ fontSize: '0.8rem', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Link2 size={14} /> {p.assignedCaretaker ? 'Change' : 'Assign'}
                                        </button>
                                    </div>

                                    {/* Expanded prescriptions */}
                                    {isExpanded && patientRx.length > 0 && (
                                        <div className="rx-list" style={{
                                            marginTop: '4px', marginLeft: '24px', marginBottom: '8px',
                                            display: 'flex', flexDirection: 'column', gap: '6px',
                                        }}>
                                            {patientRx.map(rx => (
                                                <div key={rx.id} className="glass-light" style={{
                                                    padding: '14px 18px',
                                                    display: 'flex', alignItems: 'center', gap: '14px',
                                                    borderLeft: '2px solid var(--warning)',
                                                }}>
                                                    <span style={{ fontSize: '1.2rem' }}>💊</span>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{rx.medicineName}</div>
                                                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                                            {rx.dosage && <span>{rx.dosage} • </span>}
                                                            Prescribed by {rx.prescribedBy}
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                        {rx.times.map(t => (
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
                                                    <button onClick={() => handleDeletePrescription(rx.id, p.id)}
                                                        className="btn btn-icon btn-ghost"
                                                        style={{ color: '#ef4444', opacity: 0.6 }}>
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {isExpanded && patientRx.length === 0 && (
                                        <div style={{
                                            marginTop: '4px', marginLeft: '24px', marginBottom: '8px',
                                            padding: '16px', textAlign: 'center', color: 'var(--text-muted)',
                                            fontSize: '0.85rem', fontStyle: 'italic',
                                        }}>
                                            No medicines prescribed yet. Click "Add Rx" to prescribe.
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Modals */}
            {showRegister && (
                <RegisterPatientModal onClose={() => setShowRegister(false)} onSuccess={handleRegistered} doctorName={currentUser?.name || 'Doctor'} />
            )}
            {assignPatient && (
                <AssignCaretakerModal patient={assignPatient} caretakers={caretakers} onClose={() => setAssignPatient(null)} onAssign={handleAssigned} />
            )}
            {medicinePatient && (
                <AddMedicineModal patient={medicinePatient} onClose={() => setMedicinePatient(null)} onSaved={handleMedicineSaved} doctorName={currentUser?.name || 'Doctor'} />
            )}

            {/* Face Re-enrollment Modal */}
            {enrollPatient && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 200,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(3, 7, 18, 0.85)', backdropFilter: 'blur(8px)', padding: '24px',
                }} onClick={() => setEnrollPatient(null)}>
                    <div className="glass animate-in" style={{
                        width: '100%', maxWidth: '560px', padding: '32px',
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Scan size={20} style={{ color: 'var(--primary)' }} /> Re-enroll Face
                            </h2>
                            <button onClick={() => setEnrollPatient(null)} className="btn btn-icon btn-ghost"><X size={18} /></button>
                        </div>
                        <div className="glass-light" style={{ padding: '12px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '1.3rem' }}>😷</span>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{enrollPatient.name}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{enrollPatient.email}</div>
                            </div>
                        </div>
                        <FaceCapture
                            onCapture={async (descriptor) => {
                                try {
                                    await saveFaceDescriptor(enrollPatient.id, descriptor);
                                    setEnrollPatient(null);
                                    toast(`✅ Face re-enrolled for ${enrollPatient.name}!`);
                                } catch (err) {
                                    console.error('Face enrollment error:', err);
                                }
                            }}
                            onCancel={() => setEnrollPatient(null)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
