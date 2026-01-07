import express from "express";

import bcrypt from "bcrypt";

import multer from "multer";
const storage = multer.memoryStorage();
const upload = multer({ storage });

import auth from "../config/auth.js";
import db from "../config/db.js";
import img from "../config/img.js";

import { requireLogin } from "../middlewares/auth.js";
import { getPageInfo } from "../middlewares/page.js";


const router = express.Router();


// register new user
router.post("/register", async (req, res) => {
    const name = req.body.name;
    const pass = req.body.pass;
    if (!name || !pass) return res.status(400).json("missing username or password");

    try {
        const doc = await db.users.findOne({
            name: { $regex: `^${name}$`, $options: "i" }
        });
        if (doc) return res.status(409).json("username is taken");

        const salt = await bcrypt.genSalt();
        const hash = await bcrypt.hash(pass, salt);
        
        const user = await db.users.create({ name, pass: hash });
        const id = user._id.toString();

        const refreshToken = auth.createRefreshToken(id, name);
        const accessToken = auth.createAccessToken(id, name);

        await db.tokens.create({ token: refreshToken });
        res.status(200).json({ refreshToken, accessToken, user: { id, name } });
    } catch (err) {
        console.log(err);
        res.status(500).json(err);
    }
});


// login as user
router.post("/login", async (req, res) => {
    const name = req.body.name;
    const pass = req.body.pass;
    if (!name || !pass) return res.status(400).json("missing username or password");

    try {
        const user = await db.users.findOne({ name: name });
        if (!user) return res.status(404).json(`user ${name} not found`);
        if (!await bcrypt.compare(pass, user.pass)) return res.status(401).json("incorrect password");

        const id = user._id.toString();
        const refreshToken = auth.createRefreshToken(id, name);
        const accessToken = auth.createAccessToken(id, name);

        await db.tokens.create({ token: refreshToken });
        res.status(200).json({ refreshToken, accessToken, user: { id, name } });
    } catch (err) {
        console.log(err);
        res.status(500).json(err);
    }
});


// get new access token
router.post("/refresh", async (req, res) => {
    const refreshToken = req.body.refreshToken;
    if (!refreshToken) return res.status(400).json("missing refresh token");
    try {
        const user = auth.verifyRefreshToken(refreshToken);
        if (!user) return res.status(401).json("invalid refresh token");
        if (!await db.tokens.findOne({ token: refreshToken }))
            return res.status(401).json("old refresh token");
        res.status(200).json({
            accessToken: auth.createAccessToken(user.id, user.name),
            user: { id: user.id, name: user.name }
        });
    } catch (err) {
        console.log(err);
        res.status(500).json(err);
    }
});


// logout user
router.delete("/logout", async (req, res) => {
    const refreshToken = req.body.refreshToken;
    if (!refreshToken) return res.status(400).json("missing refresh token");
    try {
        const deleted = await db.tokens.findOneAndDelete({ token: refreshToken });
        if (!deleted) return res.status(404).json("token not found");
        res.status(200).json("logged out");
    } catch (err) {
        console.log(err);
        res.status(500).json(err);
    }
});


// search users
router.get("/search/:query", getPageInfo, async (req, res) => {
    try {
        const users = await db.users.find({
            name: { $regex: req.params.query, $options: "i" }
        }, "-pass", {
            skip: db.pageSize * req.page.number,
            limit: db.pageSize
        });
        for (let i = 0; i < users.length; ++i)
            users[i].pfp = await img.getImage(users[i].pfp);
        res.status(200).json(users);
    } catch (err) {
        console.log(err);
        res.status(500).json(err);
    }
});


// get the given user's profile data
router.get("/:name/profile", async (req, res) => {
    try {
        const user = await db.users.findOne(
            { name: req.params.name },
            "-pass"
        ).lean();
        if (!user) return res.status(404).json("user not found");
        user.pfp = await img.getImage(user.pfp);
        if (!req.query.cur) return res.status(200).json(user);
        
        const following = await db.follows.findOne({
            follower: req.query.cur,
            following: user._id
        });
        res.status(200).json({ ...user, following: !!following });
    } catch (err) {
        if (err.name === "CastError")
            return res.status(400).json("invalid user id");
        console.log(err);
        res.status(500).json(err);
    }
});


// edit the logged in user's profile
router.put("/profile", requireLogin, upload.single("image"), async (req, res) => {
    const nick = req.body.nick || "";
    const bio = req.body.bio || "";

    try {
        const user = await db.users.findByIdAndUpdate(
            req.user.id,
            { nick, bio },
            {
                fields: { "_id": 0, "pass": 0, "__v": 0 },
                new: true
            }
        );

        if (!req.file) return res.status(200).json(user);
        if (!user.pfp) {
            user.pfp = img.generateImageName();
            await db.users.findByIdAndUpdate(
                req.user.id,
                { pfp: user.pfp }
            );
        }
        await img.putImage(user.pfp, req.file.buffer, req.file.mimetype);

        user.pfp = img.getImage(user.pfp);
        res.status(200).json(user);
    } catch (err) {
        console.log(err);
        res.status(500).json(err);
    }
});


// delete the logged in user
router.delete("/profile", requireLogin, async (req, res) => {
    try {
        // delete images from s3
        const posts = await db.posts.find({ author: req.user.id }).lean();
        for (let i = 0; i < posts.length; ++i) await img.deleteImage(posts[i].image);

        // delete posts
        await db.posts.deleteMany({ author: req.user.id });

        // delete comments
        await db.comments.deleteMany({ author: req.user.id });

        // delete followers and following
        await db.follows.deleteMany({ $or: [
            { follower: req.user.id },
            { following: req.user.id }
        ] });

        // delete likes
        await db.likes.deleteMany({ likedBy: req.user.id });

        // delete account
        const user = await db.users.findByIdAndDelete(req.user.id);

        // delete user profile picture
        if (user.pfp) await img.deleteImage(user.pfp);

        // done!
        res.status(200).json("user deleted");
    } catch (err) {
        console.log(err);
        res.status(500).json(err);
    }
});


export default router;

