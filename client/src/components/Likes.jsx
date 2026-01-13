import React from "react";
import { useParams } from "react-router-dom";

import BigList from "./BigList";
import User from "./User";

import "../style/userlist.css";


function Likes() {
    const id = useParams().id;

    return <div className="userlist"><BigList
        key={id}
        route={`likes/${id}`}
        map={ (v, i) => <User key={v._id} user={v} i={i} /> }
    /></div>
}


export default Likes;
