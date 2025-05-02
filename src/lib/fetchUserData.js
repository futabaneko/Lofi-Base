import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

export async function fetchUserData(uid) {
  const docRef = doc(db, "users", uid);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data() : null;
}
