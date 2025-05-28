import {
  GoogleAuthProvider,
  GithubAuthProvider,
  setPersistence,
  browserSessionPersistence,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { firebaseAuth } from './firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

// Sign in with Google functionality
// ... existing code ...

// Add this whitelist array with your allowed emails
const ALLOWED_EMAILS = [
  'maelizabeth.damaso@chmsu.edu.ph',
  'mark.meguizo@gmail.com',
  // Add all authorized emails here
];

// Helper function to check if an email is allowed
export const isEmailAllowed = (email: string | null | undefined): boolean => {
  if (!email) return false;
  return ALLOWED_EMAILS.includes(email.toLowerCase());
};

// Modify the signInWithGoogle function
export const signInWithGoogle = async () => {
  try {
    return setPersistence(firebaseAuth, browserSessionPersistence).then(async () => {
      const result = await signInWithPopup(firebaseAuth, googleProvider);
      
      // Check if the user's email is in the whitelist
      if (!isEmailAllowed(result.user.email)) {
        // Sign out the user immediately if not allowed
        await signOut(firebaseAuth);
        return {
          success: false,
          user: null,
          error: 'Access denied. Your email is not authorized to use this application.'
        };
      }
      
      return {
        success: true,
        user: result.user,
        error: null,
      };
    });
  } catch (error: any) {
    return {
      success: false,
      user: null,
      error: error.message,
    };
  }
};

// Similarly modify signInWithCredentials
export const signInWithEmailPassword = async (email: string, password: string) => {
  try {
    // Check if email is allowed before even attempting to sign in
    if (!isEmailAllowed(email)) {
      return {
        success: false,
        user: null,
        error: 'Access denied. Your email is not authorized to use this application.'
      };
    }
    
    const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
    return {
      success: true,
      user: userCredential.user,
      error: null,
    };
  } catch (error: any) {
    return {
      success: false,
      user: null,
      error: error.message,
    };
  }
};


// Sign in with GitHub functionality
export const signInWithGithub = async () => {
  try {
    return setPersistence(firebaseAuth, browserSessionPersistence).then(async () => {
      const result = await signInWithPopup(firebaseAuth, githubProvider);
      return {
        success: true,
        user: result.user,
        error: null,
      };
    });
  } catch (error: any) {
    return {
      success: false,
      user: null,
      error: error.message,
    };
  }
};




export const signInWithCredentials = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
    return {
      success: true,
      user: userCredential.user,
      error: null,
    };
  } catch (error: any) { // Added type for error
    return {
      success: false,
      user: null,
      error: error.message,
    };
  }
};


// Sign out functionality
export const firebaseSignOut = async () => {
  try {
    await signOut(firebaseAuth);
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
};

// Auth state observer
export const onAuthStateChanged = (callback: (user: any) => void) => {
  return firebaseAuth.onAuthStateChanged(callback);
};