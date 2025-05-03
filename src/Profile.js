import React from 'react';
import { useParams } from 'react-router-dom';
import UserCard from './UserCard';

function Profile({}) {
    const { id: uid } = useParams();
    
    return (
        <div class="page">
            <UserCard userID={uid} />
        </div>
    )
};
export default Profile;