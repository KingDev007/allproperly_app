// Custom hooks for task operations with React Query caching
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import {
  getTasksByUser,
  getTasksByProperty,
  addTask,
  updateTask,
  completeTask,
  deleteTask,
  skipTask,
  reopenTask,
  completeAndCreateNext,
  getTaskById,
  getUserTaskPermissions,
  getTasksSummary,
  type TaskInput,
  type TaskPermissions
} from '../services/TaskService';
import type { Task } from '../types';

// Query Keys
export const taskKeys = {
  all: ['tasks'] as const,
  user: (userId: string) => [...taskKeys.all, 'user', userId] as const,
  property: (propertyId: string) => [...taskKeys.all, 'property', propertyId] as const,
  task: (taskId: string) => [...taskKeys.all, 'task', taskId] as const,
  permissions: (userId: string, propertyId: string) => [...taskKeys.all, 'permissions', userId, propertyId] as const,
  summary: (userId: string, propertyIds: string[]) => [...taskKeys.all, 'summary', userId, ...propertyIds] as const,
};

// Hook for getting user's tasks across all properties
export function useUserTasks(propertyIds: string[]) {
  const { currentUser } = useAuth();
  
  return useQuery({
    queryKey: taskKeys.user(currentUser?.uid || ''),
    queryFn: () => getTasksByUser(currentUser!.uid, propertyIds),
    enabled: !!currentUser && propertyIds.length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes for tasks
  });
}

// Hook for getting tasks for a specific property
export function usePropertyTasks(propertyId: string) {
  const { currentUser } = useAuth();
  
  return useQuery({
    queryKey: taskKeys.property(propertyId),
    queryFn: () => getTasksByProperty(propertyId, currentUser!.uid),
    enabled: !!currentUser && !!propertyId,
    staleTime: 2 * 60 * 1000,
  });
}

// Hook for getting a specific task
export function useTask(taskId: string) {
  const { currentUser } = useAuth();
  
  return useQuery({
    queryKey: taskKeys.task(taskId),
    queryFn: () => getTaskById(taskId, currentUser!.uid),
    enabled: !!currentUser && !!taskId,
    staleTime: 5 * 60 * 1000, // Single tasks can be cached longer
  });
}

// Hook for getting task permissions
export function useTaskPermissions(propertyId: string) {
  const { currentUser } = useAuth();
  
  return useQuery({
    queryKey: taskKeys.permissions(currentUser?.uid || '', propertyId),
    queryFn: () => getUserTaskPermissions(currentUser!.uid, propertyId),
    enabled: !!currentUser && !!propertyId,
    staleTime: 5 * 60 * 1000, // Permissions don't change often
  });
}

// Hook for getting task summary
export function useTaskSummary(propertyIds: string[]) {
  const { currentUser } = useAuth();
  
  return useQuery({
    queryKey: taskKeys.summary(currentUser?.uid || '', propertyIds),
    queryFn: () => getTasksSummary(propertyIds, currentUser!.uid),
    enabled: !!currentUser && propertyIds.length > 0,
    staleTime: 1 * 60 * 1000, // 1 minute for summaries
  });
}

// Mutation hooks with optimistic updates
export function useCreateTask() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();

  return useMutation({
    mutationFn: ({ taskData }: { taskData: TaskInput }) => 
      addTask(taskData, currentUser!.uid),
    onSuccess: (_, { taskData }) => {
      // Invalidate relevant queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: taskKeys.user(currentUser!.uid) });
      queryClient.invalidateQueries({ queryKey: taskKeys.property(taskData.propertyId) });
      queryClient.invalidateQueries({ queryKey: taskKeys.summary(currentUser!.uid, [taskData.propertyId]) });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();

  return useMutation({
    mutationFn: ({ taskId, taskData }: { taskId: string; taskData: Partial<TaskInput> }) =>
      updateTask(taskId, taskData, currentUser!.uid),
    onSuccess: (_, { taskId }) => {
      // Invalidate the specific task and related queries
      queryClient.invalidateQueries({ queryKey: taskKeys.task(taskId) });
      queryClient.invalidateQueries({ queryKey: taskKeys.user(currentUser!.uid) });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

export function useCompleteTask() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();

  return useMutation({
    mutationFn: async ({ taskId, isRecurring }: { taskId: string; isRecurring: boolean }) => {
      if (isRecurring) {
        return completeAndCreateNext(taskId, currentUser!.uid);
      } else {
        return completeTask(taskId, currentUser!.uid);
      }
    },
    onMutate: async ({ taskId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: taskKeys.task(taskId) });
      
      // Snapshot previous value
      const previousTask = queryClient.getQueryData<Task>(taskKeys.task(taskId));
      
      // Optimistically update
      if (previousTask) {
        queryClient.setQueryData(taskKeys.task(taskId), {
          ...previousTask,
          status: 'completed',
          completedBy: currentUser!.uid,
        });
      }
      
      return { previousTask };
    },
    onError: (err, { taskId }, context) => {
      // Rollback on error
      if (context?.previousTask) {
        queryClient.setQueryData(taskKeys.task(taskId), context.previousTask);
      }
    },
    onSuccess: () => {
      // Invalidate all task queries to reflect changes
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();

  return useMutation({
    mutationFn: (taskId: string) => deleteTask(taskId, currentUser!.uid),
    onSuccess: (_, taskId) => {
      // Remove from cache and invalidate related queries
      queryClient.removeQueries({ queryKey: taskKeys.task(taskId) });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

export function useSkipTask() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();

  return useMutation({
    mutationFn: (taskId: string) => skipTask(taskId, currentUser!.uid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

export function useReopenTask() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();

  return useMutation({
    mutationFn: (taskId: string) => reopenTask(taskId, currentUser!.uid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}
