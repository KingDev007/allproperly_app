// Component: AppRoutes
// Purpose: Handles routing and authentication protection
// Features:
//   - Protected routes for authenticated users
//   - Public login route
//   - Loading states during auth check
//   - Automatic redirects

import { Routes, Route, Navigate } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import { useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Layout from './components/Layout';
import Properties from './pages/Properties';
import AddProperty from './pages/AddProperty';
import PropertyDetail from './pages/PropertyDetail';
import Tasks from './pages/Tasks';

export default function AppRoutes() {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  // If not authenticated, show only login
  if (!currentUser) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // If authenticated, show protected routes
  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/properties" replace />} />
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/properties" replace />} />
        <Route path="properties" element={<Properties />} />
        <Route path="properties/add" element={<AddProperty />} />
        <Route path="properties/:id" element={<PropertyDetail />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="*" element={<Navigate to="/properties" replace />} />
      </Route>
    </Routes>
  );
}
