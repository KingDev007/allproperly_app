import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { 
  Paper, 
  Typography, 
  Stack, 
  TextField, 
  Button, 
  Box, 
  Tabs, 
  Tab, 
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  Alert,
  Chip
} from "@mui/material";
import { Add, Task as TaskIcon } from "@mui/icons-material";
import { getPropertyById, updateProperty, getUserPropertyPermissions } from "../services/PropertyService";
import { 
  getTasksByProperty, 
  addTask, 
  updateTask, 
  completeTask, 
  deleteTask,
  skipTask,
  reopenTask,
  getUserTaskPermissions,
  completeAndCreateNext,
  getTaskById
} from "../services/TaskService";
import type { Property, Task } from "../types";
import type { TaskInput, TaskPermissions } from "../services/TaskService";
import type { PropertyPermissions } from "../services/PropertyService";
import { useAuth } from "../contexts/AuthContext";
import TaskCard from "../components/TaskCard";
import TaskForm from "../components/TaskForm";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function PropertyDetail() {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const [property, setProperty] = useState<Property | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskPermissions, setTaskPermissions] = useState<TaskPermissions>({
    canView: false,
    canEdit: false,
    canCreate: false,
    canDelete: false,
    role: 'none'
  });
  const [propertyPermissions, setPropertyPermissions] = useState<PropertyPermissions>({
    canView: false,
    canEdit: false,
    canDelete: false,
    canShare: false,
    role: 'none'
  });
  
  // Property editing states
  const [edit, setEdit] = useState(false);
  const [address, setAddress] = useState("");
  const [propertyType, setPropertyType] = useState<'primary' | 'rental' | 'family'>('primary');
  const [notes, setNotes] = useState("");
  
  // Task states
  const [currentTab, setCurrentTab] = useState(0);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPropertyData() {
      if (!currentUser || !id) return;
      
      try {
        const prop = await getPropertyById(id);
        if (!prop) {
          setError("Property not found");
          return;
        }
        
        setProperty(prop);
        setAddress(prop.address || "");
        setPropertyType(prop.type || 'primary');
        setNotes(prop.notes || "");
        
        // Load user permissions for both tasks and property
        const taskPerms = await getUserTaskPermissions(currentUser.uid, id);
        const propPerms = await getUserPropertyPermissions(currentUser.uid, id);
        setTaskPermissions(taskPerms);
        setPropertyPermissions(propPerms);
        
        // Only load tasks if user has permission to view them
        if (taskPerms.canView) {
          try {
            const propertyTasks = await getTasksByProperty(id, currentUser.uid);
            setTasks(propertyTasks);
          } catch (taskError) {
            console.error("Error loading tasks:", taskError);
            // Don't set error for tasks if user just doesn't have permission
            // Tasks section will show appropriate message based on permissions
          }
        }
      } catch (error) {
        console.error("Error loading property data:", error);
        setError("Failed to load property data. You may not have permission to view this property.");
      }
    }
    
    loadPropertyData();
  }, [id, currentUser]);

  const handlePropertyUpdate = async () => {
    if (!property || !currentUser) return;
    
    try {
      console.log('Updating property:', { id: id!, address, type: propertyType, notes, userId: currentUser.uid });
      await updateProperty(id!, { address, type: propertyType, notes }, currentUser.uid);
      setEdit(false);
      setProperty({ ...property, address, type: propertyType, notes });
      console.log('Property updated successfully');
    } catch (error) {
      console.error("Error updating property:", error);
      setError("Failed to update property: " + (error as Error).message);
    }
  };

  const loadTasks = async () => {
    if (!currentUser || !id) return;
    
    try {
      // Only load tasks if user has permission
      if (taskPermissions.canView) {
        const propertyTasks = await getTasksByProperty(id, currentUser.uid);
        setTasks(propertyTasks);
      }
    } catch (error) {
      console.error("Error loading tasks:", error);
      // Don't show error for permission issues, just log them
      if (error instanceof Error && !error.message.includes("permission")) {
        setError("Failed to load tasks");
      }
    }
  };

  const handleCreateTask = async (taskData: TaskInput) => {
    if (!currentUser) return;

    try {
      setLoading(true);
      await addTask(taskData, currentUser.uid);
      await loadTasks();
      setShowTaskForm(false);
    } catch (err: any) {
      setError(err.message || "Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTask = async (taskData: TaskInput) => {
    if (!currentUser || !editingTask) return;

    try {
      setLoading(true);
      await updateTask(editingTask.id, taskData, currentUser.uid);
      await loadTasks();
      setShowTaskForm(false);
      setEditingTask(null);
    } catch (err: any) {
      setError(err.message || "Failed to update task");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    if (!currentUser) return;

    try {
      // First check if task has recurrence
      const task = await getTaskById(taskId, currentUser.uid);
      
      if (task && task.recurrence) {
        console.log('Completing recurring task:', task.title);
        // For recurring tasks, complete and automatically create next instance
        await completeAndCreateNext(taskId, currentUser.uid);
        console.log('Successfully completed recurring task and created next instance');
      } else {
        // For non-recurring tasks, just complete
        await completeTask(taskId, currentUser.uid);
      }
      
      await loadTasks();
    } catch (err: any) {
      console.error('Error completing task:', err);
      setError(err.message || "Failed to complete task");
    }
  };

  const handleSkipTask = async (taskId: string) => {
    if (!currentUser) return;

    try {
      await skipTask(taskId, currentUser.uid);
      await loadTasks();
    } catch (err: any) {
      setError(err.message || "Failed to skip task");
    }
  };

  const handleReopenTask = async (taskId: string) => {
    if (!currentUser) return;

    try {
      await reopenTask(taskId, currentUser.uid);
      await loadTasks();
    } catch (err: any) {
      setError(err.message || "Failed to reopen task");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!currentUser) return;
    
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
      await deleteTask(taskId, currentUser.uid);
      await loadTasks();
    } catch (err: any) {
      setError(err.message || "Failed to delete task");
    }
  };

  const openCreateForm = () => {
    setEditingTask(null);
    setShowTaskForm(true);
  };

  const openEditForm = (task: Task) => {
    setEditingTask(task);
    setShowTaskForm(true);
  };

  const closeForm = () => {
    setShowTaskForm(false);
    setEditingTask(null);
    setError("");
  };

  if (!property) return <Typography>Loading...</Typography>;

  const pendingTasks = tasks.filter(task => task.status === 'pending');
  const completedTasks = tasks.filter(task => task.status === 'completed');
  const overdueTasks = pendingTasks.filter(task => {
    const dueDate = task.dueDate.toDate ? task.dueDate.toDate() : new Date(task.dueDate);
    return dueDate < new Date();
  });

  return (
    <Box sx={{ width: "100%", p: 2 }}>
      {/* Property Header */}
      <Paper sx={{ p: 4, mb: 3 }}>
        <Typography variant="h4" mb={2}>
          {property.address}
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        <Stack spacing={2}>
          {edit ? (
            <>
              <TextField 
                label="Address" 
                value={address} 
                onChange={e => setAddress(e.target.value)} 
                fullWidth
              />
              <TextField 
                label="Property Type" 
                select
                value={propertyType} 
                onChange={e => setPropertyType(e.target.value as 'primary' | 'rental' | 'family')}
                fullWidth
              >
                <option value="primary">Primary Residence</option>
                <option value="rental">Rental Property</option>
                <option value="family">Family Property</option>
              </TextField>
              <TextField 
                label="Notes" 
                value={notes} 
                onChange={e => setNotes(e.target.value)} 
                multiline 
                rows={3} 
                fullWidth
              />
              <Box display="flex" gap={2}>
                <Button variant="contained" onClick={handlePropertyUpdate}>
                  Save Changes
                </Button>
                <Button onClick={() => setEdit(false)}>
                  Cancel
                </Button>
              </Box>
            </>
          ) : (
            <>
              <Typography variant="subtitle1">
                <strong>Address:</strong> {property.address}
              </Typography>
              <Typography variant="body2">
                <strong>Type:</strong> {property.type?.charAt(0).toUpperCase() + property.type?.slice(1) || 'N/A'}
              </Typography>
              {property.notes && (
                <Typography variant="body2">
                  <strong>Notes:</strong> {property.notes}
                </Typography>
              )}
              {/* Debug info */}
              <Typography variant="caption" color="text.secondary">
                Debug: canEdit={propertyPermissions.canEdit.toString()}, role={propertyPermissions.role}
              </Typography>
              {propertyPermissions.canEdit && (
                <Button variant="outlined" onClick={() => setEdit(true)}>
                  Edit Property
                </Button>
              )}
            </>
          )}
        </Stack>
      </Paper>

      {/* Tasks Section */}
      <Paper sx={{ p: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5">
            <TaskIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Property Tasks
          </Typography>
          {taskPermissions.canCreate && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={openCreateForm}
            >
              Add Task
            </Button>
          )}
        </Box>

        {!taskPermissions.canView ? (
          <Alert severity="info">
            You don't have permission to view tasks for this property. Contact the property owner to request access.
          </Alert>
        ) : (
          <>
            {/* Task Summary */}
            <Box display="flex" gap={2} mb={3}>
              <Chip 
                label={`${overdueTasks.length} Overdue`} 
                color="error" 
                variant={overdueTasks.length > 0 ? "filled" : "outlined"} 
              />
              <Chip 
                label={`${pendingTasks.length} Pending`} 
                color="warning" 
                variant={pendingTasks.length > 0 ? "filled" : "outlined"} 
              />
              <Chip 
                label={`${completedTasks.length} Completed`} 
                color="success" 
                variant="outlined" 
              />
            </Box>

            {/* Task Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={currentTab} onChange={(_, newValue) => setCurrentTab(newValue)}>
                <Tab label={`All Tasks (${tasks.length})`} />
                <Tab label={`Pending (${pendingTasks.length})`} />
                <Tab label={`Completed (${completedTasks.length})`} />
              </Tabs>
            </Box>

            <TabPanel value={currentTab} index={0}>
              {tasks.length === 0 ? (
                <Alert severity="info">
                  No tasks found for this property. {taskPermissions.canCreate && "Click 'Add Task' to create your first task."}
                </Alert>
              ) : (
                tasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    userPermissions={taskPermissions}
                    onEdit={() => openEditForm(task)}
                    onComplete={() => handleCompleteTask(task.id)}
                    onSkip={() => handleSkipTask(task.id)}
                    onReopen={() => handleReopenTask(task.id)}
                    onDelete={() => handleDeleteTask(task.id)}
                  />
                ))
              )}
            </TabPanel>

            <TabPanel value={currentTab} index={1}>
              {pendingTasks.length === 0 ? (
                <Alert severity="info">
                  No pending tasks for this property.
                </Alert>
              ) : (
                pendingTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    userPermissions={taskPermissions}
                    onEdit={() => openEditForm(task)}
                    onComplete={() => handleCompleteTask(task.id)}
                    onSkip={() => handleSkipTask(task.id)}
                    onReopen={() => handleReopenTask(task.id)}
                    onDelete={() => handleDeleteTask(task.id)}
                  />
                ))
              )}
            </TabPanel>

            <TabPanel value={currentTab} index={2}>
              {completedTasks.length === 0 ? (
                <Alert severity="info">
                  No completed tasks for this property.
                </Alert>
              ) : (
                completedTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    userPermissions={taskPermissions}
                    onEdit={() => openEditForm(task)}
                    onComplete={() => handleCompleteTask(task.id)}
                    onSkip={() => handleSkipTask(task.id)}
                    onReopen={() => handleReopenTask(task.id)}
                    onDelete={() => handleDeleteTask(task.id)}
                  />
                ))
              )}
            </TabPanel>
          </>
        )}
      </Paper>

      {/* Task Form Dialog */}
      <Dialog 
        open={showTaskForm} 
        onClose={closeForm}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingTask ? 'Edit Task' : 'Create New Task'}
        </DialogTitle>
        <DialogContent>
          <TaskForm
            task={editingTask || undefined}
            propertyId={property.id}
            onSave={editingTask ? handleUpdateTask : handleCreateTask}
            onCancel={closeForm}
            loading={loading}
          />
        </DialogContent>
      </Dialog>

      {/* Floating Action Button for quick task creation */}
      {taskPermissions.canCreate && (
        <Fab
          color="primary"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={openCreateForm}
        >
          <Add />
        </Fab>
      )}
    </Box>
  );
}