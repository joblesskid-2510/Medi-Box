import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    getUsersByRole, createCall, updateCall, listenToCall,
    listenForIncomingCalls, addIceCandidate, listenToIceCandidates, generateId,
} from '../utils/db';
import { Video, VideoOff, Mic, MicOff, PhoneCall, PhoneOff, User, Search, PhoneIncoming, X } from 'lucide-react';

const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ]
};

export default function VideoCall() {
    const { currentUser } = useAuth();
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const localStreamRef = useRef(null);
    const pcRef = useRef(null);
    const unsubsRef = useRef([]);

    const [contacts, setContacts] = useState([]);
    const [callState, setCallState] = useState('idle'); // idle | calling | ringing | connected | ended
    const [callee, setCallee] = useState(null);
    const [incomingCall, setIncomingCall] = useState(null);
    const [videoEnabled, setVideoEnabled] = useState(true);
    const [audioEnabled, setAudioEnabled] = useState(true);
    const [elapsed, setElapsed] = useState(0);
    const [search, setSearch] = useState('');
    const [callId, setCallId] = useState(null);

    // Load contacts
    useEffect(() => {
        const role = currentUser.role === 'doctor' ? 'patient' : 'doctor';
        getUsersByRole(role).then(setContacts);
    }, [currentUser]);

    // Listen for incoming calls
    useEffect(() => {
        const unsub = listenForIncomingCalls(currentUser.id, (calls) => {
            if (calls.length > 0 && callState === 'idle') {
                setIncomingCall(calls[0]);
            } else if (calls.length === 0) {
                setIncomingCall(null);
            }
        });
        return () => unsub();
    }, [currentUser.id, callState]);

    // Timer
    useEffect(() => {
        if (callState !== 'connected') return;
        const iv = setInterval(() => setElapsed(e => e + 1), 1000);
        return () => clearInterval(iv);
    }, [callState]);

    const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

    // Cleanup all subscriptions
    const cleanup = useCallback(() => {
        unsubsRef.current.forEach(u => { try { u(); } catch { } });
        unsubsRef.current = [];
        if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }
        if (localStreamRef.current) { localStreamRef.current.getTracks().forEach(t => t.stop()); localStreamRef.current = null; }
        if (localVideoRef.current) localVideoRef.current.srcObject = null;
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    }, []);

    // Get media stream
    const getMedia = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        return stream;
    };

    // Create peer connection
    const createPeer = (stream) => {
        const pc = new RTCPeerConnection(ICE_SERVERS);
        stream.getTracks().forEach(t => pc.addTrack(t, stream));
        pc.ontrack = (e) => {
            if (remoteVideoRef.current && e.streams[0]) {
                remoteVideoRef.current.srcObject = e.streams[0];
            }
        };
        pc.oniceconnectionstatechange = () => {
            if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
                endCall();
            }
        };
        pcRef.current = pc;
        return pc;
    };

    // ─── CALLER: Start a call ───────────────────────
    const startCall = async (contact) => {
        setCallee(contact);
        setCallState('calling');
        setElapsed(0);

        try {
            const stream = await getMedia();
            const pc = createPeer(stream);
            const id = generateId();
            setCallId(id);

            // Collect ICE candidates
            pc.onicecandidate = (e) => {
                if (e.candidate) {
                    addIceCandidate(id, 'callerCandidates', e.candidate.toJSON());
                }
            };

            // Create offer
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            // Save call to Firestore
            await createCall({
                id,
                callerId: currentUser.id,
                callerName: currentUser.name,
                calleeId: contact.id,
                calleeName: contact.name,
                status: 'ringing',
                offer: { type: offer.type, sdp: offer.sdp },
                answer: null,
                createdAt: Date.now(),
            });

            // Listen for answer
            const unsubCall = listenToCall(id, async (callData) => {
                if (callData.status === 'answered' && callData.answer && !pc.currentRemoteDescription) {
                    await pc.setRemoteDescription(new RTCSessionDescription(callData.answer));
                    setCallState('connected');
                }
                if (callData.status === 'declined' || callData.status === 'ended') {
                    endCall();
                }
            });
            unsubsRef.current.push(unsubCall);

            // Listen for callee's ICE candidates
            const unsubIce = listenToIceCandidates(id, 'calleeCandidates', async (data) => {
                try { await pc.addIceCandidate(new RTCIceCandidate(data)); } catch { }
            });
            unsubsRef.current.push(unsubIce);

            // Auto-end if not answered within 30 seconds
            setTimeout(async () => {
                const current = await import('../utils/db').then(m => m.getCallById(id));
                if (current && current.status === 'ringing') {
                    await updateCall(id, { status: 'missed' });
                    endCall();
                }
            }, 30000);
        } catch (err) {
            console.error('Call error:', err);
            setCallState('idle');
        }
    };

    // ─── CALLEE: Answer an incoming call ────────────
    const answerCall = async (call) => {
        setCallee({ id: call.callerId, name: call.callerName });
        setCallState('connected');
        setIncomingCall(null);
        setCallId(call.id);
        setElapsed(0);

        try {
            const stream = await getMedia();
            const pc = createPeer(stream);

            // Collect callee ICE candidates
            pc.onicecandidate = (e) => {
                if (e.candidate) {
                    addIceCandidate(call.id, 'calleeCandidates', e.candidate.toJSON());
                }
            };

            // Set remote offer and create answer
            await pc.setRemoteDescription(new RTCSessionDescription(call.offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            // Send answer to Firestore
            await updateCall(call.id, {
                status: 'answered',
                answer: { type: answer.type, sdp: answer.sdp },
            });

            // Listen for caller's ICE candidates
            const unsubIce = listenToIceCandidates(call.id, 'callerCandidates', async (data) => {
                try { await pc.addIceCandidate(new RTCIceCandidate(data)); } catch { }
            });
            unsubsRef.current.push(unsubIce);

            // Listen for call end
            const unsubCall = listenToCall(call.id, (callData) => {
                if (callData.status === 'ended') endCall();
            });
            unsubsRef.current.push(unsubCall);
        } catch (err) {
            console.error('Answer error:', err);
            setCallState('idle');
        }
    };

    // ─── Decline call ───────────────────────────────
    const declineCall = async (call) => {
        await updateCall(call.id, { status: 'declined' });
        setIncomingCall(null);
    };

    // ─── End call ───────────────────────────────────
    const endCall = async () => {
        if (callId) {
            try { await updateCall(callId, { status: 'ended', endedAt: Date.now() }); } catch { }
        }
        cleanup();
        setCallState('ended');
        setTimeout(() => { setCallState('idle'); setCallee(null); setElapsed(0); setCallId(null); }, 2000);
    };

    const toggleVideo = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
            setVideoEnabled(v => !v);
        }
    };
    const toggleAudio = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
            setAudioEnabled(a => !a);
        }
    };

    const filtered = contacts.filter(c =>
        c.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.email?.toLowerCase().includes(search.toLowerCase())
    );

    // ═══════════════════════════════════════════════
    // INCOMING CALL MODAL (shown on top of any view)
    // ═══════════════════════════════════════════════
    const IncomingCallModal = incomingCall && callState === 'idle' ? (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 300,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(3,7,18,0.9)', backdropFilter: 'blur(16px)',
        }}>
            <style>{`
                .ring-anim { animation: ring-pulse 1.5s ease-in-out infinite; }
                @keyframes ring-pulse { 0%,100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(34,197,94,0.5); } 50% { transform: scale(1.05); box-shadow: 0 0 0 24px rgba(34,197,94,0); } }
                .ring-icon { animation: ring-shake 0.5s ease-in-out infinite; }
                @keyframes ring-shake { 0%,100% { transform: rotate(0); } 25% { transform: rotate(-15deg); } 75% { transform: rotate(15deg); } }
            `}</style>
            <div className="glass ring-anim" style={{ padding: '48px', textAlign: 'center', maxWidth: 400, width: '90%', borderRadius: '24px' }}>
                <div style={{ fontSize: '4rem', marginBottom: '16px' }}>
                    <span className="ring-icon" style={{ display: 'inline-block' }}>📞</span>
                </div>
                <h2 style={{ fontWeight: 800, fontSize: '1.3rem', marginBottom: '6px' }}>Incoming Call</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: '32px' }}>
                    <strong>{incomingCall.callerName}</strong> is calling you...
                </p>
                <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                    <button onClick={() => declineCall(incomingCall)} style={{
                        width: 64, height: 64, borderRadius: '50%', border: 'none', cursor: 'pointer',
                        background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 20px rgba(239,68,68,0.4)',
                    }}>
                        <PhoneOff size={26} color="white" />
                    </button>
                    <button onClick={() => answerCall(incomingCall)} style={{
                        width: 64, height: 64, borderRadius: '50%', border: 'none', cursor: 'pointer',
                        background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 20px rgba(34,197,94,0.4)',
                    }}>
                        <PhoneCall size={26} color="white" />
                    </button>
                </div>
            </div>
        </div>
    ) : null;

    // ═══════════════════════════════════════════════
    // IN-CALL VIEW (Google Meet style)
    // ═══════════════════════════════════════════════
    if (callState !== 'idle') {
        return (
            <div style={{
                position: 'fixed', inset: 0, zIndex: 200,
                background: '#111827', display: 'flex', flexDirection: 'column',
            }}>
                <style>{`
                    .call-pulse { animation: cpulse 2s ease-in-out infinite; }
                    @keyframes cpulse { 0%,100% { box-shadow: 0 0 0 0 rgba(0,212,255,0.4); } 50% { box-shadow: 0 0 0 20px rgba(0,212,255,0); } }
                    .ringing { animation: blink 1s ease infinite; }
                    @keyframes blink { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
                    .ctrl-btn { transition: all 0.2s; }
                    .ctrl-btn:hover { transform: scale(1.1); }
                `}</style>

                {/* Main video area */}
                <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {callState === 'connected' ? (
                        <video ref={remoteVideoRef} autoPlay playsInline style={{
                            width: '100%', height: '100%', objectFit: 'cover', background: '#000',
                        }} />
                    ) : (
                        <div style={{ textAlign: 'center' }}>
                            <div className="call-pulse" style={{
                                width: 140, height: 140, borderRadius: '50%',
                                background: 'rgba(0,212,255,0.08)', border: '2px solid rgba(0,212,255,0.15)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 24px',
                            }}>
                                <span style={{ fontSize: '3.5rem' }}>👤</span>
                            </div>
                            <h2 style={{ color: 'white', fontWeight: 800, fontSize: '1.4rem', marginBottom: '8px' }}>
                                {callee?.name}
                            </h2>
                            <p className="ringing" style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                                {callState === 'calling' ? '📞 Ringing...' : '📴 Call ended'}
                            </p>
                        </div>
                    )}

                    {/* Local PIP */}
                    <div style={{
                        position: 'absolute', bottom: 100, right: 24,
                        width: 220, height: 165, borderRadius: '16px',
                        overflow: 'hidden', border: '2px solid rgba(255,255,255,0.15)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.6)', background: '#1a1a2e',
                    }}>
                        <video ref={localVideoRef} autoPlay playsInline muted style={{
                            width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)',
                        }} />
                        {!videoEnabled && (
                            <div style={{
                                position: 'absolute', inset: 0, background: '#1a1a2e',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <VideoOff size={28} color="rgba(255,255,255,0.3)" />
                            </div>
                        )}
                        <div style={{
                            position: 'absolute', bottom: 6, left: '50%', transform: 'translateX(-50%)',
                            padding: '2px 10px', borderRadius: 'var(--radius-full)',
                            background: 'rgba(0,0,0,0.6)', fontSize: '0.7rem', fontWeight: 600, color: 'white',
                        }}>You</div>
                    </div>

                    {/* Top bar */}
                    <div style={{
                        position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)',
                        display: 'flex', alignItems: 'center', gap: 14,
                        padding: '10px 24px', borderRadius: 'var(--radius-full)',
                        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)',
                    }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: callState === 'connected' ? '#22c55e' : '#eab308' }} />
                        <span style={{ fontWeight: 700, color: 'white', fontSize: '0.95rem' }}>{callee?.name}</span>
                        {callState === 'connected' && (
                            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', fontFamily: 'monospace' }}>
                                {formatTime(elapsed)}
                            </span>
                        )}
                    </div>
                </div>

                {/* Bottom controls (Google Meet style) */}
                <div style={{
                    padding: '20px 0 28px', display: 'flex', justifyContent: 'center', gap: 20,
                    background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(12px)',
                }}>
                    <button className="ctrl-btn" onClick={toggleAudio} style={{
                        width: 56, height: 56, borderRadius: '50%', border: 'none', cursor: 'pointer',
                        background: audioEnabled ? 'rgba(255,255,255,0.1)' : '#ef4444',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        {audioEnabled ? <Mic size={22} color="white" /> : <MicOff size={22} color="white" />}
                    </button>
                    <button className="ctrl-btn" onClick={toggleVideo} style={{
                        width: 56, height: 56, borderRadius: '50%', border: 'none', cursor: 'pointer',
                        background: videoEnabled ? 'rgba(255,255,255,0.1)' : '#ef4444',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        {videoEnabled ? <Video size={22} color="white" /> : <VideoOff size={22} color="white" />}
                    </button>
                    <button className="ctrl-btn" onClick={endCall} style={{
                        width: 56, height: 56, borderRadius: '50%', border: 'none', cursor: 'pointer',
                        background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 20px rgba(239,68,68,0.4)',
                    }}>
                        <PhoneOff size={22} color="white" />
                    </button>
                </div>
            </div>
        );
    }

    // ═══════════════════════════════════════════════
    // CONTACT LIST VIEW
    // ═══════════════════════════════════════════════
    return (
        <div className="page">
            {IncomingCallModal}

            <div className="page-header animate-in">
                <h1>📹 Video Consultation</h1>
                <p>Start a video call with your {currentUser.role === 'doctor' ? 'patients' : 'doctor'}</p>
            </div>

            {/* Search */}
            <div style={{ position: 'relative', marginBottom: 24 }} className="animate-in">
                <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="text" className="input" placeholder="Search contacts..."
                    value={search} onChange={e => setSearch(e.target.value)}
                    style={{ paddingLeft: 42, maxWidth: 400 }} />
            </div>

            {/* Contacts */}
            <div className="glass animate-in" style={{ padding: 24 }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, fontSize: '1rem', fontWeight: 700 }}>
                    <User size={18} style={{ color: 'var(--primary)' }} />
                    {currentUser.role === 'doctor' ? 'Patients' : 'Doctors'}
                    <span style={{
                        marginLeft: 'auto', fontSize: '0.75rem', fontWeight: 600, padding: '4px 12px',
                        borderRadius: 'var(--radius-full)', background: 'rgba(0,212,255,0.08)', color: 'var(--primary)',
                    }}>{filtered.length}</span>
                </h3>

                {filtered.length === 0 ? (
                    <div className="empty-state">
                        <Video size={48} /><h3>No contacts found</h3>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {filtered.map((c, i) => (
                            <div key={c.id} className="glass-light animate-slide-up" style={{
                                padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14,
                                animationDelay: `${0.1 + i * 0.05}s`, opacity: 0,
                            }}>
                                <div style={{
                                    width: 48, height: 48, borderRadius: '50%',
                                    background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 800, fontSize: '1.1rem', color: 'white',
                                }}>{c.name?.charAt(0).toUpperCase()}</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{c.name}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.email}</div>
                                </div>
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: 6,
                                    padding: '4px 10px', borderRadius: 'var(--radius-full)',
                                    background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
                                    fontSize: '0.7rem', fontWeight: 700, color: 'var(--success)',
                                }}>
                                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)' }} />
                                    Online
                                </div>
                                <button onClick={() => startCall(c)} className="btn btn-primary" style={{
                                    padding: '10px 20px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6,
                                }}>
                                    <PhoneCall size={16} /> Call
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
