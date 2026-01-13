import React from "react";
import { Link } from "react-router-dom";

import { BACKEND_API } from "../config.js"
import useCurrentUser from "./Auth";

import "../style/NavigationBar.css";

function NavigationBar() {
    const [user, setUser] = useCurrentUser();


    const logout = () => {
        const req = {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken: localStorage.getItem("refreshToken") })
        };

        fetch(`${BACKEND_API}/users/logout`, req)
        .then(res => res.json().then(body => ({ status: res.status, body })))
        .then(res => { if (res.status !== 200) console.log(res.body); })
        .catch(err => console.log(err));

        setUser(null);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
    };


    return (<>
    <div id="navspacer"></div>
        <nav>
            <ul>
                <li><Link to="/" id="title" className="navitem"><h1>pixelblob</h1></Link></li>
                <li><Link to={ user ? `/users/${user.name}` : "/login" } className="navitem">profile</Link></li>
                <li><Link to="/search" className="navitem">search</Link></li>
                <li><Link to="/new-post" className="navitem">new</Link></li>
                { user ? <>
                    <li style={{float:"right"}}><Link to="/login" onClick={ logout } className="navitem">logout</Link></li>
                </> : <>
                    <li style={{float:"right"}}><Link to="/register" className="navitem">register</Link></li>
                    <li style={{float:"right"}}><Link to="/login" className="navitem">login</Link></li>
                </> }
            </ul>
        </nav>
    </>);
}

export default NavigationBar;
