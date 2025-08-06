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

export async function updateProperty(id: string, data: Partial<PropertyInput>) {
  const docRef = doc(db, "properties", id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteProperty(id: string) {
  const docRef = doc(db, "properties", id);
  await deleteDoc(docRef);
}

export async function shareProperty(propertyId: string, userId: string, role: 'collaborator' | 'viewer') {
  const docRef = doc(db, "properties", propertyId);
  const property = await getPropertyById(propertyId);
  
  if (property) {
    const updatedSharedWith = [...(property.sharedWith || []), { userId, role }];
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