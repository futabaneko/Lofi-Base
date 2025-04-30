import React, { useEffect, useState } from 'react';
import { db } from './firebase';
import { collection, onSnapshot, query, orderBy, getDoc, doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import UserCard from './UserCard';

function RoomList({ user }) {
  const [rooms, setRooms] = useState([]);
  const [hoveredRoomID, setHoveredRoomID] = useState(null);
  const [userIDs, setUserIDs] = useState({}); // userIDを管理するためのstate
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

  const handleEnterRoom = async (roomId) => {
    try {
      const roomRef = doc(db, 'rooms', roomId);
      const roomDoc = await getDoc(roomRef);
      const nowMembers = roomDoc.data().nowMembers;
  
      if (nowMembers < roomDoc.data().maxMembers) {
        await updateDoc(roomRef, {
          nowMembers: nowMembers + 1,
        });
  
        // メンバー情報をサブコレクションに登録
        await setDoc(doc(db, 'rooms', roomId, 'members', user.uid), {
          isInRoom: true,
          isWorking: false,
          totalTime: 0,
          currentTask: "",
          joinedAt: serverTimestamp(),
        });

        await updateDoc(doc(db, 'users', user.uid), {
          currentRoomID: roomId
        });
  
        navigate(`/rooms/${roomId}`);
      } else {
        alert('この部屋は満員です。');
        
      }
    } catch (error) {
      console.error("部屋に参加できません:", error);
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
    </div>
  );
}

export default RoomList;