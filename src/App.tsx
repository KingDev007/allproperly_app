import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "./services/firebase";
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "firebase/auth";
import { Button, Box, Typography, Paper, Snackbar, Alert } from "@mui/material";
import GoogleIcon from '@mui/icons-material/Google';
import bgImage from "./assets/modern-business-buildings-financial-district.jpg";

function App() {
  const [user, setUser] = useState<any>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState("");
  const [showError, setShowError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        navigate("/properties");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    setIsSigningIn(true);
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Sign-in error:", error);
      let errorMessage = "Failed to sign in. Please try again.";
      
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = "Sign-in was cancelled.";
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = "Pop-up was blocked. Please allow pop-ups and try again.";
      } else if (error.code === 'auth/unauthorized-domain') {
        errorMessage = "This domain is not authorized. Please contact support.";
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = "Google sign-in is not enabled. Please contact support.";
      }
      
      setError(errorMessage);
      setShowError(true);
    } finally {
      setIsSigningIn(false);
    }
  };

  if (!user) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          minWidth: "100vw",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          fontFamily: "Inter, Roboto, Arial, sans-serif",
          overflow: "hidden",
        }}
      >
        {/* Animated Background image */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            width: "100vw",
            height: "100vh",
            backgroundImage: `url(${bgImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            zIndex: 0,
            animation: "bgScaleFade 8s ease-in-out infinite alternate",
            opacity: 0.92,
            "@keyframes bgScaleFade": {
              "0%": { transform: "scale(1)", opacity: 0.92 },
              "100%": { transform: "scale(1.08)", opacity: 0.98 },
            },
          }}
        />
        {/* Gradient overlay */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            width: "100vw",
            height: "100vh",
            background: "linear-gradient(120deg, rgba(40,120,255,0.35) 0%, rgba(255,255,255,0.55) 100%)",
            zIndex: 1,
          }}
        />
        {/* Sign-in card */}
        <Paper
          elevation={8}
          sx={{
            position: "relative",
            zIndex: 2,
            p: 6,
            borderRadius: 5,
            width: "100%",
            maxWidth: 420,
            textAlign: "center",
            boxShadow: "0 8px 32px rgba(40,120,255,0.18)",
            backdropFilter: "blur(8px)",
            background: "rgba(255,255,255,0.85)",
          }}
        >
          <Typography
            variant="h3"
            mb={4}
            fontWeight={700}
            sx={{
              color: "#2a6cff",
              fontFamily: "inherit",
              letterSpacing: 1,
              textShadow: "0 2px 8px rgba(40,120,255,0.10)",
            }}
          >
            AllProperly
          </Typography>
          <Button
            variant="contained"
            startIcon={<GoogleIcon />}
            onClick={signInWithGoogle}
            disabled={isSigningIn}
            sx={{
              background: "linear-gradient(90deg, #2a6cff 0%, #4285F4 100%)",
              color: "#fff",
              px: 4,
              py: 1.5,
              fontWeight: 600,
              fontSize: 18,
              textTransform: "none",
              boxShadow: 2,
              borderRadius: 2,
              transition: "transform 0.15s, box-shadow 0.15s",
              "&:hover": {
                background: "linear-gradient(90deg, #4285F4 0%, #2a6cff 100%)",
                transform: "scale(1.04)",
                boxShadow: "0 4px 24px rgba(40,120,255,0.18)",
              },
              "&:disabled": {
                background: "linear-gradient(90deg, #2a6cff 0%, #4285F4 100%)",
                color: "#fff",
                opacity: 1,
              }
            }}
            size="large"
            fullWidth
          >
            Sign in with Google
          </Button>
        </Paper>

        {/* Modern Error Message */}
        <Snackbar
          open={showError}
          autoHideDuration={6000}
          onClose={() => setShowError(false)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert
            onClose={() => setShowError(false)}
            severity="error"
            variant="filled"
            sx={{
              width: '100%',
              borderRadius: 2,
              boxShadow: "0 8px 32px rgba(255,0,0,0.15)",
            }}
          >
            {error}
          </Alert>
        </Snackbar>
      </Box>
    );
  }

  return null;
}

export default App;