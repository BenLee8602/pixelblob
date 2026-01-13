import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { BACKEND_API } from "../config.js"
import useCurrentUser from "./Auth";

import "../style/content.css";
import "../style/Login.css";


function Login() {
    const Navigate = useNavigate();
    const setUser = useCurrentUser()[1];
    const [curName, setCurName] = useState("");
    const [curPass, setCurPass] = useState("");
    const [errMsg, setErrMsg] = useState("");

    const handleLogin = async () => {
        const req = {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: curName, pass: curPass })
        };

        try {
            const res = await fetch(`${BACKEND_API}/users/login`, req);
            const body = await res.json();
            if (res.status !== 200) return setErrMsg(body);
            localStorage.setItem("refreshToken", body.refreshToken);
            localStorage.setItem("accessToken",  body.accessToken);
            setUser(body.user);
            Navigate("/");
        } catch (err) { console.log(err); }
    };

    return (<div id="login" className="content">
        <h1>login</h1>
        <input type="text" placeholder="username" onChange={ e => setCurName(e.target.value) } /><br/>
        <input type="password" placeholder="password" onChange={ e => setCurPass(e.target.value) } /><br/>
        <p>{ errMsg }</p>
        <button onClick={ handleLogin }>Submit</button>
    </div>);
}


export default Login;
