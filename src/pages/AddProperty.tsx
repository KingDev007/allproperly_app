// Component: AddProperty
// Purpose: Form for adding new properties with updated schema support
// Props: None (page component)
// Edge Cases:
//   - Validates required fields before submission
//   - Handles authentication state
//   - Supports new property types (primary, rental, family)
//   - TODO: Add photo upload functionality
//   - TODO: Add property sharing during creation

import { useState } from "react";
import { Paper, Typography, Stack, TextField, Button, MenuItem, Alert, Box } from "@mui/material";
import { useCreateProperty } from "../hooks/useProperties";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const PROPERTY_TYPES = [
  { value: "primary", label: "Primary Residence" },
  { value: "rental", label: "Rental Property" },
  { value: "family", label: "Family Property" },
];

export default function AddProperty() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const createPropertyMutation = useCreateProperty();
  
  const [address, setAddress] = useState("");
  const [type, setType] = useState<"primary" | "rental" | "family">("primary");
  const [notes, setNotes] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const validate = () => {
    if (!address.trim()) return "Address is required.";
    if (!type) return "Property type is required.";
    return "";
  };

  const handleAdd = async () => {
    setError("");
    setSuccess("");
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    
    if (!currentUser) {
      setError("User not authenticated");
      return;
    }
    
    try {
      await createPropertyMutation.mutateAsync({
        address: address.trim(),
        type,
        notes: notes.trim(),
        ownerId: currentUser.uid,
        photoURL: photoURL.trim(),
      });
      setSuccess("Property added successfully!");
      setTimeout(() => navigate("/properties"), 1200);
    } catch (e) {
      setError("Failed to add property. Please try again.");
    }
  };

  return (
    <Box sx={{ width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "flex-start" }}>
      <Paper sx={{ p: 4, width: "100%", maxWidth: 400 }}>
        <Typography variant="h5" mb={2}>Add Property</Typography>
        <Stack spacing={2}>
          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}
          
          <TextField
            label="Address"
            value={address}
            onChange={e => setAddress(e.target.value)}
            required
            placeholder="123 Main St, City, State 12345"
          />
          
          <TextField
            select
            label="Property Type"
            value={type}
            onChange={e => setType(e.target.value as "primary" | "rental" | "family")}
            required
          >
            {PROPERTY_TYPES.map(propertyType => (
              <MenuItem key={propertyType.value} value={propertyType.value}>
                {propertyType.label}
              </MenuItem>
            ))}
          </TextField>
          
          <TextField
            label="Photo URL (Optional)"
            value={photoURL}
            onChange={e => setPhotoURL(e.target.value)}
            placeholder="https://example.com/image.jpg"
            helperText="Add a URL to a photo of the property"
          />
          
          <TextField
            label="Notes"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            multiline
            rows={3}
            placeholder="Any additional notes about this property..."
          />
          
          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              onClick={() => navigate("/properties")}
              disabled={createPropertyMutation.isPending}
              size="large"
              sx={{ flex: 1 }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleAdd}
              disabled={createPropertyMutation.isPending}
              size="large"
              sx={{ flex: 1 }}
            >
              {createPropertyMutation.isPending ? "Saving..." : "Add Property"}
            </Button>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
}