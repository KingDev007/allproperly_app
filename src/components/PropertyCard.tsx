import { Typography, Box } from "@mui/material";

export default function PropertyCard({ property }: { property: any }) {
  return (
    <Box>
      <Typography variant="h6" fontWeight={700} mb={1}>
        {property.address}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Year Built: {property.yearBuilt}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Type: {property.homeType}
      </Typography>
      {property.notes && (
        <Typography variant="body2" color="text.secondary">
          Notes: {property.notes}
        </Typography>
      )}
    </Box>
  );
}