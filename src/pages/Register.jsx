import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FaceCapture from '../components/FaceCapture';
import { UserPlus, Mail, Lock, User, AlertCircle, CheckCircle, Scan } from 'lucide-react';

export default function Register() {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: form, 2: face capture (patients only)
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'patient' });
    const [error, setError] = useState('');

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        if (formData.role === 'patient') {
            setStep(2); // go to face capture
        } else {
            // Non-patients register directly
            const result = await register(formData, null);
            if (result.success) {
                navigate(`/${result.user.role}`);
            } else {
                setError(result.error);
            }
        }
    };

    const handleFaceCaptured = async (descriptor) => {
        const result = await register(formData, descriptor);
        if (result.success) {
            navigate('/patient');
        } else {
            setError(result.error);
            setStep(1);
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
                maxWidth: step === 2 ? '600px' : '460px',
                padding: '40px',
                transition: 'max-width var(--transition-base)',
            }}>
                {step === 1 ? (
                    <>
                        {/* Header */}
                        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '12px' }}>💊</span>
                            <h1 style={{
                                fontFamily: 'var(--font-display)',
                                fontSize: '1.5rem',
                                fontWeight: 700,
                                marginBottom: '8px',
                            }}>Create Account</h1>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                Join MediBox to get started
                            </p>
                        </div>

                        {/* Error */}
                        {error && (
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                padding: '12px', borderRadius: 'var(--radius-md)',
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '16px',
                            }}>
                                <AlertCircle size={16} /> {error}
                            </div>
                        )}

                        <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div className="input-group">
                                <label><User size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} />Full Name</label>
                                <input
                                    type="text" className="input" required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="John Doe"
                                />
                            </div>

                            <div className="input-group">
                                <label><Mail size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} />Email</label>
                                <input
                                    type="email" className="input" required
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="your@email.com"
                                />
                            </div>

                            <div className="input-group">
                                <label><Lock size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} />Password</label>
                                <input
                                    type="password" className="input" required
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="••••••••"
                                />
                            </div>

                            <div className="input-group">
                                <label>Role</label>
                                <select
                                    className="input"
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                                >
                                    <option value="patient">😷 Patient</option>
                                    <option value="doctor">👩‍⚕️ Doctor</option>
                                    <option value="caretaker">🧑‍🤝‍🧑 Caretaker</option>
                                </select>
                            </div>

                            {/* Hint for patients */}
                            {formData.role === 'patient' && (
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    padding: '12px', borderRadius: 'var(--radius-md)',
                                    background: 'rgba(0, 212, 255, 0.08)',
                                    border: '1px solid rgba(0, 212, 255, 0.2)',
                                    fontSize: '0.8rem', color: 'var(--primary)',
                                }}>
                                    <Scan size={16} />
                                    Next step: You'll enroll your face for identity verification
                                </div>
                            )}

                            <button type="submit" className="btn btn-primary btn-lg" style={{ marginTop: '8px' }}>
                                {formData.role === 'patient' ? (
                                    <><Scan size={18} /> Continue to Face Enrollment</>
                                ) : (
                                    <><UserPlus size={18} /> Create Account</>
                                )}
                            </button>
                        </form>

                        <div style={{
                            textAlign: 'center', marginTop: '24px',
                            color: 'var(--text-muted)', fontSize: '0.85rem',
                        }}>
                            Already have an account?{' '}
                            <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign in</Link>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Step 2: Face Capture */}
                        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                            <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: '8px',
                                padding: '6px 16px', borderRadius: 'var(--radius-full)',
                                background: 'var(--primary-soft)',
                                border: '1px solid rgba(0, 212, 255, 0.2)',
                                fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)',
                                marginBottom: '16px',
                            }}>
                                <Scan size={14} /> Step 2 of 2 — Face Enrollment
                            </div>
                            <h2 style={{
                                fontFamily: 'var(--font-display)',
                                fontSize: '1.3rem',
                                fontWeight: 700,
                                marginBottom: '8px',
                            }}>Enroll Your Face</h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                This is a one-time registration. Your face will be used to verify your identity when taking medicine.
                            </p>
                        </div>

                        <FaceCapture
                            onCapture={handleFaceCaptured}
                            onCancel={() => setStep(1)}
                        />
                    </>
                )}
            </div>
        </div>
    );
}
