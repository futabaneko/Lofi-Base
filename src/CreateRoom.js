import React, { useState } from 'react';
import { db } from './firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

function CreateRoom({ user }) {

    const [roomName, setRoomName] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);
    const [maxMembers, setMaxMembers] = useState(8); // 最大人数（初期値は8人）
    const [password, setPassword] = useState('');

    const navigate = useNavigate();

    const getUserInfo = async (uid) => {
        const userDocRef = doc(db, 'users', uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
            return userDocSnap.data();
        } else {
            console.log("ユーザーが見つかりません");
            return null;
        }
    };

    const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) return;

        try {
            const userInfo = await getUserInfo(user.uid);

            if (isPrivate && password === '') {
                console.log("パスワードを設定して下さい");
                return;
            }

            if (userInfo) {
                await addDoc(collection(db, 'rooms'), {
                    roomName,
                    isPrivate,
                    maxMembers,
                    nowMembers: 0,
                    creatorID: user.uid,
                    createdAt: serverTimestamp(),
                    password: isPrivate ? password : ''
                });
                  
            // 自分を参加させる場合の処理（参考！）
            // await setDoc(doc(db, 'rooms', roomRef.id, 'participants', user.uid), {
            //     userID: userInfo.userID,
            //     userName: userInfo.userName,
            //     photoURL: userInfo.photoURL,
            //     lastJoinedAt: serverTimestamp(),
            //     totalTime: 0,
            //     isActive: true,
            //   });

            navigate('/');
            }

        } catch (error) {
            console.error("部屋作成エラー:", error);
        }
    };


    if (!user) {
        return <p>ログインしていません。部屋を作成するにはログインが必要です。</p>;
    }
    return (
        <div className="container py-4" style={{ maxWidth: 500 }}>
            <h2 className="mb-4">新しい部屋を作成</h2>
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label htmlFor="roomName" className="form-label">部屋の名前</label>
                    <input
                        type="text"
                        className="form-control"
                        id="roomName"
                        value={roomName}
                        onChange={(e) => setRoomName(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>最大人数</label>
                    <input
                        type="number"
                        min="1"
                        value={maxMembers}
                        onChange={(e) => setMaxMembers(Number(e.target.value))}
                    />
                </div>
                <div className="form-check mb-3">
                    <input
                        className="form-check-input"
                        type="checkbox"
                        id="privateRoom"
                        checked={isPrivate}
                        onChange={(e) => setIsPrivate(e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="privateRoom">
                        秘密基地にする
                    </label>
                </div>
                {isPrivate && (
                <div className="mb-3">
                    <label htmlFor="roomPassword" className="form-label">入室パスワード</label>
                    <input
                    type="password"
                    className="form-control"
                    id="roomPassword"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required={isPrivate}
                    />
                </div>
                )}
                <button type="submit" className="btn btn-primary w-100">作成</button>
            </form>
        </div>
    );
}

export default CreateRoom;