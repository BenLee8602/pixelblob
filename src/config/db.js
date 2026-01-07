import mongoose from "mongoose";

import posts from "../models/post.js";
import tokens from "../models/token.js";
import users from "../models/user.js";
import comments from "../models/comment.js";
import follows from "../models/follow.js";
import likes from "../models/like.js";
const schemas = { posts, tokens, users, comments, follows, likes };

import isProd from "./isProd.js";
import dbProd from "./prod/db.js";
import dbDev from "./dev/db.js";
const db = isProd ? dbProd : dbDev;

export default {
    ...db,
    ...schemas,
    pageSize: 16,
    objectId: id => new mongoose.Types.ObjectId(id)
};

