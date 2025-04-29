import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "./firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import Login from "./Login";
import ProfileSetup from "./ProfileSetup";
import Loading from "./Loading";
import Header from "./Header";
import RoomList from "./RoomList";
import CreateRoom from "./CreateRoom";
import Room from "./Room";

function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [checkingProfile, setCheckingProfile] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // ログイン
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthChecked(true);
    });

    return () => unsubscribe(); 
  }, []);

  // ログアウト
  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setProfile(null);
  };

  // プロフィールの取得
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

  // ログイン状態の取得待ち
  if (!authChecked) {
    <Router>
    <div className="page">
      <Header user={user} profile={profile} onLogout={handleLogout} />
      <Loading text="ログイン状態を取得中..." />;
    </div>
  </Router>
  }

  // ユーザー情報の取得待ち
  if (checkingProfile) {
    return (
      <Router>
        <div className="page">
          <Header user={user} profile={profile} onLogout={handleLogout} />
          <Loading text="ユーザー情報を取得中..." />
        </div>
      </Router>
    );
  }

  // ログインページ
  if (!user) {
    return (
      <Router>
        <div className="page">
          <Header user={user} profile={profile} onLogout={handleLogout} />
          <Routes>
            <Route path="/" element={<Login onLogin={setUser} />} />
          </Routes>
        </div>
      </Router>
    );
  }

  // プロフィール初期設定ページ
  if (!profile) {
    return (
      <Router>
        <div className="page">
          <Header user={user} profile={profile} onLogout={handleLogout} />
          <Routes>
            <Route path="/" element={<ProfileSetup user={user} onSubmit={setProfile} />} />
          </Routes>
        </div>
      </Router>
    );
  }

  // メインページ
  return (
    <Router>
      <div className="page">
        <Header user={user} profile={profile} onLogout={handleLogout} />
        <Routes>
          <Route path="/" element={<RoomList />}/> 
          <Route path="/create-room" element={<CreateRoom user={user} />}/>
          <Route path="/rooms/:id" component={<Room />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
