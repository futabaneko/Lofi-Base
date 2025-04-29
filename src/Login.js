import React from "react";
import { auth, provider } from "./firebase";
import { signInWithPopup } from "firebase/auth";

export default function Login({ onLogin }) {
  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      onLogin({
        uid: user.uid,
        displayName: user.displayName,
        photoURL: user.photoURL,
        email: user.email,
      });
    } catch (error) {
      alert("ログイン失敗: " + error.message);
    }
  };

  return (
    <div className="text-center mt-5">
      <h2>Welcome to Lofi-Base!</h2>
      <button className="btn btn-primary mt-3" onClick={handleLogin}>
        Login with Google
      </button>
    </div>
  );
}
