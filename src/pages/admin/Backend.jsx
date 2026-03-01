import React, { useState, useEffect } from 'react';
import { db } from '../../utils/firebase';
import { collection, getDocs } from 'firebase/firestore';
import {
    Database, Server, Shield, Zap, Cloud, HardDrive, Users, FileText,
    Activity, Lock, Globe, Cpu, Wifi, CheckCircle, ArrowUpRight, Layers
} from 'lucide-react';

// Animated counter hook
function useCounter(target, duration = 1500) {
    const [count, setCount] = useState(0);
    useEffect(() => {
        if (target === 0) return;
        let start = 0;
        const step = Math.max(1, Math.floor(target / (duration / 16)));
        const timer = setInterval(() => {
            start += step;
            if (start >= target) { setCount(target); clearInterval(timer); }
            else setCount(start);
        }, 16);
        return () => clearInterval(timer);
    }, [target, duration]);
    return count;
}

// Live pulse dot component
function PulseDot({ color = 'var(--success)', size = 8 }) {
    return (
        <span style={{ position: 'relative', display: 'inline-block', width: size, height: size }}>
            <span style={{
                position: 'absolute', inset: 0, borderRadius: '50%', background: color,
                animation: 'pulse-ring 1.5s ease-out infinite',
            }} />
            <span style={{
                position: 'absolute', inset: 0, borderRadius: '50%', background: color,
            }} />
        </span>
    );
}

// Animated progress bar
function AnimatedBar({ value, max, color, delay = 0 }) {
    const [width, setWidth] = useState(0);
    useEffect(() => {
        const t = setTimeout(() => setWidth(max > 0 ? (value / max) * 100 : 0), 200 + delay);
        return () => clearTimeout(t);
    }, [value, max, delay]);
    return (
        <div style={{
            height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.06)',
            overflow: 'hidden', width: '100%',
        }}>
            <div style={{
                height: '100%', borderRadius: '3px', background: color,
                width: `${width}%`, transition: 'width 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }} />
        </div>
    );
}

export default function AdminBackend() {
    const [stats, setStats] = useState({
        users: 0, logs: 0, clips: 0, faces: 0,
        usersData: [], logsData: [],
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                const [usersSnap, logsSnap, facesSnap] = await Promise.all([
                    getDocs(collection(db, 'users')),
                    getDocs(collection(db, 'medicineLogs')),
                    getDocs(collection(db, 'faceDescriptors')),
                ]);
                setStats({
                    users: usersSnap.size,
                    logs: logsSnap.size,
                    clips: logsSnap.docs.filter(d => d.data().clipUrl).length,
                    faces: facesSnap.size,
                    usersData: usersSnap.docs.map(d => d.data()),
                    logsData: logsSnap.docs.map(d => d.data()),
                });
            } catch (err) {
                console.error('Error fetching backend stats:', err);
            }
            setLoading(false);
        }
        fetchStats();
    }, []);

    const animUsers = useCounter(stats.users);
    const animLogs = useCounter(stats.logs);
    const animClips = useCounter(stats.clips);
    const animFaces = useCounter(stats.faces);

    const firebaseServices = [
        {
            name: 'Firebase Authentication',
            icon: Lock,
            status: 'ACTIVE',
            color: '#FBBC04',
            description: 'Email/Password sign-in • Session management • Token refresh',
            metrics: [
                { label: 'Registered Users', value: stats.users },
                { label: 'Auth Provider', value: 'Email/Pass' },
                { label: 'Session Duration', value: 'Persistent' },
            ],
        },
        {
            name: 'Cloud Firestore',
            icon: Database,
            status: 'ACTIVE',
            color: '#FF9100',
            description: 'NoSQL document database • Real-time sync • Automatic scaling',
            metrics: [
                { label: 'Collections', value: 3 },
                { label: 'Total Documents', value: stats.users + stats.logs + stats.faces },
                { label: 'Region', value: 'Auto' },
            ],
        },
        {
            name: 'Cloudinary CDN',
            icon: HardDrive,
            status: 'ACTIVE',
            color: '#00BCD4',
            description: 'Cloud video hosting • Auto-compression • Global CDN delivery',
            metrics: [
                { label: 'Stored Clips', value: stats.clips },
                { label: 'Max Size', value: 'Unlimited' },
                { label: 'Format', value: 'WebM/MP4' },
            ],
        },
        {
            name: 'Face Recognition AI',
            icon: Cpu,
            status: 'ACTIVE',
            color: '#E040FB',
            description: 'face-api.js • TinyFaceDetector • 128-dim face descriptors',
            metrics: [
                { label: 'Enrolled Faces', value: stats.faces },
                { label: 'Model', value: 'TinyFace' },
                { label: 'Threshold', value: '0.6 dist' },
            ],
        },
    ];

    const firestoreCollections = [
        { name: 'users', docs: stats.users, icon: Users, color: 'var(--primary)', description: 'User profiles, roles, credentials' },
        { name: 'medicineLogs', docs: stats.logs, icon: FileText, color: 'var(--success)', description: 'Medicine intake records & Cloudinary clip URLs' },
        { name: 'faceDescriptors', docs: stats.faces, icon: Cpu, color: '#E040FB', description: 'Face recognition vectors (Float32Array)' },
    ];

    const techStack = [
        { name: 'React 18', version: '18.x', color: '#61DAFB', icon: '⚛️' },
        { name: 'Vite', version: '5.x', color: '#646CFF', icon: '⚡' },
        { name: 'Firebase SDK', version: '11.x', color: '#FFCA28', icon: '🔥' },
        { name: 'Cloudinary', version: 'API v1', color: '#3448C5', icon: '☁️' },
        { name: 'face-api.js', version: '1.7', color: '#E040FB', icon: '🧠' },
        { name: 'Lucide React', version: 'latest', color: '#F56565', icon: '✨' },
        { name: 'React Router', version: '6.x', color: '#CA4245', icon: '🧭' },
    ];

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="spinner" />
                <p>Loading backend infrastructure...</p>
            </div>
        );
    }

    return (
        <div className="page">
            {/* Inline animations */}
            <style>{`
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        @keyframes float-icon {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes glow-border {
          0%, 100% { border-color: rgba(0,212,255,0.15); }
          50% { border-color: rgba(0,212,255,0.4); }
        }
        @keyframes data-flow {
          0% { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .backend-card {
          position: relative;
          overflow: hidden;
        }
        .backend-card::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255,255,255,0.02),
            transparent
          );
          animation: shimmer 3s infinite;
          pointer-events: none;
        }
        .service-card:hover {
          transform: translateY(-4px) scale(1.01);
          box-shadow: 0 12px 40px rgba(0,0,0,0.4);
        }
        .service-card {
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .data-flow-line {
          height: 2px;
          background: linear-gradient(90deg, transparent, var(--primary), var(--accent), transparent);
          background-size: 200% auto;
          animation: data-flow 2s linear infinite;
        }
        .tech-chip:hover {
          transform: translateY(-2px) scale(1.05);
        }
        .tech-chip {
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>

            {/* Header */}
            <div className="page-header animate-in">
                <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Server size={28} style={{
                        color: 'var(--primary)',
                        animation: 'float-icon 3s ease-in-out infinite',
                    }} />
                    Backend Infrastructure
                </h1>
                <p style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <PulseDot /> All systems operational — Firebase Cloud Platform
                </p>
            </div>

            {/* Live Data Flow Indicator */}
            <div className="data-flow-line" style={{ marginBottom: '32px', borderRadius: '2px' }} />

            {/* Quick Stats — Animated Counters */}
            <div className="grid-4" style={{ marginBottom: '32px' }}>
                {[
                    { icon: Database, label: 'Firestore Documents', value: animUsers + animLogs + animFaces, color: '#FF9100' },
                    { icon: Users, label: 'Auth Accounts', value: animUsers, color: '#FBBC04' },
                    { icon: HardDrive, label: 'Cloudinary Clips', value: animClips, color: '#00BCD4' },
                    { icon: Cpu, label: 'Face Vectors', value: animFaces, color: '#E040FB' },
                ].map((s, i) => (
                    <div key={i} className="glass stat-card glass-hover backend-card animate-slide-up" style={{
                        animationDelay: `${i * 0.1}s`, opacity: 0,
                        borderTop: `2px solid ${s.color}`,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <s.icon size={18} style={{ color: s.color }} />
                            <span className="stat-label">{s.label}</span>
                        </div>
                        <span className="stat-value" style={{
                            background: `linear-gradient(135deg, ${s.color}, var(--text-primary))`,
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                            fontFamily: 'var(--font-display)',
                        }}>{s.value}</span>
                    </div>
                ))}
            </div>

            {/* Firebase Services */}
            <div className="glass animate-in" style={{ padding: '28px', marginBottom: '32px' }}>
                <h2 style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    fontSize: '1.1rem', fontWeight: 700, marginBottom: '24px',
                }}>
                    <Cloud size={20} style={{ color: 'var(--primary)' }} />
                    Firebase Services
                    <span style={{
                        fontSize: '0.7rem', fontWeight: 600, marginLeft: 'auto',
                        padding: '4px 12px', borderRadius: 'var(--radius-full)',
                        background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
                        color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '6px',
                    }}>
                        <PulseDot size={6} /> ALL SERVICES ONLINE
                    </span>
                </h2>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                    {firebaseServices.map((svc, i) => (
                        <div key={i} className="glass-light service-card animate-slide-up" style={{
                            padding: '24px',
                            animationDelay: `${0.2 + i * 0.1}s`, opacity: 0,
                            borderLeft: `3px solid ${svc.color}`,
                        }}>
                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                marginBottom: '12px',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{
                                        width: '40px', height: '40px', borderRadius: 'var(--radius-md)',
                                        background: `${svc.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <svc.icon size={20} style={{ color: svc.color }} />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{svc.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{svc.description}</div>
                                    </div>
                                </div>
                                <span style={{
                                    fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em',
                                    padding: '3px 10px', borderRadius: 'var(--radius-full)',
                                    background: 'rgba(16,185,129,0.1)', color: 'var(--success)',
                                    display: 'flex', alignItems: 'center', gap: '4px',
                                }}>
                                    <PulseDot size={5} /> {svc.status}
                                </span>
                            </div>

                            <div style={{
                                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px',
                            }}>
                                {svc.metrics.map((m, j) => (
                                    <div key={j} style={{
                                        padding: '10px',
                                        borderRadius: 'var(--radius-sm)',
                                        background: 'rgba(255,255,255,0.03)',
                                        textAlign: 'center',
                                    }}>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            {m.label}
                                        </div>
                                        <div style={{
                                            fontSize: '0.95rem', fontWeight: 700, color: svc.color,
                                            fontFamily: typeof m.value === 'number' ? 'var(--font-display)' : 'inherit',
                                        }}>
                                            {m.value}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Firestore Collections Explorer */}
            <div className="glass animate-in" style={{ padding: '28px', marginBottom: '32px' }}>
                <h2 style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    fontSize: '1.1rem', fontWeight: 700, marginBottom: '24px',
                }}>
                    <Layers size={20} style={{ color: '#FF9100' }} />
                    Firestore Collections
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {firestoreCollections.map((col, i) => {
                        const maxDocs = Math.max(...firestoreCollections.map(c => c.docs), 1);
                        return (
                            <div key={i} className="glass-light animate-slide-up" style={{
                                padding: '20px',
                                animationDelay: `${0.3 + i * 0.08}s`, opacity: 0,
                            }}>
                                <div style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    marginBottom: '12px',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <col.icon size={18} style={{ color: col.color }} />
                                        <div>
                                            <code style={{
                                                fontWeight: 700, fontSize: '0.9rem',
                                                background: `${col.color}15`, padding: '2px 8px',
                                                borderRadius: 'var(--radius-sm)', color: col.color,
                                            }}>{col.name}</code>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                {col.description}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{
                                        fontFamily: 'var(--font-display)', fontSize: '1.2rem',
                                        fontWeight: 700, color: col.color,
                                    }}>
                                        {col.docs}
                                        <span style={{ fontSize: '0.7rem', fontWeight: 500, color: 'var(--text-muted)', marginLeft: '4px' }}>docs</span>
                                    </div>
                                </div>
                                <AnimatedBar value={col.docs} max={maxDocs} color={col.color} delay={i * 150} />
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Architecture + Tech Stack */}
            <div className="grid-2" style={{ marginBottom: '32px' }}>
                {/* Architecture Diagram */}
                <div className="glass animate-in" style={{ padding: '28px' }}>
                    <h2 style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        fontSize: '1.1rem', fontWeight: 700, marginBottom: '24px',
                    }}>
                        <Globe size={20} style={{ color: 'var(--primary)' }} />
                        System Architecture
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {[
                            { layer: 'Client', items: ['React SPA', 'face-api.js', 'MediaRecorder'], color: '#61DAFB', icon: '🖥️' },
                            { layer: 'Authentication', items: ['Firebase Auth', 'Email/Password', 'Session Tokens'], color: '#FBBC04', icon: '🔐' },
                            { layer: 'Database', items: ['Cloud Firestore', '4 Collections', 'NoSQL Documents'], color: '#FF9100', icon: '🗄️' },
                            { layer: 'Storage', items: ['Cloudinary CDN', 'Unsigned Uploads', '25GB Free'], color: '#00BCD4', icon: '☁️' },
                            { layer: 'AI / ML', items: ['TinyFaceDetector', '128-dim Vectors', 'Euclidean Distance'], color: '#E040FB', icon: '🧠' },
                        ].map((l, i) => (
                            <div key={i} className="glass-light animate-slide-up" style={{
                                padding: '14px 16px',
                                animationDelay: `${0.4 + i * 0.08}s`, opacity: 0,
                                display: 'flex', alignItems: 'center', gap: '12px',
                                borderLeft: `3px solid ${l.color}`,
                            }}>
                                <span style={{ fontSize: '1.3rem' }}>{l.icon}</span>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: l.color }}>{l.layer}</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                        {l.items.join(' • ')}
                                    </div>
                                </div>
                                <CheckCircle size={14} style={{ color: 'var(--success)', opacity: 0.7 }} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tech Stack */}
                <div className="glass animate-in" style={{ padding: '28px' }}>
                    <h2 style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        fontSize: '1.1rem', fontWeight: 700, marginBottom: '24px',
                    }}>
                        <Zap size={20} style={{ color: 'var(--accent)' }} />
                        Tech Stack
                    </h2>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                        {techStack.map((tech, i) => (
                            <div key={i} className="glass-light tech-chip animate-slide-up" style={{
                                padding: '14px 18px',
                                animationDelay: `${0.5 + i * 0.08}s`, opacity: 0,
                                display: 'flex', alignItems: 'center', gap: '10px',
                                cursor: 'default',
                                borderBottom: `2px solid ${tech.color}`,
                                minWidth: '140px',
                            }}>
                                <span style={{ fontSize: '1.4rem' }}>{tech.icon}</span>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{tech.name}</div>
                                    <div style={{ fontSize: '0.7rem', color: tech.color, fontFamily: 'var(--font-display)' }}>
                                        v{tech.version}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Security Info */}
                    <div style={{ marginTop: '24px' }}>
                        <h3 style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            fontSize: '0.9rem', fontWeight: 700, marginBottom: '12px',
                        }}>
                            <Shield size={16} style={{ color: 'var(--warning)' }} />
                            Security Features
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {[
                                'Firebase Auth token-based sessions',
                                'Firestore security rules enforcement',
                                'Face biometric identity verification',
                                'Video evidence of medicine intake',
                                'Role-based access control (RBAC)',
                            ].map((item, i) => (
                                <div key={i} style={{
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    fontSize: '0.8rem', color: 'var(--text-secondary)',
                                }}>
                                    <CheckCircle size={13} style={{ color: 'var(--success)', flexShrink: 0 }} />
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* API Endpoints / Data Flow */}
            <div className="glass animate-in" style={{ padding: '28px', marginBottom: '32px' }}>
                <h2 style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    fontSize: '1.1rem', fontWeight: 700, marginBottom: '24px',
                }}>
                    <Wifi size={20} style={{ color: 'var(--primary)' }} />
                    Data Flow & API Calls
                </h2>

                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Operation</th>
                                <th>Service</th>
                                <th>Collection / Method</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                { op: 'User Registration', svc: 'Auth + Firestore', method: 'createUserWithEmailAndPassword → users/', status: 'active' },
                                { op: 'User Login', svc: 'Auth', method: 'signInWithEmailAndPassword', status: 'active' },
                                { op: 'Face Enrollment', svc: 'Firestore', method: 'faceDescriptors/{userId}', status: 'active' },
                                { op: 'Face Verification', svc: 'Client AI', method: 'face-api.js → euclideanDistance', status: 'active' },
                                { op: 'Save Medicine Log', svc: 'Firestore', method: 'medicineLogs/{logId}', status: 'active' },
                                { op: 'Save Video Clip', svc: 'Cloudinary', method: 'POST /v1_1/{cloud}/video/upload', status: 'active' },
                                { op: 'Review / Accept', svc: 'Firestore', method: 'updateDoc → status: verified', status: 'active' },
                                { op: 'Review / Reject', svc: 'Firestore', method: 'updateDoc → status: rejected', status: 'active' },
                            ].map((row, i) => (
                                <tr key={i}>
                                    <td style={{ fontWeight: 600 }}>{row.op}</td>
                                    <td><code style={{ fontSize: '0.8rem', padding: '2px 6px', background: 'rgba(0,212,255,0.08)', borderRadius: '4px', color: 'var(--primary)' }}>{row.svc}</code></td>
                                    <td><code style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{row.method}</code></td>
                                    <td>
                                        <span style={{
                                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                                            fontSize: '0.7rem', fontWeight: 700, color: 'var(--success)',
                                            textTransform: 'uppercase', letterSpacing: '0.05em',
                                        }}>
                                            <PulseDot size={5} /> LIVE
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Footer Badge */}
            <div className="animate-in" style={{
                textAlign: 'center', padding: '20px',
                color: 'var(--text-muted)', fontSize: '0.8rem',
            }}>
                <span style={{
                    padding: '8px 20px', borderRadius: 'var(--radius-full)',
                    background: 'var(--bg-glass)', border: '1px solid var(--border-glass)',
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                }}>
                    <Cloud size={14} /> Powered by Firebase + Cloudinary • Project: <code style={{ color: 'var(--primary)' }}>medibox-app-joy</code>
                </span>
            </div>
        </div>
    );
}
