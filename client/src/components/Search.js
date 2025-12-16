import React, { useState } from "react";
import { Link } from "react-router-dom";

import { BACKEND_API } from "../config.js";

import BigList from "./BigList";
import User from "./User";

import "../style/Search.css";
import "../style/userlist.css";
import "../style/postlist.css";


function Search() {
    const [input, setInput] = useState("");
    const [query, setQuery] = useState("");
    const [view, setView] = useState("users");


    const handleSearch = () => {
        if (input === "") return;
        setQuery(input);
    };


    return (<div className="search">
        <button
            onClick={ () => setView("users") }
            className="search-switch"
            id={ view === "users" ? "search-switch-active" : "" }
        >users</button>
        <button
            onClick={ () => setView("posts") }
            className="search-switch search-switch-right"
            id={ view === "posts" ? "search-switch-active" : "" }
        >posts</button>

        <div className="search-body">
            <input
                type="text"
                placeholder={`search ${view}`}
                onChange={ e => setInput(e.target.value) }
                className="search-bar"
            />
            <button onClick={ handleSearch } className="search-button">search</button>
        </div>

        <div className="search-spacer"></div>

        { query && view === "users" ? <div className="userlist"><BigList
            key={query}
            route={`users/search/${query}`}
            map={ (v, i) => <User key={v._id} user={v} i={i} /> }
        /></div> : <></> }

        { query && view === "posts" ? <div className="postlist"><BigList
            key={query}
            route={`posts/search/${query}`}
            map={ v => <Link key={v._id} to={`/posts/${v._id}`} className="postlist-item">
                <img src={v.image} alt="post" className="postlist-image" />
            </Link> }
        /></div> : <></> }
    </div>);
}


export default Search;
