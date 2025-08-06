import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Paper, Typography, Stack, IconButton, Button, Box, Skeleton, CircularProgress } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { getUserPropertyLabel } from "../services/UserService";
import { useAuth } from "../contexts/AuthContext";
import { useUserProperties, useDeleteProperty } from "../hooks/useProperties";
import PropertyCard from "../components/PropertyCard";

export default function Properties() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  // React Query hooks
  const { data: properties = [], isLoading, error } = useUserProperties();
  const deletePropertyMutation = useDeleteProperty();
  
  const [propertyLabels, setPropertyLabels] = useState<Record<string, string>>({});

  // Load property labels (not performance-critical, can stay async)
  React.useEffect(() => {
    if (!currentUser || properties.length === 0) return;

    const loadPropertyLabels = async () => {
      try {
        const labels: Record<string, string> = {};
        for (const property of properties) {
          const label = await getUserPropertyLabel(currentUser.uid, property.id);
          if (label) {
            labels[property.id] = label;
          }
        }
        setPropertyLabels(labels);
      } catch (error) {
        console.error("Error loading property labels:", error);
      }
    };

    loadPropertyLabels();
  }, [properties, currentUser]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this property?")) return;
    
    try {
      await deletePropertyMutation.mutateAsync(id);
      // Remove from local labels state
      const newLabels = { ...propertyLabels };
      delete newLabels[id];
      setPropertyLabels(newLabels);
    } catch (error) {
      console.error("Error deleting property:", error);
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ width: "100%", p: 2 }}>
        <Typography color="error">
          Failed to load properties. Please try refreshing the page.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <Box sx={{ width: "100%", maxWidth: 1400, mt: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5">Your Properties</Typography>
          <Button variant="contained" onClick={() => navigate("/properties/add")}>
            Add Property
          </Button>
        </Stack>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(3, 1fr)",
              lg: "repeat(4, 1fr)",
            },
            gap: 3,
            width: "100%",
          }}
        >
          {deletePropertyMutation.isPending
            ? Array.from({ length: 4 }).map((_, i) => (
                <Paper key={i} sx={{ p: 3, borderRadius: 3, boxShadow: 3 }}>
                  <Skeleton variant="rectangular" width="100%" height={32} sx={{ mb: 1 }} />
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="text" width="40%" />
                  <Skeleton variant="text" width="80%" />
                </Paper>
              ))
            : properties.map(prop => (
                <Paper key={prop.id} sx={{ p: 3, borderRadius: 3, boxShadow: 3, display: "flex", flexDirection: "column", gap: 1 }}>
                  <PropertyCard 
                    property={prop} 
                    userLabel={propertyLabels[prop.id]} 
                  />
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <IconButton color="primary" onClick={() => navigate(`/property/${prop.id}`)}><EditIcon /></IconButton>
                    <IconButton color="error" onClick={() => handleDelete(prop.id)}><DeleteIcon /></IconButton>
                  </Stack>
                </Paper>
              ))
          }
        </Box>
      </Box>
    </Box>
  );
}