import { db } from "./firebase";
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, serverTimestamp, query, where } from "firebase/firestore";
import type { Property, PropertyShare } from "../types";

export interface PropertyInput {
  address: string;
  type: 'primary' | 'rental' | 'family';
  notes: string;
  ownerId: string;
  photoURL?: string;
  sharedWith?: PropertyShare[];
  propertyStatus?: 'active' | 'sold' | 'archived';
  historyVisible?: boolean;
}

export interface PropertyPermissions {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canShare: boolean;
  role: 'owner' | 'collaborator' | 'viewer' | 'none';
}

// Permission checking functions
export async function getUserPropertyPermissions(userId: string, propertyId: string): Promise<PropertyPermissions> {
  const property = await getPropertyById(propertyId);
  
  if (!property) {
    return { canView: false, canEdit: false, canDelete: false, canShare: false, role: 'none' };
  }

  // Check if user is owner
  if (property.ownerId === userId) {
    return { canView: true, canEdit: true, canDelete: true, canShare: true, role: 'owner' };
  }

  // Check if user is shared with
  const userShare = property.sharedWith?.find(share => share.userId === userId);
  if (userShare) {
    if (userShare.role === 'collaborator') {
      return { canView: true, canEdit: true, canDelete: false, canShare: false, role: 'collaborator' };
    } else if (userShare.role === 'viewer') {
      return { canView: true, canEdit: false, canDelete: false, canShare: false, role: 'viewer' };
    }
  }

  return { canView: false, canEdit: false, canDelete: false, canShare: false, role: 'none' };
}

export async function addProperty(data: PropertyInput) {
  return await addDoc(collection(db, "properties"), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    sharedWith: data.sharedWith || [],
    propertyStatus: data.propertyStatus || 'active',
    historyVisible: data.historyVisible ?? true,
    photoURL: data.photoURL || '',
  });
}

export async function getPropertiesByUser(uid: string): Promise<Property[]> {
  // Get properties where user is owner
  const ownerQuery = query(collection(db, "properties"), where("ownerId", "==", uid));
  const ownerSnapshot = await getDocs(ownerQuery);
  
  // Get properties shared with user
  const sharedQuery = query(collection(db, "properties"), where("sharedWith", "array-contains", { userId: uid }));
  const sharedSnapshot = await getDocs(sharedQuery);
  
  const ownerProperties = ownerSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));
  const sharedProperties = sharedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));
  
  // Combine and deduplicate
  const allProperties = [...ownerProperties, ...sharedProperties];
  const uniqueProperties = allProperties.filter((property, index, self) => 
    index === self.findIndex(p => p.id === property.id)
  );
  
  return uniqueProperties;
}

export async function getPropertyById(id: string): Promise<Property | null> {
  const docRef = doc(db, "properties", id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Property : null;
}

export async function updateProperty(id: string, data: Partial<PropertyInput>, userId: string) {
  console.log('PropertyService.updateProperty called:', { id, data, userId });
  
  // Check permissions
  const permissions = await getUserPropertyPermissions(userId, id);
  console.log('User permissions:', permissions);
  
  if (!permissions.canEdit) {
    throw new Error("You don't have permission to edit this property");
  }

  const docRef = doc(db, "properties", id);
  
  // Clean up the data - remove undefined values and prevent changing ownerId
  const updateData: any = { ...data };
  delete updateData.ownerId; // Prevent changing ownership via update
  
  Object.keys(updateData).forEach(key => {
    if (updateData[key] === undefined) {
      delete updateData[key];
    }
  });

  console.log('Updating property with data:', updateData);
  
  await updateDoc(docRef, {
    ...updateData,
    updatedAt: serverTimestamp(),
  });
  
  console.log('Property update completed successfully');
}

export async function deleteProperty(id: string, userId: string) {
  // Check permissions - only owners can delete
  const permissions = await getUserPropertyPermissions(userId, id);
  if (!permissions.canDelete) {
    throw new Error("You don't have permission to delete this property");
  }

  const docRef = doc(db, "properties", id);
  await deleteDoc(docRef);
}

export async function shareProperty(propertyId: string, targetUserId: string, role: 'collaborator' | 'viewer', currentUserId: string) {
  // Check permissions - only owners can share properties
  const permissions = await getUserPropertyPermissions(currentUserId, propertyId);
  if (!permissions.canShare) {
    throw new Error("You don't have permission to share this property");
  }

  const docRef = doc(db, "properties", propertyId);
  const property = await getPropertyById(propertyId);
  
  if (property) {
    // Check if user is already shared
    const existingShare = property.sharedWith?.find(share => share.userId === targetUserId);
    let updatedSharedWith;
    
    if (existingShare) {
      // Update existing share role
      updatedSharedWith = property.sharedWith?.map(share => 
        share.userId === targetUserId ? { ...share, role } : share
      ) || [];
    } else {
      // Add new share
      updatedSharedWith = [...(property.sharedWith || []), { userId: targetUserId, role }];
    }
    
    await updateDoc(docRef, {
      sharedWith: updatedSharedWith,
      updatedAt: serverTimestamp(),
    });
  }
}

export async function updatePropertyStatus(propertyId: string, status: 'active' | 'sold' | 'archived') {
  const docRef = doc(db, "properties", propertyId);
  await updateDoc(docRef, {
    propertyStatus: status,
    updatedAt: serverTimestamp(),
  });
}