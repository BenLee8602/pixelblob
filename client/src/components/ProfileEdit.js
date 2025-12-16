import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { BACKEND_API } from "../config.js"
import useCurrentUser from "./Auth";

import "../style/content.css";
import "../style/Login.css";


function ProfileEdit() {
    const Navigate = useNavigate();
    const [user, setUser] = useCurrentUser();
    const [deleting, setDeleting] = useState(false);

    const [pfp, setPfp] = useState("");
    const [nick, setNick] = useState("");
    const [bio, setBio] = useState("");


    useEffect(() => { const fetchProfile = async () => {
        try {
            const res = await fetch(`${BACKEND_API}/users/${user.name}/profile`);
            const body = await res.json();
            if (res.status !== 200) return console.log(body);
            setPfp(body.pfp);
            setNick(body.nick);
            setBio(body.bio);
        } catch (err) { console.log(err); }
    }; fetchProfile() }, []);


    const handleSubmit = () => {
        const formData = new FormData();
        formData.append("image", pfp);
        formData.append("nick", nick);
        formData.append("bio", bio);
        
        const req = {
            method: "PUT",
            headers: {
                "Authorization": "Bearer " + localStorage.getItem("accessToken")
            },
            body: formData
        };

        fetch(`${BACKEND_API}/users/profile`, req)
        .then(res => res.json().then(body => ({ status: res.status, body })))
        .then(res => res.status === 200 ? Navigate(`/users/${user.name}`) : console.log(res.body))
        .catch(err => console.log(err));
    };


    const handleDelete = async () => {
        if (deleting !== user.name) return;

        const req = {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + localStorage.getItem("accessToken")
            }
        };

        fetch(`${BACKEND_API}/users/profile`, req)
        .then(res => res.json().then(body => ({ status: res.status, body })))
        .then(res => {
            if (res.status !== 200) return console.log(res.body);
            setUser(null);
            localStorage.removeItem("user");
            localStorage.removeItem("token");
            Navigate("/login");
        })
        .catch(err => console.log(err));
    };


    return (<div className="content" id="login">
        <input
            type="file"
            name="image"
            onChange={ e => setPfp(e.target.files ? e.target.files[0] : null) }
        /><br/>
        <input
            type="text"
            placeholder="nickname"
            value={ nick }
            onChange={ e => setNick(e.target.value) }
        /><br/>
        <textarea
            placeholder="bio"
            value={ bio }
            onChange={ e => setBio(e.target.value) }
        /><br/>
        <button onClick={ handleSubmit }>submit</button><br/><br/>

        { deleting !== false ? <>
            <span>deleting your account removes all your posts, comments, etc. it cannot be undone!</span>
            <input type="text" placeholder="enter username to confirm" onChange={ e => setDeleting(e.target.value) } />
            <button onClick={ () => setDeleting(false) }>cancel</button>
            <button onClick={handleDelete}>confirm</button>
        </> : <button onClick={ () => setDeleting("") }>delete account</button> }
    </div>);
}

export default ProfileEdit;
