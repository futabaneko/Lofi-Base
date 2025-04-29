import React, { useState } from "react";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase"; 

export default function ProfileSetup({ user, onSubmit }) {
  const [nickname, setNickname] = useState("");
  const [userId, setUserId] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();


    if (nickname && userId) {
      try {
        console.log("try")
        const userDocRef = doc(db, "users", user.uid);
        await setDoc(userDocRef, {
          nickname,
          userID: userId,
          photoURL: user.photoURL ?? null,
          createdAt: serverTimestamp(),
        });
  
        console.log("set-doc")
        onSubmit({ ...user, nickname, userId });

      } catch (error) {
        console.error("Firestoreへの保存エラー:", error.code, error.message);
        alert("保存中にエラーが発生しました: " + error.message);
      }
    
    } else {
      alert("ニックネームとIDを入力してください");
    }
  };

  return (
    <div className="container mt-5">
      <h3>プロフィールを設定</h3>
      <form onSubmit={handleSubmit}>
        <img
          src={user.photoURL}
          alt="avatar"
          width="80"
          className="rounded-circle mb-3"
        />
        <div className="mb-3">
          <label className="form-label">ニックネーム</label>
          <input
            className="form-control"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">ID (@から始めてください)</label>
          <input
            className="form-control"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
        </div>
        <button className="btn btn-success" type="submit">
          登録
        </button>
      </form>
    </div>
  );
}
