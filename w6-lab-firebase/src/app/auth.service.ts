/**
 * AuthService handles all authentication-related operations including
 * user registration, login, logout, and password reset.
 * Naming conventions aligned with TasksService for consistency.
 */
import { Injectable, inject } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  UserCredential,
} from '@angular/fire/auth';
import { 
  doc, 
  Firestore, 
  setDoc 
} from '@angular/fire/firestore';

/**
 * Interface for user authentication data
 */
interface UserAuthData {
  email: string;
  password: string;
}

/**
 * Interface for user profile data stored in Firestore
 */
interface UserProfile {
  email: string;
  createdAt: string;
  lastLogin: string;
}

/**
 * Custom error class for authentication errors
 */
export class AuthError extends Error {
  constructor(
    message: string,
    public errorCode?: string,
    public originalError?: any
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Matching naming convention with TasksService
  private readonly firestoreDb = inject(Firestore);
  private readonly authService = inject(Auth);

  /**
   * Registers a new user and creates their profile in Firestore
   * @param userAuthData - Object containing email and password
   * @returns Promise resolving to UserCredential
   * @throws AuthError if registration fails
   */
  async registerUser(userAuthData: UserAuthData): Promise<UserCredential> {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        this.authService,
        userAuthData.email,
        userAuthData.password
      );

      await this.createUserProfile(userCredential);

      return userCredential;
    } catch (error: any) {
      throw this.handleAuthError(error, 'Registration failed');
    }
  }

  /**
   * Authenticates a user with email and password
   * @param userAuthData - Object containing email and password
   * @returns Promise resolving to UserCredential
   * @throws AuthError if login fails
   */
  async authenticateUser(userAuthData: UserAuthData): Promise<UserCredential> {
    try {
      return await signInWithEmailAndPassword(
        this.authService,
        userAuthData.email,
        userAuthData.password
      );
    } catch (error: any) {
      throw this.handleAuthError(error, 'Authentication failed');
    }
  }

  /**
   * Initiates password reset process for a user
   * @param userEmail - User's email address
   * @throws AuthError if sending reset email fails
   */
  async initiatePasswordReset(userEmail: string): Promise<void> {
    try {
      await sendPasswordResetEmail(this.authService, userEmail);
    } catch (error: any) {
      throw this.handleAuthError(error, 'Password reset initiation failed');
    }
  }

  /**
   * Signs out the currently authenticated user
   * @throws AuthError if logout fails
   */
  async signOutUser(): Promise<void> {
    try {
      await signOut(this.authService);
    } catch (error: any) {
      throw this.handleAuthError(error, 'Sign out failed');
    }
  }

  /**
   * Creates or updates a user profile in Firestore
   * @param userCredential - Firebase user credential
   * @private
   */
  private async createUserProfile(userCredential: UserCredential): Promise<void> {
    try {
      const userProfileRef = doc(this.firestoreDb, `users/${userCredential.user.uid}`);
      const userProfileData: UserProfile = {
        email: userCredential.user.email!,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };

      await setDoc(userProfileRef, userProfileData);
    } catch (error: any) {
      throw this.handleAuthError(error, 'Failed to create user profile');
    }
  }

  /**
   * Processes authentication errors and returns standardized error objects
   * @param error - The original error from Firebase
   * @param defaultMessage - Default message if error code isn't recognized
   * @private
   */
  private handleAuthError(error: any, defaultMessage: string): AuthError {
    let userMessage = defaultMessage;
    const errorCode = error?.code || 'unknown';

    // Map Firebase error codes to user-friendly messages
    switch (error?.code) {
      case 'auth/email-already-in-use':
        userMessage = 'This email address is already registered';
        break;
      case 'auth/weak-password':
        userMessage = 'Password must be at least 6 characters long';
        break;
      case 'auth/user-not-found':
        userMessage = 'No account found with this email address';
        break;
      case 'auth/wrong-password':
        userMessage = 'Incorrect password';
        break;
      case 'auth/invalid-email':
        userMessage = 'Please enter a valid email address';
        break;
      case 'auth/too-many-requests':
        userMessage = 'Too many attempts. Please try again later';
        break;
      case 'auth/network-request-failed':
        userMessage = 'Network error. Please check your connection';
        break;
    }

    return new AuthError(userMessage, errorCode, error);
  }
}