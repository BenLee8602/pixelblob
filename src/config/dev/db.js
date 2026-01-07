import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

import Post    from "../../models/post.js";
import Token   from "../../models/token.js";
import User    from "../../models/user.js";
import Comment from "../../models/comment.js";
import Follow  from "../../models/follow.js";
import Like    from "../../models/like.js";

import data from "./data.js";


var mongodb = null;

async function connect() {
    try {
        mongodb = await MongoMemoryServer.create();
        await mongoose.connect(mongodb.getUri());
        await resetData();
    } catch (err) {
        console.log("failed to start db:", err);
        process.exit(1);
    }
}

async function disconnect() {
    await mongoose.disconnect();
    await mongodb.stop();
    mongodb = null;
}


async function resetData() {
    await User.deleteMany({});
    await Token.deleteMany({});
    await Post.deleteMany({});
    await Comment.deleteMany({});
    await Follow.deleteMany({});
    await Like.deleteMany({});

    await User.insertMany(data.users);
    await Token.insertMany(data.tokens);
    await Post.insertMany(data.posts);
    await Comment.insertMany(data.comments);
    await Follow.insertMany(data.follows);
    await Like.insertMany(data.likes);
}


export default {
    connect,
    disconnect,
    resetData
};

