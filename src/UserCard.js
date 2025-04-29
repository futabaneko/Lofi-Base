import React, { useEffect, useState } from 'react';
import { db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';

function UserCard({ userID }) {
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const userDocRef = doc(db, 'users', userID);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          setUserInfo(userDocSnap.data());

        } else {
          console.log("ユーザーが見つかりません");
        }

      } catch (error) {
        console.error("ユーザー情報の取得エラー:", error);
      }
    };

    if (userID) {
      fetchUserInfo();
    }
  }, [userID]);

  if (!userInfo) return null;

  return (
    <div className="card p-3" style={{ width: '200px', position: 'relative' }}>
      <div className="d-flex align-items-center">
        <img
          src={userInfo.photoURL}
          alt="User"
          className="rounded-circle me-3"
          style={{ width: '50px', height: '50px' }}
        />
        <div>
          <h5 className="mb-1">{userInfo.userName}</h5>
          <small className="text-muted">@{userInfo.userID}</small>
        </div>
      </div>
      <div className="mt-2">
        {userInfo.tags && userInfo.tags.length > 0 && (
          <div className="d-flex flex-wrap">
            {userInfo.tags.map((tag, index) => (
              <span key={index} className="badge bg-primary me-1 mb-1">{tag}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default UserCard;
