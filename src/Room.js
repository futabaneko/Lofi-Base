import React, { useEffect, useState } from 'react';
import { db } from './firebase';
import { doc,updateDoc, getDoc, deleteField, collection, query, where, onSnapshot, increment, setDoc } from 'firebase/firestore';
import { useParams, useNavigate } from 'react-router-dom';
import UserCard from './UserCard';

function Room({ user }) {
  const navigate = useNavigate();
  const { id: roomID } = useParams();

  const [members, setMembers] = useState([]);
  const [roomData, setRoomData] = useState(null);
  const [workItem, setworkItem] = useState('');
  const [hoveredUserID, setHoveredUserID] = useState(null);
  const [now, setNow] = useState(new Date());


  // リアルタイムで部屋とメンバーの情報を取得
  useEffect(() => {
    const unsubRoom = onSnapshot(doc(db, 'rooms', roomID), (docSnap) => {
      if (docSnap.exists()) setRoomData(docSnap.data());
    });

    const q = query(collection(db, 'rooms', roomID, 'members'), where('isInRoom', '==', true));
    const unsubMembers = onSnapshot(q, async (querySnapshot) => {
      const memberList = await Promise.all(
        querySnapshot.docs.map(async (docSnap) => {
          const uid = docSnap.id;
          const memberData = docSnap.data();
          try {
            const userDocSnap = await getDoc(doc(db, 'users', uid));
            const userData = userDocSnap.exists() ? userDocSnap.data() : {};
            return {
              uid,
              ...memberData,
              userName: userData.userName || '名前未設定',
            };
          } catch {
            return {
              uid,
              ...memberData,
              userName: '取得失敗',
            };
          }
        })
      );
      setMembers(memberList);
    });

    return () => {
      unsubRoom();
      unsubMembers();
    };
  }, [roomID]);

  // タイマー (per 1s)
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  
  function formatSecondsToHMS(seconds) {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  }

  // 作業開始
  const handleStartWorking = async () => {
    try {
      await updateDoc(doc(db, 'rooms', roomID, 'members', user.uid), {
        isWorking: true,
        workItem: workItem,
        workStartTime: new Date(), // 勉強開始時間を記録
      });
    } catch (error) {
      console.error("作業開始に失敗:", error);
    }
  };

  // 休憩
  const handleTakeBreak = async () => {
    try {
      const memberRef = doc(db, 'rooms', roomID, 'members', user.uid);
      const memberSnap = await getDoc(memberRef);
      const memberData = memberSnap.data();

      if (!memberData.isWorking) {
        alert("すでに休憩中です。");
        return;
      }

      const startTime = memberData.workStartTime?.toDate?.() ?? new Date();
      const now = new Date();
      const elapsedSeconds = Math.floor((now - startTime) / 1000);

      // 時間加算と状態更新
      await updateDoc(memberRef, {
        isWorking: false,
        workItem: "",
        totalTime: increment(elapsedSeconds),
        workStartTime: deleteField(),
      });

      // users/{uid} に全体記録（全期間累計）
      await updateDoc(doc(db, 'users', user.uid), {
        totalTime: increment(elapsedSeconds),
      });


      // users/{uid}/weeklyLogs/{日付} に記録
      const todayStr = now.toISOString().split('T')[0];
      const userDailyRef = doc(db, 'users', user.uid, 'dailyLogs', todayStr);
      await setDoc(userDailyRef, {
        totalTime: increment(elapsedSeconds),
      }, { merge: true });

    } catch (error) {
      console.error("休憩に失敗:", error);
    }
  };

  // 退出処理
  const handleLeaveRoom = async () => {

    try {
      const memberRef = doc(db, 'rooms', roomID, 'members', user.uid);
      const memberSnap = await getDoc(memberRef);
      const memberData = memberSnap.data();

      if (memberData.isWorking) {
        await handleTakeBreak();
      };
    
    } catch (error) {
      console.log("退出処理にて休憩に失敗しました")
    }

    try {
      const roomRef = doc(db, 'rooms', roomID);
      const roomDoc = await getDoc(roomRef);
      const nowMembers = roomDoc.data().nowMembers;

      await updateDoc(roomRef, {
        nowMembers: nowMembers - 1,
      });

      await updateDoc(doc(db, 'rooms', roomID, 'members', user.uid), {
        isInRoom: false,
        isWorking: false,
      });

      await updateDoc(doc(db, 'users', user.uid), {
        currentRoomID: deleteField(),
      });

      navigate(`/`);
    } catch (error) {
      console.error("部屋から退出できません:", error);
    }
  };

  // Hoverのための初期化
  useEffect(() => {
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    [...tooltipTriggerList].forEach((tooltipTriggerEl) => {
      new window.bootstrap.Tooltip(tooltipTriggerEl);
    });
  }, [members]);
  
  return (
    <div className="container py-4">
      <h2>部屋名: {roomData?.roomName ?? '読み込み中...'}</h2>
      <p>現在の人数: {roomData?.nowMembers ?? '読み込み中...'}</p>
      <hr />
      <h4>メンバー一覧</h4>
      <ul className="list-group mb-4">
        <li className="list-group-item list-group-item-action position-relative">
          <div className="row align-items-center">
            <div className="col-1 text-center">状態</div>
            <div className="col-2"><strong>ユーザー名</strong></div>
            <div className="col-4">内容</div>
            <div className="col-4">累計時間</div>
          </div>
        </li>

        {members.map((member) => (
          <li key={member.uid} className="list-group-item list-group-item-action position-relative">
            <div className="row align-items-center">
              <div
                className="col-1 text-center"
                data-bs-toggle="tooltip"
                title={member.isWorking ? '作業中' : '休憩中'}
              >
                {member.isWorking ? '🌞' : '🌙'}
              </div>
              <div className="col-2">
                <strong
                  onMouseEnter={() => setHoveredUserID(member.uid)}
                  onMouseLeave={() => setHoveredUserID(null)}
                  style={{ cursor: 'pointer' }}
                >
                  {member.userName}
                </strong>
                {hoveredUserID === member.uid && (
                  <div className="position-absolute bg-light border rounded shadow p-2" style={{ top: '100%', left: 0, zIndex: 10 }}>
                    <UserCard userID={member.uid} />
                  </div>
                )}
              </div>
              <div className="col-4">{member.workItem}</div>
              <div className="col-4">
                {(() => {
                  const total = member.totalTime ?? 0;
                  if (member.isWorking) {
                    const start = member.workStartTime?.toDate?.() ?? new Date();
                    const elapsed = Math.floor((now - start) / 1000);
                    return formatSecondsToHMS(total + elapsed);
                  } else {
                    return formatSecondsToHMS(total);
                  }
                })()}
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="mb-3">
        <label htmlFor="workItem" className="form-label">現在の作業内容</label>
        <input
          type="text"
          id="workItem"
          className="form-control"
          value={workItem}
          onChange={(e) => setworkItem(e.target.value)}
        />
      </div>

      <button className="btn btn-primary me-2" onClick={handleStartWorking}>作業開始</button>
      <button className="btn btn-secondary me-2" onClick={handleTakeBreak}>休憩</button>

      <hr />
      <button className="btn btn-danger" onClick={handleLeaveRoom}>部屋を退出</button>
    </div>
  );
}

export default Room;