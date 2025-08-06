// Component: AuthService
// Purpose: Handles authentication and automatic user document creation
// Functions:
//   - signInWithGoogle: Google OAuth login with user document creation
//   - signOut: Logout functionality
//   - onAuthStateChanged: Listen for auth state changes
// Edge Cases:
//   - Creates user document if it doesn't exist
//   - Updates last login timestamp
//   - Handles authentication errors

import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged
} from "firebase/auth";
import type { User as FirebaseUser } from "firebase/auth";
import { auth } from "./firebase";
import { createUser, getUserById, updateUser } from "./UserService";

const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Check if user document exists in Firestore
    const existingUser = await getUserById(user.uid);
    
    if (!existingUser) {
      // Create new user document in Firestore
      await createUser({
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        role: 'owner', // Default role
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, // User's browser timezone
        linkedProperties: [],
        relationships: [],
      });
      
      console.log('New user document created in Firestore');
    } else {
      // Update last login for existing user
      await updateUser(user.uid, {
        displayName: user.displayName || existingUser.displayName,
        photoURL: user.photoURL || existingUser.photoURL,
        email: user.email || existingUser.email,
      });
      
      console.log('Existing user login updated');
    }
    
    return user;
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
}

export async function signOut() {
  try {
    await firebaseSignOut(auth);
    console.log('User signed out successfully');
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
}

// Enhanced auth state listener that also syncs user data
export function onAuthStateChanged(callback: (user: FirebaseUser | null) => void) {
  return firebaseOnAuthStateChanged(auth, async (user) => {
    if (user) {
      // Ensure user document exists when auth state changes
      const existingUser = await getUserById(user.uid);
      
      if (!existingUser) {
        // Create user document if it doesn't exist (edge case)
        await createUser({
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
          role: 'owner',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          linkedProperties: [],
          relationships: [],
        });
        console.log('User document created during auth state change');
      }
    }
    
    callback(user);
  });
}

// Get current user info
export function getCurrentUser(): FirebaseUser | null {
  return auth.currentUser;
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  return !!auth.currentUser;
}
