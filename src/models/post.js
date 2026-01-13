import mongoose from "mongoose";
const Schema = mongoose.Schema;

const PostSchema = new Schema({
    author: {
        type: mongoose.Types.ObjectId,
        required: true,
        immutable: true
    },
    posted: {
        type: Date,
        required: true,
        immutable: true,
        default: () => Date.now()
    },
    image: {
        type: String,
        required: true,
        immutable: true
    },
    caption: {
        type: String,
        required: true
    },
    likeCount: {
        type: Number,
        default: 0
    },
    commentCount: {
        type: Number,
        default: 0
    }
});

export default mongoose.model("post", PostSchema, "posts");

