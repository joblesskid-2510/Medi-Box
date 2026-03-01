import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Eye, Video, Users, Pill, Scan, ArrowRight, CheckCircle } from 'lucide-react';

const features = [
    {
        icon: Scan,
        title: 'Face Recognition',
        description: 'One-time biometric enrollment ensures only the registered patient takes their medicine.',
        color: 'var(--primary)',
    },
    {
        icon: Video,
        title: 'Video Verification',
        description: 'Each medicine intake is recorded on camera. Clips are sent to caregivers for review.',
        color: 'var(--accent)',
    },
    {
        icon: Eye,
        title: 'Live Monitoring',
        description: 'Doctors and caretakers review clips in real-time and mark medicines as taken.',
        color: 'var(--success)',
    },
    {
        icon: Shield,
        title: 'Admin Control',
        description: 'Full system oversight with user management, logs, and analytics for administrators.',
        color: 'var(--warning)',
    },
];

const roles = [
    { emoji: '😷', title: 'Patient', desc: 'Enroll face, take medicine on camera', color: 'var(--primary)' },
    { emoji: '👩‍⚕️', title: 'Doctor', desc: 'Review clips, verify intake', color: 'var(--success)' },
    { emoji: '🧑‍🤝‍🧑', title: 'Caretaker', desc: 'Monitor & confirm doses', color: 'var(--accent)' },
    { emoji: '🛡️', title: 'Admin', desc: 'Manage users & system', color: 'var(--warning)' },
];

export default function Landing() {
    return (
        <div style={{ overflow: 'hidden' }}>
            {/* Hero Section */}
            <section style={{
                minHeight: 'calc(100vh - 64px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '48px 24px',
                position: 'relative',
            }}>
                {/* Floating Pills Background */}
                <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
                    {['💊', '💉', '🩺', '🧬', '🩹', '💊'].map((emoji, i) => (
                        <span key={i} style={{
                            position: 'absolute',
                            fontSize: `${20 + i * 8}px`,
                            opacity: 0.08,
                            left: `${10 + i * 15}%`,
                            top: `${20 + (i % 3) * 25}%`,
                            animation: `pill-float ${3 + i * 0.5}s ease-in-out infinite`,
                            animationDelay: `${i * 0.3}s`,
                        }}>{emoji}</span>
                    ))}
                </div>

                <div style={{ maxWidth: '800px', position: 'relative', zIndex: 1 }}>
                    {/* Badge */}
                    <div className="animate-in stagger-1" style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '6px 16px',
                        borderRadius: 'var(--radius-full)',
                        background: 'var(--primary-soft)',
                        border: '1px solid rgba(0, 212, 255, 0.2)',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: 'var(--primary)',
                        marginBottom: '24px',
                    }}>
                        <Pill size={14} /> Smart Medicine Verification
                    </div>

                    <h1 className="animate-in stagger-2" style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 'clamp(2.5rem, 6vw, 4rem)',
                        fontWeight: 900,
                        lineHeight: 1.1,
                        marginBottom: '24px',
                        background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--primary) 50%, var(--accent) 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                    }}>
                        MEDIBOX
                    </h1>

                    <p className="animate-in stagger-3" style={{
                        fontSize: '1.15rem',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.7,
                        maxWidth: '600px',
                        margin: '0 auto 40px',
                    }}>
                        The smart medicine box platform. Patients register with <strong style={{ color: 'var(--primary)' }}>face recognition</strong>, record themselves taking medicine, and caregivers <strong style={{ color: 'var(--accent)' }}>verify via video clips</strong>.
                    </p>

                    <div className="animate-in stagger-4" style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link to="/register" className="btn btn-primary btn-lg">
                            Get Started <ArrowRight size={18} />
                        </Link>
                        <Link to="/login" className="btn btn-ghost btn-lg">
                            Sign In
                        </Link>
                    </div>

                    {/* Demo Credentials */}
                    <div className="animate-in stagger-5 glass-light" style={{
                        marginTop: '32px',
                        padding: '16px 24px',
                        display: 'inline-flex',
                        gap: '24px',
                        fontSize: '0.8rem',
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                    }}>
                        <span style={{ color: 'var(--text-muted)' }}>Demo Logins:</span>
                        <span style={{ color: 'var(--success)' }}>doctor@medibox.com / doctor123</span>
                        <span style={{ color: 'var(--accent)' }}>caretaker@medibox.com / care123</span>
                        <span style={{ color: 'var(--warning)' }}>admin@medibox.com / admin123</span>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section style={{ padding: '80px 24px', maxWidth: '1200px', margin: '0 auto' }}>
                <h2 style={{
                    textAlign: 'center',
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.6rem',
                    marginBottom: '48px',
                    color: 'var(--text-primary)',
                }}>How It Works</h2>

                <div className="grid-4">
                    {features.map((f, i) => (
                        <div key={i} className="glass glass-hover animate-slide-up" style={{
                            padding: '32px 24px',
                            textAlign: 'center',
                            animationDelay: `${i * 0.1}s`,
                            opacity: 0,
                        }}>
                            <div style={{
                                width: '56px',
                                height: '56px',
                                borderRadius: 'var(--radius-lg)',
                                background: `${f.color}15`,
                                border: `1px solid ${f.color}30`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 16px',
                            }}>
                                <f.icon size={24} style={{ color: f.color }} />
                            </div>
                            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '8px' }}>{f.title}</h3>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{f.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Roles */}
            <section style={{ padding: '80px 24px', maxWidth: '900px', margin: '0 auto' }}>
                <h2 style={{
                    textAlign: 'center',
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.6rem',
                    marginBottom: '48px',
                    color: 'var(--text-primary)',
                }}>Four Roles, One Mission</h2>

                <div className="grid-4">
                    {roles.map((r, i) => (
                        <div key={i} className="glass animate-slide-up" style={{
                            padding: '24px',
                            textAlign: 'center',
                            borderTop: `3px solid ${r.color}`,
                            animationDelay: `${i * 0.1}s`,
                            opacity: 0,
                        }}>
                            <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '12px' }}>{r.emoji}</span>
                            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '6px' }}>{r.title}</h3>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{r.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section style={{
                padding: '80px 24px',
                textAlign: 'center',
            }}>
                <div className="glass" style={{
                    maxWidth: '600px',
                    margin: '0 auto',
                    padding: '48px',
                    animation: 'pulse-glow 3s ease-in-out infinite',
                }}>
                    <h2 style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '1.4rem',
                        marginBottom: '16px',
                    }}>Ready to Secure Medicine Intake?</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                        Register as a patient, enroll your face, and start verified medicine tracking today.
                    </p>
                    <Link to="/register" className="btn btn-primary btn-lg">
                        <CheckCircle size={18} /> Create Account
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer style={{
                padding: '24px',
                textAlign: 'center',
                borderTop: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)',
                fontSize: '0.8rem',
            }}>
                <span style={{ fontFamily: 'var(--font-display)' }}>MEDIBOX</span> — Smart Medicine Verification Platform
            </footer>
        </div>
    );
}
