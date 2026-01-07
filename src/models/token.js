import mongoose from "mongoose";
const Schema = mongoose.Schema;

const TokenSchema = new Schema({
    token: {
        type: String,
        required: true,
        unique: true,
        immutable: true
    }
});

export default mongoose.model("token", TokenSchema, "tokens");

