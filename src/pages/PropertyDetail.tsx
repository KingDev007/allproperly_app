import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Paper, Typography, Stack, TextField, Button } from "@mui/material";
import { getPropertyById, updateProperty } from "../services/PropertyService";

export default function PropertyDetail() {
  const { id } = useParams();
  const [property, setProperty] = useState<any>(null);
  const [edit, setEdit] = useState(false);
  const [address, setAddress] = useState("");
  const [yearBuilt, setYearBuilt] = useState("");
  const [homeType, setHomeType] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    async function fetch() {
      const prop = await getPropertyById(id!);
      setProperty(prop);
      setAddress(prop?.address || "");
      setYearBuilt(prop?.yearBuilt || "");
      setHomeType(prop?.homeType || "");
      setNotes(prop?.notes || "");
    }
    fetch();
  }, [id]);

  const handleUpdate = async () => {
    await updateProperty(id!, { address, yearBuilt, homeType, notes });
    setEdit(false);
    setProperty({ ...property, address, yearBuilt, homeType, notes });
  };

  if (!property) return <Typography>Loading...</Typography>;

  return (
    <Paper sx={{ p: 4 }}>
      <Typography variant="h5" mb={2}>Property Detail</Typography>
      <Stack spacing={2}>
        {edit ? (
          <>
            <TextField label="Address" value={address} onChange={e => setAddress(e.target.value)} />
            <TextField label="Year Built" value={yearBuilt} onChange={e => setYearBuilt(e.target.value.replace(/\D/, ""))} />
            <TextField label="Home Type" value={homeType} onChange={e => setHomeType(e.target.value)} />
            <TextField label="Notes" value={notes} onChange={e => setNotes(e.target.value)} multiline rows={3} />
            <Button variant="contained" onClick={handleUpdate}>Save</Button>
            <Button onClick={() => setEdit(false)}>Cancel</Button>
          </>
        ) : (
          <>
            <Typography variant="subtitle1">Address: {property.address}</Typography>
            <Typography variant="body2">Year Built: {property.yearBuilt}</Typography>
            <Typography variant="body2">Type: {property.homeType}</Typography>
            {property.notes && <Typography variant="body2">Notes: {property.notes}</Typography>}
            <Button variant="outlined" onClick={() => setEdit(true)}>Edit</Button>
          </>
        )}
      </Stack>
    </Paper>
  );
}