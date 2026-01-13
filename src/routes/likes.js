import express from "express";

import db from "../config/db.js";
import img from "../config/img.js";

import { requireLogin } from "../middlewares/auth.js";
import { getPageInfo } from "../middlewares/page.js";


const router = express.Router();


// like a post or comment
router.put("/:parentType/:parentId", requireLogin, async (req, res) => {
    const parentType = req.params.parentType;
    if (parentType !== "post" && parentType !== "comment")
        return res.status(400).json("parent type must be \"post\" or \"comment\"");
    const parentCollection = parentType === "post" ? db.posts : db.comments;

    try {
        const deleted = await db.likes.findOneAndDelete({
            likedBy: req.user.id,
            parent: req.params.parentId
        });
        const inc = deleted ? -1 : 1;

        const parent = await parentCollection.findByIdAndUpdate(
            req.params.parentId,
            { $inc: { likeCount: inc } }
        );
        if (!parent) return res.status(404).json("parent not found");

        if (deleted) return res.status(200).json("unliked");
        await db.likes.create({
            parent: req.params.parentId,
            parentType: parentType,
            likedBy: req.user.id
        });
        return res.status(201).json("liked");
    } catch (err) {
        console.log(err);
        res.status(500).json(err);
    }
});


// get likes
router.get("/:parentId", getPageInfo, async (req, res) => {
    try {
        const ids = (await db.likes.find({
            parent: req.params.parentId,
            created: { $lt: req.page.start }
        }, null, {
            skip: db.pageSize * req.page.number,
            limit: db.pageSize
        })).map(l => l.likedBy);

        const rawUsers = await db.users.find(
            { _id: { $in: ids } },
            "pfp name nick"
        );

        const users = await Promise.all(rawUsers.map(async u => {
            u.pfp = await img.getImage(u.pfp);
            return u;
        }));

        res.status(200).json(users);
    } catch (err) {
        console.log(err);
        res.status(500).json(err);
    }
});


export default router;

