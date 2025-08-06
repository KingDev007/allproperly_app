// Component: TaskForm
// Purpose: Form for creating and editing tasks with full schema support
// Props:
//   - task?: Task: Existing task for editing (optional for new tasks)
//   - propertyId: string: The property this task belongs to
//   - onSave: (taskData: TaskInput) => void: Callback when form is submitted
//   - onCancel: () => void: Callback when form is cancelled
//   - loading?: boolean: Whether the form is submitting
// Edge Cases:
//   - Validates required fields (title, dueDate)
//   - Handles recurrence settings
//   - Supports seasonal and geolocated flags
//   - TODO: Add date/time picker for better UX

import { useState, useEffect } from "react";
import {
  Box,
  TextField,
  Button,
  FormControlLabel,
  Switch,
  MenuItem,
  Typography,
  Paper,
  Stack,
  Alert
} from "@mui/material";
import type { Task, Property } from "../types";
import type { TaskInput } from "../services/TaskService";
import { getPropertiesByUser } from "../services/PropertyService";
import { useAuth } from "../contexts/AuthContext";

interface TaskFormProps {
  task?: Task;
  propertyId?: string; // Made optional since we'll have property selector
  onSave: (taskData: TaskInput) => void;
  onCancel: () => void;
  loading?: boolean;
}

const RECURRENCE_OPTIONS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'custom', label: 'Custom (days)' }
];

const SOURCE_OPTIONS = [
  { value: 'manual', label: 'Manual Entry' },
  { value: 'template', label: 'From Template' },
  { value: 'AI-suggested', label: 'AI Suggested' }
];

export default function TaskForm({
  task,
  propertyId,
  onSave,
  onCancel,
  loading = false
}: TaskFormProps) {
  const { currentUser } = useAuth();
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [dueDate, setDueDate] = useState(() => {
    if (task?.dueDate) {
      const date = task.dueDate.toDate ? task.dueDate.toDate() : new Date(task.dueDate);
      return date.toISOString().split('T')[0]; // Format for date input
    }
    return '';
  });
  const [hasRecurrence, setHasRecurrence] = useState(!!task?.recurrence);
  const [recurrenceFreq, setRecurrenceFreq] = useState<'monthly' | 'yearly' | 'custom'>(
    task?.recurrence?.freq || 'monthly'
  );
  const [recurrenceInterval, setRecurrenceInterval] = useState(
    task?.recurrence?.interval || 1
  );
  const [seasonal, setSeasonal] = useState(task?.seasonal || false);
  const [geolocated, setGeolocated] = useState(task?.geolocated || false);
  const [source, setSource] = useState<'manual' | 'template' | 'AI-suggested'>(
    task?.source || 'manual'
  );
  const [selectedPropertyId, setSelectedPropertyId] = useState(propertyId || '');
  const [properties, setProperties] = useState<Property[]>([]);
  const [error, setError] = useState('');

  // Load properties when component mounts (only if no propertyId is provided - meaning this is for new task creation)
  useEffect(() => {
    if (!propertyId && currentUser) {
      getPropertiesByUser(currentUser.uid).then(setProperties);
    }
  }, [propertyId, currentUser]);

  const validate = () => {
    if (!title.trim()) return 'Task title is required';
    if (!dueDate) return 'Due date is required';
    if (!propertyId && !selectedPropertyId) return 'Property selection is required';
    if (hasRecurrence && recurrenceInterval < 1) return 'Recurrence interval must be at least 1';
    return '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    const taskData: TaskInput = {
      propertyId: propertyId || selectedPropertyId,
      title: title.trim(),
      description: description.trim(),
      dueDate: new Date(dueDate),
      seasonal,
      geolocated,
      source,
    };

    if (hasRecurrence) {
      taskData.recurrence = {
        freq: recurrenceFreq,
        interval: recurrenceInterval,
      };
    }

    onSave(taskData);
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h5" mb={3}>
        {task ? 'Edit Task' : 'Create New Task'}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={3}>
          <TextField
            label="Task Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            fullWidth
            placeholder="e.g., Clean gutters, Change air filter"
          />

          {!propertyId && properties.length > 0 && (
            <TextField
              select
              label="Property"
              value={selectedPropertyId}
              onChange={(e) => setSelectedPropertyId(e.target.value)}
              required
              fullWidth
              helperText="Select which property this task is for"
            >
              {properties.map((property) => (
                <MenuItem key={property.id} value={property.id}>
                  {property.address}
                </MenuItem>
              ))}
            </TextField>
          )}

          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            rows={3}
            fullWidth
            placeholder="Optional details about this task..."
          />

          <Box display="flex" gap={2}>
            <TextField
              label="Due Date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
              sx={{ flex: 1 }}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              select
              label="Source"
              value={source}
              onChange={(e) => setSource(e.target.value as any)}
              sx={{ flex: 1 }}
            >
              {SOURCE_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          <FormControlLabel
            control={
              <Switch
                checked={hasRecurrence}
                onChange={(e) => setHasRecurrence(e.target.checked)}
              />
            }
            label="Recurring Task"
          />

          {hasRecurrence && (
            <Box display="flex" gap={2}>
              <TextField
                select
                label="Recurrence Frequency"
                value={recurrenceFreq}
                onChange={(e) => setRecurrenceFreq(e.target.value as any)}
                sx={{ flex: 1 }}
              >
                {RECURRENCE_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label={`Interval (${recurrenceFreq === 'custom' ? 'days' : recurrenceFreq.slice(0, -2) + 's'})`}
                type="number"
                value={recurrenceInterval}
                onChange={(e) => setRecurrenceInterval(Math.max(1, parseInt(e.target.value) || 1))}
                sx={{ flex: 1 }}
                inputProps={{ min: 1 }}
              />
            </Box>
          )}

          <Box display="flex" gap={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={seasonal}
                  onChange={(e) => setSeasonal(e.target.checked)}
                />
              }
              label="Seasonal Task"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={geolocated}
                  onChange={(e) => setGeolocated(e.target.checked)}
                />
              }
              label="Location-based"
            />
          </Box>

          <Box display="flex" gap={2} justifyContent="flex-end">
            <Button
              variant="outlined"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
            >
              {loading ? 'Saving...' : (task ? 'Update Task' : 'Create Task')}
            </Button>
          </Box>
        </Stack>
      </Box>
    </Paper>
  );
}
