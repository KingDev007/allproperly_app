import { db } from "./firebase";
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, serverTimestamp, query, where } from "firebase/firestore";

export async function addProperty(data: {
  address: string;
  yearBuilt: string;
  homeType: string;
  notes: string;
  owner: string;
}) {
  return await addDoc(collection(db, "properties"), {
    ...data,
    createdAt: serverTimestamp(),
  });
}

export async function getPropertiesByUser(uid: string) {
  const q = query(collection(db, "properties"), where("owner", "==", uid));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getPropertyById(id: string) {
  const docRef = doc(db, "properties", id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
}

export async function updateProperty(id: string, data: any) {
  const docRef = doc(db, "properties", id);
  await updateDoc(docRef, data);
}

export async function deleteProperty(id: string) {
  const docRef = doc(db, "properties", id);
  await deleteDoc(docRef);
}