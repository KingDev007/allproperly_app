// Component: Tasks
// Purpose: Main page for viewing and managing tasks with React Query caching
// Props: None (page component)
// Performance: Uses React Query for caching and optimistic updates

import { useState, useMemo } from "react";
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Alert,
  Fab,
  Chip,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress
} from "@mui/material";
import { Add, FilterList } from "@mui/icons-material";
import { useUserProperties } from "../hooks/useProperties";
import { 
  useUserTasks,
  useTaskSummary,
  useCreateTask,
  useUpdateTask,
  useCompleteTask,
  useDeleteTask,
  useSkipTask,
  useReopenTask
} from "../hooks/useTasks";
import type { Task } from "../types";
import type { TaskInput } from "../services/TaskService";
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

export default function Tasks() {
  // React Query hooks - much faster than manual state management
  const { data: properties = [], isLoading: propertiesLoading } = useUserProperties();
  const propertyIds = useMemo(() => properties.map(p => p.id), [properties]);
  
  const { data: tasks = [], isLoading: tasksLoading, error: tasksError } = useUserTasks(propertyIds);
  const { data: taskSummary } = useTaskSummary(propertyIds);
  
  // Mutations with automatic cache updates
  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();
  const completeTaskMutation = useCompleteTask();
  const deleteTaskMutation = useDeleteTask();
  const skipTaskMutation = useSkipTask();
  const reopenTaskMutation = useReopenTask();
  
  // Local state for UI
  const [selectedProperty, setSelectedProperty] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentTab, setCurrentTab] = useState(0);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Filtered tasks - computed from cached data
  const filteredTasks = useMemo(() => {
    let filtered = [...tasks];

    if (selectedProperty !== "all") {
      filtered = filtered.filter(task => task.propertyId === selectedProperty);
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(task => task.status === statusFilter);
    }

    return filtered.sort((a, b) => {
      const dateA = a.dueDate.toDate ? a.dueDate.toDate() : new Date(a.dueDate);
      const dateB = b.dueDate.toDate ? b.dueDate.toDate() : new Date(b.dueDate);
      return dateA.getTime() - dateB.getTime();
    });
  }, [tasks, selectedProperty, statusFilter]);

  // Computed task categories
  const overdueTasks = useMemo(() => filteredTasks.filter(task => {
    if (task.status !== 'pending') return false;
    const dueDate = task.dueDate.toDate ? task.dueDate.toDate() : new Date(task.dueDate);
    return dueDate < new Date();
  }), [filteredTasks]);

  const upcomingTasks = useMemo(() => filteredTasks.filter(task => {
    if (task.status !== 'pending') return false;
    const dueDate = task.dueDate.toDate ? task.dueDate.toDate() : new Date(task.dueDate);
    const inOneWeek = new Date();
    inOneWeek.setDate(inOneWeek.getDate() + 7);
    return dueDate >= new Date() && dueDate <= inOneWeek;
  }), [filteredTasks]);

  const completedTasks = useMemo(() => filteredTasks.filter(task => task.status === 'completed'), [filteredTasks]);

  // Event handlers using mutations
  const handleCreateTask = async (taskData: TaskInput) => {
    try {
      await createTaskMutation.mutateAsync({ taskData });
      setShowTaskForm(false);
    } catch (err: any) {
      console.error('Failed to create task:', err);
    }
  };

  const handleUpdateTask = async (taskData: TaskInput) => {
    if (!editingTask) return;
    
    try {
      await updateTaskMutation.mutateAsync({ 
        taskId: editingTask.id, 
        taskData 
      });
      setShowTaskForm(false);
      setEditingTask(null);
    } catch (err: any) {
      console.error('Failed to update task:', err);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    const isRecurring = !!(task?.recurrence);
    
    try {
      await completeTaskMutation.mutateAsync({ taskId, isRecurring });
    } catch (err: any) {
      console.error('Failed to complete task:', err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
      await deleteTaskMutation.mutateAsync(taskId);
    } catch (err: any) {
      console.error('Failed to delete task:', err);
    }
  };

  const handleSkipTask = async (taskId: string) => {
    try {
      await skipTaskMutation.mutateAsync(taskId);
    } catch (err: any) {
      console.error('Failed to skip task:', err);
    }
  };

  const handleReopenTask = async (taskId: string) => {
    try {
      await reopenTaskMutation.mutateAsync(taskId);
    } catch (err: any) {
      console.error('Failed to reopen task:', err);
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
  };

  // Loading state
  if (propertiesLoading || tasksLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  // Error state
  if (tasksError) {
    return (
      <Box sx={{ width: "100%", p: 2 }}>
        <Alert severity="error">
          Failed to load tasks. Please try refreshing the page.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", p: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Tasks</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => openCreateForm()}
          disabled={properties.length === 0}
        >
          New Task
        </Button>
      </Box>

      {properties.length === 0 ? (
        <Alert severity="info">
          You need to add a property before creating tasks.
        </Alert>
      ) : (
        <>
          {/* Task Summary */}
          {taskSummary && (
            <Box display="flex" gap={2} mb={3}>
              <Chip 
                label={`${taskSummary.overdue} Overdue`} 
                color="error" 
                variant={taskSummary.overdue > 0 ? "filled" : "outlined"} 
              />
              <Chip 
                label={`${taskSummary.upcoming} Due Soon`} 
                color="warning" 
                variant={taskSummary.upcoming > 0 ? "filled" : "outlined"} 
              />
              <Chip 
                label={`${taskSummary.seasonal} Seasonal`} 
                color="info" 
                variant="outlined" 
              />
            </Box>
          )}

          {/* Filters */}
          <Box display="flex" gap={2} mb={3} alignItems="center">
            <FilterList />
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Property</InputLabel>
              <Select
                value={selectedProperty}
                label="Property"
                onChange={(e) => setSelectedProperty(e.target.value)}
              >
                <MenuItem value="all">All Properties</MenuItem>
                {properties.map(property => (
                  <MenuItem key={property.id} value={property.id}>
                    {property.address}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="skipped">Skipped</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Task Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={currentTab} onChange={(_, newValue) => setCurrentTab(newValue)}>
              <Tab label={`All Tasks (${filteredTasks.length})`} />
              <Tab label={`Overdue (${overdueTasks.length})`} />
              <Tab label={`Upcoming (${upcomingTasks.length})`} />
              <Tab label={`Completed (${completedTasks.length})`} />
            </Tabs>
          </Box>

          <TabPanel value={currentTab} index={0}>
            {filteredTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                userPermissions={{ canView: true, canEdit: true, canCreate: true, canDelete: true, role: 'owner' }}
                onEdit={() => openEditForm(task)}
                onComplete={() => handleCompleteTask(task.id)}
                onSkip={() => handleSkipTask(task.id)}
                onReopen={() => handleReopenTask(task.id)}
                onDelete={() => handleDeleteTask(task.id)}
              />
            ))}
          </TabPanel>

          <TabPanel value={currentTab} index={1}>
            {overdueTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                userPermissions={{ canView: true, canEdit: true, canCreate: true, canDelete: true, role: 'owner' }}
                onEdit={() => openEditForm(task)}
                onComplete={() => handleCompleteTask(task.id)}
                onSkip={() => handleSkipTask(task.id)}
                onReopen={() => handleReopenTask(task.id)}
                onDelete={() => handleDeleteTask(task.id)}
              />
            ))}
          </TabPanel>

          <TabPanel value={currentTab} index={2}>
            {upcomingTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                userPermissions={{ canView: true, canEdit: true, canCreate: true, canDelete: true, role: 'owner' }}
                onEdit={() => openEditForm(task)}
                onComplete={() => handleCompleteTask(task.id)}
                onSkip={() => handleSkipTask(task.id)}
                onReopen={() => handleReopenTask(task.id)}
                onDelete={() => handleDeleteTask(task.id)}
              />
            ))}
          </TabPanel>

          <TabPanel value={currentTab} index={3}>
            {completedTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                userPermissions={{ canView: true, canEdit: true, canCreate: true, canDelete: true, role: 'owner' }}
                onEdit={() => openEditForm(task)}
                onComplete={() => handleCompleteTask(task.id)}
                onSkip={() => handleSkipTask(task.id)}
                onReopen={() => handleReopenTask(task.id)}
                onDelete={() => handleDeleteTask(task.id)}
              />
            ))}
          </TabPanel>
        </>
      )}

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
            propertyId={editingTask?.propertyId}
            onSave={editingTask ? handleUpdateTask : handleCreateTask}
            onCancel={closeForm}
            loading={createTaskMutation.isPending || updateTaskMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Floating Action Button for quick task creation */}
      {properties.length > 0 && (
        <Fab
          color="primary"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={() => openCreateForm()}
        >
          <Add />
        </Fab>
      )}
    </Box>
  );
}
