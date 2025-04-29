import React from 'react';
import { db } from './firebase';
import { doc, updateDoc, getDoc, deleteField } from 'firebase/firestore';
import { useParams, useNavigate } from 'react-router-dom';

function Room({ roomid, user }) {
  const navigate = useNavigate();
  const { id: roomID } = useParams();
  const handleLeaveRoom = async () => {
    
    try {
      const roomRef = doc(db, 'rooms', roomID);
      const roomDoc = await getDoc(roomRef);
      const nowMembers = roomDoc.data().nowMembers;
  
      await updateDoc(roomRef, {
        nowMembers: nowMembers - 1,
      });
  
      // サブコレクションの状態更新（退出）
      await updateDoc(doc(db, 'rooms', roomID, 'members', user.uid), {
        isInRoom: false,
        isWorking: false
      });

      await updateDoc(doc(db, 'users', user.uid), {
        currentRoomID: deleteField()
      });
  
      navigate(`/`);
    } catch (error) {
      console.error("部屋から退出できません:", error);
    }
  };
  
  return (
    <div className="container py-4">
      <h2>部屋名 {roomID} </h2>
      <button className="btn btn-danger" onClick={handleLeaveRoom}>部屋を退出</button>
    </div>
  );
}

export default Room;
