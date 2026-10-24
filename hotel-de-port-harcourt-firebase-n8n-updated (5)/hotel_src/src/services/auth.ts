// src/services/auth.ts
// Firebase Authentication Service for Hotel De Port

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth } from './firebase.ts';
import { AdminUser } from '../types.ts';

const ADMIN_SESSION_KEY = 'hdph_admin_session';
const GUEST_SESSION_KEY = 'hdph_guest_session';
const ADMIN_EMAIL = 'uchechukwusandra0@gmail.com';

export interface GuestUser {
  id: string;
  name: string;
  email: string;
  provider?: 'email' | 'google';
  membershipTier: 'Silver' | 'Gold' | 'Platinum';
}

// Keep local session in sync with Firebase Auth state
onAuthStateChanged(auth, (user) => {
  if (user) {
    // If user signed in with password and email is not verified, do not create session
    if (!user.emailVerified && user.providerData?.[0]?.providerId === 'password') {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
      sessionStorage.removeItem(GUEST_SESSION_KEY);
      return;
    }

    const sessionData = {
      uid: user.uid,
      email: user.email || '',
      name: user.displayName || user.email?.split('@')[0] || 'User',
      role: 'Staff / Manager'
    };
    if ((user.email || '').toLowerCase() === ADMIN_EMAIL && user.emailVerified) {
      sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(sessionData));
    } else {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
    }
    sessionStorage.setItem(GUEST_SESSION_KEY, JSON.stringify({
      id: user.uid,
      email: user.email || '',
      name: user.displayName || user.email?.split('@')[0] || 'Valued Guest',
      provider: user.providerData?.[0]?.providerId === 'google.com' ? 'google' : 'email',
      membershipTier: 'Gold'
    }));
  }
});

export const AuthService = {
  /**
   * Sign in using Firebase Authentication (Email and Password)
   * If credentials are incorrect, returns "Email or password is incorrect"
   * If email is not verified, blocks access, triggers verification email, signs out, and flags needsVerification
   */
  async signIn(email: string, password: string): Promise<{
    success: boolean;
    needsVerification?: boolean;
    email?: string;
    user?: any;
    error?: string;
  }> {
    const cleanEmail = email.trim();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const user = userCredential.user;

      // Check if email is verified
      if (!user.emailVerified) {
        try {
          await sendEmailVerification(user);
        } catch (verErr) {
          console.warn('Could not resend email verification automatically:', verErr);
        }
        await signOut(auth);
        sessionStorage.removeItem(ADMIN_SESSION_KEY);
        sessionStorage.removeItem(GUEST_SESSION_KEY);

        return {
          success: false,
          needsVerification: true,
          email: user.email || cleanEmail
        };
      }

      const adminUser: AdminUser = {
        email: user.email || cleanEmail,
        name: user.displayName || cleanEmail.split('@')[0] || 'Manager',
        role: 'General Manager'
      };

      if ((user.email || cleanEmail).toLowerCase() === ADMIN_EMAIL && user.emailVerified) {
        sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(adminUser));
      } else {
        sessionStorage.removeItem(ADMIN_SESSION_KEY);
      }
      sessionStorage.setItem(GUEST_SESSION_KEY, JSON.stringify({
        id: user.uid,
        email: user.email || cleanEmail,
        name: user.displayName || cleanEmail.split('@')[0] || 'Guest',
        provider: 'email',
        membershipTier: 'Gold'
      }));

      return { success: true, user: adminUser };
    } catch (err: any) {
      console.warn('Firebase signIn error:', err.code, err.message);
      
      // Exact requirement: "Email or password is incorrect"
      return { success: false, error: 'Email or password is incorrect' };
    }
  },

  /**
   * Sign up using Firebase Authentication (Email and Password)
   * Sends a verification email and does NOT sign them in automatically.
   * If email already exists, returns "User already exists. Please sign in"
   */
  async signUp(email: string, password: string): Promise<{
    success: boolean;
    needsVerification?: boolean;
    email?: string;
    user?: any;
    error?: string;
  }> {
    const cleanEmail = email.trim();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      const user = userCredential.user;

      // Send verification email
      try {
        await sendEmailVerification(user);
      } catch (verErr) {
        console.warn('Could not send verification email:', verErr);
      }

      // Do NOT sign them in automatically - sign out immediately
      await signOut(auth);
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
      sessionStorage.removeItem(GUEST_SESSION_KEY);

      return {
        success: true,
        needsVerification: true,
        email: cleanEmail
      };
    } catch (err: any) {
      console.warn('Firebase signUp error:', err.code, err.message);
      
      if (err.code === 'auth/email-already-in-use') {
        // Exact requirement: "User already exists. Please sign in"
        return { success: false, error: 'User already exists. Please sign in' };
      }

      if (err.code === 'auth/weak-password') {
        return { success: false, error: 'Password should be at least 6 characters' };
      }

      return { success: false, error: err.message || 'Unable to complete registration' };
    }
  },

  /**
   * Resend email verification helper
   */
  async resendVerificationEmail(email: string, password?: string): Promise<{ success: boolean; message: string }> {
    const cleanEmail = email.trim();
    try {
      if (password) {
        const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
        await sendEmailVerification(userCredential.user);
        await signOut(auth);
        return { success: true, message: `Verification email resent to ${cleanEmail}.` };
      }
      return {
        success: false,
        message: 'Please log in with your credentials to re-trigger verification.'
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Could not resend verification email.'
      };
    }
  },

  /**
   * Send password reset link to staff / user email via Firebase Authentication
   */
  async sendPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    const cleanEmail = email.trim();
    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      return { success: true, message: `Password reset instructions sent to ${cleanEmail}` };
    } catch (err: any) {
      console.warn('Firebase sendPasswordResetEmail error:', err.code, err.message);
      if (err.code === 'auth/user-not-found') {
        return { success: false, message: 'No registered user found with this email.' };
      }
      return { success: false, message: err.message || 'Failed to send password reset email.' };
    }
  },

  /**
   * Sign out from Firebase and clear local session
   */
  async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (e) {
      console.error('Firebase signOut error:', e);
    }
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    sessionStorage.removeItem(GUEST_SESSION_KEY);
  },

  /**
   * Sign in with Google (via Firebase popup with graceful simulated fallback if in iframe)
   */
  async signInWithGoogle(customEmail?: string, customName?: string): Promise<{ success: boolean; user: any }> {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const adminUser: AdminUser = {
        email: user.email || 'user@gmail.com',
        name: user.displayName || 'Google User',
        role: 'Authenticated User'
      };

      if ((user.email || '').toLowerCase() === ADMIN_EMAIL && user.emailVerified) {
        sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(adminUser));
      } else {
        sessionStorage.removeItem(ADMIN_SESSION_KEY);
      }
      sessionStorage.setItem(GUEST_SESSION_KEY, JSON.stringify({
        id: user.uid,
        email: user.email || '',
        name: user.displayName || 'Google User',
        provider: 'google',
        membershipTier: 'Gold'
      }));

      return { success: true, user: adminUser };
    } catch (err: any) {
      console.warn('Firebase Google sign-in failed:', err?.code || err?.message || err);
      return { success: false, user: null };

    }
  },

  // Legacy wrappers for backward compatibility with existing code
  async loginAdmin(email: string, password: string) {
    return this.signIn(email, password);
  },

  async loginGuest(email: string, password?: string) {
    if (password) {
      return this.signIn(email, password);
    }
    const namePart = email.split('@')[0].replace(/[._]/g, ' ');
    const user: GuestUser = {
      id: `GST-${Date.now().toString().slice(-4)}`,
      name: namePart.charAt(0).toUpperCase() + namePart.slice(1) || 'Valued Guest',
      email,
      provider: 'email',
      membershipTier: 'Gold'
    };
    sessionStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(user));
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    return { success: true, user };
  },

  async registerGuest(name: string, email: string, password?: string) {
    if (password) {
      return this.signUp(email, password);
    }
    const user: GuestUser = {
      id: `GST-${Date.now().toString().slice(-4)}`,
      name,
      email,
      provider: 'email',
      membershipTier: 'Silver'
    };
    sessionStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(user));
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    return { success: true, user };
  },

  async logoutAdmin(): Promise<void> {
    return this.logout();
  },

  async logoutGuest(): Promise<void> {
    return this.logout();
  },

  isAdminAuthenticated(): boolean {
    const user = auth.currentUser;
    return !!user && user.emailVerified && (user.email || '').toLowerCase() === ADMIN_EMAIL;
  },

  getAdminUser(): AdminUser | null {
    try {
      const data = sessionStorage.getItem(ADMIN_SESSION_KEY);
      if (data && this.isAdminAuthenticated()) return JSON.parse(data);
      return null;
    } catch {
      return null;
    }
  },

  getGuestUser(): GuestUser | null {
    try {
      const data = sessionStorage.getItem(GUEST_SESSION_KEY);
      if (data) return JSON.parse(data);
      if (auth.currentUser) {
        return {
          id: auth.currentUser.uid,
          email: auth.currentUser.email || '',
          name: auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'Guest',
          provider: 'email',
          membershipTier: 'Gold'
        };
      }
      return null;
    } catch {
      return null;
    }
  }
};
