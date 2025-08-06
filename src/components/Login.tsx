// Component: Login
// Purpose: Login page with Google authentication
// Props: None (page component)
// Edge Cases:
//   - Handles authentication errors
//   - Shows loading state during login
//   - Automatically creates user document in Firestore
//   - Redirects after successful login

import { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  CircularProgress
} from '@mui/material';
import { Google } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [error, setError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const { signInWithGoogle } = useAuth();

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      setIsAuthenticating(true);
      
      // Force the main window to stay visible
      const mainWindow = window;
      mainWindow.focus();
      
      // Keep a reference to prevent garbage collection
      const keepAlive = setInterval(() => {
        if (document.body) {
          document.body.style.visibility = 'visible';
          document.body.style.display = 'block';
        }
      }, 100);
      
      const user = await signInWithGoogle();
      console.log('Login successful:', user.email);
      
      clearInterval(keepAlive);
      
      // No manual navigation needed - AppRoutes will handle redirect automatically
      // when currentUser state changes in AuthContext
    } catch (error: any) {
      setError(error.message || 'Failed to sign in with Google');
      console.error('Login error:', error);
      setIsAuthenticating(false); // Only reset on error, success will redirect
    }
  };

  return (
    <>
      {/* Portal Loading Overlay - Rendered directly to body */}
      {isAuthenticating && createPortal(
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(102, 126, 234, 0.9)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999999,
            backdropFilter: 'blur(12px)',
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.95) 0%, rgba(118, 75, 162, 0.95) 100%)',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255, 255, 255, 0.15)',
              borderRadius: 4,
              padding: 6,
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            }}
          >
            <CircularProgress 
              size={100} 
              thickness={4}
              sx={{ 
                color: 'white',
                mb: 4,
              }} 
            />
            <Typography 
              variant="h4" 
              sx={{ 
                color: 'white',
                fontWeight: 700,
                textAlign: 'center',
                mb: 2,
                textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
              }}
            >
              Signing you in...
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.9)',
                textAlign: 'center',
                maxWidth: '400px',
                lineHeight: 1.6,
                fontWeight: 300,
              }}
            >
              Please complete authentication in the Google popup window
            </Typography>
          </Box>
        </Box>,
        document.body
      )}
      
      <Box
        sx={{
          height: '100vh',
          width: '100vw',
          display: 'flex',
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          visibility: 'visible !important',
          opacity: 1,
          transition: 'opacity 0.3s ease',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'url("/src/assets/modern-business-buildings-financial-district.jpg")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.3,
            animation: 'slowZoom 20s ease-in-out infinite alternate',
          },
          '@keyframes slowZoom': {
            '0%': {
              transform: 'scale(1)',
            },
            '100%': {
              transform: 'scale(1.1)',
            },
          },
        }}
      >
        {/* Full screen overlay for better text readability */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.8) 0%, rgba(118, 75, 162, 0.8) 100%)',
          }}
        />      {/* Left side - Branding and info */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
          px: 8,
          py: 6,
          position: 'relative',
          zIndex: 2,
        }}
      >
        <Typography 
          variant="h2" 
          component="h1" 
          gutterBottom
          sx={{
            fontWeight: 800,
            color: 'white',
            mb: 3,
            textShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          }}
        >
          AllProperly
        </Typography>
        
        <Typography 
          variant="h5" 
          sx={{ 
            color: 'rgba(255, 255, 255, 0.9)',
            mb: 4,
            fontWeight: 300,
            lineHeight: 1.4,
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
          }}
        >
          Property management made simple
        </Typography>

        <Box sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '1.1rem', lineHeight: 1.6 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            • Manage all your properties in one place
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            • Track maintenance and tasks efficiently
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            • Collaborate with family and teams
          </Typography>
          <Typography variant="body1">
            • Keep detailed property history
          </Typography>
        </Box>
      </Box>

      {/* Right side - Login form */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          px: 8,
          py: 6,
          position: 'relative',
          zIndex: 2,
        }}
      >
        <Paper
          elevation={24}
          sx={{
            p: 6,
            width: '100%',
            maxWidth: 450,
            textAlign: 'center',
            borderRadius: 4,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
          }}
        >
          <Typography 
            variant="h4" 
            component="h2" 
            gutterBottom
            sx={{
              fontWeight: 600,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 3,
            }}
          >
            Welcome Back
          </Typography>
          
          <Typography 
            variant="body1" 
            color="text.secondary" 
            sx={{ 
              mb: 4,
              opacity: 0.8,
            }}
          >
            Sign in to access your property dashboard
          </Typography>

          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3,
                borderRadius: 2,
                '& .MuiAlert-message': {
                  fontSize: '0.95rem',
                },
              }}
            >
              {error}
            </Alert>
          )}

          <Button
            variant="contained"
            size="large"
            fullWidth
            startIcon={isAuthenticating ? <CircularProgress size={20} color="inherit" /> : <Google />}
            onClick={handleGoogleSignIn}
            disabled={isAuthenticating}
            sx={{ 
              mb: 3,
              py: 2,
              fontSize: '1.1rem',
              fontWeight: 600,
              borderRadius: 3,
              background: isAuthenticating 
                ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.7) 0%, rgba(118, 75, 162, 0.7) 100%)'
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              boxShadow: isAuthenticating 
                ? '0 4px 12px rgba(102, 126, 234, 0.2)'
                : '0 8px 20px rgba(102, 126, 234, 0.3)',
              '&:hover': {
                background: isAuthenticating 
                  ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.7) 0%, rgba(118, 75, 162, 0.7) 100%)'
                  : 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                boxShadow: isAuthenticating 
                  ? '0 4px 12px rgba(102, 126, 234, 0.2)'
                  : '0 12px 30px rgba(102, 126, 234, 0.4)',
                transform: isAuthenticating ? 'none' : 'translateY(-2px)',
              },
              '&:disabled': {
                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.7) 0%, rgba(118, 75, 162, 0.7) 100%)',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)',
                color: 'rgba(255, 255, 255, 0.8)',
              },
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            {isAuthenticating ? 'Authenticating...' : 'Sign in with Google'}
          </Button>

          <Typography 
            variant="caption" 
            color="text.secondary"
            sx={{
              display: 'block',
              opacity: 0.7,
              lineHeight: 1.4,
            }}
          >
            By signing in, you agree to our Terms of Service and Privacy Policy
          </Typography>
        </Paper>
      </Box>
    </Box>
    </>
  );
}
