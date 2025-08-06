// Component: TaskCard
// Purpose: Displays task information with actions based on user permissions
// Props:
//   - task (Task): Task object with all task data
//   - userPermissions (TaskPermissions): User's permissions for this task
//   - onEdit?: () => void: Optional callback for edit action
//   - onComplete?: () => void: Optional callback for complete action
//   - onDelete?: () => void: Optional callback for delete action
// Edge Cases:
//   - Handles permission-based action visibility
//   - Shows appropriate status indicators
//   - Displays recurrence information if applicable

import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Chip, 
  IconButton, 
  Menu,
  MenuItem,
  Tooltip
} from "@mui/material";
import { 
  CheckCircle, 
  Edit, 
  Delete, 
  MoreVert, 
  Schedule, 
  Repeat,
  LocationOn,
  WbSunny
} from "@mui/icons-material";
import { useState } from "react";
import type { Task } from "../types";
import type { TaskPermissions } from "../services/TaskService";

interface TaskCardProps {
  task: Task;
  userPermissions: TaskPermissions;
  onEdit?: () => void;
  onComplete?: () => void;
  onDelete?: () => void;
  onSkip?: () => void;
  onReopen?: () => void;
}

const getStatusColor = (status: Task['status']) => {
  switch (status) {
    case 'completed':
      return 'success';
    case 'pending':
      return 'warning';
    case 'skipped':
      return 'default';
    default:
      return 'default';
  }
};

const getSourceIcon = (source: Task['source']) => {
  switch (source) {
    case 'AI-suggested':
      return '🤖';
    case 'template':
      return '📋';
    case 'manual':
      return '✏️';
    default:
      return '✏️';
  }
};

const formatRecurrence = (recurrence?: Task['recurrence']) => {
  if (!recurrence) return null;
  
  const { freq, interval } = recurrence;
  if (interval === 1) {
    return `Every ${freq.slice(0, -2)}`; // Remove 'ly' from 'monthly', 'yearly'
  }
  return `Every ${interval} ${freq === 'custom' ? 'days' : freq.slice(0, -2) + 's'}`;
};

const isOverdue = (dueDate: any, status: string) => {
  if (status !== 'pending') return false;
  const due = dueDate.toDate ? dueDate.toDate() : new Date(dueDate);
  return due < new Date();
};

export default function TaskCard({
  task,
  userPermissions,
  onEdit,
  onComplete,
  onDelete,
  onSkip,
  onReopen
}: TaskCardProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const dueDate = task.dueDate.toDate ? task.dueDate.toDate() : new Date(task.dueDate);
  const overdue = isOverdue(task.dueDate, task.status);

  return (
    <Card 
      sx={{ 
        mb: 2,
        border: overdue ? 2 : 1,
        borderColor: overdue ? 'error.main' : 'divider',
        opacity: task.status === 'completed' ? 0.7 : 1
      }}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box flex={1}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <Typography variant="h6" component="h3">
                {task.title}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {getSourceIcon(task.source)}
              </Typography>
              {task.seasonal && (
                <Tooltip title="Seasonal task">
                  <WbSunny fontSize="small" color="warning" />
                </Tooltip>
              )}
              {task.geolocated && (
                <Tooltip title="Location-based task">
                  <LocationOn fontSize="small" color="info" />
                </Tooltip>
              )}
              {task.recurrence && (
                <Tooltip title={formatRecurrence(task.recurrence) || 'Recurring task'}>
                  <Repeat fontSize="small" color="secondary" />
                </Tooltip>
              )}
            </Box>

            {task.description && (
              <Typography variant="body2" color="text.secondary" mb={1}>
                {task.description}
              </Typography>
            )}

            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <Chip
                label={task.status}
                size="small"
                color={getStatusColor(task.status) as any}
                variant="filled"
              />
              
              <Box display="flex" alignItems="center" gap={0.5}>
                <Schedule fontSize="small" color={overdue ? "error" : "action"} />
                <Typography 
                  variant="body2" 
                  color={overdue ? "error.main" : "text.secondary"}
                >
                  {dueDate.toLocaleDateString()}
                  {overdue && " (Overdue)"}
                </Typography>
              </Box>
            </Box>

            {task.recurrence && (
              <Typography variant="caption" color="text.secondary">
                🔄 {formatRecurrence(task.recurrence)}
              </Typography>
            )}

            {task.completedBy && (
              <Typography variant="caption" color="success.main" display="block">
                ✓ Completed by user {task.completedBy}
              </Typography>
            )}
          </Box>

          <Box display="flex" alignItems="center" gap={1}>
            {/* Quick complete button for pending tasks */}
            {task.status === 'pending' && userPermissions.canEdit && (
              <Tooltip title="Mark as complete">
                <IconButton 
                  color="success" 
                  onClick={onComplete}
                  size="small"
                >
                  <CheckCircle />
                </IconButton>
              </Tooltip>
            )}

            {/* Edit button for editable tasks */}
            {userPermissions.canEdit && (
              <Tooltip title="Edit task">
                <IconButton 
                  onClick={onEdit}
                  size="small"
                >
                  <Edit />
                </IconButton>
              </Tooltip>
            )}

            {/* More actions menu */}
            {(userPermissions.canEdit || userPermissions.canDelete) && (
              <>
                <IconButton onClick={handleMenuClick} size="small">
                  <MoreVert />
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={open}
                  onClose={handleMenuClose}
                >
                  {task.status === 'completed' && userPermissions.canEdit && (
                    <MenuItem onClick={() => { onReopen?.(); handleMenuClose(); }}>
                      Reopen Task
                    </MenuItem>
                  )}
                  {task.status === 'pending' && userPermissions.canEdit && (
                    <MenuItem onClick={() => { onSkip?.(); handleMenuClose(); }}>
                      Skip Task
                    </MenuItem>
                  )}
                  {userPermissions.canDelete && (
                    <MenuItem 
                      onClick={() => { onDelete?.(); handleMenuClose(); }}
                      sx={{ color: 'error.main' }}
                    >
                      <Delete fontSize="small" sx={{ mr: 1 }} />
                      Delete Task
                    </MenuItem>
                  )}
                </Menu>
              </>
            )}
          </Box>
        </Box>

        {/* Permission indicator for read-only users */}
        {userPermissions.role === 'viewer' && (
          <Box mt={1}>
            <Chip 
              label="Read Only" 
              size="small" 
              variant="outlined" 
              color="default"
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
