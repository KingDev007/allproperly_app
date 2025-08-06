import { db } from "./firebase";
import { doc, getDoc, updateDoc, setDoc, serverTimestamp } from "firebase/firestore";
import type { User, PropertyRelationship } from "../types";

export interface UserInput {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role?: 'owner' | 'collaborator' | 'viewer';
  timezone?: string;
  linkedProperties?: string[];
  relationships?: PropertyRelationship[];
}

export async function createUser(data: UserInput) {
  const userRef = doc(db, "users", data.uid);
  await setDoc(userRef, {
    ...data,
    role: data.role || 'owner',
    timezone: data.timezone || 'UTC',
    linkedProperties: data.linkedProperties || [],
    relationships: data.relationships || [],
    createdAt: serverTimestamp(),
    lastLogin: serverTimestamp(),
  });
}

export async function getUserById(uid: string): Promise<User | null> {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);
  return userSnap.exists() ? { ...userSnap.data() } as User : null;
}

export async function updateUser(uid: string, data: Partial<UserInput>) {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, {
    ...data,
    lastLogin: serverTimestamp(),
  });
}

export async function addPropertyRelationship(uid: string, propertyId: string, label: string) {
  const user = await getUserById(uid);
  if (user) {
    const existingRelationship = user.relationships.find(rel => rel.propertyId === propertyId);
    
    if (!existingRelationship) {
      const updatedRelationships = [...user.relationships, { propertyId, label }];
      const updatedLinkedProperties = user.linkedProperties.includes(propertyId) 
        ? user.linkedProperties 
        : [...user.linkedProperties, propertyId];
      
      await updateUser(uid, {
        relationships: updatedRelationships,
        linkedProperties: updatedLinkedProperties,
      });
    }
  }
}

export async function updatePropertyRelationship(uid: string, propertyId: string, newLabel: string) {
  const user = await getUserById(uid);
  if (user) {
    const updatedRelationships = user.relationships.map(rel => 
      rel.propertyId === propertyId ? { ...rel, label: newLabel } : rel
    );
    
    await updateUser(uid, {
      relationships: updatedRelationships,
    });
  }
}

export async function removePropertyRelationship(uid: string, propertyId: string) {
  const user = await getUserById(uid);
  if (user) {
    const updatedRelationships = user.relationships.filter(rel => rel.propertyId !== propertyId);
    const updatedLinkedProperties = user.linkedProperties.filter(id => id !== propertyId);
    
    await updateUser(uid, {
      relationships: updatedRelationships,
      linkedProperties: updatedLinkedProperties,
    });
  }
}

export async function getUserPropertyLabel(uid: string, propertyId: string): Promise<string | null> {
  const user = await getUserById(uid);
  if (user) {
    const relationship = user.relationships.find(rel => rel.propertyId === propertyId);
    return relationship ? relationship.label : null;
  }
  return null;
}
