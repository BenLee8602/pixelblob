import React from "react";
import { Link } from "react-router-dom";
import "../style/userlist.css";

function User({ user, i }) {
    return <>
        { i !== 0 ? <hr/> : <></> }
        <Link to={`/users/${user.name}`} className="userlist-item">
            <img src={ user.pfp ? user.pfp : "/icons/user.png" } alt="pfp" className="userlist-item-img" />
            <div className="userlist-item-text">
                <span className="userlist-item-nick">{ user.nick ? user.nick : user.name }</span>{' '}
                <span className="userlist-item-name">{ user.name }</span>
            </div>
        </Link>
    </>
};

export default User;
