import React, { useEffect, useState } from 'react';
import { db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';

function UserCard({ userID }) {
  const [userInfo, setUserInfo] = useState(null);
  const [weeklyWorkTime, setWeeklyWorkTime] = useState(null);

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

  function formatSecondsToHMS(seconds) {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  }

  async function getWeeklyWorkTime(uid) {
    const now = new Date();
    const pastWeekDates = [...Array(7)].map((_, i) => {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      return d.toISOString().split('T')[0];
    });
  
    const logs = await Promise.all(
      pastWeekDates.map(async (dateStr) => {
        const ref = doc(db, 'users', uid, 'dailyLogs', dateStr);
        const snap = await getDoc(ref);
        return snap.exists() ? snap.data().totalTime : 0;
      })
    );
  
    const totalSeconds = logs.reduce((sum, seconds) => sum + seconds, 0);
    return totalSeconds;
  }
  
  // 週間作業時間の取得待ち
  useEffect(() => {
    async function fetchWeeklyWorkTime() {
      const time = await getWeeklyWorkTime(userID);
      setWeeklyWorkTime(time);
    }

    fetchWeeklyWorkTime();
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
      <hr />
      <div>
        <small>🕐累計作業時間 {formatSecondsToHMS(userInfo.totalTime ?? 0)}</small>
      </div>
      <div>
        <small>
          🕐週間作業時間{" "}{weeklyWorkTime !== null ? formatSecondsToHMS(weeklyWorkTime) : "読み込み中..."}
        </small>
      </div>

      <hr />
      <div className="">
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

// ランク案メモ (累計勉強時間)

// [0] 黒色 < 1 h
// [1] 灰色 < 5 h
// [2] 茶色 < 10 h
// [3] 緑色 < 20 h
// [4] 水色 < 50 h
// [5] 青色 < 100 h
// [6] 黄色 < 200 h
// [7] 橙色 < 500 h
// [8] 赤色 < 1000 h
// [9] 金色 1000 h 