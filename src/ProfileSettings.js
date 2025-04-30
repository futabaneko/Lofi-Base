import React, { useState, useEffect } from "react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import Loading from "./Loading";

export default function ProfileSettings({ user }) {
  const [userName, setUserName] = useState("");
  const [userID, setUserID] = useState("");
  const [tags, setTags] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [totalTime, setTotalTime] = useState(0);
  const [errors, setErrors] = useState({ userName: "", userID: "", tags: "" });
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    // Firebaseからユーザー情報を取得
    const fetchUserInfo = async () => {
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setUserName(userData.userName || "");
          setUserID(userData.userID || "");
          setTags(userData.tags?.join(", ") || "");
          setPhotoURL(userData.photoURL || "");
          setTotalTime(userData.totalTime || 0);
        }
      } catch (error) {
        console.error("ユーザー情報の取得エラー:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, [user.uid]);

  const validate = (name, value) => {
    if (name === "userName") {
      if (!value) return "ニックネームを入力してください。";
      if (value.length > 16) return "ニックネームは16文字以内で入力してください。";
    } else if (name === "userID") {
      if (!value) return "IDを入力してください。";
      if (!/^[a-zA-Z0-9_]{1,16}$/.test(value))
        return "IDは英数字と_のみ使用可能で、16文字以内です。";
    } else if (name === "tags") {
      if (value.split(",").length > 5) return "タグは最大5個まで入力できます。";
    }
    return "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "userName") setUserName(value);
    if (name === "userID") setUserID(value);
    if (name === "tags") setTags(value);

    setErrors((prev) => ({ ...prev, [name]: validate(name, value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const userNameError = validate("userName", userName);
    const userIdError = validate("userID", userID);
    const tagsError = validate("tags", tags);

    if (userNameError || userIdError || tagsError) {
      setErrors({ userName: userNameError, userID: userIdError, tags: tagsError });
      return;
    }

    try {
      // タグを配列に変換
      const tagArray = tags.split(",").map((tag) => tag.trim()).filter((tag) => tag !== "");

      // ユーザー情報をFirestoreに保存
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, {
        userName,
        userID: userID.toLowerCase(),  // 小文字に変換
        photoURL,
        totalTime: totalTime,
        tags: tagArray,
        updatedAt: serverTimestamp(),
      });
      alert("プロフィールが更新されました。");

    } catch (error) {
      console.error("Firestoreへの保存エラー:", error);
      alert("プロフィールの更新中にエラーが発生しました。");
    }
  };

  if (loading) {
    return (
      <div className="page">
        <Loading text="プロフィール情報を取得中..." />
      </div>
    );
  }
    
  return (
    <div className="container mt-5">
      <h3>アカウント設定</h3>
      <form onSubmit={handleSubmit}>
        {photoURL && (
          <div className="mb-3">
            <img
              src={photoURL}
              alt="avatar"
              width="80"
              className="rounded-circle mb-3"
            />
          </div>
        )}
        <div className="mb-3">
          <label className="form-label">ニックネーム</label>
          <input
            className={`form-control ${errors.userName ? "is-invalid" : ""}`}
            name="userName"
            value={userName}
            onChange={handleChange}
            maxLength={16}
          />
          {errors.userName && <div className="invalid-feedback">{errors.userName}</div>}
        </div>
        <div className="mb-3">
          <label className="form-label">ID</label>
          <input
            className={`form-control ${errors.userID ? "is-invalid" : ""}`}
            name="userID"
            value={userID}
            onChange={handleChange}
            maxLength={16}
          />
          {errors.userID && <div className="invalid-feedback">{errors.userID}</div>}
        </div>
        <div className="mb-3">
          <label className="form-label">タグ</label>
          <input
            className={`form-control ${errors.tags ? "is-invalid" : ""}`}
            name="tags"
            value={tags}
            onChange={handleChange}
            placeholder="タグをカンマ区切りで入力"
          />
          {errors.tags && <div className="invalid-feedback">{errors.tags}</div>}
        </div>
        <button className="btn btn-success" type="submit">
          更新
        </button>
      </form>
    </div>
  );
}
