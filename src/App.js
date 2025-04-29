import React, { useEffect, useState } from "react";
import Login from "./Login";
import ProfileSetup from "./ProfileSetup";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [checkingProfile, setCheckingProfile] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        setCheckingProfile(true);
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            setProfile(userDocSnap.data());
          }
        } catch (error) {
          console.error("プロフィールの取得中にエラー:", error);
        }
        setCheckingProfile(false);
      }
    };

    fetchProfile();
  }, [user]);

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  if (checkingProfile) {
    return (
      <div className="container d-flex justify-content-center align-items-center vh-100">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="mt-3">プロフィール確認中...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return <ProfileSetup user={user} onSubmit={setProfile} />;
  }

  return (
    <div className="container d-flex justify-content-center align-items-center vh-100">
      <div className="card shadow p-4" style={{ maxWidth: "400px", width: "100%" }}>
        <div className="text-center">
          <img
            src={profile.photoURL}
            alt="avatar"
            className="rounded-circle mb-3"
            width="80"
            height="80"
          />
          <h4 className="card-title">ようこそ、{profile.nickname} さん！</h4>
          <p className="text-muted">ID: {profile.userID}</p>
        </div>
      </div>
    </div>
  );
}

export default App;
