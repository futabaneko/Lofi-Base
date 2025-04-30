import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "./firebase";
import { useNavigate } from 'react-router-dom';
import { signOut, onAuthStateChanged } from "firebase/auth";
import Login from "./Login";
import ProfileSetup from "./ProfileSetup";
import Loading from "./Loading";
import Header from "./Header";
import RoomList from "./RoomList";
import CreateRoom from "./CreateRoom";
import Room from "./Room";
import ProfileSettings from "./ProfileSettings";

function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [checkingProfile, setCheckingProfile] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const navigate = useNavigate();

  // ログイン状態を監視
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthChecked(true);
    });

    return () => unsubscribe();
  }, []);

  // ログアウト処理
  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setProfile(null);
  };

  // プロフィール取得・ルームへの遷移
  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        setCheckingProfile(true);
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const profileData = userDocSnap.data();
            setProfile(profileData);

            // ここで直接 navigate を呼ぶ
            if (profileData.currentRoomID) {
              navigate(`/rooms/${profileData.currentRoomID}`);
            }
          }
        } catch (error) {
          console.error("プロフィールの取得中にエラー:", error);
        }
        setCheckingProfile(false);
      }
    };

    fetchProfile();
  }, [user, navigate]);

  if (!authChecked) {
    return (
      <div className="page">
        <Header user={user} profile={profile} onLogout={handleLogout} />
        <Loading text="ログイン状態を取得中..." />
      </div>
    );
  }

  if (checkingProfile) {
    return (
      <div className="page">
        <Header user={user} profile={profile} onLogout={handleLogout} />
        <Loading text="ユーザー情報を取得中..." />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="page">
        <Header user={user} profile={profile} onLogout={handleLogout} />
        <Routes>
          <Route path="/" element={<Login onLogin={setUser} />} />
        </Routes>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="page">
        <Header user={user} profile={profile} onLogout={handleLogout} />
        <Routes>
          <Route path="/" element={<ProfileSetup user={user} onSubmit={setProfile} />} />
        </Routes>
      </div>
    );
  }

  return (
    <div className="page">
      <Header user={user} profile={profile} onLogout={handleLogout} />
      <Routes>
        <Route path="/" element={<RoomList user={user} />} />
        <Route path="/create-room" element={<CreateRoom user={user} />} />
        <Route path="/rooms/:id" element={<Room user={user} />} />
        <Route path="/profile-settings" element={<ProfileSettings user={user} />} />
      </Routes>
    </div>
  );
}

// App コンポーネント全体を Router でラップ
export default function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}
