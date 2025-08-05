import { useState } from "react";
import { Paper, Typography, Stack, TextField, Button, MenuItem, Alert, Box } from "@mui/material";
import { addProperty } from "../services/PropertyService";
import { auth } from "../services/firebase";
import { useNavigate } from "react-router-dom";

const HOME_TYPES = [
  "Single Family",
  "Condo",
  "Townhouse",
  "Multi-Family",
  "Mobile Home",
  "Other",
];

export default function AddProperty() {
  const [address, setAddress] = useState("");
  const [yearBuilt, setYearBuilt] = useState("");
  const [homeType, setHomeType] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validate = () => {
    if (!address.trim()) return "Address is required.";
    if (!yearBuilt.match(/^\d{4}$/)) return "Year built must be a 4-digit year.";
    if (!homeType) return "Home type is required.";
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
    setLoading(true);
    try {
      if (!auth.currentUser) {
        setError("User not authenticated");
        return;
      }
      await addProperty({
        address,
        yearBuilt,
        homeType,
        notes,
        owner: auth.currentUser.uid,
      });
      setSuccess("Property added successfully!");
      setTimeout(() => navigate("/properties"), 1200);
    } catch (e) {
      setError("Failed to add property. Please try again.");
    } finally {
      setLoading(false);
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
          />
          <TextField
            label="Year Built"
            value={yearBuilt}
            onChange={e => setYearBuilt(e.target.value.replace(/\D/, ""))}
            required
            inputProps={{ maxLength: 4 }}
          />
          <TextField
            select
            label="Home Type"
            value={homeType}
            onChange={e => setHomeType(e.target.value)}
            required
          >
            {HOME_TYPES.map(type => (
              <MenuItem key={type} value={type}>{type}</MenuItem>
            ))}
          </TextField>
          <TextField
            label="Notes"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            multiline
            rows={3}
          />
          <Button
            variant="contained"
            onClick={handleAdd}
            disabled={loading}
          >
            {loading ? "Saving..." : "Add Property"}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}