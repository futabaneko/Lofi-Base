import React, { useEffect, useState } from 'react';
import { db } from './firebase';
import { collection, onSnapshot, query, orderBy, getDoc, doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import UserCard from './UserCard';

function RoomList({ user }) {
  const [rooms, setRooms] = useState([]);
  const [hoveredRoomID, setHoveredRoomID] = useState(null);
  const [userIDs, setUserIDs] = useState({});
  const [targetRoom, setTargetRoom] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(collection(db, 'rooms'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedRooms = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      setRooms(fetchedRooms);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // ホバーされたユーザーIDのuserIDを取得
    const fetchUserInfo = async () => {
      for (const room of rooms) {
        const userDocRef = doc(db, 'users', room.creatorID);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setUserIDs((prev) => ({
            ...prev,
            [room.creatorID]: userDocSnap.data().userID
          }));
        }
      }
    };
    
    fetchUserInfo();
  }, [rooms]);

  // 入室処理(Private?)
  const handleEnterRoom = async (roomId) => {
    try {
      const roomRef = doc(db, 'rooms', roomId);
      const roomDoc = await getDoc(roomRef);
      const roomData = roomDoc.data();
  
      if (roomData.isPrivate) {
        setTargetRoom({ ...roomData, id: roomId });
        setPasswordInput('');
        setShowPasswordModal(true);
        return;
      }
  
      await enterRoom(roomDoc, roomId);
  
    } catch (error) {
      console.error("部屋に参加できません:", error);
    }
  };

// 入室処理・本体
const enterRoom = async (roomDoc, roomId) => {
  const nowMembers = roomDoc.data().nowMembers;

  if (nowMembers >= roomDoc.data().maxMembers) {
    alert('この部屋は満員です。');
    return;
  }

  // 部屋の現在のメンバー数を更新
  await updateDoc(doc(db, 'rooms', roomId), {
    nowMembers: nowMembers + 1,
  });

  // ユーザーが既に部屋に入っているかどうか確認
  const userDocRef = doc(db, 'rooms', roomId, 'members', user.uid);
  const userDoc = await getDoc(userDocRef);
  
  // 2回目以降
  if (userDoc.exists()) {
    await updateDoc(userDocRef, {
      isInRoom: true,
      isWorking: false,
      joinedAt: serverTimestamp(),
    });

  // 初回
  } else {
    await setDoc(userDocRef, {
      isInRoom: true,
      isWorking: false,
      totalTime: 0,
      currentTask: '',
      joinedAt: serverTimestamp(),
    });
  }

  // ユーザーの現在の部屋情報を更新
  await updateDoc(doc(db, 'users', user.uid), {
    currentRoomID: roomId,
  });

  // 部屋ページに遷移
  navigate(`/rooms/${roomId}`);
};
  
  // パスワード確認
  const handlePasswordSubmit = async () => {
    if (!targetRoom) return;

    if (passwordInput !== targetRoom.password) {
      alert('パスワードが間違っています。');
      return;
    }

    try {
      const roomRef = doc(db, 'rooms', targetRoom.id);
      const roomDoc = await getDoc(roomRef);
      await enterRoom(roomDoc, targetRoom.id);
      setShowPasswordModal(false);
    } catch (err) {
      console.error('入室失敗:', err);
    }
  };

  return (
    <div className="container py-4">
      <h2 className="mb-4">部屋一覧</h2>
      <div className="list-group">
        {rooms.length === 0 && (
          <div className="text-muted">まだ部屋がありません。</div>
        )}

        {rooms.length !== 0 && (
          <button className="list-group-item list-group-item-action">
            <div className="d-flex align-items-center">
              <div className="col-4">
                <strong>部屋名</strong>
              </div>
              <div className="col-2">
                <strong>公開設定</strong>
              </div>
              <div className="col-2">
                <strong>参加人数/人数上限</strong>
              </div>
              <div className="col-2">
                <strong>作成者</strong>
              </div>
              <small>作成日時</small>
            </div>
          </button>
        )}

        {rooms.map((room) => (
          <button
            key={room.id}
            className="list-group-item list-group-item-action"
            onClick={() => handleEnterRoom(room.id)}
          >
            <div className="d-flex align-items-center">
              <div className="col-4">
                <strong>{room.roomName}</strong>
              </div>

              <div className="col-2">
                {!room.isPrivate && <span className="ms-2 badge bg-success">🔓 公開</span>}
                {room.isPrivate && <span className="ms-2 badge bg-secondary">🔒 秘密基地</span>}
              </div>

              <div className="col-2">
                <strong>
                  {room.nowMembers}/{room.maxMembers}
                </strong>
              </div>

              <div className="col-2">
                <strong
                  onMouseEnter={() => setHoveredRoomID(room.id)}
                  onMouseLeave={() => setHoveredRoomID(null)}
                >
                  @{userIDs[room.creatorID] || room.creatorID}
                </strong>
              </div>

              <small>{new Date(room.createdAt?.toDate?.()).toLocaleString()}</small>
            </div>

            {hoveredRoomID === room.id && (
              <div className="position-absolute" style={{ top: '10px', right: '10px', zIndex: 10 }}>
                <UserCard userID={room.creatorID} />
              </div>
            )}
          </button>
        ))}
      </div>
      <div>
        <h2>部屋リスト</h2>
        <Link to="/create-room" className="btn btn-outline-primary">
          ＋ 新しい部屋を作成
        </Link>
      </div>
      {targetRoom && (
        <div className={`modal ${showPasswordModal ? 'd-block' : ''}`} tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">パスワード入力</h5>
                <button type="button" className="btn-close" onClick={() => setShowPasswordModal(false)}></button>
              </div>
              <div className="modal-body">
                <p>「{targetRoom.roomName}」は秘密基地です。パスワードを入力してください。</p>
                <input
                  type="password"
                  className="form-control"
                  placeholder="パスワード"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                />
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowPasswordModal(false)}>キャンセル</button>
                <button className="btn btn-primary" onClick={handlePasswordSubmit}>入室する</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RoomList;