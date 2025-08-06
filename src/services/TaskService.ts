import { db } from "./firebase";
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, serverTimestamp, query, where } from "firebase/firestore";
import type { Task, TaskRecurrence } from "../types";
import { getPropertyById } from "./PropertyService";

export interface TaskInput {
  propertyId: string;
  title: string;
  description?: string;
  dueDate: Date;
  recurrence?: TaskRecurrence;
  seasonal?: boolean;
  geolocated?: boolean;
  source?: 'manual' | 'template' | 'AI-suggested';
}

export interface TaskPermissions {
  canView: boolean;
  canEdit: boolean;
  canCreate: boolean;
  canDelete: boolean;
  role: 'owner' | 'collaborator' | 'viewer' | 'none';
}

// Permission checking functions
export async function getUserTaskPermissions(userId: string, propertyId: string): Promise<TaskPermissions> {
  const property = await getPropertyById(propertyId);
  
  if (!property) {
    return { canView: false, canEdit: false, canCreate: false, canDelete: false, role: 'none' };
  }

  // Check if user is owner
  if (property.ownerId === userId) {
    return { canView: true, canEdit: true, canCreate: true, canDelete: true, role: 'owner' };
  }

  // Check if user is shared with
  const userShare = property.sharedWith?.find(share => share.userId === userId);
  if (userShare) {
    if (userShare.role === 'collaborator') {
      return { canView: true, canEdit: true, canCreate: true, canDelete: true, role: 'collaborator' };
    } else if (userShare.role === 'viewer') {
      return { canView: true, canEdit: false, canCreate: false, canDelete: false, role: 'viewer' };
    }
  }

  return { canView: false, canEdit: false, canCreate: false, canDelete: false, role: 'none' };
}

export async function checkTaskAccess(userId: string, taskId: string): Promise<TaskPermissions> {
  const docRef = doc(db, "tasks", taskId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    return { canView: false, canEdit: false, canCreate: false, canDelete: false, role: 'none' };
  }
  
  const task = { id: docSnap.id, ...docSnap.data() } as Task;
  return getUserTaskPermissions(userId, task.propertyId);
}

// CRUD Operations with Permissions

export async function addTask(data: TaskInput, userId: string) {
  // Check permissions
  const permissions = await getUserTaskPermissions(userId, data.propertyId);
  if (!permissions.canCreate) {
    throw new Error("You don't have permission to create tasks for this property");
  }

  // Validate required fields
  if (!data.title.trim()) {
    throw new Error("Task title is required");
  }
  if (!data.propertyId) {
    throw new Error("Property ID is required");
  }
  if (!data.dueDate) {
    throw new Error("Due date is required");
  }

  return await addDoc(collection(db, "tasks"), {
    propertyId: data.propertyId,
    title: data.title.trim(),
    description: data.description?.trim() || '',
    dueDate: data.dueDate,
    recurrence: data.recurrence || null,
    status: 'pending',
    seasonal: data.seasonal || false,
    geolocated: data.geolocated || false,
    source: data.source || 'manual',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    completedBy: null,
  });
}

export async function getTasksByProperty(propertyId: string, userId: string): Promise<Task[]> {
  // Check permissions
  const permissions = await getUserTaskPermissions(userId, propertyId);
  if (!permissions.canView) {
    throw new Error("You don't have permission to view tasks for this property");
  }

  // Simple query without orderBy to avoid index requirements
  const q = query(
    collection(db, "tasks"), 
    where("propertyId", "==", propertyId)
  );
  const snapshot = await getDocs(q);
  const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
  
  // Sort client-side
  return tasks.sort((a, b) => {
    const dateA = a.dueDate.toDate ? a.dueDate.toDate() : new Date(a.dueDate);
    const dateB = b.dueDate.toDate ? b.dueDate.toDate() : new Date(b.dueDate);
    return dateA.getTime() - dateB.getTime();
  });
}

export async function getTasksByUser(userId: string, properties: string[]): Promise<Task[]> {
  if (properties.length === 0) return [];
  
  // Filter properties based on user permissions
  const accessibleProperties: string[] = [];
  for (const propertyId of properties) {
    const permissions = await getUserTaskPermissions(userId, propertyId);
    if (permissions.canView) {
      accessibleProperties.push(propertyId);
    }
  }

  if (accessibleProperties.length === 0) return [];
  
  // Simple query without orderBy to avoid index requirements
  const q = query(
    collection(db, "tasks"),
    where("propertyId", "in", accessibleProperties)
  );
  const snapshot = await getDocs(q);
  const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
  
  // Sort client-side
  return tasks.sort((a, b) => {
    const dateA = a.dueDate.toDate ? a.dueDate.toDate() : new Date(a.dueDate);
    const dateB = b.dueDate.toDate ? b.dueDate.toDate() : new Date(b.dueDate);
    return dateA.getTime() - dateB.getTime();
  });
}

export async function getTaskById(id: string, userId: string): Promise<Task | null> {
  const docRef = doc(db, "tasks", id);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) return null;
  
  const task = { id: docSnap.id, ...docSnap.data() } as Task;
  
  // Check permissions
  const permissions = await getUserTaskPermissions(userId, task.propertyId);
  if (!permissions.canView) {
    throw new Error("You don't have permission to view this task");
  }
  
  return task;
}

export async function updateTask(id: string, data: Partial<TaskInput>, userId: string) {
  // Check permissions
  const permissions = await checkTaskAccess(userId, id);
  if (!permissions.canEdit) {
    throw new Error("You don't have permission to edit this task");
  }

  const docRef = doc(db, "tasks", id);
  const updateData: any = {
    ...data,
    updatedAt: serverTimestamp(),
  };

  // Clean up the data - remove undefined values
  Object.keys(updateData).forEach(key => {
    if (updateData[key] === undefined) {
      delete updateData[key];
    }
  });

  await updateDoc(docRef, updateData);
}

export async function completeTask(id: string, userId: string) {
  // Check permissions
  const permissions = await checkTaskAccess(userId, id);
  if (!permissions.canEdit) {
    throw new Error("You don't have permission to complete this task");
  }

  const docRef = doc(db, "tasks", id);
  await updateDoc(docRef, {
    status: 'completed',
    completedBy: userId,
    updatedAt: serverTimestamp(),
  });
}

export async function reopenTask(id: string, userId: string) {
  // Check permissions
  const permissions = await checkTaskAccess(userId, id);
  if (!permissions.canEdit) {
    throw new Error("You don't have permission to reopen this task");
  }

  const docRef = doc(db, "tasks", id);
  await updateDoc(docRef, {
    status: 'pending',
    completedBy: null,
    updatedAt: serverTimestamp(),
  });
}

export async function skipTask(id: string, userId: string) {
  // Check permissions
  const permissions = await checkTaskAccess(userId, id);
  if (!permissions.canEdit) {
    throw new Error("You don't have permission to skip this task");
  }

  const docRef = doc(db, "tasks", id);
  await updateDoc(docRef, {
    status: 'skipped',
    updatedAt: serverTimestamp(),
  });
}

export async function deleteTask(id: string, userId: string) {
  // Check permissions
  const permissions = await checkTaskAccess(userId, id);
  if (!permissions.canDelete) {
    throw new Error("You don't have permission to delete this task");
  }

  // Hard delete - for soft delete, we could add a 'deleted' field instead
  const docRef = doc(db, "tasks", id);
  await deleteDoc(docRef);
}

export async function getOverdueTasks(propertyIds: string[], userId: string): Promise<Task[]> {
  if (propertyIds.length === 0) return [];
  
  // Filter properties based on user permissions
  const accessibleProperties: string[] = [];
  for (const propertyId of propertyIds) {
    const permissions = await getUserTaskPermissions(userId, propertyId);
    if (permissions.canView) {
      accessibleProperties.push(propertyId);
    }
  }

  if (accessibleProperties.length === 0) return [];
  
  // Simple query without multiple where clauses to avoid index requirements
  const q = query(
    collection(db, "tasks"),
    where("propertyId", "in", accessibleProperties)
  );
  const snapshot = await getDocs(q);
  const allTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
  
  // Filter client-side
  const now = new Date();
  return allTasks.filter(task => {
    if (task.status !== 'pending') return false;
    const dueDate = task.dueDate.toDate ? task.dueDate.toDate() : new Date(task.dueDate);
    return dueDate < now;
  });
}

export async function getUpcomingTasks(propertyIds: string[], userId: string, days: number = 7): Promise<Task[]> {
  if (propertyIds.length === 0) return [];
  
  // Filter properties based on user permissions
  const accessibleProperties: string[] = [];
  for (const propertyId of propertyIds) {
    const permissions = await getUserTaskPermissions(userId, propertyId);
    if (permissions.canView) {
      accessibleProperties.push(propertyId);
    }
  }

  if (accessibleProperties.length === 0) return [];
  
  // Simple query without multiple where clauses to avoid index requirements
  const q = query(
    collection(db, "tasks"),
    where("propertyId", "in", accessibleProperties)
  );
  const snapshot = await getDocs(q);
  const allTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
  
  // Filter and sort client-side
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(now.getDate() + days);
  
  const filteredTasks = allTasks.filter(task => {
    if (task.status !== 'pending') return false;
    const dueDate = task.dueDate.toDate ? task.dueDate.toDate() : new Date(task.dueDate);
    return dueDate >= now && dueDate <= futureDate;
  });
  
  return filteredTasks.sort((a, b) => {
    const dateA = a.dueDate.toDate ? a.dueDate.toDate() : new Date(a.dueDate);
    const dateB = b.dueDate.toDate ? b.dueDate.toDate() : new Date(b.dueDate);
    return dateA.getTime() - dateB.getTime();
  });
}

export async function getSeasonalTasks(propertyIds: string[], userId: string): Promise<Task[]> {
  if (propertyIds.length === 0) return [];
  
  // Filter properties based on user permissions
  const accessibleProperties: string[] = [];
  for (const propertyId of propertyIds) {
    const permissions = await getUserTaskPermissions(userId, propertyId);
    if (permissions.canView) {
      accessibleProperties.push(propertyId);
    }
  }

  if (accessibleProperties.length === 0) return [];
  
  // Simple query without multiple where clauses to avoid index requirements
  const q = query(
    collection(db, "tasks"),
    where("propertyId", "in", accessibleProperties)
  );
  const snapshot = await getDocs(q);
  const allTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
  
  // Filter client-side
  return allTasks.filter(task => task.seasonal === true);
}

// Recurrence Logic
export async function createRecurringTask(originalTaskId: string, userId: string): Promise<void> {
  try {
    const task = await getTaskById(originalTaskId, userId);
    
    if (!task || !task.recurrence) {
      throw new Error("Task not found or doesn't have recurrence settings");
    }

    const permissions = await getUserTaskPermissions(userId, task.propertyId);
    if (!permissions.canCreate) {
      throw new Error("You don't have permission to create recurring tasks for this property");
    }

    const { freq, interval } = task.recurrence;
    
    // Handle Firestore Timestamp conversion properly
    const originalDueDate = task.dueDate.toDate ? task.dueDate.toDate() : new Date(task.dueDate);
    
    // Validate the original date
    if (isNaN(originalDueDate.getTime())) {
      throw new Error("Invalid due date in original task");
    }
    
    const newDueDate = new Date(originalDueDate);

    // Calculate next due date based on frequency
    switch (freq) {
      case 'monthly':
        newDueDate.setMonth(newDueDate.getMonth() + interval);
        break;
      case 'yearly':
        newDueDate.setFullYear(newDueDate.getFullYear() + interval);
        break;
      case 'custom':
        newDueDate.setDate(newDueDate.getDate() + interval);
        break;
      default:
        throw new Error(`Unsupported recurrence frequency: ${freq}`);
    }

    // Validate the new date
    if (isNaN(newDueDate.getTime())) {
      throw new Error("Invalid calculated due date for recurring task");
    }

    console.log('Creating recurring task with new due date:', newDueDate);

    // Create new task with updated due date
    await addTask({
      propertyId: task.propertyId,
      title: task.title,
      description: task.description,
      dueDate: newDueDate,
      recurrence: task.recurrence,
      seasonal: task.seasonal,
      geolocated: task.geolocated,
      source: task.source,
    }, userId);
  } catch (error) {
    console.error('Error in createRecurringTask:', error);
    throw error;
  }
}

export async function completeAndCreateNext(taskId: string, userId: string): Promise<void> {
  try {
    // Complete the current task
    await completeTask(taskId, userId);
    
    // Check if task has recurrence and create next occurrence
    const task = await getTaskById(taskId, userId);
    if (task && task.recurrence) {
      console.log('Creating next recurring task for:', task.title, 'with recurrence:', task.recurrence);
      await createRecurringTask(taskId, userId);
      console.log('Successfully created next recurring task');
    }
  } catch (error) {
    console.error('Error in completeAndCreateNext:', error);
    throw error;
  }
}

// Bulk operations for efficiency
export async function getTasksSummary(propertyIds: string[], userId: string) {
  const [overdue, upcoming, seasonal] = await Promise.all([
    getOverdueTasks(propertyIds, userId),
    getUpcomingTasks(propertyIds, userId),
    getSeasonalTasks(propertyIds, userId)
  ]);

  return {
    overdue: overdue.length,
    upcoming: upcoming.length,
    seasonal: seasonal.length,
    overdueTasksPreview: overdue.slice(0, 3), // First 3 for preview
    upcomingTasksPreview: upcoming.slice(0, 5) // First 5 for preview
  };
}
