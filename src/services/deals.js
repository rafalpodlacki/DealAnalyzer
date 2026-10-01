import {
  collection, addDoc, getDocs, doc, updateDoc, deleteDoc,
  query, orderBy, serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

// Signed-in users (uid set) save to Firestore.
// Guests (uid null) save to this browser's localStorage only.
const GUEST_KEY = "dealanalyser.guestDeals.v1";

const dealsCol = (uid) => collection(db, "users", uid, "deals");

function readGuest() {
  try {
    const raw = window.localStorage.getItem(GUEST_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function writeGuest(list) {
  try {
    window.localStorage.setItem(GUEST_KEY, JSON.stringify(list));
  } catch {
    throw new Error("Could not save in this browser (storage is blocked or full). Sign in with Google to save to the cloud.");
  }
}

export async function saveNewDeal(uid, inputs, results) {
  if (!uid) {
    const id = "local-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    writeGuest([{ id, inputs, results, updatedAt: Date.now() }, ...readGuest()]);
    return { id };
  }
  return addDoc(dealsCol(uid), {
    inputs,
    results,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateDeal(uid, dealId, inputs, results) {
  if (!uid) {
    writeGuest(readGuest().map(d => d.id === dealId ? { ...d, inputs, results, updatedAt: Date.now() } : d));
    return;
  }
  return updateDoc(doc(db, "users", uid, "deals", dealId), {
    inputs,
    results,
    updatedAt: serverTimestamp(),
  });
}

export async function fetchDeals(uid) {
  if (!uid) {
    return readGuest().sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  }
  const q = query(dealsCol(uid), orderBy("updatedAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function deleteDeal(uid, dealId) {
  if (!uid) {
    writeGuest(readGuest().filter(d => d.id !== dealId));
    return;
  }
  return deleteDoc(doc(db, "users", uid, "deals", dealId));
}
