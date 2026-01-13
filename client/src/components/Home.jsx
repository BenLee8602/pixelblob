import React from "react";
import BigList from "./BigList";
import Post from "./Post";

function Home() {
    return <BigList
        route="posts"
        map={ v => <Post key={v._id} data={v} /> }
    />
}

export default Home;
