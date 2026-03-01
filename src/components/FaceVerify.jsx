import React, { useRef, useState, useEffect, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import { useAuth } from '../context/AuthContext';
import { getFaceDescriptor } from '../utils/db';
import { ShieldCheck, ShieldX, Loader, RefreshCw } from 'lucide-react';

const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model';

let modelsLoaded = false;

async function loadModels() {
    if (modelsLoaded) return;
    await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);
    modelsLoaded = true;
}

function euclideanDistance(a, b) {
    let sum = 0;
    for (let i = 0; i < a.length; i++) sum += (a[i] - b[i]) ** 2;
    return Math.sqrt(sum);
}

export default function FaceVerify({ onVerified, onFailed }) {
    const { currentUser } = useAuth();
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const [status, setStatus] = useState('loading'); // loading, verifying, verified, failed
    const [message, setMessage] = useState('Loading face verification...');
    const [confidence, setConfidence] = useState(0);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
    }, []);

    const verify = useCallback(async () => {
        if (!videoRef.current || !currentUser) return;

        setStatus('verifying');
        setMessage('Verifying your identity...');

        try {
            await loadModels();

            const storedDescriptor = await getFaceDescriptor(currentUser.id);
            if (!storedDescriptor) {
                setStatus('failed');
                setMessage('No face enrolled. Please register your face first.');
                return;
            }

            const detection = await faceapi
                .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.5 }))
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (!detection) {
                setStatus('failed');
                setMessage('No face detected. Please position your face clearly.');
                return;
            }

            const distance = euclideanDistance(detection.descriptor, storedDescriptor);
            const matchConfidence = Math.max(0, Math.min(100, Math.round((1 - distance / 1.0) * 100)));

            setConfidence(matchConfidence);

            if (distance < 0.6) {
                setStatus('verified');
                setMessage(`Identity verified! Confidence: ${matchConfidence}%`);
                setTimeout(() => {
                    stopCamera();
                    onVerified();
                }, 1500);
            } else {
                setStatus('failed');
                setMessage(`Face did not match. Distance: ${distance.toFixed(2)}`);
            }
        } catch (err) {
            setStatus('failed');
            setMessage('Verification error. Please try again.');
        }
    }, [currentUser, onVerified, stopCamera]);

    useEffect(() => {
        let mounted = true;

        async function init() {
            try {
                await loadModels();
                if (!mounted) return;

                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: 640, height: 480, facingMode: 'user' }
                });
                if (!mounted) { stream.getTracks().forEach(t => t.stop()); return; }

                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    await videoRef.current.play();
                }

                setStatus('verifying');
                setMessage('Position your face and click Verify');
                // Auto-verify after short delay
                setTimeout(() => { if (mounted) verify(); }, 1500);
            } catch {
                if (mounted) {
                    setStatus('failed');
                    setMessage('Camera access denied.');
                }
            }
        }

        init();
        return () => { mounted = false; stopCamera(); };
    }, [stopCamera]);

    const statusColors = {
        loading: 'var(--warning)',
        verifying: 'var(--primary)',
        verified: 'var(--success)',
        failed: 'var(--danger)',
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="webcam-container" style={{
                borderColor: statusColors[status],
                maxWidth: '500px',
                margin: '0 auto',
                width: '100%',
            }}>
                <video ref={videoRef} playsInline muted />
                {status === 'verifying' && (
                    <div className="webcam-overlay">
                        <div className="face-scanning-ring" />
                    </div>
                )}
                {status === 'verified' && (
                    <div className="webcam-overlay" style={{
                        background: 'rgba(16, 185, 129, 0.2)',
                        border: '3px solid var(--success)',
                        borderRadius: 'var(--radius-lg)',
                    }}>
                        <ShieldCheck size={64} style={{ color: 'var(--success)', filter: 'drop-shadow(0 0 20px rgba(16,185,129,0.5))' }} />
                    </div>
                )}
            </div>

            {/* Status */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                background: `${statusColors[status]}15`,
                border: `1px solid ${statusColors[status]}40`,
                maxWidth: '500px',
                margin: '0 auto',
                width: '100%',
            }}>
                {status === 'verified' ? <ShieldCheck size={18} style={{ color: statusColors[status] }} /> :
                    status === 'failed' ? <ShieldX size={18} style={{ color: statusColors[status] }} /> :
                        <Loader size={18} style={{ color: statusColors[status], animation: 'spin 1s linear infinite' }} />}
                <span style={{ fontSize: '0.9rem', color: statusColors[status] }}>{message}</span>
                {confidence > 0 && (
                    <span style={{
                        marginLeft: 'auto',
                        fontFamily: 'var(--font-display)',
                        fontWeight: 700,
                        color: statusColors[status],
                    }}>{confidence}%</span>
                )}
            </div>

            {/* Actions */}
            {status === 'failed' && (
                <div style={{ display: 'flex', gap: '12px', maxWidth: '500px', margin: '0 auto', width: '100%' }}>
                    <button onClick={verify} className="btn btn-primary" style={{ flex: 1 }}>
                        <RefreshCw size={18} /> Try Again
                    </button>
                    {onFailed && (
                        <button onClick={() => { stopCamera(); onFailed(); }} className="btn btn-ghost" style={{ flex: 1 }}>
                            Cancel
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
