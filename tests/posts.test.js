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


describe("get all posts", () => {
    it("should return all posts in db", async () => {
        const res = await request(app).get(
            "/api/posts?page=2"
        ).send();
        expect(res.statusCode).toBe(200);
        expect(res.body.length).toBe(db.pageSize);
        expect(res.body[0].author.name).toBe("excepteur.nulla");
    });
});


describe("get post by id", () => {
    it("should fail if post doesnt exist", async () => {
        const res = await request(app).get(
            "/api/posts/e020ee4ae7584f86e1fe33f7"
        ).send();
        expect(res.statusCode).toBe(404);
    });


    it("should return post if exists", async () => {
        const res = await request(app).get(
            "/api/posts/695ee09562610f325ee70762"
        ).query({
            cur: "695ee09062610f325ee6fafb"
        }).send();
        expect(res.statusCode).toBe(200);

        expect(res.body.author.name).toBe("magna.laborum");
        expect(res.body.caption).toBe("Et amet.");
        expect(res.body.liked).toBe(true);
    });
});


describe("get posts by author", () => {
    it("should return all posts created by author", async () => {
        const res = await request(app).get(
            "/api/posts/author/695ee09162610f325ee6fb8f"
        ).send();
        expect(res.statusCode).toBe(200);
        expect(res.body.length).toBe(5);
        for (const post of res.body)
            expect(post.author.name).toBe("aliquip.quis");
    });
});


describe("search posts", () => {
    it("should search by caption", async () => {
        const res = await request(app).get(
            "/api/posts/search/OCCAECAT"
        ).send();
        expect(res.statusCode).toBe(200);
        expect(res.body.length).toBe(16);
        for (const post of res.body)
            expect(post.caption).toMatch(/occaecat/i);
    });
});


describe("create new post", () => {
    it("should add the post to the database", async () => {
        const accessToken = auth.createAccessToken(
            "695ee08e62610f325ee6fa06", "id.ex");
        const res = await request(app).post(
            "/api/posts"
        ).set({
            "Authorization": "Bearer " + accessToken
        }).attach(
            "image", Buffer.from("dummy"), "image"
        ).field({
            caption: "awesome caption"
        });
        expect(res.statusCode).toBe(200);
        
        const posts = await db.posts.find({
            author: "695ee08e62610f325ee6fa06"
        });
        expect(posts.length).toBe(1);

        const author = await db.users.findOne({
            name: "id.ex"
        });
        expect(author.postCount).toBe(1);
    });
});


describe("edit a post", () => {
    it("should fail if caption is not given", async () => {
        const accessToken = auth.createAccessToken(
            "695ee09162610f325ee6fb8f", "aliquip.quis");
        const res = await request(app).put(
            "/api/posts/695ee09462610f325ee705bb"
        ).set({
            "Authorization": "Bearer " + accessToken
        }).send({
            msg: "how are you"
        });
        expect(res.statusCode).toBe(400);
    });


    it("should fail if post doesnt exist", async () => {
        const accessToken = auth.createAccessToken(
            "695ee09162610f325ee6fb8f", "aliquip.quis");
        const res = await request(app).put(
            "/api/posts/01abe3720d6e382d80970673"
        ).set({
            "Authorization": "Bearer " + accessToken
        }).send({
            caption: "this is a new caption"
        });
        expect(res.statusCode).toBe(404);
    });


    it("should update a valid post given a caption", async () => {
        const accessToken = auth.createAccessToken(
            "695ee09162610f325ee6fb8f", "aliquip.quis");
        const res = await request(app).put(
            "/api/posts/695ee09462610f325ee705bb"
        ).set({
            "Authorization": "Bearer " + accessToken
        }).send({
            caption: "crazy caption"
        });
        expect(res.statusCode).toBe(200);

        const post = await db.posts.findById("695ee09462610f325ee705bb");
        expect(post.caption).toBe("crazy caption");
    });
});


describe("delete a post", () => {
    it("should fail if post doesnt exist", async () => {
        const accessToken = auth.createAccessToken(
            "695ee09162610f325ee6fb8f", "aliquip.quis");
        const res = await request(app).delete(
            "/api/posts/cb760905e8fa1745e1457e0b"
        ).set({
            "Authorization": "Bearer " + accessToken
        }).send();
        expect(res.statusCode).toBe(404);
    });


    it("should delete post if exists", async () => {
        const accessToken = auth.createAccessToken(
            "695ee09062610f325ee6fafb", "id.enim");
        const res = await request(app).delete(
            "/api/posts/695ee09562610f325ee706f9"
        ).set({
            "Authorization": "Bearer " + accessToken
        }).send();
        expect(res.statusCode).toBe(200);

        const post = await db.posts.findById("695ee09562610f325ee706f9");
        expect(post).toBeNull();

        const author = await db.users.findOne({ name: "id.enim" });
        expect(author.postCount).toBe(3);

        const comments = await db.comments.find({
            parent: "695ee09562610f325ee706f9"
        });
        expect(comments.length).toBe(0);

        const likes = await db.likes.find({
            parent: "695ee09562610f325ee706f9"
        });
        expect(likes.length).toBe(0);
    });
});
