import React, { useRef, useState, useEffect, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import { Camera, CheckCircle, AlertCircle, Loader } from 'lucide-react';

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

export default function FaceCapture({ onCapture, onCancel }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const [status, setStatus] = useState('loading'); // loading, ready, detecting, captured, error
    const [message, setMessage] = useState('Loading face detection models...');
    const [descriptor, setDescriptor] = useState(null);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
    }, []);

    useEffect(() => {
        let mounted = true;

        async function init() {
            try {
                await loadModels();
                if (!mounted) return;
                setMessage('Starting camera...');

                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: 640, height: 480, facingMode: 'user' }
                });
                if (!mounted) { stream.getTracks().forEach(t => t.stop()); return; }

                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    await videoRef.current.play();
                }

                setStatus('ready');
                setMessage('Position your face in the frame and click Capture');
            } catch (err) {
                if (mounted) {
                    setStatus('error');
                    setMessage('Camera access denied. Please enable camera permissions.');
                }
            }
        }

        init();
        return () => { mounted = false; stopCamera(); };
    }, [stopCamera]);

    const handleCapture = async () => {
        if (!videoRef.current) return;
        setStatus('detecting');
        setMessage('Detecting face...');

        try {
            const detection = await faceapi
                .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.5 }))
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (!detection) {
                setStatus('ready');
                setMessage('No face detected. Please try again.');
                return;
            }

            // Draw the detection on canvas
            if (canvasRef.current && videoRef.current) {
                const dims = faceapi.matchDimensions(canvasRef.current, videoRef.current, true);
                const resized = faceapi.resizeResults(detection, dims);
                faceapi.draw.drawDetections(canvasRef.current, resized);
                faceapi.draw.drawFaceLandmarks(canvasRef.current, resized);
            }

            setDescriptor(detection.descriptor);
            setStatus('captured');
            setMessage('Face captured successfully! ✓');
        } catch (err) {
            setStatus('ready');
            setMessage('Detection failed. Please try again.');
        }
    };

    const handleConfirm = () => {
        stopCamera();
        onCapture(descriptor);
    };

    const handleRetry = () => {
        setDescriptor(null);
        setStatus('ready');
        setMessage('Position your face in the frame and click Capture');
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
    };

    const statusColors = {
        loading: 'var(--warning)',
        ready: 'var(--primary)',
        detecting: 'var(--warning)',
        captured: 'var(--success)',
        error: 'var(--danger)',
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Webcam */}
            <div className="webcam-container" style={{ borderColor: statusColors[status] }}>
                <video ref={videoRef} playsInline muted />
                <canvas ref={canvasRef} />
                {status === 'ready' && (
                    <div className="webcam-overlay">
                        <div className="face-scanning-ring" />
                    </div>
                )}
                {status === 'loading' && (
                    <div className="webcam-overlay" style={{
                        background: 'rgba(3, 7, 18, 0.8)',
                        flexDirection: 'column',
                        gap: '12px',
                    }}>
                        <Loader size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading AI models...</span>
                    </div>
                )}
            </div>

            {/* Status Message */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                background: `${statusColors[status]}15`,
                border: `1px solid ${statusColors[status]}40`,
            }}>
                {status === 'captured' ? <CheckCircle size={18} style={{ color: statusColors[status] }} /> :
                    status === 'error' ? <AlertCircle size={18} style={{ color: statusColors[status] }} /> :
                        <Camera size={18} style={{ color: statusColors[status] }} />}
                <span style={{ fontSize: '0.9rem', color: statusColors[status] }}>{message}</span>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px' }}>
                {status === 'ready' && (
                    <button onClick={handleCapture} className="btn btn-primary" style={{ flex: 1 }}>
                        <Camera size={18} /> Capture Face
                    </button>
                )}
                {status === 'detecting' && (
                    <button className="btn btn-ghost" disabled style={{ flex: 1, opacity: 0.6 }}>
                        <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> Detecting...
                    </button>
                )}
                {status === 'captured' && (
                    <>
                        <button onClick={handleRetry} className="btn btn-ghost" style={{ flex: 1 }}>
                            Retry
                        </button>
                        <button onClick={handleConfirm} className="btn btn-success" style={{ flex: 1 }}>
                            <CheckCircle size={18} /> Confirm & Save Face
                        </button>
                    </>
                )}
                {onCancel && (
                    <button onClick={() => { stopCamera(); onCancel(); }} className="btn btn-ghost">
                        Cancel
                    </button>
                )}
            </div>
        </div>
    );
}
