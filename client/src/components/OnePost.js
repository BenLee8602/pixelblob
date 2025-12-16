import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { BACKEND_API } from "../config.js"
import useCurrentUser from "./Auth";

import Post from "./Post";

function OnePost() {
    const [user] = useCurrentUser();
    const [post, setPost] = useState(null);
    
    const id = useParams().id;

    useEffect(() => { const fetchPost = async () => {
        try {
            const url = `${BACKEND_API}/posts/${id}`;
            const res = await fetch(url + (user ? `?cur=${user.id}` : ``));
            const body = await res.json();
            if (res.status !== 200) return console.log(body);
            setPost(body);
        } catch (err) { console.log(err); }
    }; fetchPost(); }, [id]);

    if (!post) return <></>
    return <Post data={post} />
}

export default OnePost;
