// Test Component: AuthTest
// Purpose: Quick test component to verify Firebase authentication and user document creation
// Usage: Import in App.tsx temporarily to test auth flow

import { useEffect, useState } from 'react';
import { Box, Typography, Button, Card, CardContent } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { signInWithGoogle } from '../services/AuthService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

export default function AuthTest() {
  const { currentUser } = useAuth();
  const [userDoc, setUserDoc] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      checkUserDocument();
    }
  }, [currentUser]);

  const checkUserDocument = async () => {
    if (!currentUser) return;
    
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        setUserDoc(userDocSnap.data());
        console.log('✅ User document found in Firestore:', userDocSnap.data());
      } else {
        console.log('❌ No user document found in Firestore');
      }
    } catch (error) {
      console.error('Error checking user document:', error);
    }
  };

  const handleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      console.log('🔐 Sign in completed');
    } catch (error) {
      console.error('Sign in error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Authentication Test
      </Typography>
      
      {!currentUser ? (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Not authenticated
            </Typography>
            <Button 
              variant="contained" 
              onClick={handleSignIn}
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign in with Google'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom color="success.main">
              ✅ Authentication Successful
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>User ID:</strong> {currentUser.uid}
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>Email:</strong> {currentUser.email}
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>Display Name:</strong> {currentUser.displayName}
            </Typography>
            
            {userDoc ? (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                <Typography variant="h6" gutterBottom color="success.dark">
                  ✅ Firestore Document Created
                </Typography>
                <Typography variant="body2">
                  <strong>Created:</strong> {userDoc.createdAt?.toDate().toLocaleString()}
                </Typography>
                <Typography variant="body2">
                  <strong>Last Updated:</strong> {userDoc.updatedAt?.toDate().toLocaleString()}
                </Typography>
              </Box>
            ) : (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
                <Typography variant="h6" gutterBottom color="warning.dark">
                  ⚠️ No Firestore Document Found
                </Typography>
                <Button variant="outlined" onClick={checkUserDocument}>
                  Refresh Check
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
