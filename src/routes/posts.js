import express from "express";

import multer from "multer";
const storage = multer.memoryStorage();
const upload = multer({ storage });

import db from "../config/db.js";
import img from "../config/img.js";

import { requireLogin } from "../middlewares/auth.js";
import { getPageInfo } from "../middlewares/page.js";


const router = express.Router();


async function checkLike(post, cur) {
    if (!cur) return false;
    return !!(await db.likes.findOne({
        parent: post._id,
        likedBy: cur
    }));
}


async function processPosts(posts, cur) {
    let pfps = {};
    return await Promise.all(posts.map(async p => {
        p.image = await img.getImage(p.image);
        p.liked = await checkLike(p, cur);

        p.author = await db.users.findById(
            p.author,
            "_id name nick pfp"
        ).lean();
        const id = p.author._id.toString();
        if (!(id in pfps)) pfps[id] = await img.getImage(p.author.pfp);
        p.author.pfp = pfps[id];
        return p;
    }));
}


// get all posts
router.get("/", getPageInfo, async (req, res) => {
    try {
        const rawPosts = await db.posts.find({
            posted: { $lt: req.page.start }
        }, null, {
            skip: db.pageSize * req.page.number,
            limit: db.pageSize
        }).sort({ posted: "desc" }).lean();
        const posts = await processPosts(rawPosts, req.query.cur)
        res.status(200).json(posts);
    } catch (err) {
        console.log(err);
        res.status(500).json(err);
    }
});


// get a post by id
router.get("/:id", async (req, res) => {
    try {
        const rawPost = await db.posts.findById(req.params.id, "-__v").lean();
        if (!rawPost) return res.status(404).json("post not found");
        const post = (await processPosts([rawPost], req.query.cur))[0];
        res.status(200).json(post);
    } catch (err) {
        console.log(err);
        res.status(500).json(err);
    }
});


// get posts by author
router.get("/author/:name", getPageInfo, async (req, res) => {
    try {
        const rawPosts = await db.posts.find({
            author: req.params.name,
            posted: { $lt: req.page.start }
        }, null, {
            skip: db.pageSize * req.page.number,
            limit: db.pageSize
        }).sort({ posted: "desc" }).lean();
        const posts = await processPosts(rawPosts, req.query.cur);
        res.status(200).json(posts);
    } catch (err) {
        console.log(err);
        res.status(500).json(err);
    }
});


// search posts by caption
router.get("/search/:query", getPageInfo, async (req, res) => {
    const query = { $regex: req.params.query, $options: "i" };
    try {
        const rawPosts = await db.posts.find({
            caption: query,
            posted: { $lt: req.page.start }
        }, null, {
            skip: db.pageSize * req.page.number,
            limit: db.pageSize
        }).lean();
        const posts = await processPosts(rawPosts, req.query.cur);
        res.status(200).json(posts);
    } catch (err) {
        console.log(err);
        res.status(500).json(err);
    }
});


// create new post
router.post("/", requireLogin, upload.single("image"), async (req, res) => {
    const caption = req.body.caption || "";
    try {
        const imageName = img.generateImageName();
        await img.putImage(imageName, req.file.buffer, req.file.mimetype);

        const newPost = await db.posts.create({
            author: req.user.id,
            image: imageName,
            caption: caption
        });
        
        await db.users.updateOne(
            { name: req.user.name },
            { $inc: { postCount: 1 } }
        );

        res.status(200).json(newPost);
    } catch (err) {
        console.log(err);
        res.status(500).json(err);
    }
});


// edit a post
router.put("/:id", requireLogin, async (req, res) => {
    const caption = req.body.caption;
    if (!caption) return res.status(400).json("new caption missing");
    try {
        const post = await db.posts.findOneAndUpdate(
            { _id: req.params.id, author: req.user.id },
            { caption: caption }
        );
        if (!post) return res.status(404).json("post not found");
        res.status(200).json("post updated");
    } catch (err) {
        console.log(err);
        res.status(500).json(err);
    }
});


// delete a post
router.delete("/:id", requireLogin, async (req, res) => {
    try {
        const post = await db.posts.findOneAndDelete(
            { _id: req.params.id, author: req.user.id },
        );
        if (!post) return res.status(404).json(req.params.id);
        
        await img.deleteImage(post.image);

        await db.comments.deleteMany({ parent: post._id });
        await db.likes.deleteMany({ parent: post._id });
        
        await db.users.updateOne(
            { name: req.user.name },
            { $inc: { postCount: -1 } }
        );

        res.status(200).json("post deleted");
    } catch (err) {
        console.log(err);
        res.status(500).json(err);
    }
});


export default router;

