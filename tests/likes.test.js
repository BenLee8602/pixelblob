import request from "supertest";

import app from "../src/app";
import auth from "../src/config/auth";
import db from "../src/config/db";
import img from "../src/config/img";


beforeAll(async () => await db.connect());
afterAll(async () => await db.disconnect());

afterEach(async () => {
    await db.resetData();
    await img.resetImages();
});


describe("smash the like button", () => {
    it("should fail if parent type is invalid", async () => {
        const accessToken = auth.createAccessToken(
            "695ee08e62610f325ee6fa06", "id.ex");
        const res = await request(app).put(
            "/api/likes/someInvalidType/695ee09462610f325ee705bb"
        ).set({
            "Authorization": "Bearer " + accessToken
        }).send();
        expect(res.statusCode).toBe(400);
    });


    it("should fail if parent doesnt exist", async () => {
        const accessToken = auth.createAccessToken(
            "695ee08e62610f325ee6fa06", "id.ex");
        const res = await request(app).put(
            "/api/likes/post/5fbca0a35e06b136c429a22a"
        ).set({
            "Authorization": "Bearer " + accessToken
        }).send();
        expect(res.statusCode).toBe(404);
    });


    it("should like if not already liked", async () => {
        const accessToken = auth.createAccessToken(
            "695ee08e62610f325ee6fa06", "id.ex");
        const res = await request(app).put(
            "/api/likes/post/695ee09462610f325ee705bb"
        ).set({
            "Authorization": "Bearer " + accessToken
        }).send();
        expect(res.statusCode).toBe(201);

        const like = await db.likes.findOne({
            parent: "695ee09462610f325ee705bb",
            likedBy: "695ee08e62610f325ee6fa06"
        });
        expect(like).not.toBeNull();

        const parent = await db.posts.findById("695ee09462610f325ee705bb");
        expect(parent.likeCount).toBe(1);
    });


    it("should unlike if already liked", async () => {
        const accessToken = auth.createAccessToken(
            "695ee09162610f325ee6fb8f", "aliquip.quis");
        const res = await request(app).put(
            "/api/likes/comment/695ee09662610f325ee70d56"
        ).set({
            "Authorization": "Bearer " + accessToken
        }).send();
        expect(res.statusCode).toBe(200);

        const like = await db.likes.findOne({
            parent: "695ee09662610f325ee70d56",
            likedBy: "695ee09162610f325ee6fb8f"
        });
        expect(like).toBeNull();

        const parent = await db.comments.findById("695ee09662610f325ee70d56");
        expect(parent.likeCount).toBe(1);
    });
});


describe("get likes", () => {
    it("should return a list of users that smashed the like button", async () => {
        const res = await request(app).get(
            "/api/likes/695ee09562610f325ee70815"
        ).send();
        expect(res.statusCode).toBe(200);
        expect(res.body.length).toBe(3);
    });
});

