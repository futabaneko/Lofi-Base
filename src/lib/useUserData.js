import { useEffect, useState } from "react";
import { fetchUserData } from "./lib/fetchUserData";

export function useUserData(uid) {
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    if (!uid) return;

    fetchUserData(uid).then(setUserData);
  }, [uid]);

  return userData;
}