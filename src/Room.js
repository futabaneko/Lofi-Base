import React from 'react';
import { db } from './firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { useParams, useNavigate } from 'react-router-dom';

function Room() {
  const { roomID } = useParams();
  const navigate = useNavigate();
  const user = {};

  const handleLeaveRoom = async () => {
    try {
      const roomRef = doc(db, 'rooms', roomID);
  
        const roomDoc = await getDoc(roomRef);
        const nowMembers = roomDoc.data().nowMembers;

        // 部屋からユーザーを削除
        await updateDoc(roomRef, {
          nowMembers: nowMembers - 1, // 参加人数を増加
        });

        // 
        await updateDoc(doc(db, 'rooms', roomRef.id, 'participants', user.uid), {
            isActive: false,
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
