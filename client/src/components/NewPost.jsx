import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import useCurrentUser from "./Auth";

import { BACKEND_API } from "../config.js"

import "../style/content.css";
import "../style/Login.css";

function NewPost() {
    const Navigate = useNavigate();
    const [user] = useCurrentUser();
    const [image, setImage] = useState();
    const [caption, setCaption] = useState("");

    const handleSubmit = () => {
        const formData = new FormData();
        formData.append("image", image);
        formData.append("caption", caption);

        const req = {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + localStorage.getItem("accessToken")
            },
            body: formData
        };

        fetch(`${BACKEND_API}/posts`, req)
        .then(res => res.json().then(body => ({ status: res.status, body })))
        .then(res => res.status === 200 ? Navigate(`/users/${user.name}`) : console.log(res.body))
        .catch(err => console.log(err));
    };

    return (<div id="login" className="content">
        <h1>new post</h1>
        <input type="file" name="image" onChange={ e => setImage(e.target.files ? e.target.files[0] : null) } />
        <input type="text" placeholder="caption" onChange={ e => setCaption(e.target.value) } />
        <button onClick={ handleSubmit }>Submit</button>
    </div>);
}

export default NewPost;
