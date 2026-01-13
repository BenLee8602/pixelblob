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


describe("get comments for a post", () => {
    it("should return array of comments", async () => {
        const postId = "695ee09562610f325ee70732";
        const res = await request(app).get("/api/comments/" + postId).send();
        expect(res.statusCode).toBe(200);
        expect(res.body.length).toBe(6);
        for (const comment of res.body)
            expect(comment.parent).toBe(postId);
    });
});


describe("create comment", () => {
    it("should fail if comment text is missing", async () => {
        const accessToken = auth.createAccessToken(
            "63cf27d7bc581a0257678496", "id.ex");
        const res = await request(app).post(
            "/api/comments/post/695ee09462610f325ee705bb"
        ).set({
            "Authorization": "Bearer " + accessToken
        }).send({
            message: "wonderful weather were having!"
        });
        expect(res.statusCode).toBe(400);
        expect(res.body).toBe("missing comment text");
    });


    it("should fail if parent type is invalid", async () => {
        const accessToken = auth.createAccessToken(
            "63cf27d7bc581a0257678496", "id.ex");
        const res = await request(app).post(
            "/api/comments/someInvalidType/695ee09462610f325ee705bb"
        ).set({
            "Authorization": "Bearer " + accessToken
        }).send({
            text: "testing 123"
        });
        expect(res.statusCode).toBe(400);
        expect(res.body).toBe("parent type must be \"post\" or \"comment\"");
    });


    it("should fail if parent is not found", async () => {
        const accessToken = auth.createAccessToken(
            "63cf27d7bc581a0257678496", "id.ex");
        const res = await request(app).post(
            "/api/comments/post/63cf278abc581a025767848d"
        ).set({
            "Authorization": "Bearer " + accessToken
        }).send({
            text: "oops wrong id"
        });
        expect(res.statusCode).toBe(404);
    });

    
    it("should fail if parent is a reply", async () => {
        const accessToken = auth.createAccessToken(
            "695ee09062610f325ee6faf4", "consequat.ea");
        const res = await request(app).post(
            "/api/comments/comment/695ee09562610f325ee70a22"
        ).set({
            "Authorization": "Bearer " + accessToken
        }).send({
            text: "replying to a reply"
        });
        expect(res.statusCode).toBe(400);
        expect(res.body).toBe("parent cannot be a reply");
    });


    it("should create comment for valid post given comment text", async () => {
        const accessToken = auth.createAccessToken(
            "695ee08e62610f325ee6fa06", "id.ex");
        const res = await request(app).post(
            "/api/comments/post/695ee09462610f325ee705bb"
        ).set({
            "Authorization": "Bearer " + accessToken
        }).send({
            text: "new comment from test 3"
        });
        expect(res.statusCode).toBe(200);

        const comment = await db.comments.findOne({
            parent: "695ee09462610f325ee705bb",
            text: "new comment from test 3",
            author: "695ee08e62610f325ee6fa06"
        });
        expect(comment).not.toBeNull();

        const parent = await db.posts.findById("695ee09462610f325ee705bb");
        expect(parent.commentCount).toBe(1);
    });
});


describe("edit a comment", () => {
    it("should fail if new text is not given", async () => {
        const accessToken = auth.createAccessToken(
            "695ee09262610f325ee6fc06", "non.culpa");
        const res = await request(app).put(
            "/api/comments/695ee09562610f325ee70815"
        ).set({
            "Authorization": "Bearer " + accessToken
        }).send({
            msg: "hey!"
        });
        expect(res.statusCode).toBe(400);
    });


    it("should fail if comment doesnt exist", async () => {
        const accessToken = auth.createAccessToken(
            "695ee09262610f325ee6fc06", "non.culpa");
        const res = await request(app).put(
            "/api/comments/1d42dba5a242fae43db013ff"
        ).set({
            "Authorization": "Bearer " + accessToken
        }).send({
            text: "hiii"
        });
        expect(res.statusCode).toBe(404);
    });


    it("should update a valid comment given a caption", async () => {
        const accessToken = auth.createAccessToken(
            "695ee09262610f325ee6fc06", "non.culpa");
        const res = await request(app).put(
            "/api/comments/695ee09562610f325ee70815"
        ).set({
            "Authorization": "Bearer " + accessToken
        }).send({
            text: "hi 2"
        });
        expect(res.statusCode).toBe(200);

        const comment = await db.comments.findById("695ee09562610f325ee70815");
        expect(comment.text).toBe("hi 2");
    });
});


describe("delete a comment", () => {
    it("should fail if comment doesnt exist", async () => {
        const accessToken = auth.createAccessToken(
            "695ee09262610f325ee6fc06", "non.culpa");
        const res = await request(app).delete(
            "/api/comments/922375f85c0d1971cbc424cf"
        ).set({
            "Authorization": "Bearer " + accessToken
        }).send();
        expect(res.statusCode).toBe(404);
    });


    it("should delete comment if exists", async () => {
        const accessToken = auth.createAccessToken(
            "695ee09262610f325ee6fc06", "non.culpa");
        const res = await request(app).delete(
            "/api/comments/695ee09562610f325ee70815"
        ).set({
            "Authorization": "Bearer " + accessToken
        }).send();
        expect(res.statusCode).toBe(200);

        const comment = await db.comments.findById("695ee09562610f325ee70815");
        expect(comment).toBeNull();

        const parent = await db.posts.findById("695ee09562610f325ee70699");
        expect(parent.commentCount).toBe(2);
    });
});

