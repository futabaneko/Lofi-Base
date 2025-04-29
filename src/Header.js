// Header.js
import React from 'react';
import './App.css';

function Header({ user, profile }) {
    console.log(profile)
    return (
        <nav className="navbar bg-dark border-bottom border-bottom-dark" data-bs-theme="dark">
            <div className="container-fluid px-3 my-2 d-flex justify-content-between align-items-center">
                <label className="navbar-brand">Lo-fi Base β</label>

                {user && profile && (
                    <div className="dropdown d-flex align-items-center gap-2">
                        <div className="text-end px-2" style={{ color: 'white', fontSize: 14 }}>
                            <div>{profile.userName}</div>
                            <div>@{profile.userID}</div>
                        </div>
                        <img
                            src={profile.photoURL}
                            alt="User Avatar"
                            className="rounded-circle"
                            width="40"
                            height="40"
                            role="button"
                            id="dropdownMenuButton"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                        />
                        <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="dropdownMenuButton">
                            <li><a className="dropdown-item" href="#settings">ユーザー設定</a></li>
                        </ul>
                    </div>
                    
                )}
            </div>
        </nav>
    );
}

export default Header;
