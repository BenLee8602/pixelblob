import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import moment from "moment";

import { BACKEND_API } from "../config.js"
import useCurrentUser from "./Auth";

import BigList from "./BigList";

import "../style/Comment.css";
import "../style/Reply.css";


function Comment({ data, showReplies }) {
    const [user] = useCurrentUser();
    const [comment, setComment] = useState(null);
    const [replies, setReplies] = useState([]);
    const [view, setView] = useState("default");
    const [input, setInput] = useState("");

    useEffect(() => setComment({ ...data }), [data]);


    const handleLike = async () => {
        const req = {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + localStorage.getItem("accessToken")
            }
        };
        
        try {
            const res = await fetch(`${BACKEND_API}/likes/comment/${comment._id}`, req);
            const body = await res.json();
            if (res.status === 200) return setComment(prev => ({
                ...prev,
                liked: false,
                likeCount: prev.likeCount - 1
            }));
            if (res.status === 201) return setComment(prev => ({
                ...prev,
                liked: true,
                likeCount: prev.likeCount + 1
            }));
            console.log(body);
        } catch (err) { console.log(err); }
    };


    const handleReply = () => {
        const req = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + localStorage.getItem("accessToken")
            },
            body: JSON.stringify({ text: input })
        };

        fetch(`${BACKEND_API}/comments/comment/${comment._id}`, req)
        .then(res => res.json().then(body => ({ status: res.status, body })))
        .then(res => res.status === 200 ? setReplies([res.body, ...replies]) : console.log(res.body))
        .catch(err => console.log(err));
    };


    const handleEdit = async () => {
        const req = {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + localStorage.getItem("accessToken")
            },
            body: JSON.stringify({ text: input })
        };

        fetch(`${BACKEND_API}/comments/${comment._id}`, req)
        .then(res => res.json().then(body => ({ status: res.status, body })))
        .then(res => res.status === 200 ? setComment({ ...comment, text: input }) : console.log(res.body))
        .catch(err => console.log(err));

        setView("default");
    };


    const handleDelete = () => {
        if (input !== user.name) return;

        const req = {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + localStorage.getItem("accessToken")
            }
        };

        fetch(`${BACKEND_API}/comments/${comment._id}`, req)
        .then(res => res.json().then(body => ({ status: res.status, body })))
        .then(res => res.status === 200 ? setComment(null) : console.log(res.body))
        .catch(err => console.log(err));
    };


    if (!comment) return (<></>);

    return (<div className={ showReplies ? "comment" : "reply" }>
        <div className="comment-body">
            <Link to={`/users/${comment.author.name}`} className="comment-author">
                <img
                    src={ comment.author.pfp ? comment.author.pfp : "/icons/user.png" }
                    alt="pfp"
                    className="comment-author-pfp"
                />
                <div className="comment-info">
                    <p className="comment-author-nick">
                        { comment.author.nick ? comment.author.nick : comment.author.name }
                    </p>
                    <p className="comment-author-name">
                        { comment.author.name }
                        {` - ${moment(comment.posted).fromNow()}`}
                    </p>
                </div>
            </Link>
            <p className="comment-text">{ comment.text }</p>
        </div>

        { view === "default" ? <div className="comment-actions">
            <Link to={`/likes/${comment._id}`} className="comment-likes-count">{ comment.likeCount }</Link>
            <button onClick={handleLike} className={ comment.liked ? "comment-action-active" : "" }>
                <img src={ comment.liked ? "/icons/unlike.png" : "/icons/like.png" } alt="like" />
            </button>
            { showReplies ? <button onClick={ () => setView("reply") }><img src="/icons/comment.png" alt="comment" /></button> : <></> }
            { user && user.id === comment.author._id ? <>
                <button onClick={ () => setView("edit") }><img src="/icons/edit.png" alt="edit" /></button>
                <button onClick={ () => setView("delete") }><img src="/icons/delete.png" alt="delete" /></button>
            </> : <></> }
        </div> : <></> }
        { view === "reply" ? <>
            <div className="comment-actions">
                <input type="text" placeholder="new reply" onChange={ e => setInput(e.target.value) } />
                <button onClick={ () => setView("default") || setReplies([]) }>✕</button>
                <button onClick={handleReply}>✓</button>
            </div>
            <div className="comment-replies">
                { replies ? <>{ replies.map(v => <Comment key={v._id} data={v} />) }</> : <></> }
                <BigList
                    route={`comments/${comment._id}`}
                    map={ v => <Comment key={v._id} data={v} /> }
                />
            </div>
        </> : <></> }
        { view === "edit" ? <div className="comment-actions">
            <input type="text" placeholder="new comment text" onChange={ e => setInput(e.target.value) } />
            <button onClick={ () => setView("default") }>✕</button>
            <button onClick={handleEdit}>✓</button>
        </div> : <></> }
        { view === "delete" ? <div className="comment-actions">
            <input type="text" placeholder="enter username to confirm" onChange={ e => setInput(e.target.value) } />
            <button onClick={ () => setView("default") }>✕</button>
            <button onClick={handleDelete}>✓</button>
        </div> : <></> }
    </div>);
}

export default Comment;


