import React, { useState } from "react";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "./firebase";

export default function ProfileSetup({ user, onSubmit }) {
  const [userName, setUserName] = useState("");
  const [userID, setUserId] = useState("");
  const [errors, setErrors] = useState({ userName: "", userID: "" });
  const [touched, setTouched] = useState({ userName: false, userID: false });

  const validate = (name, value) => {
    if (name === "userName") {
      if (!value) return "ニックネームを入力してください。";
      if (value.length > 16) return "ニックネームは16文字以内で入力してください。";
    } else if (name === "userID") {
      if (!value) return "IDを入力してください。";
      if (!/^[a-zA-Z0-9_]{1,16}$/.test(value))
        return "IDは英数字と_のみ使用可能で、16文字以内です。";
    }
    return "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "userName") setUserName(value);
    if (name === "userID") setUserId(value);

    setErrors((prev) => ({ ...prev, [name]: validate(name, value) }));
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const userNameError = validate("userName", userName);
    const userIdError = validate("userID", userID);
    if (userNameError || userIdError) {
      setErrors({ userName: userNameError, userID: userIdError });
      setTouched({ userName: true, userID: true });
      return;
    }
  
    try {
      // IDの重複チェック
      const q = query(
        collection(db, "users"),
        where("userID", "==", userID)
      );
      const querySnapshot = await getDocs(q);
  
      // 自分以外に同じIDがある場合はエラー
      const isDuplicate = querySnapshot.docs.some(
        (docSnap) => docSnap.id !== user.uid
      );
      if (isDuplicate) {
        setErrors((prev) => ({
          ...prev,
          userID: "このIDはすでに使われています。",
        }));
        setTouched((prev) => ({ ...prev, userID: true }));
        return;
      }
  
      // 保存処理
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, {
        userName,
        userID: userID,
        photoURL: user.photoURL ?? null,
        createdAt: serverTimestamp(),
      });
      onSubmit({ ...user, userName, userID });

    } catch (error) {
      console.error("Firestoreへの保存エラー:", error.code, error.message);
      alert("保存中にエラーが発生しました: " + error.message);
    }
  };

  return (
    <div className="container mt-5">
      <h3>プロフィールを設定</h3>
      <form onSubmit={handleSubmit}>
        {user.photoURL && (
          <img
            src={user.photoURL}
            alt="avatar"
            width="80"
            className="rounded-circle mb-3"
          />
        )}
        <div className="mb-3">
          <label className="form-label">ニックネーム</label>
          <input
            className={`form-control ${touched.userName && errors.userName ? "is-invalid" : ""}`}
            name="userName"
            value={userName}
            onChange={handleChange}
            onBlur={handleBlur}
            maxLength={16}
          />
          {touched.userName && errors.userName && (
            <div className="invalid-feedback">{errors.userName}</div>
          )}
        </div>
        <div className="mb-3">
          <label className="form-label">ID</label>
          <input
            className={`form-control ${touched.userID && errors.userID ? "is-invalid" : ""}`}
            name="userID"
            value={userID}
            onChange={handleChange}
            onBlur={handleBlur}
            maxLength={16}
          />
          {touched.userID && errors.userID && (
            <div className="invalid-feedback">{errors.userID}</div>
          )}
        </div>
        <button className="btn btn-success" type="submit">
          登録
        </button>
      </form>
    </div>
  );
}
