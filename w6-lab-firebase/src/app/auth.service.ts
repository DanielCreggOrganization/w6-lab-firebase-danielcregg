import { Injectable, inject } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  User,
  UserCredential,
} from '@angular/fire/auth';

interface UserAuthData {
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly authService = inject(Auth);

  /**
   * Registers a new user
   */
  async registerUser(userAuthData: UserAuthData): Promise<UserCredential> {
    return createUserWithEmailAndPassword(
      this.authService,
      userAuthData.email,
      userAuthData.password
    );
  }

  /**
   * Authenticates a user
   */
  async authenticateUser(userAuthData: UserAuthData): Promise<UserCredential> {
    return signInWithEmailAndPassword(
      this.authService,
      userAuthData.email,
      userAuthData.password
    );
  }


  /**
   * 
   * @returns The current authenticated user
   */
  getCurrentUser(): User | null {
    return this.authService.currentUser;
  }

  /**
   * Sends password reset email
   */
  async initiatePasswordReset(userEmail: string): Promise<void> {
    return sendPasswordResetEmail(this.authService, userEmail);
  }

  /**
   * Signs out the current user
   */
  async signOutUser(): Promise<void> {
    return signOut(this.authService);
  }
}