import {
  collection, addDoc, getDocs, doc, updateDoc, deleteDoc,
  query, orderBy, serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

const dealsCol = (uid) => collection(db, "users", uid, "deals");

export async function saveNewDeal(uid, inputs, results) {
  return addDoc(dealsCol(uid), {
    inputs,
    results,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateDeal(uid, dealId, inputs, results) {
  return updateDoc(doc(db, "users", uid, "deals", dealId), {
    inputs,
    results,
    updatedAt: serverTimestamp(),
  });
}

export async function fetchDeals(uid) {
  const q = query(dealsCol(uid), orderBy("updatedAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function deleteDeal(uid, dealId) {
  return deleteDoc(doc(db, "users", uid, "deals", dealId));
}
