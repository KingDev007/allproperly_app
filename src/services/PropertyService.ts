import { db } from "./firebase";
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, serverTimestamp, query, where } from "firebase/firestore";

export interface Property {
  id: string;
  address: string;
  yearBuilt: string;
  homeType: string;
  notes: string;
  owner: string;
  createdAt?: any;
}

export interface PropertyInput {
  address: string;
  yearBuilt: string;
  homeType: string;
  notes: string;
  owner: string;
}

export async function addProperty(data: PropertyInput) {
  return await addDoc(collection(db, "properties"), {
    ...data,
    createdAt: serverTimestamp(),
  });
}

export async function getPropertiesByUser(uid: string): Promise<Property[]> {
  const q = query(collection(db, "properties"), where("owner", "==", uid));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));
}

export async function getPropertyById(id: string): Promise<Property | null> {
  const docRef = doc(db, "properties", id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Property : null;
}

export async function updateProperty(id: string, data: Partial<PropertyInput>) {
  const docRef = doc(db, "properties", id);
  await updateDoc(docRef, data);
}

export async function deleteProperty(id: string) {
  const docRef = doc(db, "properties", id);
  await deleteDoc(docRef);
}