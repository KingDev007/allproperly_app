// Component: PropertyCard
// Purpose: Displays property information in a card format with user-specific labeling
// Props:
//   - property (Property): Property object with id, address, type, notes, etc.
//   - userLabel?: string: Custom label for this property from user relationships
//   - onEdit?: () => void: Optional callback for edit action
//   - showStatus?: boolean: Whether to show property status badge
// Edge Cases:
//   - Handles missing property images with placeholder
//   - Shows property type with proper formatting
//   - Displays custom user label if available (e.g., "Mom's House")

import { Typography, Box, Chip, Avatar } from "@mui/material";
import { Home, Business, People } from "@mui/icons-material";
import type { Property } from "../types";

interface PropertyCardProps {
  property: Property;
  userLabel?: string;
  onEdit?: () => void;
  showStatus?: boolean;
}

const getPropertyTypeIcon = (type: Property['type']) => {
  switch (type) {
    case 'primary':
      return <Home />;
    case 'rental':
      return <Business />;
    case 'family':
      return <People />;
    default:
      return <Home />;
  }
};

const getPropertyTypeColor = (type: Property['type']) => {
  switch (type) {
    case 'primary':
      return 'primary';
    case 'rental':
      return 'success';
    case 'family':
      return 'secondary';
    default:
      return 'default';
  }
};

const getStatusColor = (status: Property['propertyStatus']) => {
  switch (status) {
    case 'active':
      return 'success';
    case 'sold':
      return 'warning';
    case 'archived':
      return 'default';
    default:
      return 'default';
  }
};

export default function PropertyCard({ 
  property, 
  userLabel, 
  onEdit, 
  showStatus = false 
}: PropertyCardProps) {
  return (
    <Box 
      sx={{ 
        p: 2, 
        border: 1, 
        borderColor: 'divider', 
        borderRadius: 2,
        cursor: onEdit ? 'pointer' : 'default',
        '&:hover': onEdit ? { bgcolor: 'action.hover' } : {}
      }}
      onClick={onEdit}
    >
      <Box display="flex" alignItems="center" gap={1} mb={1}>
        <Avatar 
          src={property.photoURL} 
          sx={{ width: 40, height: 40 }}
        >
          {getPropertyTypeIcon(property.type)}
        </Avatar>
        <Box flex={1}>
          <Typography variant="h6" fontWeight={700}>
            {userLabel || property.address}
          </Typography>
          {userLabel && (
            <Typography variant="body2" color="text.secondary">
              {property.address}
            </Typography>
          )}
        </Box>
      </Box>
      
      <Box display="flex" alignItems="center" gap={1} mb={1}>
        <Chip
          icon={getPropertyTypeIcon(property.type)}
          label={property.type.charAt(0).toUpperCase() + property.type.slice(1)}
          size="small"
          color={getPropertyTypeColor(property.type) as any}
          variant="outlined"
        />
        {showStatus && (
          <Chip
            label={property.propertyStatus}
            size="small"
            color={getStatusColor(property.propertyStatus) as any}
            variant="filled"
          />
        )}
      </Box>

      {property.notes && (
        <Typography variant="body2" color="text.secondary">
          {property.notes}
        </Typography>
      )}
      
      {property.sharedWith && property.sharedWith.length > 0 && (
        <Typography variant="caption" color="text.secondary" mt={1}>
          Shared with {property.sharedWith.length} {property.sharedWith.length === 1 ? 'person' : 'people'}
        </Typography>
      )}
    </Box>
  );
}