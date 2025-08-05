import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Paper, Typography, Stack, IconButton, Button, Box, Skeleton } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { getPropertiesByUser, deleteProperty } from "../services/PropertyService";
import { auth } from "../services/firebase";
import PropertyCard from "../components/PropertyCard";
import { onAuthStateChanged } from "firebase/auth";

export default function Properties() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setLoading(true);
        const props = await getPropertiesByUser(user.uid);
        setProperties(props);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleDelete = async (id: string) => {
    setLoading(true);
    await deleteProperty(id);
    if (auth.currentUser) {
      const props = await getPropertiesByUser(auth.currentUser.uid);
      setProperties(props);
    }
    setLoading(false);
  };

  return (
    <Box sx={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <Box sx={{ width: "100%", maxWidth: 1400, mt: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5">Your Properties</Typography>
          <Button variant="contained" onClick={() => navigate("/properties/new")}>
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
          {loading
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
                  <PropertyCard property={prop} />
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