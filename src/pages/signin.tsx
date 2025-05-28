'use client';
import * as React from 'react';
import Alert from '@mui/material/Alert';
import LinearProgress from '@mui/material/LinearProgress';
import { SignInPage, type AuthProvider, type AuthResponse } from '@toolpad/core/SignInPage'; // Added AuthResponse type
import { Navigate, useNavigate } from 'react-router';
import { useSession, type Session } from '../SessionContext';
import { signInWithCredentials, signInWithGoogle } from '../firebase/auth'; // Assuming you have a function for credentials sign-in too
// You'll need a similar function for email/password sign-in if you're connecting to a backend
// import { signInWithEmailAndPassword } from '../firebase/auth'; // Example
export default function SignIn() {
  const { session, setSession, loading } = useSession();
  const navigate = useNavigate();

  if (loading) {
    return <LinearProgress />;
  }

  if (session) {
    return <Navigate to="/" />;
  }

  // Explicitly define the return type for handleSignIn
  const handleSignIn = async (
    provider: AuthProvider, 
    formData?: FormData, 
    callbackUrl?: string
  ): Promise<AuthResponse | void> => { // Adjusted return type
    let resultFromAuthFunction : any; // Renamed to avoid confusion with final AuthResponse
    try {
      if (provider.id === 'google') {
        resultFromAuthFunction = await signInWithGoogle();
      } else if (provider.id === 'credentials') {
        const email = formData?.get('email');
        const password = formData?.get('password');

        if (!email || !password) {
          // Return AuthResponse compatible error
          return { error: 'Email and password are required.' }; 
        }

        console.log('Signing in with credentials:', email, password);
        resultFromAuthFunction = await signInWithCredentials(email as string, password as string);
      }

      if (resultFromAuthFunction?.success && resultFromAuthFunction?.user) {
        const userSession: Session = {
          user: {
            name: resultFromAuthFunction.user.displayName || '',
            email: resultFromAuthFunction.user.email || '',
            image: resultFromAuthFunction.user.photoURL || '',
          },
        };
        setSession(userSession);
        navigate(callbackUrl || '/', { replace: true });
        // On success, Toolpad expects an empty object or void for no alert
        return {}; // This is treated as a success with no message by SignInPage
      }
      
      // If not successful, return an AuthResponse with the error
      return { error: resultFromAuthFunction?.error || 'Failed to sign in' };
    } catch (error) {
      console.error('Sign-in error:', error);
      // Return AuthResponse compatible error
      return { error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
  };

  return (
    <SignInPage
      providers={[
        { id: 'google', name: 'Google' },
        { id: 'credentials', name: 'Email and Password' },
      ]}
      signIn={async (provider, formData, callbackUrl) => {
        const result = await handleSignIn(provider, formData, callbackUrl);
        // Ensure we always return an AuthResponse object
        if (!result) {
          return { error: 'Sign in failed' };
        }
        return result;
      }}
      slotProps={{ 
        emailField: { autoFocus: false }, 
        form: { noValidate: true } 
      }}
    />
  );
}