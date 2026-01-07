import express from "express";

import db from "../config/db.js";
import img from "../config/img.js";

import { requireLogin } from "../middlewares/auth.js";
import { getPageInfo } from "../middlewares/page.js";


const router = express.Router();


// get comments
router.get("/:parentId", getPageInfo, async (req, res) => {
    try {
        const rawComments = await db.comments.find({
            parent: req.params.parentId,
            posted: { $lt: req.page.start }
        }, null, {
            skip: db.pageSize * req.page.number,
            limit: db.pageSize
        }).sort({ posted: "desc" }).lean();

        let pfps = {};
        const comments = await Promise.all(rawComments.map(async c => {
            if (req.query.cur) c.liked = !!(await db.likes.findOne({
                parent: c._id,
                likedBy: req.query.cur
            }));

            c.author = await db.users.findById(
                c.author,
                "_id name nick pfp"
            ).lean();
            const id = c.author._id.toString();
            if (!(id in pfps)) pfps[id] = await img.getImage(c.author.pfp);
            c.author.pfp = pfps[id];
            return c;
        }));
        
        return res.status(200).json(comments);
    } catch (err) {
        console.log(err);
        res.status(500).json(err);
    }
});


// create comment
router.post("/:parentType/:parentId", requireLogin, async (req, res) => {
    const text = req.body.text;
    if (!text) return res.status(400).json("missing comment text");

    const parentType = req.params.parentType;
    if (parentType !== "post" && parentType !== "comment")
        return res.status(400).json("parent type must be \"post\" or \"comment\"");
    const parentCollection = parentType === "post" ? db.posts : db.comments;
    
    try {
        const parent = await parentCollection.findById(req.params.parentId);
        if (!parent)
            return res.status(404).json("parent not found");
        if (parent.parentType === "comment")
            return res.status(400).json("parent cannot be a reply");
        parent.commentCount += 1;
        await parent.save();

        const rawComment = await db.comments.create({
            parent: req.params.parentId,
            parentType: parentType,
            author: req.user.id,
            text: text,
        });
        const author = await db.users.findById(
            rawComment.author,
            "_id name nick pfp"
        );
        author.pfp = await img.getImage(author.pfp);
        
        const comment = { ...rawComment._doc, author };
        res.status(200).json(comment);
    } catch (err) {
        console.log(err);
        res.status(500).json(err);
    }
});


// edit comment
router.put("/:id", requireLogin, async (req, res) => {
    const text = req.body.text;
    if (!text) return res.status(400).send("new text missing");
    try {
        const comment = await db.comments.findOneAndUpdate(
            { _id: req.params.id, author: req.user.id },
            { text },
            { new: true }
        );
        if (!comment) return res.status(404).json("comment not found");
        res.status(200).json("comment updated");
    } catch (err) {
        console.log(err);
        res.status(500).json(err);
    }
});


// delete comment
router.delete("/:id", requireLogin, async (req, res) => {
    try {
        const comment = await db.comments.findOneAndDelete({
            _id: req.params.id,
            author: req.user.id
        });
        if (!comment) return res.status(404).json("comment not found");

        await db.comments.deleteMany({ parent: comment._id });
        await db.likes.deleteMany({ parent: comment._id });

        const parentCol = comment.parentType === "post" ? db.posts : db.comments;
        await parentCol.findByIdAndUpdate(
            comment.parent,
            { $inc: { commentCount: -1 } }
        );

        res.status(200).json("comment deleted");
    } catch (err) {
        console.log(err);
        res.status(500).json(err);
    }
});


export default router;

