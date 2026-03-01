import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getMedicineLogs, updateMedicineLog, getClip, getUsersByRole, getAlertsByDoctor, updateAlert } from '../../utils/db';
import { Video, CheckCircle, Clock, Users, BarChart3, Play, X, Pill, XCircle, MessageSquare, ThumbsUp, ThumbsDown, AlertTriangle } from 'lucide-react';

function ReviewModal({ log, onClose, onVerify, onReject }) {
    const [clipUrl, setClipUrl] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showRejectForm, setShowRejectForm] = useState(false);
    const [rejectReason, setRejectReason] = useState('');

    useEffect(() => {
        async function loadClip() {
            try {
                // getClip now returns a URL string (from Firebase Storage)
                const url = log.clipUrl || await getClip(log.clipId);
                setClipUrl(url);
            } catch { /* ignore */ }
            setLoading(false);
        }
        loadClip();
    }, [log.clipId, log.clipUrl]);

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 200,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(3, 7, 18, 0.85)',
            backdropFilter: 'blur(8px)',
            padding: '24px',
        }} onClick={onClose}>
            <div className="glass animate-in" style={{
                width: '100%',
                maxWidth: '640px',
                padding: '32px',
            }} onClick={e => e.stopPropagation()}>
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginBottom: '20px',
                }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Video size={20} style={{ color: 'var(--primary)' }} /> Review Medicine Intake
                    </h2>
                    <button onClick={onClose} className="btn btn-icon btn-ghost">
                        <X size={18} />
                    </button>
                </div>

                {/* Patient Info */}
                <div className="glass-light" style={{
                    padding: '14px 16px',
                    marginBottom: '16px',
                    display: 'flex', alignItems: 'center', gap: '12px',
                }}>
                    <span style={{ fontSize: '1.5rem' }}>😷</span>
                    <div>
                        <div style={{ fontWeight: 600 }}>{log.patientName}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {log.medicineName || 'Medicine Dose'} • {new Date(log.timestamp).toLocaleString()}
                        </div>
                    </div>
                </div>

                {/* Video Player */}
                <div className="video-player" style={{ marginBottom: '20px' }}>
                    {loading ? (
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            height: '300px', flexDirection: 'column', gap: '12px',
                        }}>
                            <div className="spinner" />
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading clip...</p>
                        </div>
                    ) : clipUrl ? (
                        <video controls src={clipUrl} style={{ width: '100%' }} />
                    ) : (
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            height: '300px', flexDirection: 'column', gap: '12px',
                        }}>
                            <Video size={48} style={{ opacity: 0.3 }} />
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Clip not available</p>
                        </div>
                    )}
                </div>

                {/* Actions */}
                {log.status === 'pending' && !showRejectForm && (
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button onClick={() => onVerify(log.id)} className="btn btn-success btn-lg" style={{ flex: 1 }}>
                            <ThumbsUp size={18} /> Accept — Medicine Taken ✓
                        </button>
                        <button onClick={() => setShowRejectForm(true)} className="btn btn-danger btn-lg" style={{ flex: 1 }}>
                            <ThumbsDown size={18} /> Reject — Not Taken ✗
                        </button>
                    </div>
                )}

                {/* Reject Reason Form */}
                {log.status === 'pending' && showRejectForm && (
                    <div style={{
                        padding: '20px',
                        borderRadius: 'var(--radius-md)',
                        background: 'rgba(239, 68, 68, 0.06)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                    }}>
                        <h4 style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            fontSize: '0.95rem', fontWeight: 700, marginBottom: '12px',
                            color: 'var(--danger)',
                        }}>
                            <XCircle size={18} /> Reject Medicine Intake
                        </h4>
                        <div className="input-group" style={{ marginBottom: '12px' }}>
                            <label><MessageSquare size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} />Reason for rejection</label>
                            <textarea
                                className="input"
                                value={rejectReason}
                                onChange={e => setRejectReason(e.target.value)}
                                placeholder="e.g., Patient did not swallow the medicine, wrong medicine taken, unclear video..."
                                rows={3}
                                style={{ resize: 'vertical' }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button onClick={() => setShowRejectForm(false)} className="btn btn-ghost" style={{ flex: 1 }}>
                                Cancel
                            </button>
                            <button
                                onClick={() => onReject(log.id, rejectReason)}
                                className="btn btn-danger"
                                style={{ flex: 1 }}
                            >
                                <XCircle size={16} /> Confirm Rejection
                            </button>
                        </div>
                    </div>
                )}

                {log.status === 'verified' && (
                    <div style={{
                        padding: '16px',
                        borderRadius: 'var(--radius-md)',
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        textAlign: 'center',
                        color: 'var(--success)',
                        fontWeight: 600,
                    }}>
                        <CheckCircle size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                        Accepted — Medicine verified {log.reviewedBy ? `by ${log.reviewedBy}` : ''}
                    </div>
                )}

                {log.status === 'rejected' && (
                    <div style={{
                        padding: '16px',
                        borderRadius: 'var(--radius-md)',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: 'var(--danger)',
                    }}>
                        <div style={{ fontWeight: 600, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <XCircle size={16} /> Rejected {log.reviewedBy ? `by ${log.reviewedBy}` : ''}
                        </div>
                        {log.rejectReason && (
                            <div style={{ fontSize: '0.85rem', opacity: 0.8, marginTop: '4px' }}>
                                Reason: {log.rejectReason}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function DoctorDashboard() {
    const { currentUser } = useAuth();
    const [logs, setLogs] = useState([]);
    const [selectedLog, setSelectedLog] = useState(null);
    const [filter, setFilter] = useState('pending');
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [alerts, setAlerts] = useState([]);

    const refreshLogs = useCallback(async () => {
        try {
            const [allLogs, patientList, sosAlerts] = await Promise.all([
                getMedicineLogs(),
                getUsersByRole('patient'),
                getAlertsByDoctor(currentUser?.id || 'all').catch(() => []),
            ]);
            setLogs(allLogs);
            setPatients(patientList);
            setAlerts(sosAlerts.filter(a => a.status === 'active'));
        } catch (err) {
            console.error('Error loading logs:', err);
        }
        setLoading(false);
    }, [currentUser]);

    const dismissAlert = async (alertId) => {
        await updateAlert(alertId, { status: 'dismissed', dismissedAt: Date.now() });
        setAlerts(prev => prev.filter(a => a.id !== alertId));
    };

    useEffect(() => { refreshLogs(); }, [refreshLogs]);

    const handleVerify = async (logId) => {
        await updateMedicineLog(logId, {
            status: 'verified',
            reviewedBy: currentUser.name,
            reviewedAt: Date.now(),
        });
        await refreshLogs();
        setSelectedLog(null);
    };

    const handleReject = async (logId, reason) => {
        await updateMedicineLog(logId, {
            status: 'rejected',
            reviewedBy: currentUser.name,
            reviewedAt: Date.now(),
            rejectReason: reason || 'No reason provided',
        });
        await refreshLogs();
        setSelectedLog(null);
    };

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="spinner" />
                <p>Loading dashboard...</p>
            </div>
        );
    }

    const allLogs = logs;
    const filteredLogs = filter === 'all' ? allLogs : allLogs.filter(l => l.status === filter);
    const pendingCount = allLogs.filter(l => l.status === 'pending').length;
    const verifiedCount = allLogs.filter(l => l.status === 'verified').length;
    const rejectedCount = allLogs.filter(l => l.status === 'rejected').length;

    return (
        <div className="page">
            <style>{`
                .sos-alert-banner { animation: sos-flash 1s ease-in-out infinite alternate; }
                @keyframes sos-flash { 0% { border-color: rgba(239,68,68,0.6); } 100% { border-color: rgba(239,68,68,0.2); } }
            `}</style>

            {/* SOS Alert Banner */}
            {alerts.length > 0 && alerts.map(alert => (
                <div key={alert.id} className="glass sos-alert-banner" style={{
                    padding: '16px 20px', marginBottom: '16px',
                    display: 'flex', alignItems: 'center', gap: '12px',
                    borderLeft: '4px solid #ef4444',
                    background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.3)',
                }}>
                    <AlertTriangle size={22} style={{ color: '#ef4444', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, color: '#ef4444', fontSize: '0.9rem' }}>🚨 Emergency SOS</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            {alert.patientName} triggered an emergency alert — {new Date(alert.timestamp).toLocaleTimeString()}
                        </div>
                    </div>
                    <button onClick={() => dismissAlert(alert.id)} className="btn btn-ghost"
                        style={{ fontSize: '0.75rem', padding: '6px 14px', color: '#ef4444' }}>Dismiss</button>
                </div>
            ))}

            <div className="page-header animate-in">
                <h1>{currentUser?.role === 'doctor' ? '🩺' : '🧑‍🤝‍🧑'} {currentUser?.role === 'doctor' ? 'Doctor' : 'Caretaker'} Dashboard</h1>
                <p>Review patient medicine intake clips</p>
            </div>

            {/* Stats */}
            <div className="grid-4" style={{ marginBottom: '32px' }}>
                {[
                    { icon: Clock, label: 'Pending Review', value: pendingCount, color: 'var(--warning)' },
                    { icon: CheckCircle, label: 'Accepted', value: verifiedCount, color: 'var(--success)' },
                    { icon: XCircle, label: 'Rejected', value: rejectedCount, color: 'var(--danger)' },
                    { icon: Users, label: 'Patients', value: patients.length, color: 'var(--primary)' },
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

            {/* Filter Tabs */}
            <div className="glass" style={{ padding: '24px' }}>
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginBottom: '20px',
                }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Video size={18} style={{ color: 'var(--primary)' }} /> Medicine Intake Clips
                    </h3>
                    <div style={{ display: 'flex', gap: '4px' }}>
                        {['pending', 'verified', 'rejected', 'all'].map(f => (
                            <button key={f} onClick={() => setFilter(f)} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`}>
                                {f === 'pending' && `Pending (${pendingCount})`}
                                {f === 'verified' && `Accepted (${verifiedCount})`}
                                {f === 'rejected' && `Rejected (${rejectedCount})`}
                                {f === 'all' && 'All'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Clips List */}
                {filteredLogs.length === 0 ? (
                    <div className="empty-state">
                        <Pill size={48} />
                        <h3>{filter === 'pending' ? 'No pending reviews' : 'No records found'}</h3>
                        <p style={{ fontSize: '0.85rem' }}>
                            {filter === 'pending' ? 'All clips have been reviewed! 🎉' : 'Medicine intake clips will appear here.'}
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {filteredLogs.map((log, i) => (
                            <div
                                key={log.id}
                                className="glass-light glass-hover animate-slide-up"
                                style={{
                                    padding: '16px 20px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    cursor: 'pointer',
                                    animationDelay: `${i * 0.05}s`, opacity: 0,
                                }}
                                onClick={() => setSelectedLog(log)}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                        width: '44px', height: '44px', borderRadius: 'var(--radius-md)',
                                        background: 'rgba(0, 212, 255, 0.1)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <Play size={20} style={{ color: 'var(--primary)' }} />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{log.patientName}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                            {log.medicineName || 'Medicine Dose'} • {new Date(log.timestamp).toLocaleString()}
                                            {log.duration && ` • ${log.duration}s clip`}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span className={`badge badge-${log.status === 'rejected' ? 'missed' : log.status}`}>
                                        {log.status === 'verified' && <CheckCircle size={12} />}
                                        {log.status === 'pending' && <Clock size={12} />}
                                        {log.status === 'rejected' && <XCircle size={12} />}
                                        {log.status === 'verified' ? 'accepted' : log.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Review Modal */}
            {selectedLog && (
                <ReviewModal
                    log={selectedLog}
                    onClose={() => setSelectedLog(null)}
                    onVerify={handleVerify}
                    onReject={handleReject}
                />
            )}
        </div>
    );
}
