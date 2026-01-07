import express from "express";

import db from "../config/db.js";
import img from "../config/img.js";

import { requireLogin } from "../middlewares/auth.js";
import { getPageInfo } from "../middlewares/page.js";


const router = express.Router();


// follow a user
router.put("/:id", requireLogin, async (req, res) => {
    const fol = {
        follower: req.user.id,
        following: req.params.id
    };
    if (fol.follower === fol.following)
        return res.status(400).json("cant follow yourself");

    try {
        const exists = await db.users.findById(fol.following);
        if (!exists) return res.status(404).json("user not found");
        
        const deleted = await db.follows.findOneAndDelete(fol);
        const inc = deleted ? -1 : 1;

        await db.users.findByIdAndUpdate(
            fol.follower,
            { $inc: { followingCount: inc } }
        );
        await db.users.findByIdAndUpdate(
            fol.following,
            { $inc: { followerCount: inc } }
        );

        if (deleted) return res.status(200).json("unfollowed");
        await db.follows.create(fol);
        res.status(201).json("followed");
    } catch (err) {
        if (err.name === "CastError")
            return res.status(400).json("invalid user id");
        console.log(err);
        res.status(500).json(err);
    }
});


// get followers
router.get("/:id/followers", getPageInfo, async (req, res) => {
    try {
        const ids = (await db.follows.find({
            following: req.params.id,
            created: { $lt: req.page.start }
        }, null, {
            skip: db.pageSize * req.page.number,
            limit: db.pageSize
        })).map(f => f.follower);

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


// get following
router.get("/:id/following", getPageInfo, async (req, res) => {
    try {
        const ids = (await db.follows.find({
            follower: req.params.id,
            created: { $lt: req.page.start }
        }, null, {
            skip: db.pageSize * req.page.number,
            limit: db.pageSize
        })).map(f => f.following);

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

