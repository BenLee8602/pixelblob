import mongoose from "mongoose";
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        immutable: true
    },
    pass: {
        type: String,
        required: true
    },
    pfp: {
        type: String,
        default: ""
    },
    nick: {
        type: String,
        default: ""
    },
    bio: {
        type: String,
        default: ""
    },
    postCount: {
        type: Number,
        default: 0
    },
    followerCount: {
        type: Number,
        default: 0
    },
    followingCount: {
        type: Number,
        default: 0
    }
});

export default mongoose.model("user", UserSchema, "users");

