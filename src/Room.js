import React, { useEffect, useState } from 'react';
import { db } from './firebase';
import { doc, updateDoc, getDoc, getDocs, deleteField, collection, query, where, onSnapshot, increment, setDoc, deleteDoc } from 'firebase/firestore';
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

  // 部屋が存在しているか確認
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'rooms', roomID), (docSnap) => {
      if (!docSnap.exists()) {
        alert("この部屋は削除されました。");
        navigate('/');
      }
    });
    return () => unsubscribe();
  }, [roomID, navigate]);

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
      const memberRef = doc(db, 'rooms', roomID, 'members', user.uid);
      const memberSnap = await getDoc(memberRef);

      if (!memberSnap.exists()) {
        alert("ユーザー情報が見つかりませんでした。");
        return;
      }

      const memberData = memberSnap.data();

      if (!memberData.isWorking) {
        await updateDoc(memberRef, {
          isWorking: true,
          workItem: workItem,
          workStartTime: new Date(),
        });
      } else {
        alert("すでに作業中です。\n（内容を更新したい際は、一度休憩ボタンを押してから再実行してください。）");
      }

    } catch (error) {
      console.error("作業開始に失敗:", error);
      alert("作業開始中にエラーが発生しました。");
    }
  };


  // 休憩
  const handleTakeBreak = () => takeBreak(user.uid);

  const takeBreak = async (uid) => {
    try {
      const memberRef = doc(db, 'rooms', roomID, 'members', uid);
      const memberSnap = await getDoc(memberRef);
      const memberData = memberSnap.data();
  
      if (!memberData.isWorking) return;
  
      const startTime = memberData.workStartTime?.toDate?.() ?? new Date();
      const now = new Date();
      const elapsedSeconds = Math.floor((now - startTime) / 1000);
  
      await updateDoc(memberRef, {
        isWorking: false,
        workItem: "",
        workStartTime: deleteField(),
        totalTime: increment(elapsedSeconds),
      });
  
      await updateDoc(doc(db, 'users', uid), {
        totalTime: increment(elapsedSeconds),
      });
  
      const todayStr = now.toISOString().split('T')[0];
      const userDailyRef = doc(db, 'users', uid, 'dailyLogs', todayStr);
      await setDoc(userDailyRef, {
        totalTime: increment(elapsedSeconds),
      }, { merge: true });
  
    } catch (error) {
      console.error(`ユーザー ${uid} の休憩に失敗:`, error);
    }
  };

  // 退出
  const handleLeaveRoom = async () => {
    await leaveRoom(user.uid, roomID);
    navigate('/');
  };
  
  const leaveRoom = async (uid, roomID) => {
    try {
      const memberRef = doc(db, 'rooms', roomID, 'members', uid);
      const memberSnap = await getDoc(memberRef);
      const memberData = memberSnap.data();
  
      if (memberData.isWorking) {
        await takeBreak(uid);
      }
  
      await updateDoc(memberRef, {
        isInRoom: false,
        isWorking: false,
      });
  
      await updateDoc(doc(db, 'users', uid), {
        currentRoomID: deleteField(),
      });
  
      const roomRef = doc(db, 'rooms', roomID);
      const roomSnap = await getDoc(roomRef);

      if (!roomSnap.exists()) {
        console.warn(`部屋 ${roomID} が存在しません（すでに削除された可能性があります）`);
        return;
      }

      const nowMembers = roomSnap.data().nowMembers ?? 1;
      
      await updateDoc(roomRef, {
        nowMembers: nowMembers > 0 ? nowMembers - 1 : 0,
      });
      
  
      await updateDoc(roomRef, {
        nowMembers: nowMembers > 0 ? nowMembers - 1 : 0,
      });
  
    } catch (error) {
      console.error(`ユーザー ${uid} の退出処理に失敗:`, error);
    }
  };
  

  // 部屋削除処理
  const handleDeleteRoom = async () => {
    if (roomData?.creatorID === user.uid) {
      
      try {
        // 参加している全ユーザーを退出処理
        const membersRef = collection(db, 'rooms', roomID, 'members');
        const membersSnapshot = await getDocs(membersRef);

        // 退出処理をPromise.allで待機
        const leavePromises = membersSnapshot.docs.map(async (docSnap) => {
          const memberID = docSnap.id;
          await leaveRoom(memberID, roomID);
          navigate('/');
        });

        await Promise.all(leavePromises);

        // データの削除
        await deleteDoc(doc(db, 'rooms', roomID));

        membersSnapshot.docs.map((docSnap) => {
          return deleteDoc(doc(db, 'rooms', roomID, 'members', docSnap.id));
        });

        navigate('/');
        
      } catch (error) {
        console.error("部屋削除に失敗:", error);
      }
    } else {
      alert("部屋を削除する権限がありません。");
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
      <h2>{roomData?.roomName ?? '読み込み中...'}</h2>

      <label>
        {!roomData?.isPrivate && <span className="ms-2 badge bg-success">🔓 公開</span>}
        {roomData?.isPrivate && <span className="ms-2 badge bg-secondary">🔒 秘密基地</span>}
      </label>

      <p>人数: {roomData?.nowMembers ?? '読み込み中...'} / {roomData?.maxMembers ?? '読み込み中...'}</p>
      <small>作成者ID: {roomData?.creatorID ?? '読み込み中...'} / 部屋ID: {roomID ?? '読み込み中...'}</small>
      <hr />


      <div className="my-4 p-4 bg-light rounded shadow text-center">
        <div className="display-4 fw-bold mb-2" style={{ fontSize: '3rem' }}>
          {
            (() => {
              const member = members.find(m => m.uid === user.uid);
              if (!member) return '---';
              const total = member.totalTime ?? 0;
              if (member.isWorking) {
                const start = member.workStartTime?.toDate?.() ?? new Date();
                const elapsed = Math.floor((now - start) / 1000);
                return formatSecondsToHMS(total + elapsed);
              } else {
                return formatSecondsToHMS(total);
              }
            })()
          }
        </div>

        <div className="mb-3">
          <input
            type="text"
            className="form-control text-center"
            placeholder="作業内容を入力"
            value={workItem}
            onChange={(e) => setworkItem(e.target.value)}
          />
        </div>

        <div>
          <button className="btn btn-primary me-2" onClick={handleStartWorking}>作業開始</button>
          <button className="btn btn-secondary" onClick={handleTakeBreak}>休憩</button>
        </div>
      </div>
      
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

      <hr />
      <button className="btn btn-danger" onClick={handleLeaveRoom}>部屋を退出</button>

      {roomData?.creatorID === user.uid && (
        <button className="btn btn-danger mx-2" onClick={handleDeleteRoom}>部屋を削除</button>
      )}
    </div>
  );
}

export default Room;