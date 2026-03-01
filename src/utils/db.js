// ═══════════════════════════════════════════════
// MediBox — Database Utilities (Firestore + Firebase Storage)
// ═══════════════════════════════════════════════

import { db } from './firebase';
import {
    collection, doc, addDoc, getDoc, getDocs, updateDoc,
    query, where, orderBy, setDoc, deleteDoc, serverTimestamp, onSnapshot
} from 'firebase/firestore';

// ─── Collections ───────────────────────────────
const USERS_COL = 'users';
const LOGS_COL = 'medicineLogs';
const FACES_COL = 'faceDescriptors';

// ─── Users ─────────────────────────────────────
export async function getUsers() {
    const snap = await getDocs(collection(db, USERS_COL));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function saveUser(user) {
    const docRef = doc(db, USERS_COL, user.id);
    await setDoc(docRef, {
        ...user,
        createdAt: Date.now(),
    });
}

export async function getUserByEmail(email) {
    const q = query(collection(db, USERS_COL), where('email', '==', email));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { id: d.id, ...d.data() };
}

export async function getUserById(id) {
    const docRef = doc(db, USERS_COL, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
}

export async function getUsersByRole(role) {
    const q = query(collection(db, USERS_COL), where('role', '==', role));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function updateUser(userId, updates) {
    const docRef = doc(db, USERS_COL, userId);
    await updateDoc(docRef, updates);
}

// ─── Prescriptions ─────────────────────────────
const PRESCRIPTIONS_COL = 'prescriptions';

export async function savePrescription(prescription) {
    const docRef = doc(db, PRESCRIPTIONS_COL, prescription.id);
    await setDoc(docRef, prescription);
}

export async function getPrescriptionsByPatient(patientId) {
    const q = query(collection(db, PRESCRIPTIONS_COL), where('patientId', '==', patientId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function deletePrescription(id) {
    await deleteDoc(doc(db, PRESCRIPTIONS_COL, id));
}

// ─── Face Descriptors ──────────────────────────
export async function saveFaceDescriptor(userId, descriptor) {
    const docRef = doc(db, FACES_COL, userId);
    await setDoc(docRef, {
        userId,
        descriptor: Array.from(descriptor),
        updatedAt: Date.now(),
    });
}

export async function getFaceDescriptor(userId) {
    const docRef = doc(db, FACES_COL, userId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return new Float32Array(snap.data().descriptor);
}

export async function getAllFaceDescriptors() {
    const snap = await getDocs(collection(db, FACES_COL));
    const result = {};
    snap.docs.forEach(d => {
        result[d.id] = new Float32Array(d.data().descriptor);
    });
    return result;
}

// ─── Medicine Logs ─────────────────────────────
export async function getMedicineLogs() {
    const snap = await getDocs(collection(db, LOGS_COL));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
}

export async function saveMedicineLog(log) {
    const docRef = doc(db, LOGS_COL, log.id);
    await setDoc(docRef, log);
}

export async function updateMedicineLog(logId, updates) {
    const docRef = doc(db, LOGS_COL, logId);
    await updateDoc(docRef, updates);
    const snap = await getDoc(docRef);
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function getLogsByPatient(patientId) {
    const q = query(
        collection(db, LOGS_COL),
        where('patientId', '==', patientId)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
}

export async function getPendingLogs() {
    const q = query(collection(db, LOGS_COL), where('status', '==', 'pending'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ─── Video Clips (Cloudinary) ──────────────────
const CLOUDINARY_CLOUD = 'dz8ffoyet';
const CLOUDINARY_PRESET = 'medibox_clips';

export async function saveClip(id, blob) {
    const formData = new FormData();
    formData.append('file', blob);
    formData.append('upload_preset', CLOUDINARY_PRESET);
    formData.append('public_id', `medibox/${id}`);
    formData.append('resource_type', 'video');

    const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/video/upload`,
        { method: 'POST', body: formData }
    );

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || 'Cloudinary upload failed');
    }

    const data = await res.json();
    return data.secure_url; // returns the video URL
}

export async function getClip(clipUrl) {
    // Cloudinary URLs are direct — just return the URL
    return clipUrl || null;
}

// ─── App Settings ──────────────────────────────
const SETTINGS_DOC = 'app';
const SETTINGS_COL = 'settings';

export async function getAppSettings() {
    try {
        const ref = doc(db, SETTINGS_COL, SETTINGS_DOC);
        const snap = await getDoc(ref);
        if (snap.exists()) return snap.data();
        // Default settings
        return { mlPillDetection: false };
    } catch {
        return { mlPillDetection: false };
    }
}

export async function updateAppSettings(updates) {
    const ref = doc(db, SETTINGS_COL, SETTINGS_DOC);
    const snap = await getDoc(ref);
    if (snap.exists()) {
        await updateDoc(ref, updates);
    } else {
        await setDoc(ref, { mlPillDetection: false, ...updates });
    }
}

// ─── Seed Demo Data ────────────────────────────
export async function seedDemoData() {
    // Check if demo data already exists
    const existingDoc = await getDoc(doc(db, USERS_COL, 'doc1'));
    if (existingDoc.exists()) return;

    const demoUsers = [
        { id: 'doc1', name: 'Dr. Sarah Chen', email: 'doctor@medibox.com', password: 'doctor123', role: 'doctor', avatar: '👩‍⚕️', createdAt: Date.now() },
        { id: 'care1', name: 'James Wilson', email: 'caretaker@medibox.com', password: 'care123', role: 'caretaker', avatar: '🧑‍🤝‍🧑', createdAt: Date.now() },
        { id: 'admin1', name: 'System Admin', email: 'admin@medibox.com', password: 'admin123', role: 'admin', avatar: '🛡️', createdAt: Date.now() },
    ];

    for (const user of demoUsers) {
        await saveUser(user);
    }
}

// ─── Appointments ──────────────────────────────
const APPOINTMENTS_COL = 'appointments';

export async function saveAppointment(appointment) {
    const docRef = doc(db, APPOINTMENTS_COL, appointment.id);
    await setDoc(docRef, appointment);
}

export async function getAppointmentsByDoctor(doctorId) {
    const q = query(collection(db, APPOINTMENTS_COL), where('doctorId', '==', doctorId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getAppointmentsByPatient(patientId) {
    const q = query(collection(db, APPOINTMENTS_COL), where('patientId', '==', patientId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function updateAppointment(id, updates) {
    const docRef = doc(db, APPOINTMENTS_COL, id);
    await updateDoc(docRef, updates);
}

export async function deleteAppointment(id) {
    await deleteDoc(doc(db, APPOINTMENTS_COL, id));
}

// ─── Video Calls (WebRTC Signaling) ─────────────
const CALLS_COL = 'calls';

export async function createCall(callData) {
    const docRef = doc(db, CALLS_COL, callData.id);
    await setDoc(docRef, callData);
    return callData.id;
}

export async function getCallById(id) {
    const docRef = doc(db, CALLS_COL, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
}

export async function updateCall(id, updates) {
    const docRef = doc(db, CALLS_COL, id);
    await updateDoc(docRef, updates);
}

export async function getActiveCalls(userId) {
    const q = query(collection(db, CALLS_COL), where('status', '==', 'ringing'));
    const snap = await getDocs(q);
    return snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(c => c.callerId === userId || c.calleeId === userId);
}

// Real-time listener for a specific call document
export function listenToCall(callId, callback) {
    const docRef = doc(db, CALLS_COL, callId);
    return onSnapshot(docRef, (snap) => {
        if (snap.exists()) callback({ id: snap.id, ...snap.data() });
    });
}

// Listen for incoming calls targeting a user
export function listenForIncomingCalls(userId, callback) {
    const q = query(collection(db, CALLS_COL), where('calleeId', '==', userId), where('status', '==', 'ringing'));
    return onSnapshot(q, (snap) => {
        const calls = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        callback(calls);
    });
}

// ICE candidates sub-collection
export async function addIceCandidate(callId, who, candidate) {
    const colRef = collection(db, CALLS_COL, callId, who);
    await addDoc(colRef, candidate);
}

export function listenToIceCandidates(callId, who, callback) {
    const colRef = collection(db, CALLS_COL, callId, who);
    return onSnapshot(colRef, (snap) => {
        snap.docChanges().forEach(change => {
            if (change.type === 'added') callback(change.doc.data());
        });
    });
}

// ─── Chat Messages ─────────────────────────────
const MESSAGES_COL = 'messages';

export async function saveMessage(message) {
    const docRef = doc(db, MESSAGES_COL, message.id);
    await setDoc(docRef, message);
}

export async function getMessagesByChat(chatId) {
    const q = query(collection(db, MESSAGES_COL), where('chatId', '==', chatId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.timestamp - b.timestamp);
}

// ─── Health Vitals ──────────────────────────────
const VITALS_COL = 'vitals';

export async function saveVital(vital) {
    const docRef = doc(db, VITALS_COL, vital.id);
    await setDoc(docRef, vital);
}

export async function getVitalsByPatient(patientId) {
    const q = query(collection(db, VITALS_COL), where('patientId', '==', patientId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.timestamp - a.timestamp);
}

// ─── Emergency Alerts ──────────────────────────
const ALERTS_COL = 'alerts';

export async function createAlert(alert) {
    const docRef = doc(db, ALERTS_COL, alert.id);
    await setDoc(docRef, alert);
}

export async function getAlertsByDoctor(doctorId) {
    const q = query(collection(db, ALERTS_COL), where('doctorId', '==', doctorId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.timestamp - a.timestamp);
}

export async function getAlertsByPatient(patientId) {
    const q = query(collection(db, ALERTS_COL), where('patientId', '==', patientId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function updateAlert(id, updates) {
    const docRef = doc(db, ALERTS_COL, id);
    await updateDoc(docRef, updates);
}

// ─── Generate Unique IDs ───────────────────────
export function generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
