import React, { useState } from "react";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "./firebase";

const escapeHTML = (str) => {
  const div = document.createElement("div");
  if (str) {
    div.innerText = str;
    div.textContent = str;
  }
  return div.innerHTML;
};

export default function ProfileSetup({ user, onSubmit }) {
  const [userName, setUserName] = useState("");
  const [userID, setUserId] = useState("");
  const [tags, setTags] = useState(""); // タグの状態を管理
  const [errors, setErrors] = useState({ userName: "", userID: "", tags: "" });
  const [touched, setTouched] = useState({ userName: false, userID: false, tags: false });

  const validate = (name, value) => {
    if (name === "userName") {
      if (!value) return "ニックネームを入力してください。";
      if (value.length > 16) return "ニックネームは16文字以内で入力してください。";
    } else if (name === "userID") {
      if (!value) return "IDを入力してください。";
      if (!/^[a-zA-Z0-9_]{1,16}$/.test(value))
        return "IDは英数字と_のみ使用可能で、16文字以内です。";
    } else if (name === "tags") {
      if (value.split(',').length > 5) return "タグは最大5個まで入力できます。";
    }
    return "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "userName") setUserName(value);
    if (name === "userID") setUserId(value);
    if (name === "tags") setTags(value);

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
    const tagsError = validate("tags", tags);

    if (userNameError || userIdError || tagsError) {
      setErrors({ userName: userNameError, userID: userIdError, tags: tagsError });
      setTouched({ userName: true, userID: true, tags: true });
      return;
    }
  
    try {
      // IDの重複チェック（大文字小文字を区別しない）
      const lowerCaseUserID = userID.toLowerCase();
      const q = query(
        collection(db, "users"),
        where("userID", "==", lowerCaseUserID)
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
  
      // ユーザー名をエスケープ（HTMLタグを無害化）
      const safeUserName = escapeHTML(userName);

      // タグを配列に変換
      const tagArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');

      // 保存処理
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, {
        userName: safeUserName,
        userID: lowerCaseUserID,
        photoURL: user.photoURL ?? null,
        totalTime: 0,
        isAdmin: false,
        tags: tagArray,
        createdAt: serverTimestamp(),
      });
      onSubmit({ ...user, userName: safeUserName, userID: lowerCaseUserID, tags: tagArray });
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
        <div className="mb-3">
          <label className="form-label">タグ</label>
          <input
            className={`form-control ${touched.tags && errors.tags ? "is-invalid" : ""}`}
            name="tags"
            value={tags}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="タグをカンマ区切りで入力"
          />
          {touched.tags && errors.tags && (
            <div className="invalid-feedback">{errors.tags}</div>
          )}
        </div>
        <button className="btn btn-success" type="submit">
          登録
        </button>
      </form>
    </div>
  );
}
