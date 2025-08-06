// User Types
export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: 'owner' | 'collaborator' | 'viewer';
  timezone: string;
  createdAt: any; // Firebase Timestamp
  lastLogin: any; // Firebase Timestamp
  linkedProperties: string[]; // Array of property IDs
  relationships: PropertyRelationship[];
}

export interface PropertyRelationship {
  propertyId: string;
  label: string; // e.g., "Mom's House", "Rental #2", "Parents' Home"
}

// Property Types
export interface Property {
  id: string;
  ownerId: string;
  address: string;
  type: 'primary' | 'rental' | 'family';
  notes: string;
  photoURL: string; // For Zillow-style photo display
  createdAt: any; // Firebase Timestamp
  updatedAt: any; // Firebase Timestamp
  sharedWith: PropertyShare[];
  propertyStatus: 'active' | 'sold' | 'archived'; // For CarFax-style history
  historyVisible: boolean; // Whether history is passed to next buyer
}

export interface PropertyShare {
  userId: string;
  role: 'collaborator' | 'viewer';
}

// Task Types
export interface Task {
  id: string;
  propertyId: string;
  title: string;
  description: string;
  dueDate: any; // Firebase Timestamp
  status: 'pending' | 'completed' | 'skipped';
  completedBy?: string; // userId
  createdAt: any; // Firebase Timestamp
  updatedAt: any; // Firebase Timestamp
  recurrence?: TaskRecurrence;
  seasonal: boolean; // For weather-based tasks
  geolocated: boolean; // For location-based suggestions
  source: 'manual' | 'template' | 'AI-suggested'; // Task origin
}

export interface TaskRecurrence {
  freq: 'monthly' | 'yearly' | 'custom';
  interval: number;
}

// Form Types for UI
export interface PropertyFormData {
  address: string;
  type: 'primary' | 'rental' | 'family';
  notes: string;
  photoURL?: string;
}

export interface TaskFormData {
  title: string;
  description: string;
  dueDate: Date;
  recurrence?: {
    freq: 'monthly' | 'yearly' | 'custom';
    interval: number;
  };
  seasonal?: boolean;
  geolocated?: boolean;
}

// Additional utility types
export type UserRole = 'owner' | 'collaborator' | 'viewer';
export type PropertyType = 'primary' | 'rental' | 'family';
export type PropertyStatus = 'active' | 'sold' | 'archived';
export type TaskStatus = 'pending' | 'completed' | 'skipped';
export type TaskSource = 'manual' | 'template' | 'AI-suggested';
export type RecurrenceFrequency = 'monthly' | 'yearly' | 'custom';