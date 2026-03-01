import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../utils/firebase';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
} from 'firebase/auth';
import { saveUser, getUserByEmail, getUserById, saveFaceDescriptor, seedDemoData, generateId } from '../utils/db';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Seed demo data on first load
        seedDemoData().catch(err => { console.warn('Seed demo data failed:', err.message); });

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                // Fetch user profile from Firestore
                const profile = await getUserById(firebaseUser.uid);
                if (profile) {
                    setCurrentUser(profile);
                } else {
                    // User exists in Auth but not in Firestore (edge case)
                    setCurrentUser({
                        id: firebaseUser.uid,
                        email: firebaseUser.email,
                        name: firebaseUser.email,
                        role: 'patient',
                        avatar: '😷',
                    });
                }
            } else {
                setCurrentUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const login = async (email, password) => {
        try {
            // First try Firebase Auth
            const cred = await signInWithEmailAndPassword(auth, email, password);
            const profile = await getUserById(cred.user.uid);
            if (profile) {
                setCurrentUser(profile);
                return { success: true, user: profile };
            }
            return { success: false, error: 'Profile not found' };
        } catch (firebaseErr) {
            // Fallback: check if it's a demo account (stored in Firestore but not in Firebase Auth)
            try {
                const user = await getUserByEmail(email);
                if (!user) return { success: false, error: 'User not found' };
                if (user.password !== password) return { success: false, error: 'Invalid password' };

                // Demo user — create Firebase Auth account for them
                try {
                    const cred = await createUserWithEmailAndPassword(auth, email, password);
                    // Update user doc with the Firebase Auth UID
                    const updatedUser = { ...user, id: cred.user.uid };
                    await saveUser(updatedUser);
                    setCurrentUser(updatedUser);
                    return { success: true, user: updatedUser };
                } catch (createErr) {
                    // If auth account already exists, just sign in
                    if (createErr.code === 'auth/email-already-in-use') {
                        const cred2 = await signInWithEmailAndPassword(auth, email, password);
                        const profile = await getUserById(cred2.user.uid) || user;
                        setCurrentUser(profile);
                        return { success: true, user: profile };
                    }
                    // Worst case, use the Firestore-only profile
                    setCurrentUser(user);
                    return { success: true, user };
                }
            } catch (err) {
                return { success: false, error: 'Login failed: ' + (err.message || 'Unknown error') };
            }
        }
    };

    const register = async (userData, faceDescriptor) => {
        try {
            const existing = await getUserByEmail(userData.email);
            if (existing) return { success: false, error: 'Email already registered' };

            // Create Firebase Auth account
            const cred = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
            const uid = cred.user.uid;

            const user = {
                id: uid,
                name: userData.name,
                email: userData.email,
                password: userData.password,
                role: userData.role,
                avatar: userData.role === 'patient' ? '😷' : userData.role === 'doctor' ? '👩‍⚕️' : userData.role === 'caretaker' ? '🧑‍🤝‍🧑' : '🛡️',
                createdAt: Date.now(),
            };

            await saveUser(user);

            if (faceDescriptor && userData.role === 'patient') {
                await saveFaceDescriptor(uid, faceDescriptor);
            }

            setCurrentUser(user);
            return { success: true, user };
        } catch (err) {
            let errorMsg = 'Registration failed';
            if (err.code === 'auth/email-already-in-use') errorMsg = 'Email already registered';
            else if (err.code === 'auth/weak-password') errorMsg = 'Password must be at least 6 characters';
            else if (err.code === 'auth/invalid-email') errorMsg = 'Invalid email address';
            else errorMsg = err.message || errorMsg;
            return { success: false, error: errorMsg };
        }
    };

    const logout = async () => {
        await signOut(auth);
        setCurrentUser(null);
    };

    return (
        <AuthContext.Provider value={{ currentUser, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be inside AuthProvider');
    return ctx;
}
